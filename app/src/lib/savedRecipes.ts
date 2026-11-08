// Saved Recipes, stored whole on the device so the Saved Recipes screen works offline.
import type { Recipe } from '@fridge/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_KEY = 'savedRecipes';

export async function loadSavedRecipes(): Promise<Recipe[]> {
  const raw = await AsyncStorage.getItem(SAVED_KEY);
  return raw ? (JSON.parse(raw) as Recipe[]) : [];
}

export async function isRecipeSaved(id: string): Promise<boolean> {
  return (await loadSavedRecipes()).some((r) => r.id === id);
}

/** Saves the Recipe, or unsaves it if it was already saved. Resolves to whether it is now saved. */
export async function toggleSavedRecipe(recipe: Recipe): Promise<boolean> {
  const saved = await loadSavedRecipes();
  const others = saved.filter((r) => r.id !== recipe.id);
  const nowSaved = others.length === saved.length;
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(nowSaved ? [recipe, ...others] : others));
  return nowSaved;
}
