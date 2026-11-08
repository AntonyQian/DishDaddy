import { describe, expect, it } from 'vitest';
import type { Recipe } from '@fridge/shared';
import { buildSearchRequest, missingIngredients } from './recipeMatch';

const recipe = (ingredients: string[]): Recipe => ({
  id: 'r1', name: 'Omelette', servings: 2, equipment: ['hob'], cuisine: 'French', minutes: 10, steps: [], highProtein: true,
  ingredients: ingredients.map((ingredient) => ({ ingredient, quantity: '1' })),
});

describe('Missing Ingredients', () => {
  it('are the ones neither confirmed in the latest Scan nor a Staple', () => {
    const missing = missingIngredients(recipe(['egg', 'milk', 'salt', 'chives']), { ingredients: ['egg'], staples: ['salt'] });
    expect([...missing]).toEqual(['milk', 'chives']);
  });

  it('ignore case and stray spaces when comparing names', () => {
    const missing = missingIngredients(recipe(['Egg', 'Olive Oil']), { ingredients: [' egg'], staples: ['olive oil '] });
    expect(missing.size).toBe(0);
  });
});

describe('Recipe search request', () => {
  it('sends the latest Scan\'s confirmed Ingredients with the Staples and Equipment', () => {
    const req = buildSearchRequest({ ingredients: ['egg', 'leek'], confirmedAt: '2026-11-07T00:00:00Z' }, ['salt'], ['hob']);
    expect(req).toEqual({ ingredients: ['egg', 'leek'], staples: ['salt'], equipment: ['hob'] });
  });

  it('sends no Ingredients when there is no latest Scan', () => {
    expect(buildSearchRequest(null, ['salt'], ['hob']).ingredients).toEqual([]);
  });
});
