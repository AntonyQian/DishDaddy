// T8, step 2: filtered Food.com recipes -> server/data/recipes.json via Gemini.
//
//   npm run recipes:build -- [filtered.json] [out.json] [--limit N]
//
// Needs GEMINI_API_KEY (server/.env). Gemini answers are cached in data/raw/cache,
// so re-running after an interruption only pays for what is missing.
import { readFileSync, writeFileSync } from 'node:fs';
import { buildRecipes } from './enrich';
import type { RawRecipe } from './filterRecipes';
import { createGeminiSteps } from './geminiSteps';

const args = process.argv.slice(2);
const limitAt = args.indexOf('--limit');
const limit = limitAt >= 0 ? Number(args.splice(limitAt, 2)[1]) : Infinity;
const [input = 'data/filtered-recipes.json', output = 'data/recipes.json'] = args;

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('GEMINI_API_KEY is not set (see server/.env.example)');

const raw: RawRecipe[] = JSON.parse(readFileSync(input, 'utf8')).slice(0, limit);
const log = (m: string) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);

const steps = createGeminiSteps({
  apiKey,
  model: process.env.GEMINI_MODEL ?? 'gemini-3.8-flash',
  cacheDir: 'data/raw/cache',
  log,
});
const { recipes, report, unmapped } = await buildRecipes(raw, steps, { concurrency: Number(process.env.CONCURRENCY ?? 3), log });

// one recipe per line, so a re-run shows up as a readable diff
writeFileSync(output, `[\n${recipes.map((r) => JSON.stringify(r)).join(',\n')}\n]\n`);
console.log(report);
if (unmapped.length) console.log(`unmappable ingredient wordings (${unmapped.length}), first 40:`, unmapped.slice(0, 40));
console.log(`wrote ${output}`);
