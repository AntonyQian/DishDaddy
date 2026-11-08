import type { Detection } from '@fridge/shared';
import { describe, expect, it } from 'vitest';

import type { ReviewItem } from '@/review/reviewState';
import { coverCrop, keepStocked, mergePhotos, photosFromReview, unusedUris, type ItemPhoto } from './itemPhotos';

const det = (ingredient: string, box: Detection['box'], photoIndex = 0, confidence = 0.9): Detection =>
  ({ ingredient, label: ingredient, confidence, box, photoIndex, alternatives: [] });
const item = (ingredient: string | null, detection?: Detection, status: ReviewItem['status'] = 'confirmed'): ReviewItem =>
  ({ id: `${ingredient}-${Math.random()}`, ingredient, detection, status });
const photos = [{ uri: 'file:///a.jpg', width: 1000, height: 2000 }, { uri: 'file:///b.jpg', width: 1000, height: 1000 }];

describe('photosFromReview', () => {
  it('keeps the photo and box of each confirmed Ingredient that came from a Detection', () => {
    const got = photosFromReview([item('milk', det('milk', [0, 0, 500, 500])), item('egg', det('egg', [100, 100, 200, 300], 1))], photos);
    expect(got.milk).toEqual({ uri: 'file:///a.jpg', width: 1000, height: 2000, box: [0, 0, 500, 500] });
    expect(got.egg.uri).toBe('file:///b.jpg');
  });
  it('uses the final name when the user chose or named the Ingredient', () => {
    const got = photosFromReview([item('spring onion', det('leek', [0, 0, 100, 100]))], photos);
    expect(Object.keys(got)).toEqual(['spring onion']);
  });
  it('skips removed or unconfirmed items and Ingredients the user typed in', () => {
    const got = photosFromReview([item('milk', det('milk', [0, 0, 5, 5]), 'removed'), item('egg', det('egg', [0, 0, 5, 5]), 'pending'), item('butter')], photos);
    expect(got).toEqual({});
  });
  it('keeps the most confident view when an Ingredient is seen twice', () => {
    const got = photosFromReview([item('milk', det('milk', [0, 0, 1, 1], 0, 0.5)), item('milk', det('milk', [2, 2, 3, 3], 1, 0.9))], photos);
    expect(got.milk.uri).toBe('file:///b.jpg');
  });
});

describe('mergePhotos and keepStocked', () => {
  const p = (uri: string): ItemPhoto => ({ uri, width: 1, height: 1, box: [0, 0, 1, 1] });
  it('a newer photo replaces the older one for the same Ingredient', () => {
    expect(mergePhotos({ milk: p('old'), egg: p('e') }, { milk: p('new') })).toEqual({ milk: p('new'), egg: p('e') });
  });
  it('keeps photos only for Ingredients still in stock', () => {
    expect(keepStocked({ milk: p('m'), egg: p('e') }, ['egg', 'butter'])).toEqual({ egg: p('e') });
  });
  it('lists files no photo points to any more', () => {
    expect(unusedUris({ a: p('x'), b: p('y') }, { b: p('y') })).toEqual(['x']);
    expect(unusedUris({ a: p('x'), b: p('x') }, { b: p('x') })).toEqual([]);
  });
});

describe('coverCrop', () => {
  it('fills a square with the middle of the box, scaled so it covers', () => {
    // A 400x200 px box inside a 1000x2000 photo: height is the short side, so 200px becomes 80.
    const c = coverCrop({ uri: '', width: 1000, height: 2000, box: [100, 100, 200, 500] }, 80);
    expect(c.width).toBeCloseTo(1000 * 0.4);
    expect(c.height).toBeCloseTo(2000 * 0.4);
    // Box centre (300, 300) in the photo lands at the middle of the square.
    expect(c.left + 300 * 0.4 * (1000 / 1000) * 1).toBeCloseTo(40);
    expect(c.top + 300 * 0.4 * (2000 / 2000) * 1).toBeCloseTo(40);
  });
});
