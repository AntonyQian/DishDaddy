import type { Recipe } from '@fridge/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => void store.set(k, v),
  },
}));

import { isRecipeSaved, loadSavedRecipes, toggleSavedRecipe } from './savedRecipes';

function recipe(id: string, name: string): Recipe {
  return {
    id, name, servings: 2, ingredients: [{ ingredient: 'egg', quantity: '2' }], equipment: ['hob'],
    cuisine: 'British', minutes: 10, steps: ['Cook it.'], highProtein: true,
  };
}

beforeEach(() => store.clear());

describe('Saved Recipes on the device', () => {
  it('has no Saved Recipes on first run', async () => {
    expect(await loadSavedRecipes()).toEqual([]);
  });

  it('keeps a saved Recipe, whole, for the next app start', async () => {
    const omelette = recipe('r1', 'Omelette');
    expect(await toggleSavedRecipe(omelette)).toBe(true);
    expect(await loadSavedRecipes()).toEqual([omelette]);
    expect(await isRecipeSaved('r1')).toBe(true);
  });

  it('unsaves a Recipe when toggled again, leaving the others', async () => {
    await toggleSavedRecipe(recipe('r1', 'Omelette'));
    await toggleSavedRecipe(recipe('r2', 'Pancakes'));
    expect(await toggleSavedRecipe(recipe('r1', 'Omelette'))).toBe(false);
    expect((await loadSavedRecipes()).map((r) => r.id)).toEqual(['r2']);
    expect(await isRecipeSaved('r1')).toBe(false);
  });

  it('lists the most recently saved Recipe first', async () => {
    await toggleSavedRecipe(recipe('r1', 'Omelette'));
    await toggleSavedRecipe(recipe('r2', 'Pancakes'));
    expect((await loadSavedRecipes()).map((r) => r.name)).toEqual(['Pancakes', 'Omelette']);
  });
});
