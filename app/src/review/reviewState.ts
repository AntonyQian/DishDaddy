// Review: the user confirms, corrects, names or adds Ingredients after a Scan.
// Pure state functions, so the screen stays thin and the rules are testable.
import { LOW_CONFIDENCE, type Detection, type ScanResult } from '@fridge/shared';

export type ReviewStatus = 'pending' | 'confirmed' | 'removed';

export interface ReviewItem {
  id: string;
  /** The Detection this came from; absent for Ingredients the user added. */
  detection?: Detection;
  /** Current Ingredient name; null until an Unidentified Item is named. */
  ingredient: string | null;
  status: ReviewStatus;
}

/** How Review presents an item. */
export type ReviewKind = 'named' | 'choice' | 'unidentified' | 'added';

export function kindOf(item: ReviewItem): ReviewKind {
  const det = item.detection;
  if (!det) return 'added';
  if (det.ingredient === null) return 'unidentified';
  return det.confidence < LOW_CONFIDENCE ? 'choice' : 'named';
}

/** The options for an "Is this X or Y?" choice, most likely first. */
export function choicesFor(item: ReviewItem): string[] {
  const det = item.detection;
  return det ? [det.ingredient, ...det.alternatives].filter((x): x is string => x !== null) : [];
}

export function startReview(result: ScanResult): ReviewItem[] {
  return result.detections.map((detection, i) => ({
    id: `d${i}`,
    detection,
    ingredient: detection.ingredient,
    status: 'pending',
  }));
}

const tidy = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

const update = (items: ReviewItem[], id: string, patch: Partial<ReviewItem>) =>
  items.map((i) => (i.id === id ? { ...i, ...patch } : i));

export const confirm = (items: ReviewItem[], id: string) => update(items, id, { status: 'confirmed' });
export const remove = (items: ReviewItem[], id: string) => update(items, id, { status: 'removed' });

/** Answers "Is this X or Y?" (or names an Unidentified Item from its options). */
export const choose = (items: ReviewItem[], id: string, ingredient: string) =>
  update(items, id, { ingredient: tidy(ingredient), status: 'confirmed' });

/** Names an Unidentified Item from free text or autocomplete. */
export function name(items: ReviewItem[], id: string, text: string): ReviewItem[] {
  const ingredient = tidy(text);
  return ingredient ? update(items, id, { ingredient, status: 'confirmed' }) : items;
}

/** Confirms every pending, confidently named item; choices and Unidentified Items still need the user. */
export const confirmAll = (items: ReviewItem[]) =>
  items.map((i) => (i.status === 'pending' && kindOf(i) === 'named' ? { ...i, status: 'confirmed' as const } : i));

let addedCount = 0;

/** Adds an Ingredient the camera missed. Already-confirmed Ingredients are not added twice. */
export function add(items: ReviewItem[], text: string): ReviewItem[] {
  const ingredient = tidy(text);
  if (!ingredient || confirmedIngredients(items).includes(ingredient)) return items;
  return [...items, { id: `a${++addedCount}`, ingredient, status: 'confirmed' }];
}

/** The confirmed Ingredient list, de-duplicated, in Review order. */
export function confirmedIngredients(items: ReviewItem[]): string[] {
  const names = items.filter((i) => i.status === 'confirmed' && i.ingredient).map((i) => i.ingredient!);
  return [...new Set(names)];
}

/** Off-list names are kept, but recipes can't be matched on them yet. */
export const isOnList = (ingredient: string, vocabulary: readonly string[]) => vocabulary.includes(tidy(ingredient));

/** Autocomplete over the ingredient list: prefix matches first, then other matches. */
export function suggest(query: string, vocabulary: readonly string[], limit = 8): string[] {
  const q = tidy(query);
  if (!q) return [];
  const starts = vocabulary.filter((v) => v.startsWith(q));
  const contains = vocabulary.filter((v) => !v.startsWith(q) && v.includes(q));
  return [...starts, ...contains].slice(0, limit);
}
