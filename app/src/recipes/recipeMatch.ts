import type { Recipe, RecipeSearchRequest } from '@fridge/shared';
import type { LatestScan } from '@/lib/latestScan';

const norm = (s: string) => s.trim().toLowerCase();

/** What the user has: the latest Scan's confirmed Ingredients and their Staples. */
export interface Available {
  ingredients: readonly string[];
  staples: readonly string[];
}

/**
 * A Recipe's Missing Ingredients, in recipe order: those neither confirmed in
 * the latest Scan nor a Staple. Matches the server's rule in recipes/search.ts.
 */
export function buildSearchRequest(
  latest: LatestScan | null, staples: readonly string[], equipment: readonly string[],
): RecipeSearchRequest {
  return { ingredients: [...(latest?.ingredients ?? [])], staples: [...staples], equipment: [...equipment] };
}

export function missingIngredients(recipe: Recipe, have: Available): Set<string> {
  const available = new Set([...have.ingredients, ...have.staples].map(norm));
  return new Set(recipe.ingredients.map((i) => i.ingredient).filter((n) => !available.has(norm(n))));
}
