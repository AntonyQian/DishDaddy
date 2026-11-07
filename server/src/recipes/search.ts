import type { Recipe, RecipeMatch, RecipeSearchRequest } from '@fridge/shared';

const norm = (s: string) => s.trim().toLowerCase();

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
    // a Recipe can list an Ingredient twice (e.g. oil for frying and for dressing)
    const names = [...new Map(r.ingredients.map((i) => [norm(i.ingredient), i.ingredient])).values()];
    if (!names.some((n) => scanned.has(norm(n)))) continue;
    const missing = names.filter((n) => !available.has(norm(n)));
    matches.push({
      recipeId: r.id,
      name: r.name,
      imageUrl: r.imageUrl,
      missing,
      usedCount: names.length - missing.length,
      cuisine: r.cuisine,
      minutes: r.minutes,
    });
  }

  // id last so equal matches come back in a stable order
  matches.sort((a, b) => a.missing.length - b.missing.length || b.usedCount - a.usedCount || a.minutes - b.minutes || a.recipeId.localeCompare(b.recipeId));
  return matches.slice(0, topN);
}
