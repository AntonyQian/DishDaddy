import type { Box } from '@fridge/shared';
import type { ModelDetection } from './types';

// Shared by every provider (Gemini, OpenAI): the instructions and the parsing
// of the JSON they return, so providers can be compared on identical rules.

export function detectionPrompt(vocabulary: readonly string[]): string {
  return `You are identifying food ingredients in a photo of a fridge, freezer or cupboard.

Rules:
- List only items that are clearly visible. Never list something you merely expect to be there.
- Use names from the ingredient list below. Name the generic ingredient, not the brand ("ketchup", not "Heinz").
- Read labels on jars, bottles and packets and use them to decide what the item is.
- If you cannot tell what an item is (an opaque tupperware, an unlabelled jar), set name to null rather than guess, and describe it in label.
- If unsure between look-alikes (leek vs spring onion, parsley vs coriander, yogurt vs Greek yogurt, dairy vs plant milk), give your best name, a confidence below 0.7, and the other options in alternatives.
- List each distinct ingredient once per photo, even if there are several of it.
- confidence is your probability (0-1) that name is correct.

Ingredient list:
${vocabulary.join(', ')}`;
}

// Strict JSON schema shared by OpenAI and Anthropic structured outputs: every
// property required, no min/max keywords. parseItems clamps and filters after.
export const STRICT_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: {
            type: ['string', 'null'],
            description: 'Ingredient name from the list, or null if you cannot tell what it is.',
          },
          label: { type: 'string', description: 'Short description of what you see.' },
          confidence: { type: 'number', description: 'Probability from 0 to 1 that name is correct.' },
          box_2d: {
            type: 'array',
            items: { type: 'integer' },
            description: 'Bounding box [ymin, xmin, ymax, xmax], integers normalised to 0-1000.',
          },
          alternatives: {
            type: 'array',
            items: { type: 'string' },
            description: 'Other ingredients from the list it could be, most likely first. Empty if sure.',
          },
          visible_text: { type: 'string', description: 'Text readable on the packaging, or an empty string.' },
        },
        required: ['name', 'label', 'confidence', 'box_2d', 'alternatives', 'visible_text'],
      },
    },
  },
  required: ['items'],
} as const;

interface RawItem {
  name: string | null;
  label: string;
  confidence: number;
  box_2d: number[];
  alternatives: string[];
  visible_text?: string | null;
}

export function parseItems(json: unknown, provider: string): ModelDetection[] {
  const items = (json as { items?: RawItem[] }).items;
  if (!Array.isArray(items)) throw new Error(`${provider} response has no items array`);
  return items
    .filter((i) => Array.isArray(i.box_2d) && i.box_2d.length === 4)
    .map((i) => ({
      name: i.name || null,
      label: i.label ?? '',
      confidence: Math.min(1, Math.max(0, Number(i.confidence) || 0)),
      box: i.box_2d as Box,
      alternatives: Array.isArray(i.alternatives) ? i.alternatives : [],
      ...(i.visible_text ? { visibleText: i.visible_text } : {}),
    }));
}
