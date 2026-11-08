// Substitutions on the Recipe detail screen: proposed swaps for its Missing
// Ingredients, which the user accepts or rejects. Screen state only, never stored.
// Ingredients are matched by normalised name, so a Recipe that spells one
// ingredient two ways ("Buttermilk", "buttermilk") counts and clears it once.
import type { Substitution } from '@fridge/shared';

import { norm } from './recipeMatch';

export type SwapStatus = 'proposed' | 'accepted' | 'rejected';

export interface Swap extends Substitution {
  /** Identifies the swap; one Missing Ingredient can have several. */
  id: number;
  status: SwapStatus;
}

export interface SwapState {
  /** The Recipe's Missing Ingredients still missing after accepted swaps, by normalised name. */
  missing: ReadonlySet<string>;
  swaps: readonly Swap[];
}

export function startSwaps(missing: ReadonlySet<string>): SwapState {
  return { missing: new Set([...missing].map(norm)), swaps: [] };
}

/**
 * Adds the server's suggestions as proposed swaps. Swaps already accepted are
 * kept; earlier ones not accepted are replaced, and suggestions for items no
 * longer missing are dropped.
 */
export function offerSwaps(state: SwapState, suggestions: readonly Substitution[]): SwapState {
  const kept = state.swaps.filter((s) => s.status === 'accepted');
  const nextId = state.swaps.reduce((max, s) => Math.max(max, s.id + 1), 0);
  const offered = suggestions
    .filter((s) => state.missing.has(norm(s.missing)))
    .map((s, n): Swap => ({ ...s, id: nextId + n, status: 'proposed' }));
  return { ...state, swaps: [...kept, ...offered] };
}

/** Accepts a swap: its item is no longer missing, and the item's other swaps are hidden. */
export function acceptSwap(state: SwapState, id: number): SwapState {
  const chosen = state.swaps.find((s) => s.id === id);
  if (!chosen) return state;
  const item = norm(chosen.missing);
  const missing = new Set(state.missing);
  missing.delete(item);
  const swaps = state.swaps.map((s): Swap => {
    if (s.id === id) return { ...s, status: 'accepted' };
    return norm(s.missing) === item ? { ...s, status: 'rejected' } : s;
  });
  return { missing, swaps };
}

/** Rejects a swap: it is hidden and its item stays missing. */
export function rejectSwap(state: SwapState, id: number): SwapState {
  return { ...state, swaps: state.swaps.map((s) => (s.id === id ? { ...s, status: 'rejected' } : s)) };
}

/** Whether `ingredient` is still missing after accepted swaps. */
export function isStillMissing(state: SwapState, ingredient: string): boolean {
  return state.missing.has(norm(ingredient));
}

/** The proposed or accepted swaps to show next to `ingredient`. */
export function visibleSwaps(state: SwapState, ingredient: string): Swap[] {
  const item = norm(ingredient);
  return state.swaps.filter((s) => norm(s.missing) === item && s.status !== 'rejected');
}

/** Whether a swap still waits for Accept or Reject on an item that is still missing. */
export function hasOpenSwaps(state: SwapState): boolean {
  return state.swaps.some((s) => s.status === 'proposed' && state.missing.has(norm(s.missing)));
}

/** "buttermilk → milk + lemon" */
export function swapLabel(swap: Substitution): string {
  return `${swap.missing} → ${swap.use.join(' + ')}`;
}
