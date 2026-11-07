// The Gemini side of the recipe build (see enrich.ts). Every call is cached on
// disk by its prompt, so a crash or rate limit costs only the call in flight.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { FIXTURE_INGREDIENTS } from '@fridge/shared';
import { CUISINES, EQUIPMENT, type Steps } from './enrich';

const tidy = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function createGeminiSteps(options: { apiKey: string; model: string; cacheDir: string; log?: (m: string) => void }): Steps {
  const ai = new GoogleGenAI({ apiKey: options.apiKey });
  const log = options.log ?? (() => {});
  mkdirSync(options.cacheDir, { recursive: true });

  async function askJson(prompt: string, schema: object): Promise<unknown> {
    const file = join(options.cacheDir, `${createHash('sha1').update(options.model + prompt).digest('hex')}.json`);
    if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
    for (let attempt = 0; ; attempt++) {
      try {
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
        if (attempt >= 5 || (status !== undefined && status < 500 && status !== 429)) throw e;
        const wait = Math.min(60_000, 2000 * 2 ** attempt);
        log(`Gemini call failed (${e instanceof Error ? e.message.slice(0, 120) : e}); retrying in ${wait / 1000}s`);
        await sleep(wait);
      }
    }
  }

  return {
    async mapIngredients(raw) {
      const json = (await askJson(MAP_PROMPT(raw), MAP_SCHEMA)) as { items?: { raw: string; name: string | null }[] };
      const byRaw = new Map((json.items ?? []).map((i) => [tidy(i.raw), i.name]));
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
  };
}

const MAP_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: { raw: { type: 'string' }, name: { type: ['string', 'null'] } },
        required: ['raw', 'name'],
      },
    },
  },
  required: ['items'],
};

const MAP_PROMPT = (raw: string[]) => `You standardise recipe ingredient wording to the generic ingredient a shopper would name.

For each input line return its standard name:
- Lowercase, singular, generic: "garlic cloves" -> "garlic", "all-purpose flour" -> "flour", "granulated sugar" -> "sugar", "boneless skinless chicken breasts" -> "chicken breast", "extra virgin olive oil" -> "olive oil".
- Drop preparation, size, brand and quantity words (chopped, fresh, large, Heinz).
- Keep distinctions that change the dish: brown sugar vs sugar, buttermilk vs milk, cheddar cheese vs parmesan, chicken breast vs chicken thigh, red onion vs onion.
- Prefer a name from the preferred list when one fits exactly. Use British names, as the list does (courgette, aubergine, coriander, spring onion, icing sugar, plain flour is just "flour").
- If the line is not one specific ingredient ("garnish", "ingredients", "optional toppings", "salt and pepper", "your favorite sauce"), return null.

Preferred list: ${FIXTURE_INGREDIENTS.join(', ')}

Input lines:
${JSON.stringify(raw)}

Return every input line once, with "raw" exactly as given.`;

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

Return merges only for names that should become another name FROM THE SAME LIST. Pick the more common British name as the target. Do not merge ingredients that cook or taste differently (brown sugar and sugar, butter and margarine, milk and buttermilk, chicken breast and chicken thigh, red onion and onion).

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
          equipment: { type: 'array', items: { type: 'string', enum: [...EQUIPMENT] } },
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
