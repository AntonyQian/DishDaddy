import type { Recipe, RecipeMatch, RecipeSearchRequest } from '@fridge/shared';

export const norm = (s: string) => s.trim().toLowerCase();

/** A Recipe's distinct Ingredient names; a Recipe can list one twice (oil for frying and for dressing). */
function ingredientNames(r: Recipe): string[] {
  return [...new Map(r.ingredients.map((i) => [norm(i.ingredient), i.ingredient])).values()];
}

/** The Recipe's Missing Ingredients: neither among the user's Ingredients nor their Staples. */
export function missingIngredients(r: Recipe, available: Iterable<string>): string[] {
  const have = new Set([...available].map(norm));
  return ingredientNames(r).filter((n) => !have.has(norm(n)));
}

/**
 * Rank Recipes for a request (ADR 0002): Equipment is a hard filter, Staples
 * count as available, then fewest Missing Ingredients, then most used.
 * A Recipe that uses none of the scanned Ingredients is not a match.
 */
export function searchRecipes(recipes: readonly Recipe[], req: RecipeSearchRequest, topN = 20): RecipeMatch[] {
  const scanned = new Set(req.ingredients.map(norm));
  const available = new Set([...scanned, ...req.staples.map(norm)]);
  const equipment = new Set(req.equipment.map(norm));

  const matches: RecipeMatch[] = [];
  for (const r of recipes) {
    if (!r.equipment.every((e) => equipment.has(norm(e)))) continue;
    const names = ingredientNames(r);
    if (!names.some((n) => scanned.has(norm(n)))) continue;
    const missing = missingIngredients(r, available);
    matches.push({
      recipeId: r.id,
      name: r.name,
      imageUrl: r.imageUrl,
      missing,
      usedCount: names.length - missing.length,
      cuisine: r.cuisine,
      minutes: r.minutes,
      calories: r.calories,
      proteinGrams: r.proteinGrams,
      highProtein: r.highProtein,
    });
  }

  // id last so equal matches come back in a stable order
  matches.sort((a, b) => a.missing.length - b.missing.length || b.usedCount - a.usedCount || a.minutes - b.minutes || a.recipeId.localeCompare(b.recipeId));
  return matches.slice(0, topN);
}
