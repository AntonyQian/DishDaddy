import { serve } from '@hono/node-server';
import { FIXTURE_INGREDIENTS } from '@fridge/shared';
import { createApp } from './app';
import { createDetectIngredients } from './detection/detectIngredients';
import { createGeminiModel } from './detection/gemini';
import { ingredientList, loadRecipes } from './recipes/collection';

const port = Number(process.env.PORT ?? 8787);
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) console.warn('GEMINI_API_KEY is not set: /scan will answer 503');

const recipes = loadRecipes();

// Detections are normalised to the collection's ingredient list. The fixture
// list stays in until the full T8 collection lands, because the placeholder
// collection lacks hard cases (greek yogurt, coriander, ketchup).
const vocabulary = [...new Set([...FIXTURE_INGREDIENTS, ...ingredientList(recipes)])].sort();
const detectIngredients = apiKey
  ? createDetectIngredients({
      model: createGeminiModel({ apiKey, model: process.env.GEMINI_MODEL }),
      vocabulary,
    })
  : undefined;

serve({ fetch: createApp({ detectIngredients, recipes }).fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.log(`server listening on http://localhost:${info.port}`);
});
