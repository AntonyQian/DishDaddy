import { describe, expect, it } from 'vitest';
import type { Substitution, SubstitutionsResponse } from '@fridge/shared';
import { createApp } from '../app';
import { loadRecipes } from '../recipes/collection';
import type { SubstitutionQuery, SuggestSubstitutions } from './types';

const recipes = loadRecipes(new URL('../recipes/fixtures/recipes.fixture.json', import.meta.url));

/** A fake LLM that records what it was asked and answers with fixed swaps. */
function fakeSuggest(answer: Substitution[]) {
  const calls: SubstitutionQuery[] = [];
  const suggest: SuggestSubstitutions = async (query) => {
    calls.push(query);
    return answer;
  };
  return { suggest, calls };
}

function post(app: ReturnType<typeof createApp>, id: string, body: unknown) {
  return app.request(`/recipes/${id}/substitutions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /recipes/:id/substitutions', () => {
  it('offers milk + lemon for buttermilk in Buttermilk Pancakes', async () => {
    const swap = { missing: 'buttermilk', use: ['milk', 'lemon'], note: '1 tbsp lemon juice per 250 ml milk' };
    const { suggest, calls } = fakeSuggest([swap]);
    const app = createApp({ recipes, suggestSubstitutions: suggest });

    const res = await post(app, 'fx-003', { ingredients: ['egg', 'milk', 'lemon'], staples: ['flour', 'baking powder', 'butter'] });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual<SubstitutionsResponse>({ substitutions: [swap] });
    expect(calls).toHaveLength(1);
    expect(calls[0].recipe.id).toBe('fx-003');
    expect(calls[0].missing).toEqual(['buttermilk']);
    expect(calls[0].available).toEqual(expect.arrayContaining(['egg', 'milk', 'lemon', 'flour', 'baking powder', 'butter']));
  });

  it('keeps only swaps for real Missing Ingredients that use what the user has', async () => {
    const { suggest } = fakeSuggest([
      { missing: 'Buttermilk', use: ['Milk', 'lemon'] }, // kept, in the Recipe's own spelling
      { missing: 'egg', use: ['milk'] }, // not missing: the user has egg
      { missing: 'chocolate', use: ['milk'] }, // not in this Recipe
      { missing: 'baking powder', use: ['baking soda', 'lemon'] }, // relies on something the user lacks
      { missing: 'baking powder', use: [] }, // swaps for nothing
      { missing: 'buttermilk', use: ['milk', 'lemon'] }, // duplicate of the first
    ]);
    const app = createApp({ recipes, suggestSubstitutions: suggest });

    const res = await post(app, 'fx-003', { ingredients: ['egg', 'milk', 'lemon'], staples: ['flour', 'butter'] });

    expect(await res.json()).toEqual<SubstitutionsResponse>({
      substitutions: [{ missing: 'buttermilk', use: ['milk', 'lemon'] }],
    });
  });

  it('returns no Substitutions without asking the model when nothing is missing', async () => {
    const { suggest, calls } = fakeSuggest([{ missing: 'egg', use: ['milk'] }]);
    const app = createApp({ recipes, suggestSubstitutions: suggest });

    const res = await post(app, 'fx-001', { ingredients: ['egg', 'cheddar cheese'], staples: ['butter', 'salt'] });

    expect(await res.json()).toEqual<SubstitutionsResponse>({ substitutions: [] });
    expect(calls).toHaveLength(0);
  });

  it('answers 503 when no model is configured, 404 for an unknown Recipe, 400 for a bad body', async () => {
    const { suggest } = fakeSuggest([]);
    const app = createApp({ recipes, suggestSubstitutions: suggest });
    const body = { ingredients: [], staples: [] };

    expect((await post(createApp({ recipes }), 'fx-003', body)).status).toBe(503);
    expect((await post(app, 'nope', body)).status).toBe(404);
    expect((await post(app, 'fx-003', { ingredients: 'egg' })).status).toBe(400);
  });

  it('answers 502 when the model fails, so the app can offer a retry', async () => {
    const app = createApp({ recipes, suggestSubstitutions: async () => { throw new Error('quota'); } });
    expect((await post(app, 'fx-003', { ingredients: ['egg'], staples: [] })).status).toBe(502);
  });
});
