import type { Box } from '@fridge/shared';

/** One photo of a Scan. */
export interface Photo {
  bytes: Uint8Array;
  mimeType: string;
}

/** One item as a model reports it, before normalising to the ingredient list. */
export interface ModelDetection {
  /** The model's Ingredient name, or null when it can't name the item. */
  name: string | null;
  label: string;
  confidence: number;
  box: Box;
  alternatives: string[];
  visibleText?: string;
}

/**
 * The model-specific seam: detect items in one photo. Gemini sits behind this;
 * a Claude or GPT version can be swapped in to compare on the same test set.
 */
export type PhotoModel = (photo: Photo, vocabulary: readonly string[]) => Promise<ModelDetection[]>;
