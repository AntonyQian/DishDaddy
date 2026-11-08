import { createAnthropicModel } from './anthropic';
import { createGeminiModel } from './gemini';
import { createOpenAIModel } from './openai';
import type { PhotoModel } from './types';

export type ProviderName = 'anthropic' | 'openai' | 'gemini';

export interface ProviderEnv {
  DETECTION_PROVIDER?: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

export interface SelectedModel {
  provider: ProviderName;
  model: PhotoModel;
}

/**
 * Picks the detection model from the environment. DETECTION_PROVIDER wins when
 * set; otherwise the first provider with a key is used: Anthropic, OpenAI, Gemini. Returns
 * undefined when the chosen provider has no key, so /scan can answer 503.
 */
export function selectPhotoModel(env: ProviderEnv): SelectedModel | undefined {
  const requested = env.DETECTION_PROVIDER?.trim().toLowerCase();
  if (requested && requested !== 'anthropic' && requested !== 'openai' && requested !== 'gemini') {
    throw new Error(`DETECTION_PROVIDER must be "anthropic", "openai" or "gemini", got "${env.DETECTION_PROVIDER}"`);
  }
  const provider: ProviderName =
    (requested as ProviderName | undefined) ||
    (env.ANTHROPIC_API_KEY ? 'anthropic' : env.OPENAI_API_KEY ? 'openai' : 'gemini');

  if (provider === 'anthropic') {
    if (!env.ANTHROPIC_API_KEY) return undefined;
    return {
      provider,
      model: createAnthropicModel({ apiKey: env.ANTHROPIC_API_KEY, model: env.ANTHROPIC_MODEL || undefined }),
    };
  }

  if (provider === 'openai') {
    if (!env.OPENAI_API_KEY) return undefined;
    return {
      provider,
      model: createOpenAIModel({ apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL || undefined }),
    };
  }
  if (!env.GEMINI_API_KEY) return undefined;
  return {
    provider,
    model: createGeminiModel({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL || undefined }),
  };
}
