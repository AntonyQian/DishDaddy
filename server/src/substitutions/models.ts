import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { withRetry } from '../detection/gemini';
import { SUBSTITUTIONS_SCHEMA, parseSubstitutions, substitutionPrompt } from './prompt';
import type { SuggestSubstitutions } from './types';

// One text-only client per provider behind the SuggestSubstitutions seam,
// with the same default models as detection.

interface ClientOptions {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
}

export function createGeminiSubstitutions(options: ClientOptions): SuggestSubstitutions {
  const ai = new GoogleGenAI({ apiKey: options.apiKey });
  const model = options.model ?? 'gemini-3.5-flash';
  return async (query) => {
    const response = await withRetry(() => ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: substitutionPrompt(query) }] }],
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: SUBSTITUTIONS_SCHEMA,
        abortSignal: AbortSignal.timeout(options.timeoutMs ?? 20_000),
      },
    }));
    if (!response.text) throw new Error('Gemini returned no content');
    return parseSubstitutions(JSON.parse(response.text), 'Gemini');
  };
}

export function createAnthropicSubstitutions(options: ClientOptions): SuggestSubstitutions {
  // the SDK retries 429/5xx itself
  const client = new Anthropic({ apiKey: options.apiKey, timeout: options.timeoutMs ?? 30_000 });
  const model = options.model ?? 'claude-haiku-5-5';
  return async (query) => {
    const response = await client.messages.create({
      model,
      max_tokens: 2000,
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: SUBSTITUTIONS_SCHEMA as unknown as Record<string, unknown> },
      },
      messages: [{ role: 'user', content: substitutionPrompt(query) }],
    });
    if (response.stop_reason === 'refusal') throw new Error('Anthropic refused the request');
    if (response.stop_reason === 'max_tokens') throw new Error('Anthropic response was cut off (max_tokens)');
    const block = response.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') throw new Error('Anthropic returned no text');
    return parseSubstitutions(JSON.parse(block.text), 'Anthropic');
  };
}

export function createOpenAISubstitutions(options: ClientOptions): SuggestSubstitutions {
  const client = new OpenAI({ apiKey: options.apiKey });
  const model = options.model ?? 'gpt-4o';
  return async (query) => {
    const response = await client.chat.completions.create(
      {
        model,
        messages: [{ role: 'user', content: substitutionPrompt(query) }],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'substitutions', strict: true, schema: SUBSTITUTIONS_SCHEMA },
        },
      },
      { timeout: options.timeoutMs ?? 20_000 },
    );
    const message = response.choices[0]?.message;
    if (message?.refusal) throw new Error(`OpenAI refused: ${message.refusal}`);
    if (!message?.content) throw new Error('OpenAI returned no content');
    return parseSubstitutions(JSON.parse(message.content), 'OpenAI');
  };
}
