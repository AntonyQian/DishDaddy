// The Gemini side of the recipe build (see enrich.ts). Every call is cached on
// disk by its prompt, so a crash or rate limit costs only the call in flight.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { FIXTURE_INGREDIENTS } from '@fridge/shared';
import { CUISINES, MODEL_EQUIPMENT, type Steps } from './enrich';
import type { RawRecipe } from './filterRecipes';

const tidy = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function createGeminiSteps(options: {
  apiKey: string;
  model: string;
  cacheDir: string;
  /** Minimum gap between API calls; the free tier allows 15 a minute, so 5000 stays under it. */
  minGapMs?: number;
  log?: (m: string) => void;
}): Steps {
  const ai = new GoogleGenAI({ apiKey: options.apiKey });
  const log = options.log ?? (() => {});
  mkdirSync(options.cacheDir, { recursive: true });

  // Hands out call slots one minGapMs apart, however many callers are waiting.
  let nextSlot = 0;
  async function waitForSlot() {
    const now = Date.now();
    const at = Math.max(now, nextSlot);
    nextSlot = at + (options.minGapMs ?? 5000);
    await sleep(at - now);
  }

  async function askJson(prompt: string, schema: object): Promise<unknown> {
    const file = join(options.cacheDir, `${createHash('sha1').update(options.model + prompt).digest('hex')}.json`);
    if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
    for (let attempt = 0; ; attempt++) {
      try {
        await waitForSlot();
        const response = await ai.models.generateContent({
          model: options.model,
          contents: prompt,
          config: { responseMimeType: 'application/json', responseJsonSchema: schema, abortSignal: AbortSignal.timeout(120_000) },
        });
        if (!response.text) throw new Error('Gemini returned no content');
        const json = JSON.parse(response.text);
        writeFileSync(file, JSON.stringify(json));
        return json;
      } catch (e) {
        // 429 and 5xx can pass; anything else (bad key, no credits, bad request) won't, so fail now
        const status = (e as { status?: number }).status;
        if (attempt >= 10 || (status !== undefined && status < 500 && status !== 429)) throw e;
        // Gemini says how long to wait ("Please retry in 9.1s"); otherwise back off
        const asked = /retry in ([\d.]+)s/i.exec(e instanceof Error ? e.message : '')?.[1];
        const wait = asked ? Math.ceil(Number(asked) * 1000) + 1000 : Math.min(60_000, 2000 * 2 ** attempt);
        log(`Gemini call failed (${e instanceof Error ? e.message.slice(0, 120) : e}); retrying in ${wait / 1000}s`);
        await sleep(wait);
      }
    }
  }

  return {
    async mapIngredients(raw) {
      const json = (await askJson(MAP_PROMPT(raw), MAP_SCHEMA)) as { items?: { raw: string; isIngredient: boolean; name: string }[] };
      const byRaw = new Map((json.items ?? []).map((i) => [tidy(i.raw), i.isIngredient ? i.name : null]));
      return Object.fromEntries(raw.map((r) => [r, byRaw.get(tidy(r)) || null]));
    },

    async consolidate(names) {
      const json = (await askJson(CONSOLIDATE_PROMPT(names), CONSOLIDATE_SCHEMA)) as { merges?: { from: string; to: string }[] };
      return Object.fromEntries((json.merges ?? []).map((m) => [tidy(m.from), tidy(m.to)]));
    },

    async enrich(batch) {
      const json = (await askJson(ENRICH_PROMPT(batch), ENRICH_SCHEMA)) as {
        recipes?: { id: string; equipment: string[]; cuisine: string }[];
      };
      return Object.fromEntries((json.recipes ?? []).map((r) => [r.id, { equipment: r.equipment ?? [], cuisine: r.cuisine ?? 'Other' }]));
    },

    async amounts(batch) {
      const json = (await askJson(AMOUNTS_PROMPT(batch), AMOUNTS_SCHEMA)) as { recipes?: { id: string; amounts: string[] }[] };
      return Object.fromEntries((json.recipes ?? []).map((r) => [r.id, r.amounts ?? []]));
    },
  };
}

const MAP_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: { raw: { type: 'string' }, isIngredient: { type: 'boolean' }, name: { type: 'string' } },
        required: ['raw', 'isIngredient', 'name'],
      },
    },
  },
  required: ['items'],
};

const MAP_PROMPT = (raw: string[]) => `You standardise recipe ingredient wording to the generic ingredient a shopper would name.

For each input line return:
- isIngredient: true for any real food item, even an uncommon one (nutmeg, pecans, raisins, turmeric, water, molasses, cheese, beef). false ONLY for placeholders that name no specific food: "garnish", "ingredients", "optional toppings", "salt and pepper", "your favorite sauce".
- name: the standard name. Always fill it in; when isIngredient is false, repeat the input.

How to write name:
- Lowercase, singular, generic: "garlic cloves" -> "garlic", "all-purpose flour" -> "flour", "granulated sugar" -> "sugar", "boneless skinless chicken breasts" -> "chicken breast", "extra virgin olive oil" -> "olive oil", "pecans" -> "pecan", "raisins" -> "raisin", "nutmeg" -> "nutmeg".
- Drop preparation, size, brand and quantity words (chopped, fresh, large, Heinz).
- Keep distinctions that change the dish: brown sugar vs sugar, buttermilk vs milk, cheddar cheese vs parmesan, chicken breast vs chicken thigh, red onion vs onion, and forms that are a different product: garlic powder vs garlic, tomato paste vs tomato, chicken stock vs chicken, lemon juice vs lemon.
- If a name on the preferred list fits, use it exactly. If none fits, still give your own standard name. A name missing from the list is fine; a missing answer is not.
- Use British words, as the list does (courgette, aubergine, coriander, spring onion, beef mince, icing sugar).

Preferred list: ${FIXTURE_INGREDIENTS.join(', ')}

Input lines:
${JSON.stringify(raw)}

Return every input line exactly once, with "raw" exactly as given.`;

