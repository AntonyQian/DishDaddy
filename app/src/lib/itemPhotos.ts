// The photo of each Ingredient in the Kitchen, taken from the Scan it was found in and kept
// until the user removes the Ingredient. Pure rules here; the files and storage are in itemPhotoStore.ts.
import type { Box } from '@fridge/shared';

import type { ReviewItem } from '@/review/reviewState';
import type { CapturedPhoto } from '@/scan/types';

/** A Scan photo and where one Ingredient sits in it. */
export interface ItemPhoto {
  uri: string;
  width: number;
  height: number;
  box: Box;
}

/** Keyed by Ingredient name. */
export type ItemPhotos = Record<string, ItemPhoto>;

/**
 * The photos to remember from a finished Review: each confirmed Ingredient that the camera found
 * (not one the user typed in), under the name the user settled on. Seen twice, the most confident wins.
 */
export function photosFromReview(items: readonly ReviewItem[], photos: readonly CapturedPhoto[]): ItemPhotos {
  const best: Record<string, number> = {};
  const out: ItemPhotos = {};
  for (const i of items) {
    const photo = i.detection && photos[i.detection.photoIndex];
    if (i.status !== 'confirmed' || !i.ingredient || !i.detection || !photo) continue;
    if ((best[i.ingredient] ?? -1) >= i.detection.confidence) continue;
    best[i.ingredient] = i.detection.confidence;
    out[i.ingredient] = { uri: photo.uri, width: photo.width, height: photo.height, box: i.detection.box };
  }
  return out;
}

/** A newer photo replaces the older one for the same Ingredient. */
export const mergePhotos = (existing: ItemPhotos, added: ItemPhotos): ItemPhotos => ({ ...existing, ...added });

/** Drops photos of Ingredients no longer in stock. */
export function keepStocked(photos: ItemPhotos, ingredients: readonly string[]): ItemPhotos {
  const stocked = new Set(ingredients);
  return Object.fromEntries(Object.entries(photos).filter(([name]) => stocked.has(name)));
}

/** The files in `before` that nothing in `after` points to, so they can be deleted. */
export function unusedUris(before: ItemPhotos, after: ItemPhotos): string[] {
  const used = new Set(Object.values(after).map((p) => p.uri));
  return [...new Set(Object.values(before).map((p) => p.uri))].filter((u) => !used.has(u));
}

/**
 * Where to draw the whole photo so the middle of the Ingredient's box fills a `size` square:
 * scaled so the box covers it, with the extra trimmed evenly. Use inside a square with overflow hidden.
 */
export function coverCrop({ width, height, box }: ItemPhoto, size: number) {
  const [ymin, xmin, ymax, xmax] = box;
  const boxW = Math.max(1, ((xmax - xmin) / 1000) * width);
  const boxH = Math.max(1, ((ymax - ymin) / 1000) * height);
  const scale = size / Math.min(boxW, boxH);
  const centreX = (((xmin + xmax) / 2) / 1000) * width;
  const centreY = (((ymin + ymax) / 2) / 1000) * height;
  return { width: width * scale, height: height * scale, left: size / 2 - centreX * scale, top: size / 2 - centreY * scale };
}
