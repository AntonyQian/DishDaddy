import { describe, expect, it } from 'vitest';
import type { Detection } from '@fridge/shared';
import {
  add, choose, confirm, confirmAll, confirmedIngredients, isOnList, kindOf, name, remove, startReview, suggest,
} from './reviewState';

const VOCAB = ['leek', 'spring onion', 'milk', 'oat milk', 'egg', 'ketchup', 'greek yogurt', 'yogurt'];
const d = (ingredient: string | null, confidence = 0.9, alternatives: string[] = []): Detection => ({
  ingredient, label: ingredient ?? 'jar', confidence, box: [0, 0, 100, 100], photoIndex: 0, alternatives,
});

describe('Review', () => {
  it('shows confident Detections to confirm, low-confidence ones as a choice, and Unidentified Items to name', () => {
    const items = startReview({ detections: [d('egg'), d('leek', 0.5, ['spring onion']), d(null)] });
    expect(items.map(kindOf)).toEqual(['named', 'choice', 'unidentified']);
    expect(items.every((i) => i.status === 'pending')).toBe(true);
  });

  it('confirms only what the user confirmed or chose', () => {
    let items = startReview({ detections: [d('egg'), d('milk'), d('leek', 0.5, ['spring onion'])] });
    items = confirm(items, items[0].id);
    items = remove(items, items[1].id);
    items = choose(items, items[2].id, 'spring onion');
    expect(confirmedIngredients(items)).toEqual(['egg', 'spring onion']);
  });

  it('confirms all pending named items at once, leaving choices and Unidentified Items to the user', () => {
    let items = startReview({ detections: [d('egg'), d('milk'), d('leek', 0.5, ['spring onion']), d(null)] });
    items = remove(items, items[1].id);
    items = confirmAll(items);
    expect(confirmedIngredients(items)).toEqual(['egg']);
  });

  it('names an Unidentified Item, matching the ingredient list regardless of case', () => {
    let items = startReview({ detections: [d(null)] });
    items = name(items, items[0].id, '  Ketchup ');
    expect(confirmedIngredients(items)).toEqual(['ketchup']);
  });

  it('adds Ingredients the camera missed, without duplicating ones already confirmed', () => {
    let items = startReview({ detections: [d('egg')] });
    items = confirm(items, items[0].id);
    items = add(items, 'Milk');
    items = add(items, 'egg');
    expect(confirmedIngredients(items)).toEqual(['egg', 'milk']);
  });

  it('keeps a name that is off the ingredient list, flagged so the user is warned', () => {
    let items = startReview({ detections: [] });
    items = add(items, 'kimchi');
    expect(confirmedIngredients(items)).toEqual(['kimchi']);
    expect(isOnList('kimchi', VOCAB)).toBe(false);
    expect(isOnList('Oat Milk', VOCAB)).toBe(true);
  });
});

describe('suggest', () => {
  it('puts names that start with the query before ones that merely contain it', () => {
    expect(suggest('mil', VOCAB)).toEqual(['milk', 'oat milk']);
    expect(suggest('YOG', VOCAB)).toEqual(['yogurt', 'greek yogurt']);
    expect(suggest(' ', VOCAB)).toEqual([]);
  });
});
