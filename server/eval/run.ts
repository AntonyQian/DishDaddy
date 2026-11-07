// npm run eval: runs every Scan in eval/fixtures through the /scan pipeline
// and reports accuracy against ground truth (T4, ADR 0001).
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { FIXTURE_INGREDIENTS } from '@fridge/shared';
import { createDetectIngredients } from '../src/detection/detectIngredients';
import { createGeminiModel } from '../src/detection/gemini';
import { createNormaliser } from '../src/detection/normalise';
import type { Photo, PhotoModel } from '../src/detection/types';
import { BAR, scoreScan, summarise, type ScanScore } from './score';

const FIXTURES = join(import.meta.dirname, 'fixtures');
const MIME: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

interface Truth {
  ingredients: string[];
}

async function loadScans() {
  const entries = await readdir(FIXTURES, { withFileTypes: true });
  const scans = [];
  for (const dir of entries.filter((e) => e.isDirectory()).map((e) => e.name).sort()) {
    const files = (await readdir(join(FIXTURES, dir))).sort();
    const photoFiles = files.filter((f) => MIME[extname(f).toLowerCase()]);
    if (!files.includes('truth.json') || photoFiles.length === 0) {
      console.warn(`skipping ${dir}: needs truth.json and at least one photo`);
      continue;
    }
    const truth: Truth = JSON.parse(await readFile(join(FIXTURES, dir, 'truth.json'), 'utf8'));
    const photos: Photo[] = await Promise.all(
      photoFiles.map(async (f) => ({
        bytes: new Uint8Array(await readFile(join(FIXTURES, dir, f))),
        mimeType: MIME[extname(f).toLowerCase()],
      })),
    );
    scans.push({ name: dir, truth: truth.ingredients, photos });
  }
  return scans;
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Set GEMINI_API_KEY in server/.env');

  const vocabulary = FIXTURE_INGREDIENTS;
  const gemini = createGeminiModel({ apiKey, model: process.env.GEMINI_MODEL });
  // Names off the ingredient list become Unidentified Items, which score as
  // acceptable. Record them so a confidently named phantom can't hide there.
  let offListNames: string[] = [];
  const isOnList = createNormaliser(vocabulary);
  const model: PhotoModel = async (photo, vocab) => {
    const items = await gemini(photo, vocab);
    offListNames.push(...items.flatMap((i) => (i.name && !isOnList(i.name) ? [i.name] : [])));
    return items;
  };
  const detect = createDetectIngredients({ model, vocabulary });

  const scans = await loadScans();
  if (scans.length === 0) throw new Error(`No Scans in ${FIXTURES}; see eval/fixtures/README.md`);

  const scores: ScanScore[] = [];
  for (const scan of scans) {
    const offList = scan.truth.filter((i) => !vocabulary.includes(i));
    if (offList.length) console.warn(`${scan.name}: truth names not on the ingredient list: ${offList.join(', ')}`);

    offListNames = [];
    const start = performance.now();
    const result = await detect(scan.photos);
    const score = scoreScan(scan.truth, result, Math.round(performance.now() - start));
    scores.push(score);

    console.log(
      `\n${scan.name} (${scan.photos.length} photos, ${(score.ms / 1000).toFixed(1)} s)\n` +
        `  found        ${pct(score.found, score.expected)} (${score.found}/${score.expected})${score.missed.length ? `  missed: ${score.missed.join(', ')}` : ''}\n` +
        `  made up      ${score.madeUp.length}${score.madeUp.length ? `  (${score.madeUp.join(', ')})` : ''}\n` +
        `  unidentified ${score.unidentified}` +
        (offListNames.length ? `
  named off the list (check by hand): ${offListNames.join(', ')}` : ''),
    );
  }

  const total = summarise(scores);
  console.log(
    `\nOverall: ${(total.foundRate * 100).toFixed(1)}% found (${total.found}/${total.expected}), ` +
      `${total.madeUp} made up, ${total.unidentified} unidentified, slowest Scan ${(total.maxMs / 1000).toFixed(1)} s`,
  );
  console.log(
    total.meetsBar
      ? 'PASS: meets the bar'
      : `FAIL: bar is ≥${BAR.foundRate * 100}% found and ${BAR.madeUp} made up`,
  );
  process.exitCode = total.meetsBar ? 0 : 1;
}

function pct(n: number, of: number): string {
  return of === 0 ? '–' : `${((n / of) * 100).toFixed(1)}%`;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
