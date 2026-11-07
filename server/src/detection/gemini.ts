import { GoogleGenAI, MediaResolution } from '@google/genai';
import type { Box } from '@fridge/shared';
import type { ModelDetection, PhotoModel } from './types';

// ADR 0001: Gemini Flash at high media resolution with a strict JSON schema.

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: ['string', 'null'],
            description: 'Ingredient name from the list, or null if you cannot tell what it is.',
          },
          label: { type: 'string', description: 'Short description of what you see.' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          box_2d: {
            type: 'array',
            items: { type: 'integer', minimum: 0, maximum: 1000 },
            minItems: 4,
            maxItems: 4,
            description: '[ymin, xmin, ymax, xmax] normalised to 0-1000.',
          },
          alternatives: {
            type: 'array',
            items: { type: 'string' },
            description: 'Other ingredients from the list it could be, most likely first. Empty if sure.',
          },
          visible_text: { type: 'string', description: 'Text readable on the packaging, if any.' },
        },
        required: ['name', 'label', 'confidence', 'box_2d', 'alternatives'],
      },
    },
  },
  required: ['items'],
} as const;

function prompt(vocabulary: readonly string[]): string {
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

interface GeminiItem {
  name: string | null;
  label: string;
  confidence: number;
  box_2d: number[];
  alternatives: string[];
  visible_text?: string;
}

export function createGeminiModel(options: {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
}): PhotoModel {
  const ai = new GoogleGenAI({ apiKey: options.apiKey });
  const model = options.model ?? 'gemini-3.8-flash';

  return async (photo, vocabulary) => {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: photo.mimeType, data: Buffer.from(photo.bytes).toString('base64') } },
            { text: prompt(vocabulary) },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: RESPONSE_SCHEMA,
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH,
        abortSignal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
      },
    });
    const text = response.text;
    if (!text) throw new Error('Gemini returned no content');
    return parseItems(JSON.parse(text));
  };
}

function parseItems(json: unknown): ModelDetection[] {
  const items = (json as { items?: GeminiItem[] }).items;
  if (!Array.isArray(items)) throw new Error('Gemini response has no items array');
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
