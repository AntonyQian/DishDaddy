import type { Substitution } from '@fridge/shared';
import type { SubstitutionQuery } from './types';

// Shared by every provider, like detection/prompt.ts.

export function substitutionPrompt({ recipe, missing, available }: SubstitutionQuery): string {
  const lines = recipe.ingredients.map((i) => `- ${i.quantity ? `${i.quantity} ` : ''}${i.ingredient}`);
  return `You suggest ingredient substitutions for a home cook.

Recipe: ${recipe.name}
Ingredients:
${lines.join('\n')}

The cook is missing: ${missing.join(', ')}
The cook has: ${available.join(', ')}

For each missing ingredient, suggest swaps that work in this recipe, made ONLY from what the cook has.
Rules:
- "missing" is the missing ingredient's name exactly as listed above.
- "use" lists the cook's ingredients the swap needs, using their names exactly as listed above (e.g. buttermilk -> ["milk", "lemon"]).
- Never use another missing ingredient or anything the cook does not have.
- Give at most 2 swaps per missing ingredient, best first. Skip an ingredient if no sensible swap exists; an empty list is fine.
- "note" is one short sentence on how to do it, with amounts if useful.`;
}

// Strict schema (OpenAI and Anthropic structured outputs, Gemini JSON schema):
// every property required, no extra keywords.
export const SUBSTITUTIONS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    substitutions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          missing: { type: 'string', description: 'The missing ingredient, as named in the recipe.' },
          use: { type: 'array', items: { type: 'string' }, description: "The cook's ingredients to use instead." },
          note: { type: 'string', description: 'One short how-to sentence, or an empty string.' },
        },
        required: ['missing', 'use', 'note'],
      },
    },
  },
  required: ['substitutions'],
} as const;

/** Parse a model's JSON answer; malformed entries are dropped, not fatal. */
export function parseSubstitutions(json: unknown, source: string): Substitution[] {
  const list = (json as { substitutions?: unknown } | null)?.substitutions;
  if (!Array.isArray(list)) throw new Error(`${source} returned no substitutions array`);
  return list.flatMap((s): Substitution[] => {
    if (!s || typeof s.missing !== 'string' || !Array.isArray(s.use)) return [];
    const use = s.use.filter((u: unknown): u is string => typeof u === 'string');
    const note = typeof s.note === 'string' && s.note.trim() ? s.note.trim() : undefined;
    return [{ missing: s.missing, use, ...(note ? { note } : {}) }];
  });
}
