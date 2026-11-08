import { describe, expect, it } from 'vitest';
import { groupStaples, STAPLE_GROUPS, stapleGroupOf } from './staples';

describe('stapleGroupOf', () => {
  it('sorts sauces and condiments', () => {
    for (const s of ['soy sauce', 'ketchup', 'mayonnaise', 'vinegar', 'honey', 'tomato paste', 'chilli sauce', 'peanut butter', 'mustard', 'chicken stock']) {
      expect(stapleGroupOf(s), s).toBe('Sauces & condiments');
    }
  });

  it('sorts seasonings and spices', () => {
    for (const s of ['salt', 'black pepper', 'cumin', 'paprika', 'chilli powder', 'cinnamon', 'oregano', 'garlic powder', 'mustard powder', 'bay leaf']) {
      expect(stapleGroupOf(s), s).toBe('Seasonings & spices');
    }
  });

  it('sorts oils and fats', () => {
    for (const s of ['olive oil', 'vegetable oil', 'sesame oil', 'butter', 'lard']) {
      expect(stapleGroupOf(s), s).toBe('Oils & fats');
    }
  });

  it('sorts flour, baking and pantry basics', () => {
    for (const s of ['flour', 'sugar', 'brown sugar', 'baking powder', 'baking soda', 'vanilla extract', 'cornflour', 'rice', 'pasta', 'oats']) {
      expect(stapleGroupOf(s), s).toBe('Baking & pantry');
    }
  });

  it('puts anything else under Other', () => {
    expect(stapleGroupOf('dragon fruit')).toBe('Other');
  });
});

describe('groupStaples', () => {
  it('groups in a fixed order, A to Z inside each group, and leaves out empty groups', () => {
    const groups = groupStaples(['sugar', 'salt', 'olive oil', 'soy sauce', 'cumin', 'flour', 'ketchup']);
    expect(groups).toEqual([
      ['Sauces & condiments', ['ketchup', 'soy sauce']],
      ['Seasonings & spices', ['cumin', 'salt']],
      ['Oils & fats', ['olive oil']],
      ['Baking & pantry', ['flour', 'sugar']],
    ]);
    expect(STAPLE_GROUPS[0]).toBe('Sauces & condiments');
  });

  it('is empty for no staples', () => {
    expect(groupStaples([])).toEqual([]);
  });
});
