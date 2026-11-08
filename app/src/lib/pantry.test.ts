import { describe, expect, it } from 'vitest';
import { categoriesOf, CATEGORIES, categoryOf, emojiFor } from './pantry';

describe('categoryOf', () => {
  it('sorts everyday ingredients into the design\'s groups', () => {
    expect(categoryOf('spinach')).toBe('Vegetables');
    expect(categoryOf('chicken breast')).toBe('Proteins');
    expect(categoryOf('tofu')).toBe('Proteins');
    expect(categoryOf('egg')).toBe('Dairy & Eggs');
    expect(categoryOf('cheddar cheese')).toBe('Dairy & Eggs');
    expect(categoryOf('rice')).toBe('Staples');
    expect(categoryOf('soy sauce')).toBe('Sauces & Spices');
    expect(categoryOf('cumin')).toBe('Sauces & Spices');
  });
  it('treats black pepper as a spice but bell pepper as a vegetable', () => {
    expect(categoryOf('black pepper')).toBe('Sauces & Spices');
    expect(categoryOf('bell pepper')).toBe('Vegetables');
  });
  it('falls back to Other', () => {
    expect(categoryOf('mystery item')).toBe('Other');
  });
});

describe('categoriesOf', () => {
  it('counts ingredients per group, in the design\'s order, leaving out empty groups', () => {
    const counts = categoriesOf(['spinach', 'tomato', 'rice', 'egg']);
    expect(counts).toEqual([['Vegetables', 2], ['Dairy & Eggs', 1], ['Staples', 1]]);
    expect(CATEGORIES.indexOf('Vegetables')).toBeLessThan(CATEGORIES.indexOf('Staples'));
  });
});

describe('emojiFor', () => {
  it('picks a picture for what it knows and a group icon for what it does not', () => {
    expect(emojiFor('egg')).toBe('🥚');
    expect(emojiFor('cherry tomatoes')).toBe('🍅');
    expect(emojiFor('cumin')).toBe('🧂');
    expect(emojiFor('mystery item')).toBe('🍽️');
  });
});
