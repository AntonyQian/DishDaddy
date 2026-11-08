import { describe, expect, it } from 'vitest';
import { FIXTURE_INGREDIENTS } from '@fridge/shared';
import { ingredientList, loadRecipes } from './collection';

const FIXTURE = new URL('./fixtures/recipes.fixture.json', import.meta.url);

describe('real collection (data/recipes.json)', () => {
  const recipes = loadRecipes();

  it('loads, with enough recipes to be useful', () => {
    expect(recipes.length).toBeGreaterThanOrEqual(1000);
  });

  it('only uses known Equipment', () => {
    const known = new Set(['oven', 'hob', 'microwave', 'air fryer', 'blender', 'mixer', 'meat grinder', 'slow cooker', 'pressure cooker', 'grill', 'rice cooker', 'toaster']);
    expect(recipes.flatMap((r) => r.equipment).filter((e) => !known.has(e))).toEqual([]);
  });
});

describe('fixture collection', () => {
  const recipes = loadRecipes(FIXTURE);

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
