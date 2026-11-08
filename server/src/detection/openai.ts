import OpenAI from 'openai';
import { STRICT_RESPONSE_SCHEMA, detectionPrompt, parseItems } from './prompt';
import type { PhotoModel } from './types';

// Same job as gemini.ts behind the same PhotoModel seam: one photo in, items out.

export function createOpenAIModel(options: {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
}): PhotoModel {
  const client = new OpenAI({ apiKey: options.apiKey });
  const model = options.model ?? 'gpt-4o';

  return async (photo, vocabulary) => {
    const dataUrl = `data:${photo.mimeType};base64,${Buffer.from(photo.bytes).toString('base64')}`;
    const response = await client.chat.completions.create(
      {
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
              { type: 'text', text: detectionPrompt(vocabulary) },
            ],
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'fridge_detections', strict: true, schema: STRICT_RESPONSE_SCHEMA },
        },
      },
      { timeout: options.timeoutMs ?? 30_000 },
    );
    const message = response.choices[0]?.message;
    if (message?.refusal) throw new Error(`OpenAI refused: ${message.refusal}`);
    const text = message?.content;
    if (!text) throw new Error('OpenAI returned no content');
    return parseItems(JSON.parse(text), 'OpenAI');
  };
}
