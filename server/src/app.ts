import { Hono } from 'hono';
import type {
  ErrorResponse, HealthResponse, IngredientsResponse, Recipe, RecipeSearchRequest, ScanResult,
} from '@fridge/shared';
import type { DetectIngredients } from './detection/detectIngredients';
import type { Photo } from './detection/types';
import { ingredientList, loadRecipes } from './recipes/collection';
import { searchRecipes } from './recipes/search';

export const MAX_PHOTOS = 8;
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

const isStrings = (v: unknown): v is string[] => Array.isArray(v) && v.every((s) => typeof s === 'string');

export interface AppDeps {
  /** Missing when no GEMINI_API_KEY is set; /scan then answers 503. */
  detectIngredients?: DetectIngredients;
  /** The recipe collection; defaults to server/data/recipes.json. */
  recipes?: readonly Recipe[];
}

export function createApp(deps: AppDeps) {
  const recipes = deps.recipes ?? loadRecipes();
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

  // multipart/form-data with one or more "photos" files, in Scan order.
  app.post('/scan', async (c) => {
    if (!deps.detectIngredients) return c.json<ErrorResponse>({ error: 'Detection is not configured' }, 503);

    const body = await c.req.parseBody({ all: true }).catch(() => null);
    const field = body?.photos;
    const files = (Array.isArray(field) ? field : field ? [field] : []).filter((f): f is File => f instanceof File);

    if (files.length === 0) return c.json<ErrorResponse>({ error: 'Send at least one photo as "photos"' }, 400);
    if (files.length > MAX_PHOTOS) return c.json<ErrorResponse>({ error: `At most ${MAX_PHOTOS} photos per Scan` }, 400);
    if (files.some((f) => !f.type.startsWith('image/'))) return c.json<ErrorResponse>({ error: 'Photos must be images' }, 400);
    if (files.some((f) => f.size > MAX_PHOTO_BYTES)) return c.json<ErrorResponse>({ error: 'A photo is too large' }, 400);

    const photos: Photo[] = await Promise.all(
      files.map(async (f) => ({ bytes: new Uint8Array(await f.arrayBuffer()), mimeType: f.type })),
    );

    try {
      return c.json<ScanResult>(await deps.detectIngredients(photos));
    } catch (e) {
      console.error('scan failed', e);
      return c.json<ErrorResponse>({ error: 'Detection failed, please retry' }, 502);
    }
  });

  return app;
}
