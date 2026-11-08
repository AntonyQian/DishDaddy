import { describe, expect, it } from 'vitest';
import { portionNutrition, scaleAmount, scaleStep, spaceFractions } from './scale';

describe('scaleAmount', () => {
  it('leaves an amount alone at the recipe\'s own size', () => {
    expect(scaleAmount('1 1/2 cups', 1)).toBe('1 1/2 cups');
  });

  it('scales cups and tidies fractions, with the unit agreeing with the number', () => {
    expect(scaleAmount('1 1/2 cups', 1 / 3)).toBe('1/2 cup');
    expect(scaleAmount('2 cups', 1 / 2)).toBe('1 cup');
    expect(scaleAmount('1 cup', 2)).toBe('2 cups');
    expect(scaleAmount('1/2 cup', 3)).toBe('1 1/2 cups');
  });

  it('switches to a smaller spoon or measure when the amount gets small', () => {
    expect(scaleAmount('1/2 cup', 1 / 4)).toBe('2 tbsp');
    expect(scaleAmount('1 tbsp', 1 / 3)).toBe('1 tsp');
    expect(scaleAmount('1 tbsp', 1 / 2)).toBe('1 1/2 tsp');
    expect(scaleAmount('1 lb', 1 / 8)).toBe('2 oz');
  });

  it('calls a tiny amount of a spice a pinch', () => {
    expect(scaleAmount('1/4 tsp', 1 / 3)).toBe('1 pinch');
  });

  it('keeps simple measures simple', () => {
    expect(scaleAmount('2 tbsp', 1 / 2)).toBe('1 tbsp');
    expect(scaleAmount('8 oz', 1 / 3)).toBe('2 2/3 oz');
    expect(scaleAmount('1 tsp', 1 / 3)).toBe('1/3 tsp');
  });

  it('rounds things you count to half, and never to nothing', () => {
    expect(scaleAmount('3 large', 1 / 3)).toBe('1 large');
    expect(scaleAmount('2 large', 1 / 3)).toBe('1/2 large');
    expect(scaleAmount('4 cloves', 1 / 4)).toBe('1 clove');
    expect(scaleAmount('1 can', 1 / 2)).toBe('1/2 can');
    expect(scaleAmount('2', 1 / 2)).toBe('1');
    expect(scaleAmount('1', 1 / 8)).toBe('1/2');
  });

  it('scales both ends of a range', () => {
    expect(scaleAmount('2-3 cloves', 1 / 2)).toBe('1-1 1/2 cloves');
  });

  it('rounds grams and millilitres to a sensible step', () => {
    expect(scaleAmount('200 g', 1 / 3)).toBe('65 g');
    expect(scaleAmount('30 ml', 1 / 4)).toBe('8 ml');
  });

  it('leaves amounts that are not a number alone', () => {
    expect(scaleAmount('to taste', 1 / 3)).toBe('to taste');
    expect(scaleAmount('as needed', 2)).toBe('as needed');
    expect(scaleAmount('1 pinch', 1 / 3)).toBe('1 pinch');
    expect(scaleAmount('', 2)).toBe('');
  });
});

describe('scaleStep', () => {
  it('scales measured amounts in the text', () => {
    expect(scaleStep('Add 2 tbsp oil and 1 cup flour.', 1 / 2)).toBe('Add 1 tbsp oil and 1/2 cup flour.');
    expect(scaleStep('Mix 1 1/2 cups flour with 8 oz cheese.', 1 / 3)).toBe('Mix 1/2 cup flour with 2 2/3 oz cheese.');
  });

  it('does not touch times, temperatures or pan sizes', () => {
    expect(scaleStep('Bake 35 min at 425°F (220°C) in a 9 x 12 pan.', 1 / 3)).toBe('Bake 35 min at 425°F (220°C) in a 9 x 12 pan.');
  });

  it('is unchanged at the recipe\'s own size', () => {
    expect(scaleStep('Add 2 tbsp oil.', 1)).toBe('Add 2 tbsp oil.');
  });
});

describe('portionNutrition', () => {
  it('multiplies the per-serving numbers by the servings, rounded', () => {
    expect(portionNutrition({ calories: 264, proteinGrams: 5 }, 1)).toEqual({ calories: 264, proteinGrams: 5 });
    expect(portionNutrition({ calories: 264, proteinGrams: 5 }, 3)).toEqual({ calories: 792, proteinGrams: 15 });
  });
  it('leaves out what the recipe does not have', () => {
    expect(portionNutrition({ calories: 100 }, 2)).toEqual({ calories: 200 });
    expect(portionNutrition({}, 2)).toEqual({});
  });
});

describe('spaceFractions', () => {
  it('puts a wider gap between a whole number and its fraction so "1 1/2" does not read as "11/2"', () => {
    expect(spaceFractions('1 1/2 cups')).toBe('1\u20021/2 cups');
    expect(spaceFractions('Add 2 3/4 cups, then 1/2 cup.')).toBe('Add 2\u20023/4 cups, then 1/2 cup.');
  });
  it('leaves everything else alone', () => {
    expect(spaceFractions('2 tbsp')).toBe('2 tbsp');
    expect(spaceFractions('Bake 9 x 12, 5 1 2')).toBe('Bake 9 x 12, 5 1 2');
  });
});
