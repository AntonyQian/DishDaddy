import { describe, expect, it } from 'vitest';
import { loadRecipes } from '../src/recipes/collection';
import { buildRecipes, highProtein, mergeAmounts, tidyStep, type Steps } from './enrich';
import type { RawRecipe } from './filterRecipes';

function raw(id: string, names: string[], extra: Partial<RawRecipe> = {}): RawRecipe {
  return {
    id, name: `Recipe ${id}`, imageUrl: 'https://img/x.jpg', servings: 4, minutes: 30, category: 'Dinner', rating: 4.8, reviewCount: 50,
    proteinGrams: null, calories: null, ingredients: names.map((name, i) => ({ name, quantity: String(i + 1) })), steps: ['Mix.', 'Bake.'], ...extra,
  };
}

/** Fake Gemini: maps by a table, merges by another, and tags equipment from the steps. */
function fakeSteps(table: Record<string, string | null>, merges: Record<string, string> = {}) {
  const calls = { map: [] as string[][], consolidate: [] as string[][], enrich: [] as string[][] };
  const steps: Steps = {
    mapIngredients: async (names) => {
      calls.map.push(names);
      return Object.fromEntries(names.map((n) => [n, n in table ? table[n] : n]));
    },
    consolidate: async (names) => {
      calls.consolidate.push(names);
      return merges;
    },
    enrich: async (batch) => {
      calls.enrich.push(batch.map((r) => r.id));
      return Object.fromEntries(batch.map((r) => [r.id, { equipment: r.steps.includes('Bake.') ? ['oven', 'oven', 'spaceship'] : [], cuisine: 'Klingon' }]));
    },
    amounts: async () => ({}),
  };
  return { steps, calls };
}

describe('highProtein', () => {
  it('is true from 20 g per serving, false below or when unknown', () => {
    expect(highProtein(20)).toBe(true);
    expect(highProtein(19.9)).toBe(false);
    expect(highProtein(null)).toBe(false);
  });
});

