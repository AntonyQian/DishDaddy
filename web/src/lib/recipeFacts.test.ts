import type { Recipe } from '@fridge/shared';
import { describe, expect, it } from 'vitest';
import { difficultyOf } from './recipeFacts';

const r = (extra: Partial<Recipe>): Recipe => ({
  id: 'r', name: 'r', servings: 2, ingredients: Array.from({ length: 5 }, (_, i) => ({ ingredient: `i${i}`, quantity: '1' })),
  equipment: [], cuisine: 'x', minutes: 20, steps: ['a', 'b', 'c'], highProtein: false, ...extra,
});

describe('difficultyOf', () => {
  it('is Easy for a short recipe with few steps', () => {
    expect(difficultyOf(r({}))).toBe('Easy');
  });
  it('is Medium once there are many ingredients or steps, or it takes long', () => {
    expect(difficultyOf(r({ minutes: 60 }))).toBe('Medium');
    expect(difficultyOf(r({ steps: Array(9).fill('s') }))).toBe('Medium');
    expect(difficultyOf(r({ ingredients: Array.from({ length: 11 }, (_, i) => ({ ingredient: `i${i}`, quantity: '' })) }))).toBe('Medium');
  });
  it('is Hard when it is long and has many steps', () => {
    expect(difficultyOf(r({ minutes: 90, steps: Array(13).fill('s') }))).toBe('Hard');
  });
});
