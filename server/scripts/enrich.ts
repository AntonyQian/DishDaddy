// T8, step 2 (ADR 0002): turn the filtered Food.com recipes into the server's
// Recipe collection. Gemini does the language work (standard ingredient names,
// Equipment, cuisine) behind the `Steps` interface, so the pipeline is testable
// without it. The protein flag comes from the dataset's own nutrition numbers.
import type { Recipe } from '@fridge/shared';
import type { RawRecipe } from './filterRecipes';

/** Appliances that decide whether a user can cook a Recipe. Bowls, knives and pans are assumed. */
export const EQUIPMENT = [
  'oven', 'hob', 'microwave', 'air fryer', 'blender', 'food processor', 'slow cooker',
  'pressure cooker', 'grill', 'stand mixer', 'hand mixer', 'rice cooker', 'toaster',
] as const;

export const CUISINES = [
  'American', 'British', 'Chinese', 'French', 'Greek', 'Indian', 'Italian', 'Japanese', 'Korean',
  'Mediterranean', 'Mexican', 'Middle Eastern', 'Spanish', 'Thai', 'Vietnamese', 'Other',
] as const;

/** Grams of protein per serving from which a Recipe counts as high protein. */
export const HIGH_PROTEIN_GRAMS = 20;

export const highProtein = (grams: number | null) => grams !== null && grams >= HIGH_PROTEIN_GRAMS;

export interface Enrichment {
  equipment: string[];
  cuisine: string;
}

/** The three things Gemini does. Each takes one batch and answers for that batch only. */
export interface Steps {
  /** Raw ingredient wording → standard Ingredient name, or null if it isn't a real, specific ingredient. */
  mapIngredients(raw: string[]): Promise<Record<string, string | null>>;
  /** Standard names → the name to merge each into, for synonyms the first pass named differently. */
  consolidate(names: string[]): Promise<Record<string, string>>;
  /** Equipment and cuisine per recipe id. */
  enrich(batch: RawRecipe[]): Promise<Record<string, Enrichment>>;
}

export interface BuildReport {
  input: number;
  droppedUnmapped: number;
  droppedNoEnrichment: number;
  output: number;
  /** Distinct standard Ingredient names across the output. */
  ingredients: number;
}

/**
 * Corrections for wordings the model gets wrong in bulk. Checked after the model,
 * and they win. Each names a different product from the thing it flavours, so a
 * recipe that needs garlic powder must not match someone who has only garlic.
 */
export const OVERRIDES: [RegExp, string][] = [
  [/\bgarlic powder\b/, 'garlic powder'],
  [/\bonion powder\b/, 'onion powder'],
  [/\bmustard powder\b/, 'mustard powder'],
  [/\b(ginger powder|ground ginger)\b/, 'ground ginger'],
  [/\bcocoa powder\b|\bunsweetened cocoa\b/, 'cocoa powder'],
  [/\b(vegetable|veggie) (broth|stock)\b/, 'vegetable stock'],
  [/\bbeef (broth|stock|bouillon)\b/, 'beef stock'],
  [/\bchil+[ie]? sauce\b/, 'chilli sauce'],
  [/\b(bisquick|baking mix)\b/, 'baking mix'],
  [/\blemon[- ]pepper\b/, 'lemon pepper'],
  [/\b(red pepper|chil+[ie]|chilli) flakes\b/, 'chilli flakes'],
];

const tidy = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

const chunk = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

/** Maps items with at most `limit` calls in flight, keeping results in input order. */
export async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export async function buildRecipes(
  raw: RawRecipe[],
  steps: Steps,
  options: { ingredientBatch?: number; recipeBatch?: number; concurrency?: number; log?: (message: string) => void } = {},
): Promise<{ recipes: Recipe[]; report: BuildReport; unmapped: string[] }> {
  const { ingredientBatch = 100, recipeBatch = 20, concurrency = 1, log = () => {} } = options;

  // 1. Standard names for every distinct raw wording, asked once each, alphabetical so look-alikes share a batch.
  const wordings = [...new Set(raw.flatMap((r) => r.ingredients.map((i) => tidy(i.name))))].sort();
  log(`mapping ${wordings.length} distinct ingredient wordings`);
  const answers = await pool(chunk(wordings, ingredientBatch), concurrency, (b) => steps.mapIngredients(b));
  const first = new Map<string, string | null>();
  chunk(wordings, ingredientBatch).forEach((b, i) =>
    b.forEach((w) => first.set(w, (answers[i][w] && tidy(answers[i][w]!)) || null)),
  );

  // 2. Merge synonyms the batches named differently, only into names that exist.
  const names = [...new Set([...first.values()].filter((n): n is string => !!n))].sort();
  log(`consolidating ${names.length} standard names`);
  const merges = await steps.consolidate(names);
  const known = new Set(names);
  const finalName = (n: string) => {
    const to = merges[n] && tidy(merges[n]);
    return to && known.has(to) ? to : n;
  };
  const override = (w: string) => OVERRIDES.find(([pattern]) => pattern.test(w))?.[1];
  const mapping = new Map([...first].map(([w, n]) => [w, override(w) ?? (n && finalName(n))] as const));

  // 3. Drop recipes with an ingredient we can't name.
  const survivors: RawRecipe[] = [];
  const unmapped = new Set<string>();
  for (const r of raw) {
    const bad = r.ingredients.filter((i) => !mapping.get(tidy(i.name)));
    bad.forEach((i) => unmapped.add(tidy(i.name)));
    if (!bad.length) survivors.push(r);
  }

  // 4. Equipment and cuisine, in batches.
  log(`enriching ${survivors.length} recipes`);
  const batches = chunk(survivors, recipeBatch);
  let done = 0;
  const enriched = Object.assign({}, ...(await pool(batches, concurrency, async (b) => {
    const result = await steps.enrich(b);
    log(`enriched ${(done += b.length)}/${survivors.length}`);
    return result;
  })));

  const recipes: Recipe[] = [];
  for (const r of survivors) {
    const e: Enrichment | undefined = enriched[r.id];
    if (!e) continue;
    recipes.push({
      id: `fd-${r.id}`,
      name: r.name,
      imageUrl: r.imageUrl,
      servings: r.servings,
      ingredients: r.ingredients.map((i) => ({ ingredient: mapping.get(tidy(i.name))!, quantity: i.quantity, original: i.name.trim() })),
      equipment: [...new Set(e.equipment.map(tidy))].filter((x) => (EQUIPMENT as readonly string[]).includes(x)),
      cuisine: (CUISINES as readonly string[]).find((c) => c.toLowerCase() === tidy(e.cuisine)) ?? 'Other',
      minutes: r.minutes,
      steps: r.steps,
      highProtein: highProtein(r.proteinGrams),
    });
  }

  return {
    recipes,
    unmapped: [...unmapped].sort(),
    report: {
      input: raw.length,
      droppedUnmapped: raw.length - survivors.length,
      droppedNoEnrichment: survivors.length - recipes.length,
      output: recipes.length,
      ingredients: new Set(recipes.flatMap((r) => r.ingredients.map((i) => i.ingredient))).size,
    },
  };
}
