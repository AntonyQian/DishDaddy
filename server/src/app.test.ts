import { describe, expect, it } from 'vitest';
import { createApp } from './app';

describe('GET /health', () => {
  it('reports ok', async () => {
    const res = await createApp({}).request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe('recipe endpoints', () => {
  const recipe = {
    id: 'r1', name: 'Omelette', servings: 1, equipment: ['hob'], cuisine: 'French', minutes: 10, steps: ['Cook.'], highProtein: true,
    ingredients: [{ ingredient: 'egg', quantity: '2' }, { ingredient: 'butter', quantity: '1 tbsp' }],
  };
  const app = createApp({ recipes: [recipe] });
  const post = (body: unknown) =>
    app.request('/recipes/search', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

  it('POST /recipes/search returns ranked RecipeMatches', async () => {
    const res = await post({ ingredients: ['egg'], staples: [], equipment: ['hob'] });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ recipeId: 'r1', name: 'Omelette', missing: ['butter'], usedCount: 1, cuisine: 'French', minutes: 10, highProtein: true }]);
  });

  it('POST /recipes/search rejects a malformed body', async () => {
    expect((await post({ ingredients: 'egg' })).status).toBe(400);
    expect((await app.request('/recipes/search', { method: 'POST', body: 'nope' })).status).toBe(400);
  });

  it('GET /recipes/:id returns the Recipe, or 404', async () => {
    expect(await (await app.request('/recipes/r1')).json()).toEqual(recipe);
    expect((await app.request('/recipes/nope')).status).toBe(404);
  });

  it('GET /ingredients returns the ingredient list', async () => {
    expect(await (await app.request('/ingredients')).json()).toEqual({ ingredients: ['butter', 'egg'] });
  });
});
