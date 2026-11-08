import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => void store.set(k, v),
  },
}));

import { DEFAULT_GOALS, loadGoals, percentOfGoal, saveGoals, stepGoal } from './goals';

beforeEach(() => store.clear());

describe('Goals on the device', () => {
  it('starts with the default goals on first run', async () => {
    expect(await loadGoals()).toEqual(DEFAULT_GOALS);
  });

  it('remembers goals after they are saved', async () => {
    await saveGoals({ proteinGrams: 150, calories: 2400 });
    expect(await loadGoals()).toEqual({ proteinGrams: 150, calories: 2400 });
  });

  it('falls back to the defaults for anything stored that is not a sensible goal', async () => {
    store.set('goals', '{"proteinGrams":"lots","calories":-5}');
    expect(await loadGoals()).toEqual(DEFAULT_GOALS);
    store.set('goals', 'not json');
    expect(await loadGoals()).toEqual(DEFAULT_GOALS);
  });
});

describe('stepGoal', () => {
  it('moves protein by 5 g and calories by 50, within limits', () => {
    expect(stepGoal('proteinGrams', 100, 1)).toBe(105);
    expect(stepGoal('proteinGrams', 100, -1)).toBe(95);
    expect(stepGoal('calories', 2000, 1)).toBe(2050);
    expect(stepGoal('proteinGrams', 300, 1)).toBe(300);
    expect(stepGoal('proteinGrams', 20, -1)).toBe(20);
    expect(stepGoal('calories', 1000, -1)).toBe(1000);
  });
});

describe('percentOfGoal', () => {
  it('rounds to a whole percent', () => {
    expect(percentOfGoal(35, 160)).toBe(22);
    expect(percentOfGoal(5, 100)).toBe(5);
  });
  it('is null when there is nothing to compare', () => {
    expect(percentOfGoal(undefined, 100)).toBeNull();
    expect(percentOfGoal(10, 0)).toBeNull();
  });
});
