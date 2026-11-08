import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => void store.set(k, v),
  },
}));

import { DEFAULT_SERVINGS, loadServings, saveServings, stepServings } from './servings';

beforeEach(() => store.clear());

describe('servings on the device', () => {
  it('starts at one serving, since most meals are for one person', async () => {
    expect(DEFAULT_SERVINGS).toBe(1);
    expect(await loadServings()).toBe(1);
  });
  it('remembers the last choice', async () => {
    await saveServings(2);
    expect(await loadServings()).toBe(2);
  });
  it('ignores anything stored that is not a sensible number', async () => {
    store.set('servings', '0');
    expect(await loadServings()).toBe(1);
    store.set('servings', 'lots');
    expect(await loadServings()).toBe(1);
    store.set('servings', '99');
    expect(await loadServings()).toBe(1);
  });
});

describe('stepServings', () => {
  it('moves by one within 1 to 12', () => {
    expect(stepServings(2, 1)).toBe(3);
    expect(stepServings(2, -1)).toBe(1);
    expect(stepServings(1, -1)).toBe(1);
    expect(stepServings(12, 1)).toBe(12);
  });
});