const CONSOLIDATE_SCHEMA = {
  type: 'object',
  properties: {
    merges: {
      type: 'array',
      items: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' } }, required: ['from', 'to'] },
    },
  },
  required: ['merges'],
};

const CONSOLIDATE_PROMPT = (names: string[]) => `Below is a list of standard ingredient names from a recipe collection. Some are the same ingredient under different names: spelling, US vs British words, singular vs plural, or needless modifiers ("scallion" / "spring onion", "cilantro" / "coriander", "confectioners sugar" / "icing sugar", "garbanzo beans" / "chickpeas", "ground beef" / "beef mince").

Return merges only for names that should become another name FROM THE SAME LIST. Pick the more common British name as the target. A name on the preferred list below is already correct: never merge it into another name, only merge other names into it. Do not merge ingredients that cook or taste differently (brown sugar and sugar, butter and margarine, milk and buttermilk, chicken breast and chicken thigh, red onion and onion).

Preferred list: ${FIXTURE_INGREDIENTS.join(', ')}

Names: ${JSON.stringify(names)}`;

const ENRICH_SCHEMA = {
  type: 'object',
  properties: {
    recipes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          equipment: { type: 'array', items: { type: 'string', enum: [...MODEL_EQUIPMENT] } },
          cuisine: { type: 'string', enum: [...CUISINES] },
        },
        required: ['id', 'equipment', 'cuisine'],
      },
    },
  },
  required: ['recipes'],
};

const ENRICH_PROMPT = (batch: { id: string; name: string; ingredients: { name: string }[]; steps: string[] }[]) => `For each recipe, decide:
- equipment: the appliances a home cook must have to make it as written, from the allowed list only. Use "hob" for stovetop cooking (frying pan, saucepan, boiling, sauteing), "oven" for baking, roasting or preheating, "grill" for grilling or broiling, "microwave" if it is cooked in one. Do NOT list bowls, knives, pans or whisks. Use an empty list if no appliance is needed (a salad, a sandwich).
- cuisine: the best fit from the allowed list, or "Other" if none fits or it is generic.

Recipes:
${JSON.stringify(batch.map((r) => ({ id: r.id, name: r.name, ingredients: r.ingredients.map((i) => i.name), steps: r.steps.join(' ').slice(0, 1200) })))}

Return every recipe once, with "id" exactly as given.`;

const AMOUNTS_SCHEMA = {
  type: 'object',
  properties: {
    recipes: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, amounts: { type: 'array', items: { type: 'string' } } },
        required: ['id', 'amounts'],
      },
    },
  },
  required: ['recipes'],
};

// The dataset gives each ingredient's quantity as a bare number ("1/2") with the unit stripped out.
// The unit is worked out here from the ingredient and from the recipe's own steps, which often say it.
const AMOUNTS_PROMPT = (batch: RawRecipe[]) => `Each recipe below lists its ingredients with a bare quantity whose unit was lost ("1/2", "3", "1 1/2").
Write each ingredient's amount as "<quantity> <unit>", choosing the unit a home cook would use.

Rules:
- Copy the quantity exactly as given, as the first part of the amount. Never change, convert, round or reword the number.
- Add the most likely unit: cup, tbsp, tsp, g, kg, ml, l, oz, lb, can, clove, slice, large, medium, small, stick, bunch, sprig, pinch, dash, package. For items you count, use a size or the item ("3 large", "2 cloves", "1 can") or just the number if no word is natural ("2" for 2 carrots).
- The recipe's steps often name the amount ("add 2 tablespoons of oil"): follow them. Otherwise decide from the ingredient and the number: 1/4 of butter is "1/4 cup", 2 of olive oil is "2 tbsp", 1/2 of salt is "1/2 tsp", 2 of garlic is "2 cloves", 1 of chicken breast is "1 lb" only if the recipe feeds several, else "1 large".
- Use these short forms: tbsp, tsp, oz, lb, g, ml. Keep it to a few words.
- If the quantity is empty, write a short phrase such as "to taste", "as needed" or "1 pinch".
- Return one amount for every ingredient, in the same order, so the list is the same length as the ingredients.

Recipes:
${JSON.stringify(batch.map((r) => ({
  id: r.id,
  name: r.name,
  servings: r.servings,
  ingredients: r.ingredients.map((i) => ({ wording: i.name, quantity: i.quantity })),
  steps: r.steps.join(' ').slice(0, 1500),
})))}`;
