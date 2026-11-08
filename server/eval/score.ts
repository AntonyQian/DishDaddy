import { LOW_CONFIDENCE, type Detection, type ScanResult } from '@fridge/shared';

// The accuracy bar from ADR 0001, measured before Review.
export const BAR = { foundRate: 0.9, madeUp: 0 };

// Pantry-style items the user is expected to record as Staples. They are not
// worth scoring: detecting one is not a made-up item, and truth.json omits them.
export const STAPLE_LIKE = new Set([
  'butter', 'mayonnaise', 'ketchup', 'mustard', 'dijon mustard', 'soy sauce',
  'fish sauce', 'salsa', 'pesto', 'jam', 'honey', 'vinegar', 'olive oil',
  'vegetable oil', 'cream cheese', 'soured cream', 'cream', 'parmesan',
  'tortilla', 'hummus', 'pickles',
]);

export interface ScanScore {
  expected: number;
  /** Ingredients named correctly, or offered among a Detection's alternatives. */
  found: number;
  missed: string[];
  /** Named Detections with no right answer among their options. */
  madeUp: string[];
  /** Unidentified Items: acceptable, not failures. */
  unidentified: number;
  ms: number;
}

/**
 * The options Review puts in front of the user for a Detection: its name, plus
 * its alternatives when Review shows it as a choice (low confidence) or as an
 * Unidentified Item.
 */
function offered(d: Detection): string[] {
  const showsAlternatives = d.ingredient === null || d.confidence < LOW_CONFIDENCE;
  return [d.ingredient, ...(showsAlternatives ? d.alternatives : [])].filter((x): x is string => x !== null);
}

export function scoreScan(truth: string[], result: ScanResult, ms: number): ScanScore {
  const expected = [...new Set(truth)];
  const used = new Set<Detection>();
  const found = new Set<string>();

  // Each Detection stands for one physical item, so it can find at most one
  // Ingredient. Exact names are matched first, then offered alternatives.
  const match = (accepts: (d: Detection, ingredient: string) => boolean) => {
    for (const ingredient of expected) {
      if (found.has(ingredient)) continue;
      const hit = result.detections.find((d) => !used.has(d) && accepts(d, ingredient));
      if (hit) {
        used.add(hit);
        found.add(ingredient);
      }
    }
  };
  match((d, i) => d.ingredient === i);
  match((d, i) => offered(d).includes(i));

  const madeUp = result.detections
    .filter((d) => d.ingredient !== null && !STAPLE_LIKE.has(d.ingredient) && !offered(d).some((o) => expected.includes(o)))
    .map((d) => d.ingredient!);

  return {
    expected: expected.length,
    found: found.size,
    missed: expected.filter((i) => !found.has(i)),
    madeUp,
    unidentified: result.detections.filter((d) => d.ingredient === null).length,
    ms,
  };
}

export function summarise(scores: ScanScore[]) {
  const expected = sum(scores.map((s) => s.expected));
  const found = sum(scores.map((s) => s.found));
  const madeUp = sum(scores.map((s) => s.madeUp.length));
  const foundRate = expected === 0 ? 0 : found / expected;
  return {
    expected,
    found,
    foundRate,
    madeUp,
    unidentified: sum(scores.map((s) => s.unidentified)),
    maxMs: Math.max(0, ...scores.map((s) => s.ms)),
    meetsBar: foundRate >= BAR.foundRate && madeUp <= BAR.madeUp,
  };
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