describe('buildRecipes', () => {
  it('builds a Recipe with canonical names, keeping the source wording and quantity', async () => {
    const { steps } = fakeSteps({ 'garlic cloves': 'garlic' });
    const { recipes } = await buildRecipes([raw('7', ['Garlic Cloves ', 'egg', 'milk', 'flour'], { proteinGrams: 25 })], steps);
    expect(recipes).toHaveLength(1);
    expect(recipes[0]).toMatchObject({
      id: 'fd-7', name: 'Recipe 7', imageUrl: 'https://img/x.jpg', servings: 4, minutes: 30, highProtein: true,
      steps: ['Mix.', 'Bake.'],
    });
    expect(recipes[0].ingredients[0]).toEqual({ ingredient: 'garlic', quantity: '1', original: 'Garlic Cloves' });
  });

  it('carries nutrition per serving, rounded, and leaves it out when the source has none', async () => {
    const { steps } = fakeSteps({});
    const { recipes } = await buildRecipes([
      raw('1', ['a', 'b', 'c', 'd'], { proteinGrams: 24.6, calories: 480.4 }),
      raw('2', ['a', 'b', 'c', 'd']),
    ], steps);
    expect(recipes[0]).toMatchObject({ proteinGrams: 25, calories: 480 });
    expect('calories' in recipes[1] || 'proteinGrams' in recipes[1]).toBe(false);
  });

  it('folds the model\'s mixers and food processors into the Equipment we support', async () => {
    const { steps } = fakeSteps({});
    steps.enrich = async (batch) => Object.fromEntries(batch.map((r) => [r.id, { equipment: ['Hand mixer', 'stand mixer', 'food processor', 'stove', 'hob'], cuisine: 'Italian' }]));
    const [r] = (await buildRecipes([raw('1', ['a', 'b', 'c', 'd'])], steps)).recipes;
    expect(r.equipment).toEqual(['mixer', 'blender', 'hob']);
  });

  it('keeps only known Equipment, once each, and falls back to Other for an unknown cuisine', async () => {
    const { steps } = fakeSteps({});
    const [r] = (await buildRecipes([raw('1', ['a', 'b', 'c', 'd'])], steps)).recipes;
    expect(r.equipment).toEqual(['oven']);
    expect(r.cuisine).toBe('Other');
  });

  it('lets known corrections beat the model: powders, broths and sauces are not the thing they flavour', async () => {
    const wrong = { 'garlic powder': 'garlic', 'vegetable broth': 'chicken stock', 'beef broth': 'beef mince', 'chili sauce': 'ketchup', 'cocoa powder': 'chocolate' };
    const { steps } = fakeSteps(wrong);
    const [r] = (await buildRecipes([raw('1', ['Garlic Powder', 'vegetable broth', 'beef broth', 'chili sauce', 'cocoa powder'])], steps)).recipes;
    expect(r.ingredients.map((i) => i.ingredient)).toEqual(['garlic powder', 'vegetable stock', 'beef stock', 'chilli sauce', 'cocoa powder']);
  });

  it('drops a recipe when an ingredient cannot be mapped, and does not spend enrichment on it', async () => {
    const { steps, calls } = fakeSteps({ garnish: null });
    const { recipes, report } = await buildRecipes([raw('1', ['a', 'b', 'c', 'garnish']), raw('2', ['a', 'b', 'c', 'd'])], steps);
    expect(recipes.map((r) => r.id)).toEqual(['fd-2']);
    expect(report.droppedUnmapped).toBe(1);
    expect(calls.enrich.flat()).toEqual(['2']);
  });

  it('asks about each distinct ingredient once, in batches', async () => {
    const { steps, calls } = fakeSteps({});
    await buildRecipes([raw('1', ['a', 'b', 'c', 'd']), raw('2', ['A', 'c', 'e', 'f'])], steps, { ingredientBatch: 4 });
    expect(calls.map).toEqual([['a', 'b', 'c', 'd'], ['e', 'f']]);
  });

  it('merges synonyms the second pass found, but only into names that exist', async () => {
    const { steps } = fakeSteps({}, { scallion: 'spring onion', 'spring onion': 'spring onion', zzz: 'nothing real' });
    const { recipes } = await buildRecipes([raw('1', ['scallion', 'a', 'b', 'c']), raw('2', ['spring onion', 'a', 'b', 'c'])], steps);
    expect(recipes.map((r) => r.ingredients[0].ingredient)).toEqual(['spring onion', 'spring onion']);
  });

  it('drops a recipe the model gave no enrichment for', async () => {
    const { steps } = fakeSteps({});
    steps.enrich = async () => ({});
    const { recipes, report } = await buildRecipes([raw('1', ['a', 'b', 'c', 'd'])], steps);
    expect(recipes).toEqual([]);
    expect(report.droppedNoEnrichment).toBe(1);
  });

  it('batches enrichment', async () => {
    const { steps, calls } = fakeSteps({});
    const all = ['1', '2', '3', '4', '5'].map((id) => raw(id, ['a', 'b', 'c', 'd']));
    await buildRecipes(all, steps, { recipeBatch: 2 });
    expect(calls.enrich).toEqual([['1', '2'], ['3', '4'], ['5']]);
  });

  it('produces recipes the server accepts, with the ingredient list as every canonical name', async () => {
    const { steps } = fakeSteps({});
    const { recipes, report } = await buildRecipes([raw('1', ['a', 'b', 'c', 'd'])], steps);
    expect(report.ingredients).toBe(4);
    const { mkdtempSync, writeFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { tmpdir } = await import('node:os');
    const file = join(mkdtempSync(join(tmpdir(), 'recipes-')), 'recipes.json');
    writeFileSync(file, JSON.stringify(recipes));
    expect(loadRecipes(file)).toHaveLength(1);
  });
});

describe('tidyStep', () => {
  it('shortens units after a number: tbsp, tsp, oz, lb, min, hr', () => {
    expect(tidyStep('Add 2 tablespoons of oil and 1 teaspoon salt.')).toBe('Add 2 tbsp of oil and 1 tsp salt.');
    expect(tidyStep('Mix 8 ounces of cheese with 1 pound of pasta.')).toBe('Mix 8 oz of cheese with 1 lb of pasta.');
    expect(tidyStep('Bake for 35 minutes, then rest 1 hour 30 mins.')).toBe('Bake for 35 min, then rest 1 hr 30 min.');
    expect(tidyStep('Stir for 30 seconds.')).toBe('Stir for 30 sec.');
  });

  it('handles fractions and ranges', () => {
    expect(tidyStep('Use 1/2 tablespoon, or 1 1/2 teaspoons.')).toBe('Use 1/2 tbsp, or 1 1/2 tsp.');
    expect(tidyStep('Simmer 10-15 minutes.')).toBe('Simmer 10-15 min.');
  });

  it('does not touch words that are not units of a number', () => {
    expect(tidyStep('Wait a minute, then add a tablespoon of butter.')).toBe('Wait a minute, then add a tablespoon of butter.');
  });

  it('writes oven temperatures as °F with the °C in brackets', () => {
    expect(tidyStep('Preheat oven to 450F.')).toBe('Preheat oven to 450°F (230°C).');
    expect(tidyStep('Heat to 350 degrees F.')).toBe('Heat to 350°F (175°C).');
    expect(tidyStep('Bake at 375° F for an hour.')).toBe('Bake at 375°F (190°C) for an hour.');
  });

  it('reads "350 degrees" as Fahrenheit too', () => {
    expect(tidyStep('Heat oven to 350 degrees.')).toBe('Heat oven to 350°F (175°C).');
    expect(tidyStep('Heat to 180 degrees C.')).toBe('Heat to 180 degrees C.');
  });

  it('reads a bare degree sign as Fahrenheit, since the recipes are American', () => {
    expect(tidyStep('Preheat oven to 350°.')).toBe('Preheat oven to 350°F (175°C).');
    expect(tidyStep('Preheat oven to 350° and bake.')).toBe('Preheat oven to 350°F (175°C) and bake.');
  });

  it('leaves a temperature that already has its Celsius alone', () => {
    expect(tidyStep('Bake at 350°F (175°C).')).toBe('Bake at 350°F (175°C).');
  });

  it('collapses doubled spaces left by the source', () => {
    expect(tidyStep('Preheat  oven to 425F. Heat butter in  9 x 12 pan.')).toBe('Preheat oven to 425°F (220°C). Heat butter in 9 x 12 pan.');
  });

  it('leaves other text alone', () => {
    expect(tidyStep('Whisk the eggs until fluffy.')).toBe('Whisk the eggs until fluffy.');
  });
});

describe('mergeAmounts', () => {
  const ing = [{ quantity: '1/2' }, { quantity: '2' }, { quantity: '' }];

  it('uses the model\'s amounts when each keeps its quantity and adds a unit', () => {
    expect(mergeAmounts(ing, ['1/2 cup', '2 tbsp', 'to taste'])).toEqual(['1/2 cup', '2 tbsp', 'to taste']);
  });

  it('falls back to the bare quantity for an amount that changed the number', () => {
    expect(mergeAmounts(ing, ['3/4 cup', '2 tbsp', 'to taste'])).toEqual(['1/2', '2 tbsp', 'to taste']);
  });

  it('falls back to the bare quantities when the model gave the wrong number of amounts', () => {
    expect(mergeAmounts(ing, ['1/2 cup'])).toEqual(['1/2', '2', '']);
    expect(mergeAmounts(ing, undefined)).toEqual(['1/2', '2', '']);
  });

  it('does not let a long ramble through', () => {
    expect(mergeAmounts([{ quantity: '2' }], ['2 tablespoons of the finest olive oil you can possibly find'])).toEqual(['2']);
  });

  it('puts the unit in the right number: 1 cup, 2 cups, 1/2 cup, 2 1/4 cups, 2-3 cloves', () => {
    const q = (quantity: string, unit: string) => mergeAmounts([{ quantity }], [`${quantity} ${unit}`])[0];
    expect(q('1', 'cups')).toBe('1 cup');
    expect(q('1/2', 'cups')).toBe('1/2 cup');
    expect(q('2', 'cup')).toBe('2 cups');
    expect(q('2 1/4', 'cup')).toBe('2 1/4 cups');
    expect(q('2-3', 'clove')).toBe('2-3 cloves');
    expect(q('1', 'cloves')).toBe('1 clove');
    expect(q('2', 'can')).toBe('2 cans');
    expect(q('1', 'bunches')).toBe('1 bunch');
    expect(q('2', 'bunch')).toBe('2 bunches');
  });

  it('leaves units that do not change alone', () => {
    const q = (quantity: string, unit: string) => mergeAmounts([{ quantity }], [`${quantity} ${unit}`])[0];
    expect(q('2', 'tbsp')).toBe('2 tbsp');
    expect(q('1', 'tbsp')).toBe('1 tbsp');
    expect(q('3', 'large')).toBe('3 large');
    expect(q('4', 'oz')).toBe('4 oz');
  });

  it('does not match "1" to "10 g"', () => {
    expect(mergeAmounts([{ quantity: '1' }], ['10 g'])).toEqual(['1']);
  });
});

describe('buildRecipes with amounts and tidy steps', () => {
  it('shows each ingredient\'s amount with a unit, and tidies the steps', async () => {
    const { steps } = fakeSteps({});
    steps.amounts = async (batch) => Object.fromEntries(batch.map((r) => [r.id, ['1 cup', '2 tbsp', '3 large', '4 tsp']]));
    const { recipes } = await buildRecipes([raw('1', ['a', 'b', 'c', 'd'], { steps: ['Bake 20 minutes at 400F.'] })], steps);
    expect(recipes[0].ingredients.map((i) => i.quantity)).toEqual(['1 cup', '2 tbsp', '3 large', '4 tsp']);
    expect(recipes[0].steps).toEqual(['Bake 20 min at 400°F (205°C).']);
  });

  it('keeps the bare quantities when the model gave no usable amounts', async () => {
    const { steps } = fakeSteps({});
    const { recipes } = await buildRecipes([raw('1', ['a', 'b', 'c', 'd'])], steps);
    expect(recipes[0].ingredients.map((i) => i.quantity)).toEqual(['1', '2', '3', '4']);
  });
});
