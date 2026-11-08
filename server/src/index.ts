import { serve } from '@hono/node-server';
import { FIXTURE_INGREDIENTS } from '@fridge/shared';
import { createApp } from './app';
import { createDetectIngredients } from './detection/detectIngredients';
import { selectPhotoModel } from './detection/provider';
import { ingredientList, loadRecipes } from './recipes/collection';

const port = Number(process.env.PORT ?? 8787);
const selected = selectPhotoModel(process.env);

if (selected) console.log(`detection provider: ${selected.provider}`);
else console.warn('No API key for the detection provider (OPENAI_API_KEY or GEMINI_API_KEY): /scan will answer 503');

const recipes = loadRecipes();

// Detections are normalised to the collection's ingredient list. The fixture
// list stays in until the full T8 collection lands, because the placeholder
// collection lacks hard cases (greek yogurt, coriander, ketchup).
const vocabulary = [...new Set([...FIXTURE_INGREDIENTS, ...ingredientList(recipes)])].sort();
const detectIngredients = selected
  ? createDetectIngredients({ model: selected.model, vocabulary })
  : undefined;

serve({ fetch: createApp({ detectIngredients, recipes }).fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.log(`server listening on http://localhost:${info.port}`);
});
