// Contracts between the app and the server. Terms follow GLOSSARY.md.
// Change these only in a small, separate merge to main, and tell the team.

/**
 * Where a Detection sits in its photo: [ymin, xmin, ymax, xmax], each
 * normalised to 0–1000 (Gemini's convention), independent of photo size.
 */
export type Box = [ymin: number, xmin: number, ymax: number, xmax: number];

/** An Ingredient the app believes is visible in a Scan. */
export interface Detection {
  /** Standard Ingredient name from the ingredient list, or null for an Unidentified Item. */
  ingredient: string | null;
  /** What the model saw, in its own words ("bunch of green onions"). */
  label: string;
  /** 0–1. */
  confidence: number;
  box: Box;
  /** Index into the Scan's photos, in the order they were sent. */
  photoIndex: number;
  /** Other Ingredients it might be, most likely first. Empty when sure. */
  alternatives: string[];
  /** Text read off the packaging, if any. */
  visibleText?: string;
}

/** The result of one Scan, de-duplicated across its photos. */
export interface ScanResult {
  detections: Detection[];
}

export interface RecipeSearchRequest {
  /** Confirmed Ingredients from Review. */
  ingredients: string[];
  staples: string[];
  equipment: string[];
}

export interface RecipeMatch {
  recipeId: string;
  name: string;
  imageUrl?: string;
  /** Missing Ingredients. */
  missing: string[];
  /** How many of the user's Ingredients and Staples the Recipe uses. */
  usedCount: number;
  cuisine: string;
  minutes: number;
}

export interface RecipeIngredient {
  /** Standard Ingredient name from the ingredient list. */
  ingredient: string;
  /** Amount as written in the source ("2 cups"); empty when the source gives none. */
  quantity: string;
  /** The source's original wording ("finely chopped spring onions"). */
  original?: string;
}

export interface Recipe {
  id: string;
  name: string;
  imageUrl?: string;
  servings: number;
  ingredients: RecipeIngredient[];
  equipment: string[];
  cuisine: string;
  minutes: number;
  steps: string[];
  /** The protein flag. */
  highProtein: boolean;
}

export interface IngredientsResponse {
  ingredients: string[];
}

export interface HealthResponse {
  ok: true;
}

export interface ErrorResponse {
  error: string;
}

/** Below this, Review shows a Detection as an "Is this X or Y?" choice. */
export const LOW_CONFIDENCE = 0.7;
