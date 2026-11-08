import type { Recipe, RecipeMatch } from '@fridge/shared';

// The site forwards /api/* to the recipe server (see next.config.ts).
const API = '/api';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`The server answered ${res.status}`);
  return res.json();
}

export async function searchRecipes(ingredients: string[], staples: readonly string[], equipment: readonly string[]): Promise<RecipeMatch[]> {
  const res = await fetch(`${API}/recipes/search`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ingredients, staples, equipment }),
  });
  return json(res);
}

export async function getRecipe(id: string): Promise<Recipe> {
  return json(await fetch(`${API}/recipes/${encodeURIComponent(id)}`));
}

export async function getIngredients(): Promise<string[]> {
  const body = await json<{ ingredients: string[] }>(await fetch(`${API}/ingredients`));
  return body.ingredients;
}
