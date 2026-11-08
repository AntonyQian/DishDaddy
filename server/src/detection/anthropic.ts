import Anthropic from '@anthropic-ai/sdk';
import { STRICT_RESPONSE_SCHEMA, detectionPrompt, parseItems } from './prompt';
import type { PhotoModel } from './types';

// Same job as gemini.ts and openai.ts behind the same PhotoModel seam. Haiku is
// the cheap default; the SDK retries 429/5xx itself.

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

export function createAnthropicModel(options: {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
}): PhotoModel {
  const client = new Anthropic({ apiKey: options.apiKey, timeout: options.timeoutMs ?? 60_000 });
  const model = options.model ?? 'claude-haiku-5-5';

  return async (photo, vocabulary) => {
    const response = await client.messages.create({
      model,
      max_tokens: 8000,
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: STRICT_RESPONSE_SCHEMA as unknown as Record<string, unknown> },
      },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: photo.mimeType as ImageMediaType,
                data: Buffer.from(photo.bytes).toString('base64'),
              },
            },
            { type: 'text', text: detectionPrompt(vocabulary) },
          ],
        },
      ],
    });
    if (response.stop_reason === 'refusal') throw new Error('Anthropic refused the request');
    if (response.stop_reason === 'max_tokens') throw new Error('Anthropic response was cut off (max_tokens)');
    const block = response.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') throw new Error('Anthropic returned no text');
    return parseItems(JSON.parse(block.text), 'Anthropic');
  };
}
