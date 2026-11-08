import { describe, expect, it } from 'vitest';
import { selectPhotoModel } from './provider';

describe('selectPhotoModel', () => {
  it('prefers Anthropic when its key is set', () => {
    expect(selectPhotoModel({ ANTHROPIC_API_KEY: 'a', OPENAI_API_KEY: 'k', GEMINI_API_KEY: 'g' })?.provider).toBe('anthropic');
  });
  it('uses OpenAI over Gemini when both keys are set', () => {
    expect(selectPhotoModel({ OPENAI_API_KEY: 'k', GEMINI_API_KEY: 'g' })?.provider).toBe('openai');
  });
  it('falls back to Gemini when only its key is set', () => {
    expect(selectPhotoModel({ GEMINI_API_KEY: 'g' })?.provider).toBe('gemini');
  });
  it('honours DETECTION_PROVIDER over key presence', () => {
    const env = { DETECTION_PROVIDER: 'gemini', OPENAI_API_KEY: 'k', GEMINI_API_KEY: 'g' };
    expect(selectPhotoModel(env)?.provider).toBe('gemini');
  });
  it('returns undefined when the chosen provider has no key', () => {
    expect(selectPhotoModel({})).toBeUndefined();
    expect(selectPhotoModel({ DETECTION_PROVIDER: 'openai', GEMINI_API_KEY: 'g' })).toBeUndefined();
  });
  it('rejects an unknown provider', () => {
    expect(() => selectPhotoModel({ DETECTION_PROVIDER: 'mistral' })).toThrow(/DETECTION_PROVIDER/);
  });
});
