// T8, step 1 (ADR 0002): stream the 1.5 GB Food.com recipes.csv down to a few
// thousand everyday, well-rated recipes. Gemini enrichment runs on the output.
//
//   npm run recipes:filter -- [recipes.csv] [out.json]
import { createReadStream, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** A recipe as the dataset has it: ingredient names are still the raw source wording. */
export interface RawRecipe {
  id: string;
  name: string;
  imageUrl: string;
  servings: number;
  minutes: number;
  category: string;
  rating: number;
  reviewCount: number;
  /** Protein per serving in grams, or null when the dataset has none. */
  proteinGrams: number | null;
  ingredients: { name: string; quantity: string }[];
  steps: string[];
}

export interface FilterOptions {
  minRating: number;
  minReviews: number;
  minIngredients: number;
  maxIngredients: number;
  maxMinutes: number;
  topN: number;
  /** The most any one RecipeCategory may take of topN, so desserts don't crowd out dinners. */
  maxCategoryShare: number;
}

export const DEFAULTS: FilterOptions = {
  minRating: 4.5, minReviews: 10, minIngredients: 4, maxIngredients: 12, maxMinutes: 90, topN: 4000, maxCategoryShare: 0.1,
};

/** Streams CSV text into rows. Handles quotes, "" escapes, CRLF and newlines inside quoted fields. */
export async function* csvRows(chunks: AsyncIterable<string>): AsyncGenerator<string[]> {
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let quoteSeen = false; // a quote inside quotes: closes the field, or is the first half of ""
  for await (const chunk of chunks) {
    for (const ch of chunk) {
      if (quoteSeen) {
        quoteSeen = false;
        if (ch === '"') { field += '"'; continue; }
        inQuotes = false;
      }
      if (inQuotes) {
        if (ch === '"') quoteSeen = true;
        else field += ch;
      } else if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); field = ''; yield row; row = []; }
      else if (ch !== '\r') field += ch;
    }
  }
  if (field || row.length) { row.push(field); yield row; }
}

/** Reads an R vector as the dataset prints it: c("a", NA), a lone "a", or character(0). NA elements become null. */
export function parseRVector(text: string): (string | null)[] {
  const out: (string | null)[] = [];
  for (const m of text.matchAll(/"((?:[^"\\]|\\.)*)"|\bNA\b/g)) out.push(m[1] === undefined ? null : m[1].replace(/\\(.)/g, '$1'));
  // a bare NA means no value at all, not a vector holding one NA
  return text.trim() === 'NA' ? [] : out;
}

/** ISO 8601 duration ("PT1H30M") in minutes; null when missing, unreadable or zero. */
export function parseDuration(text: string): number | null {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/.exec(text.trim());
  if (!m) return null;
  const minutes = Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
  return minutes > 0 ? minutes : null;
}

/** One CSV row as a RawRecipe, or null if it fails a filter. */
function toRawRecipe(get: (column: string) => string, o: FilterOptions): RawRecipe | null {
  const rating = Number(get('AggregatedRating'));
  const reviewCount = Number(get('ReviewCount'));
  if (!(rating >= o.minRating) || !(reviewCount >= o.minReviews)) return null;

  const servings = Number(get('RecipeServings'));
  const minutes = parseDuration(get('TotalTime'));
  if (!(servings > 0) || minutes === null || minutes > o.maxMinutes) return null;

  const proteinText = get('ProteinContent').trim();
  const protein = proteinText === '' || proteinText === 'NA' || isNaN(Number(proteinText)) ? null : Number(proteinText);
  const imageUrl = parseRVector(get('Images')).find((u) => u);
  const names = parseRVector(get('RecipeIngredientParts'));
  const quantities = parseRVector(get('RecipeIngredientQuantities'));
  const steps = parseRVector(get('RecipeInstructions')).filter((s): s is string => !!s?.trim());
  if (!imageUrl || !steps.length) return null;
  // quantities line up with names by position, so a length mismatch can't be trusted
  if (names.length < o.minIngredients || names.length > o.maxIngredients || names.length !== quantities.length) return null;
  if (names.some((n) => !n)) return null;

  return {
    id: get('RecipeId'),
    name: get('Name'),
    imageUrl,
    servings,
    minutes,
    category: get('RecipeCategory'),
    rating,
    reviewCount,
    proteinGrams: protein,
    ingredients: names.map((n, i) => ({ name: n!, quantity: quantities[i] ?? '' })),
    steps,
  };
}

/**
 * Best first: rating weighted by review count, so 4.9 from 500 people beats 4.9 from 10.
 * No category may take more than maxCategoryShare of topN.
 */
export function selectTop(candidates: RawRecipe[], o: Pick<FilterOptions, 'topN' | 'maxCategoryShare'>): RawRecipe[] {
  const prior = 20; // pseudo-reviews at the average rating
  const mean = candidates.reduce((sum, r) => sum + r.rating, 0) / (candidates.length || 1);
  const score = (r: RawRecipe) => (r.reviewCount * r.rating + prior * mean) / (r.reviewCount + prior);
  const ranked = candidates.map((r) => [r, score(r)] as const).sort((a, b) => b[1] - a[1] || a[0].id.localeCompare(b[0].id));

  const cap = Math.max(1, Math.ceil(o.topN * o.maxCategoryShare));
  const perCategory = new Map<string, number>();
  const out: RawRecipe[] = [];
  for (const [r] of ranked) {
    const n = perCategory.get(r.category) ?? 0;
    if (n >= cap) continue;
    perCategory.set(r.category, n + 1);
    out.push(r);
    if (out.length === o.topN) break;
  }
  return out;
}

export async function filterRecipes(rows: AsyncIterable<string[]>, options: Partial<FilterOptions> = {}): Promise<RawRecipe[]> {
  const o = { ...DEFAULTS, ...options };
  let columns = new Map<string, number>();
  const candidates: RawRecipe[] = [];
  for await (const row of rows) {
    if (!columns.size) {
      columns = new Map(row.map((name, i) => [name, i]));
      continue;
    }
    const recipe = toRawRecipe((c) => row[columns.get(c) ?? -1] ?? '', o);
    if (recipe) candidates.push(recipe);
  }
  return selectTop(candidates, o);
}

async function main() {
  const [input = 'data/raw/recipes.csv', output = 'data/filtered-recipes.json'] = process.argv.slice(2);
  const recipes = await filterRecipes(csvRows(createReadStream(input, { encoding: 'utf8' })));
  writeFileSync(output, JSON.stringify(recipes) + '\n');
  const categories = new Map<string, number>();
  for (const r of recipes) categories.set(r.category, (categories.get(r.category) ?? 0) + 1);
  console.log(`kept ${recipes.length} recipes -> ${output}`);
  console.log([...categories].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c, n]) => `${c}: ${n}`).join('\n'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
