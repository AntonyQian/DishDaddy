import type { RecipeMatch } from '@fridge/shared';

export type MatchFilter = 'ready' | 'quick' | 'protein';

/** "Quick prep" means this many minutes or fewer. */
export const QUICK_MINUTES = 30;

export const FILTER_LABELS: Record<MatchFilter, string> = {
  ready: 'Ready now',
  quick: `Quick prep (<${QUICK_MINUTES}m)`,
  protein: 'High protein',
};

const TESTS: Record<MatchFilter, (m: RecipeMatch) => boolean> = {
  ready: (m) => m.missing.length === 0,
  quick: (m) => m.minutes <= QUICK_MINUTES,
  protein: (m) => !!m.highProtein,
};

/** Keeps the Recipe Matches that pass every filter that is on, in their given order. */
export function applyFilters(matches: RecipeMatch[], active: ReadonlySet<MatchFilter>): RecipeMatch[] {
  return matches.filter((m) => [...active].every((f) => TESTS[f](m)));
}

/** How many Recipes each filter pill would show on its own, and how many there are in all. */
export function countFilters(matches: RecipeMatch[]): Record<MatchFilter | 'all', number> {
  return {
    all: matches.length,
    ready: matches.filter(TESTS.ready).length,
    quick: matches.filter(TESTS.quick).length,
    protein: matches.filter(TESTS.protein).length,
  };
}

/** Whether a Recipe's name contains the search text, ignoring case and surrounding spaces. */
export function matchesQuery(m: RecipeMatch, query: string): boolean {
  const q = query.trim().toLowerCase();
  return !q || m.name.toLowerCase().includes(q);
}

/** How many of a Recipe's Ingredients the user has (their Ingredients and Staples) out of all it needs. */
export function ingredientCounts(m: RecipeMatch): { have: number; total: number } {
  return { have: m.usedCount, total: m.usedCount + m.missing.length };
}
