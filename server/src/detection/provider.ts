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

/** The chosen LLM provider and its credentials; shared by detection and Substitutions. */
export interface ProviderChoice {
  provider: ProviderName;
  apiKey: string;
  /** Undefined means the client's default model. */
  model?: string;
}

/**
 * Picks the LLM provider from the environment. DETECTION_PROVIDER wins when
 * set; otherwise the first provider with a key is used: Anthropic, OpenAI, Gemini.
 * Returns undefined when the chosen provider has no key.
 */
export function chooseProvider(env: ProviderEnv): ProviderChoice | undefined {
  const requested = env.DETECTION_PROVIDER?.trim().toLowerCase();
  if (requested && requested !== 'anthropic' && requested !== 'openai' && requested !== 'gemini') {
    throw new Error(`DETECTION_PROVIDER must be "anthropic", "openai" or "gemini", got "${env.DETECTION_PROVIDER}"`);
  }
  const provider: ProviderName =
    (requested as ProviderName | undefined) ||
    (env.ANTHROPIC_API_KEY ? 'anthropic' : env.OPENAI_API_KEY ? 'openai' : 'gemini');

  const [apiKey, model] =
    provider === 'anthropic' ? [env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL]
    : provider === 'openai' ? [env.OPENAI_API_KEY, env.OPENAI_MODEL]
    : [env.GEMINI_API_KEY, env.GEMINI_MODEL];
  if (!apiKey) return undefined;
  return { provider, apiKey, model: model || undefined };
}

export interface SelectedModel {
  provider: ProviderName;
  model: PhotoModel;
}

/** The detection model for the chosen provider, or undefined so /scan can answer 503. */
export function selectPhotoModel(env: ProviderEnv): SelectedModel | undefined {
  const choice = chooseProvider(env);
  if (!choice) return undefined;
  const create = { anthropic: createAnthropicModel, openai: createOpenAIModel, gemini: createGeminiModel }[choice.provider];
  return { provider: choice.provider, model: create({ apiKey: choice.apiKey, model: choice.model }) };
}
