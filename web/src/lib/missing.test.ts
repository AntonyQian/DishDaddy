import type { Recipe } from '@fridge/shared';
import { describe, expect, it } from 'vitest';

import { missingIngredients } from './missing';

const recipe = (names: string[]) => ({ ingredients: names.map((ingredient) => ({ ingredient, quantity: '1' })) }) as Recipe;

describe('missingIngredients', () => {
  it('lists what is neither in the Kitchen nor a Staple, in recipe order', () => {
    expect([...missingIngredients(recipe(['egg', 'milk', 'salt', 'chives']), { ingredients: ['egg'], staples: ['salt'] })]).toEqual(['milk', 'chives']);
  });
  it('ignores case and stray spaces', () => {
    expect(missingIngredients(recipe(['Egg', 'Olive Oil']), { ingredients: [' egg'], staples: ['olive oil '] }).size).toBe(0);
  });
});
