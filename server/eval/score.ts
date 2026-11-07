import type { ScanResult } from '@fridge/shared';

// The accuracy bar from ADR 0001, measured before Review.
export const BAR = { foundRate: 0.9, madeUp: 0 };

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

export function scoreScan(truth: string[], result: ScanResult, ms: number): ScanScore {
  const expected = new Set(truth);
  const options = (d: ScanResult['detections'][number]) =>
    [d.ingredient, ...d.alternatives].filter((x): x is string => x !== null);

  const offered = new Set(result.detections.flatMap(options));
  const missed = [...expected].filter((i) => !offered.has(i));
  const madeUp = result.detections
    .filter((d) => d.ingredient !== null && !options(d).some((o) => expected.has(o)))
    .map((d) => d.ingredient!);

  return {
    expected: expected.size,
    found: expected.size - missed.length,
    missed,
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
