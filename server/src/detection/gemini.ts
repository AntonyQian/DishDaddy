import { GoogleGenAI, MediaResolution } from '@google/genai';
import { detectionPrompt, parseItems } from './prompt';
import type { PhotoModel } from './types';

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

/** Gemini answers 503/429 under load; retry those a few times with backoff. */
export async function withRetry<T>(call: () => Promise<T>, attempts = 4): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await call();
    } catch (err) {
      const status = (err as { status?: number }).status;
      const retryable = status === 503 || status === 429 || status === 500 || (err as Error).name === 'TimeoutError';
      if (!retryable || attempt >= attempts) throw err;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
    }
  }
}

export function createGeminiModel(options: {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
}): PhotoModel {
  const ai = new GoogleGenAI({ apiKey: options.apiKey });
  const model = options.model ?? 'gemini-3.5-flash';

  return async (photo, vocabulary) => {
    const response = await withRetry(() => ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: photo.mimeType, data: Buffer.from(photo.bytes).toString('base64') } },
            { text: detectionPrompt(vocabulary) },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: RESPONSE_SCHEMA,
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH,
        abortSignal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
      },
    }));
    const text = response.text;
    if (!text) throw new Error('Gemini returned no content');
    return parseItems(JSON.parse(text), 'Gemini');
  };
}
