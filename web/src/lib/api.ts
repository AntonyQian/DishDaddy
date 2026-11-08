import type { Recipe, RecipeMatch } from '@fridge/shared';

// The site forwards /api/* to the recipe server (see next.config.ts).
const API = '/api';

/** What the phone app starts with, so the same Kitchen gives the same matches. */
export const DEFAULT_STAPLES = ['salt', 'black pepper', 'olive oil', 'vegetable oil', 'flour', 'sugar', 'paprika', 'cumin', 'chilli powder', 'cinnamon', 'oregano'];
export const DEFAULT_EQUIPMENT = ['hob', 'oven', 'grill', 'microwave'];

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`The server answered ${res.status}`);
  return res.json();
}

export async function searchRecipes(ingredients: string[]): Promise<RecipeMatch[]> {
  const res = await fetch(`${API}/recipes/search`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ingredients, staples: DEFAULT_STAPLES, equipment: DEFAULT_EQUIPMENT }),
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
