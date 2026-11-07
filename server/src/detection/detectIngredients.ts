import type { Detection, ScanResult } from '@fridge/shared';
import { createNormaliser } from './normalise';
import type { ModelDetection, Photo, PhotoModel } from './types';

/** The detection pipeline: photos of one Scan in, de-duplicated Detections out. */
export type DetectIngredients = (photos: Photo[]) => Promise<ScanResult>;

export function createDetectIngredients(deps: {
  model: PhotoModel;
  vocabulary: readonly string[];
}): DetectIngredients {
  const normalise = createNormaliser(deps.vocabulary);

  const toDetection = (item: ModelDetection, photoIndex: number): Detection => {
    const ingredient = item.name === null ? null : normalise(item.name);
    const alternatives = unique(
      item.alternatives.map(normalise).filter((a): a is string => a !== null && a !== ingredient),
    );
    return {
      ingredient,
      label: item.label,
      confidence: item.confidence,
      box: item.box,
      photoIndex,
      alternatives,
      ...(item.visibleText ? { visibleText: item.visibleText } : {}),
    };
  };

  return async (photos) => {
    // In parallel: accuracy needs high resolution, so speed comes from concurrency.
    const perPhoto = await Promise.all(photos.map((p) => deps.model(p, deps.vocabulary)));
    const all = perPhoto.flatMap((items, photoIndex) => items.map((item) => toDetection(item, photoIndex)));
    return { detections: deduplicate(all) };
  };
}

/** One Detection per Ingredient (the most confident); Unidentified Items are all kept. */
function deduplicate(detections: Detection[]): Detection[] {
  const byIngredient = new Map<string, Detection>();
  const out: Detection[] = [];
  for (const d of detections) {
    if (d.ingredient === null) {
      out.push(d);
      continue;
    }
    const existing = byIngredient.get(d.ingredient);
    if (!existing) {
      byIngredient.set(d.ingredient, d);
      out.push(d);
      continue;
    }
    const [best, other] = d.confidence > existing.confidence ? [d, existing] : [existing, d];
    const merged: Detection = {
      ...best,
      alternatives: unique([...best.alternatives, ...other.alternatives]),
      ...(best.visibleText ?? other.visibleText ? { visibleText: best.visibleText ?? other.visibleText } : {}),
    };
    byIngredient.set(d.ingredient, merged);
    out[out.indexOf(existing)] = merged;
  }
  return out;
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}
