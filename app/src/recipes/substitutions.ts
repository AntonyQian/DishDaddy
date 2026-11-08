// Substitutions on the Recipe detail screen: proposed swaps for its Missing
// Ingredients, which the user accepts or rejects. Screen state only, never stored.
import type { Substitution } from '@fridge/shared';

export type SwapStatus = 'proposed' | 'accepted' | 'rejected';

export interface Swap extends Substitution {
  /** Identifies the swap; one Missing Ingredient can have several. */
  id: number;
  status: SwapStatus;
}

export interface SwapState {
  /** The Recipe's Missing Ingredients still missing after accepted swaps. */
  missing: ReadonlySet<string>;
  swaps: readonly Swap[];
}

export function startSwaps(missing: ReadonlySet<string>): SwapState {
  return { missing, swaps: [] };
}

/** Adds the server's suggestions as proposed swaps. */
export function offerSwaps(state: SwapState, suggestions: readonly Substitution[]): SwapState {
  return { ...state, swaps: suggestions.map((s, id) => ({ ...s, id, status: 'proposed' })) };
}

/** Accepts a swap: its item is no longer missing, and the item's other swaps are hidden. */
export function acceptSwap(state: SwapState, id: number): SwapState {
  const chosen = state.swaps.find((s) => s.id === id);
  if (!chosen) return state;
  const missing = new Set(state.missing);
  missing.delete(chosen.missing);
  const swaps = state.swaps.map((s): Swap => {
    if (s.id === id) return { ...s, status: 'accepted' };
    return s.missing === chosen.missing ? { ...s, status: 'rejected' } : s;
  });
  return { missing, swaps };
}

/** Rejects a swap: it is hidden and its item stays missing. */
export function rejectSwap(state: SwapState, id: number): SwapState {
  return { ...state, swaps: state.swaps.map((s) => (s.id === id ? { ...s, status: 'rejected' } : s)) };
}

/** The proposed or accepted swaps to show next to `ingredient`. */
export function visibleSwaps(state: SwapState, ingredient: string): Swap[] {
  return state.swaps.filter((s) => s.missing === ingredient && s.status !== 'rejected');
}

/** "buttermilk → milk + lemon" */
export function swapLabel(swap: Substitution): string {
  return `${swap.missing} → ${swap.use.join(' + ')}`;
}
