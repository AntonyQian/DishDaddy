import type { RecipeMatch } from '@fridge/shared';
import { describe, expect, it } from 'vitest';
import { applyFilters, ingredientCounts, QUICK_MINUTES } from './matchFilters';

const m = (id: string, extra: Partial<RecipeMatch> = {}): RecipeMatch => ({
  recipeId: id, name: id, missing: [], usedCount: 4, cuisine: 'x', minutes: 40, ...extra,
});

describe('ingredientCounts', () => {
  it('counts what the user has out of everything the Recipe needs', () => {
    expect(ingredientCounts(m('a', { usedCount: 5, missing: ['x', 'y'] }))).toEqual({ have: 5, total: 7 });
  });
  it('is all of them when nothing is missing', () => {
    expect(ingredientCounts(m('a', { usedCount: 6 }))).toEqual({ have: 6, total: 6 });
  });
});

describe('applyFilters', () => {
  const all = [
    m('ready-fast', { minutes: QUICK_MINUTES, highProtein: true }),
    m('ready-slow', { minutes: 90 }),
    m('missing-fast', { minutes: 10, missing: ['egg'], highProtein: true }),
  ];
  const ids = (list: RecipeMatch[]) => list.map((r) => r.recipeId);

  it('shows everything when no filter is on', () => {
    expect(ids(applyFilters(all, new Set()))).toEqual(['ready-fast', 'ready-slow', 'missing-fast']);
  });

  it('keeps only Recipes with nothing missing for "ready"', () => {
    expect(ids(applyFilters(all, new Set(['ready'])))).toEqual(['ready-fast', 'ready-slow']);
  });

  it('keeps high-protein Recipes, and Recipes within the quick limit', () => {
    expect(ids(applyFilters(all, new Set(['protein'])))).toEqual(['ready-fast', 'missing-fast']);
    expect(ids(applyFilters(all, new Set(['quick'])))).toEqual(['ready-fast', 'missing-fast']);
  });

  it('needs every filter that is on to match', () => {
    expect(ids(applyFilters(all, new Set(['ready', 'protein', 'quick'])))).toEqual(['ready-fast']);
  });

  it('keeps the order it was given', () => {
    expect(ids(applyFilters([all[2], all[0]], new Set(['protein'])))).toEqual(['missing-fast', 'ready-fast']);
  });
});
