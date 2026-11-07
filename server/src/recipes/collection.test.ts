import { describe, expect, it } from 'vitest';
import { FIXTURE_INGREDIENTS } from '@fridge/shared';
import { ingredientList, loadRecipes } from './collection';

describe('fixture collection', () => {
  const recipes = loadRecipes();

  it('loads valid recipes', () => {
    expect(recipes.length).toBeGreaterThanOrEqual(10);
  });

  it('only uses ingredient names from the shared fixture list', () => {
    const unknown = ingredientList(recipes).filter((i) => !FIXTURE_INGREDIENTS.includes(i));
    expect(unknown).toEqual([]);
  });
});

describe('ingredientList', () => {
  it('is de-duplicated and sorted', () => {
    const r = (id: string, names: string[]) => ({ id, name: id, servings: 1, ingredients: names.map((ingredient) => ({ ingredient, quantity: '' })), equipment: [], cuisine: '', minutes: 1, steps: [], highProtein: false });
    expect(ingredientList([r('a', ['milk', 'egg']), r('b', ['egg', 'butter'])])).toEqual(['butter', 'egg', 'milk']);
  });
});
