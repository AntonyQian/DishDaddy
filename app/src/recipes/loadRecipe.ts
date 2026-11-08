import type { Recipe } from '@fridge/shared';

import { getRecipe } from '@/lib/api';
import { findSavedRecipe } from '@/lib/savedRecipes';

/** The Recipe from the server, or its saved copy when the server can't be reached, so Saved Recipes open offline. */
export async function loadRecipe(id: string): Promise<Recipe> {
  try {
    return await getRecipe(id);
  } catch (e) {
    const saved = await findSavedRecipe(id).catch(() => undefined);
    if (saved) return saved;
    throw e;
  }
}
