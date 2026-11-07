import { readFileSync } from 'node:fs';
import type { Recipe } from '@fridge/shared';

export const RECIPES_PATH = new URL('../../data/recipes.json', import.meta.url);

/** Load and sanity-check the recipe collection (T8 output). */
export function loadRecipes(path: URL | string = RECIPES_PATH): Recipe[] {
  const data: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(data)) throw new Error('recipes.json must be an array');
  const ids = new Set<string>();
  for (const r of data as Recipe[]) {
    if (!r.id || !r.name || !Array.isArray(r.ingredients) || !r.ingredients.length || !Array.isArray(r.equipment) || !Array.isArray(r.steps)) {
      throw new Error(`invalid recipe: ${JSON.stringify(r?.id ?? r)}`);
    }
    if (ids.has(r.id)) throw new Error(`duplicate recipe id: ${r.id}`);
    ids.add(r.id);
  }
  return data as Recipe[];
}

/** The ingredient list: every standard Ingredient name used by any Recipe, sorted. */
export function ingredientList(recipes: readonly Recipe[]): string[] {
  return [...new Set(recipes.flatMap((r) => r.ingredients.map((i) => i.ingredient)))].sort();
}
