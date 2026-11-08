import type { Recipe } from '@fridge/shared';

/** Easy, Medium or Hard, worked out from how long it takes and how many steps and ingredients it has. */
export function difficultyOf(r: Pick<Recipe, 'minutes' | 'steps' | 'ingredients'>): 'Easy' | 'Medium' | 'Hard' {
  const points = (r.minutes > 45 ? 1 : 0) + (r.steps.length > 8 ? 1 : 0) + (r.ingredients.length > 10 ? 1 : 0);
  return points >= 2 ? 'Hard' : points === 1 ? 'Medium' : 'Easy';
}
