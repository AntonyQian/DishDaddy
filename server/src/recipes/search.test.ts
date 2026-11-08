import { describe, expect, it } from 'vitest';
import type { Recipe } from '@fridge/shared';
import { searchRecipes } from './search';

function recipe(id: string, ingredients: string[], extra: Partial<Recipe> = {}): Recipe {
  return {
    id,
    name: id,
    servings: 2,
    ingredients: ingredients.map((ingredient) => ({ ingredient, quantity: '1' })),
    equipment: [],
    cuisine: 'any',
    minutes: 20,
    steps: [],
    highProtein: false,
    ...extra,
  };
}

const none = { staples: [], equipment: [] };

describe('searchRecipes', () => {
  it('drops recipes that need Equipment the user lacks', () => {
    const recipes = [
      recipe('roast', ['egg'], { equipment: ['oven'] }),
      recipe('fry', ['egg'], { equipment: ['hob'] }),
    ];
    const ids = searchRecipes(recipes, { ingredients: ['egg'], staples: [], equipment: ['hob'] }).map((m) => m.recipeId);
    expect(ids).toEqual(['fry']);
  });

  it('treats Staples as available', () => {
    const [m] = searchRecipes([recipe('omelette', ['egg', 'salt'])], { ingredients: ['egg'], staples: ['salt'], equipment: [] });
    expect(m.missing).toEqual([]);
    expect(m.usedCount).toBe(2);
  });

  it('lists Missing Ingredients', () => {
    const [m] = searchRecipes([recipe('omelette', ['egg', 'cheddar cheese'])], { ingredients: ['egg'], ...none });
    expect(m.missing).toEqual(['cheddar cheese']);
  });

  it('ranks fewest missing first, then most used', () => {
    const recipes = [
      recipe('two-missing', ['egg', 'milk', 'flour', 'butter']),
      recipe('one-missing-one-used', ['egg', 'flour']),
      recipe('one-missing-two-used', ['egg', 'milk', 'flour']),
      recipe('none-missing', ['egg']),
    ];
    const ids = searchRecipes(recipes, { ingredients: ['egg', 'milk'], ...none }).map((m) => m.recipeId);
    expect(ids).toEqual(['none-missing', 'one-missing-two-used', 'one-missing-one-used', 'two-missing']);
  });

  it('skips recipes that use none of the scanned Ingredients', () => {
    const recipes = [recipe('salad', ['lettuce', 'salt']), recipe('omelette', ['egg'])];
    const ids = searchRecipes(recipes, { ingredients: ['egg'], staples: ['salt'], equipment: [] }).map((m) => m.recipeId);
    expect(ids).toEqual(['omelette']);
  });

  it('matches names case-insensitively', () => {
    const [m] = searchRecipes([recipe('r', ['Egg'], { equipment: ['Oven'] })], { ingredients: ['egg'], staples: [], equipment: ['OVEN'] });
    expect(m.missing).toEqual([]);
  });

  it('counts an Ingredient listed twice once', () => {
    const [m] = searchRecipes([recipe('r', ['egg', 'Egg', 'milk'])], { ingredients: ['egg'], ...none });
    expect(m.missing).toEqual(['milk']);
    expect(m.usedCount).toBe(1);
  });

  it('returns at most the top N', () => {
    const recipes = ['a', 'b', 'c'].map((id) => recipe(id, ['egg']));
    expect(searchRecipes(recipes, { ingredients: ['egg'], ...none }, 2)).toHaveLength(2);
  });

  it('copies display fields into the RecipeMatch', () => {
    const [m] = searchRecipes([recipe('r', ['egg'], { name: 'Eggs', cuisine: 'French', minutes: 5, imageUrl: 'u' })], { ingredients: ['egg'], ...none });
    expect(m).toEqual({ recipeId: 'r', name: 'Eggs', imageUrl: 'u', missing: [], usedCount: 1, cuisine: 'French', minutes: 5, highProtein: false });
  });

  it('carries nutrition into the RecipeMatch', () => {
    const [m] = searchRecipes([recipe('r', ['egg'], { calories: 480, proteinGrams: 35, highProtein: true })], { ingredients: ['egg'], ...none });
    expect(m).toMatchObject({ calories: 480, proteinGrams: 35, highProtein: true });
  });
});
