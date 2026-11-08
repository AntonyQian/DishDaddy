import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => void store.set(k, v),
  },
}));

import {
  addScanToKitchen, insertIngredient, loadLatestScan, mergeIngredients, removeIngredient, saveLatestScan,
} from './latestScan';

beforeEach(() => store.clear());

describe('mergeIngredients', () => {
  it('keeps what is already there and adds what is new, once each, in order', () => {
    expect(mergeIngredients(['egg', 'milk'], ['milk', 'spinach', 'egg'])).toEqual(['egg', 'milk', 'spinach']);
  });
  it('tidies names, so "Milk " and "milk" are one Ingredient', () => {
    expect(mergeIngredients(['milk'], [' Milk ', 'Spring  Onion'])).toEqual(['milk', 'spring onion']);
  });
  it('drops blank names', () => {
    expect(mergeIngredients([], ['', '  ', 'egg'])).toEqual(['egg']);
  });
});

describe('removeIngredient and insertIngredient', () => {
  it('removes one Ingredient and leaves the rest in order', () => {
    expect(removeIngredient(['egg', 'milk', 'spinach'], 'milk')).toEqual(['egg', 'spinach']);
  });
  it('puts an Ingredient back where it was, for Undo', () => {
    expect(insertIngredient(['egg', 'spinach'], 'milk', 1)).toEqual(['egg', 'milk', 'spinach']);
    expect(insertIngredient(['egg'], 'milk', 5)).toEqual(['egg', 'milk']);
  });
  it('does not add it twice if it is already back', () => {
    expect(insertIngredient(['egg', 'milk'], 'milk', 0)).toEqual(['egg', 'milk']);
  });
});

describe('the Kitchen on the device', () => {
  it('starts empty', async () => {
    expect(await loadLatestScan()).toBeNull();
  });

  it('adds each confirmed Scan to what is already there', async () => {
    await addScanToKitchen(['egg', 'milk']);
    const after = await addScanToKitchen(['milk', 'spinach']);
    expect(after.ingredients).toEqual(['egg', 'milk', 'spinach']);
    expect((await loadLatestScan())!.ingredients).toEqual(['egg', 'milk', 'spinach']);
  });

  it('keeps a list that was edited down, including down to nothing', async () => {
    await addScanToKitchen(['egg']);
    await saveLatestScan([]);
    expect((await loadLatestScan())!.ingredients).toEqual([]);
    expect((await addScanToKitchen(['milk'])).ingredients).toEqual(['milk']);
  });
});
