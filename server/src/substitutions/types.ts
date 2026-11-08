import type { Recipe, Substitution } from '@fridge/shared';

/** What the model is asked: swaps for these Missing Ingredients, using only what is available. */
export interface SubstitutionQuery {
  recipe: Recipe;
  /** This Recipe's Missing Ingredients. Never empty. */
  missing: string[];
  /** The user's Ingredients and Staples. */
  available: string[];
}

/**
 * The LLM seam: proposes Substitutions. Output is untrusted; the endpoint
 * filters it to real Missing Ingredients and available swaps.
 */
export type SuggestSubstitutions = (query: SubstitutionQuery) => Promise<Substitution[]>;
