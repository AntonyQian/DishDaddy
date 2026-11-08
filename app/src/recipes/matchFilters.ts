import type { RecipeMatch } from '@fridge/shared';

export type MatchFilter = 'ready' | 'protein' | 'quick';

/** "Quick" means this many minutes or fewer. */
export const QUICK_MINUTES = 30;

export const FILTER_LABELS: Record<MatchFilter, string> = {
  ready: 'Ready now',
  protein: 'High protein',
  quick: `Under ${QUICK_MINUTES} min`,
};

const TESTS: Record<MatchFilter, (m: RecipeMatch) => boolean> = {
  ready: (m) => m.missing.length === 0,
  protein: (m) => !!m.highProtein,
  quick: (m) => m.minutes <= QUICK_MINUTES,
};

/** Keeps the Recipe Matches that pass every filter that is on, in their given order. */
export function applyFilters(matches: RecipeMatch[], active: ReadonlySet<MatchFilter>): RecipeMatch[] {
  return matches.filter((m) => [...active].every((f) => TESTS[f](m)));
}

/** How many of a Recipe's Ingredients the user has (their Ingredients and Staples) out of all it needs. */
export function ingredientCounts(m: RecipeMatch): { have: number; total: number } {
  return { have: m.usedCount, total: m.usedCount + m.missing.length };
}
