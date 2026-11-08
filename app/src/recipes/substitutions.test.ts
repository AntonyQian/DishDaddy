import { describe, expect, it } from 'vitest';

import { acceptSwap, offerSwaps, rejectSwap, startSwaps, swapLabel, visibleSwaps } from './substitutions';

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
