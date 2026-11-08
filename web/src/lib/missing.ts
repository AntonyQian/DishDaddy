import type { Recipe } from '@fridge/shared';

/** An ingredient name as compared: case and stray spaces ignored. */
export const norm = (s: string) => s.trim().toLowerCase();

/** A Recipe's Missing Ingredients, in recipe order: those neither in the Kitchen nor a Staple. Same rule as the server's search. */
export function missingIngredients(recipe: Recipe, have: { ingredients: readonly string[]; staples: readonly string[] }): Set<string> {
  const available = new Set([...have.ingredients, ...have.staples].map(norm));
  return new Set(recipe.ingredients.map((i) => i.ingredient).filter((n) => !available.has(norm(n))));
}
