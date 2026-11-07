import { Hono } from 'hono';
import type { ErrorResponse, HealthResponse, IngredientsResponse, Recipe, RecipeSearchRequest } from '@fridge/shared';
import { ingredientList, loadRecipes } from './recipes/collection';
import { searchRecipes } from './recipes/search';

const isStrings = (v: unknown): v is string[] => Array.isArray(v) && v.every((s) => typeof s === 'string');

export function createApp(recipes: readonly Recipe[] = loadRecipes()) {
  const app = new Hono();
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const ingredients = ingredientList(recipes);

  app.get('/health', (c) => c.json<HealthResponse>({ ok: true }));

  app.post('/recipes/search', async (c) => {
    const body: Partial<RecipeSearchRequest> | null = await c.req.json().catch(() => null);
    if (!body || !isStrings(body.ingredients) || !isStrings(body.staples) || !isStrings(body.equipment)) {
      return c.json<ErrorResponse>({ error: 'expected { ingredients, staples, equipment } as string arrays' }, 400);
    }
    return c.json(searchRecipes(recipes, body as RecipeSearchRequest));
  });

  app.get('/recipes/:id', (c) => {
    const recipe = byId.get(c.req.param('id'));
    return recipe ? c.json(recipe) : c.json<ErrorResponse>({ error: 'recipe not found' }, 404);
  });

  app.get('/ingredients', (c) => c.json<IngredientsResponse>({ ingredients }));

  return app;
}
