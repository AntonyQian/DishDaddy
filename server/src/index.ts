import { serve } from '@hono/node-server';
import { FIXTURE_INGREDIENTS } from '@fridge/shared';
import { createApp } from './app';
import { createDetectIngredients } from './detection/detectIngredients';
import { createGeminiModel } from './detection/gemini';

const port = Number(process.env.PORT ?? 8787);
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) console.warn('GEMINI_API_KEY is not set: /scan will answer 503');

// The fixture list stands in for the recipe collection's ingredient list until T8.
const detectIngredients = apiKey
  ? createDetectIngredients({
      model: createGeminiModel({ apiKey, model: process.env.GEMINI_MODEL }),
      vocabulary: FIXTURE_INGREDIENTS,
    })
  : undefined;

serve({ fetch: createApp({ detectIngredients }).fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.log(`server listening on http://localhost:${info.port}`);
});
