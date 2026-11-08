import { describe, expect, it } from 'vitest';

import { acceptSwap, hasOpenSwaps, isStillMissing, offerSwaps, rejectSwap, startSwaps, swapLabel, visibleSwaps } from './substitutions';

const buttermilk = { missing: 'buttermilk', use: ['milk', 'lemon'], note: '1 tbsp lemon per 250 ml milk' };
const yogurt = { missing: 'buttermilk', use: ['yogurt', 'water'] };

describe('substitutions', () => {
  it('a buttermilk recipe offers milk + lemon, and accepting it clears that missing item', () => {
    let state = startSwaps(new Set(['buttermilk', 'eggs']));
    state = offerSwaps(state, [buttermilk]);
    const [offer] = visibleSwaps(state, 'buttermilk');
    expect(swapLabel(offer)).toBe('buttermilk → milk + lemon');

    state = acceptSwap(state, offer.id);
    expect([...state.missing]).toEqual(['eggs']);
  });

  it('keeps an accepted swap visible so the screen can show what replaces the item', () => {
    let state = offerSwaps(startSwaps(new Set(['buttermilk'])), [buttermilk]);
    state = acceptSwap(state, visibleSwaps(state, 'buttermilk')[0].id);
    expect(visibleSwaps(state, 'buttermilk')).toMatchObject([{ use: ['milk', 'lemon'], status: 'accepted' }]);
  });

  it('rejecting a swap hides it and leaves the item missing', () => {
    let state = offerSwaps(startSwaps(new Set(['buttermilk'])), [buttermilk]);
    state = rejectSwap(state, visibleSwaps(state, 'buttermilk')[0].id);
    expect(visibleSwaps(state, 'buttermilk')).toEqual([]);
    expect([...state.missing]).toEqual(['buttermilk']);
  });

  it('with two swaps for one item, rejecting one keeps the other, and accepting one hides the rest', () => {
    let state = offerSwaps(startSwaps(new Set(['buttermilk'])), [buttermilk, yogurt]);
    const [first, second] = visibleSwaps(state, 'buttermilk');

    const afterReject = rejectSwap(state, first.id);
    expect(visibleSwaps(afterReject, 'buttermilk')).toMatchObject([{ use: ['yogurt', 'water'], status: 'proposed' }]);

    state = acceptSwap(state, second.id);
    expect(visibleSwaps(state, 'buttermilk')).toMatchObject([{ use: ['yogurt', 'water'], status: 'accepted' }]);
    expect(state.missing.size).toBe(0);
  });
});

describe('substitutions when the Recipe spells an ingredient two ways', () => {
  it('match swaps by normalised name, so accepting one clears every spelling and nothing is left missing', () => {
    let state = startSwaps(new Set(['Buttermilk', 'buttermilk ']));
    expect(state.missing.size).toBe(1);

    state = offerSwaps(state, [buttermilk]);
    expect(visibleSwaps(state, 'Buttermilk')).toHaveLength(1);
    expect(visibleSwaps(state, 'buttermilk ')).toHaveLength(1);

    state = acceptSwap(state, visibleSwaps(state, 'Buttermilk')[0].id);
    expect(isStillMissing(state, 'Buttermilk')).toBe(false);
    expect(isStillMissing(state, 'buttermilk ')).toBe(false);
    expect(state.missing.size).toBe(0);
  });

  it('can offer swaps again once every offered swap is rejected while something is still missing', () => {
    let state = offerSwaps(startSwaps(new Set(['buttermilk'])), [buttermilk]);
    expect(hasOpenSwaps(state)).toBe(true);
    state = rejectSwap(state, visibleSwaps(state, 'buttermilk')[0].id);
    expect(hasOpenSwaps(state)).toBe(false);
  });

  it('asking again keeps accepted swaps and offers new ones only for items still missing', () => {
    const eggs = { missing: 'eggs', use: ['flax', 'water'] };
    let state = offerSwaps(startSwaps(new Set(['buttermilk', 'eggs'])), [buttermilk, eggs]);
    state = acceptSwap(state, visibleSwaps(state, 'buttermilk')[0].id);
    state = rejectSwap(state, visibleSwaps(state, 'eggs')[0].id);

    state = offerSwaps(state, [yogurt, eggs]);
    expect(visibleSwaps(state, 'buttermilk')).toMatchObject([{ use: ['milk', 'lemon'], status: 'accepted' }]);
    expect(visibleSwaps(state, 'eggs')).toMatchObject([{ use: ['flax', 'water'], status: 'proposed' }]);
    expect(new Set(state.swaps.map((s) => s.id)).size).toBe(state.swaps.length);
  });
});
