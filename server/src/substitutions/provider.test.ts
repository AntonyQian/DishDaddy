import { describe, expect, it } from 'vitest';
import { selectSubstitutionModel } from './provider';

describe('selectSubstitutionModel', () => {
  it('uses the same provider as detection', () => {
    expect(selectSubstitutionModel({ ANTHROPIC_API_KEY: 'a', GEMINI_API_KEY: 'g' })?.provider).toBe('anthropic');
    expect(selectSubstitutionModel({ DETECTION_PROVIDER: 'gemini', ANTHROPIC_API_KEY: 'a', GEMINI_API_KEY: 'g' })?.provider).toBe('gemini');
    expect(selectSubstitutionModel({ OPENAI_API_KEY: 'k' })?.provider).toBe('openai');
  });
  it('returns undefined when the chosen provider has no key', () => {
    expect(selectSubstitutionModel({})).toBeUndefined();
  });
});
