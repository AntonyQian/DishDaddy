import { chooseProvider, type ProviderEnv, type ProviderName } from '../detection/provider';
import { createAnthropicSubstitutions, createGeminiSubstitutions, createOpenAISubstitutions } from './models';
import type { SuggestSubstitutions } from './types';

/** The Substitutions model for the same provider detection uses, or undefined so the endpoint answers 503. */
export function selectSubstitutionModel(env: ProviderEnv): { provider: ProviderName; suggest: SuggestSubstitutions } | undefined {
  const choice = chooseProvider(env);
  if (!choice) return undefined;
  const create = {
    anthropic: createAnthropicSubstitutions,
    openai: createOpenAISubstitutions,
    gemini: createGeminiSubstitutions,
  }[choice.provider];
  return { provider: choice.provider, suggest: create({ apiKey: choice.apiKey, model: choice.model }) };
}
