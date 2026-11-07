import { describe, expect, it } from 'vitest';
import { loadRecipes } from '../src/recipes/collection';
import { buildRecipes, highProtein, type Steps } from './enrich';
import type { RawRecipe } from './filterRecipes';

function raw(id: string, names: string[], extra: Partial<RawRecipe> = {}): RawRecipe {
  return {
    id, name: `Recipe ${id}`, imageUrl: 'https://img/x.jpg', servings: 4, minutes: 30, category: 'Dinner', rating: 4.8, reviewCount: 50,
    proteinGrams: null, ingredients: names.map((name, i) => ({ name, quantity: String(i + 1) })), steps: ['Mix.', 'Bake.'], ...extra,
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
