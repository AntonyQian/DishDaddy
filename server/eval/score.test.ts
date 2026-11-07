import { describe, expect, it } from 'vitest';
import type { Detection } from '@fridge/shared';
import { scoreScan, summarise } from './score';

const d = (ingredient: string | null, alternatives: string[] = []): Detection => ({
  ingredient, label: ingredient ?? '?', confidence: 0.9, box: [0, 0, 1, 1], photoIndex: 0, alternatives,
});

describe('scoreScan', () => {
  it('counts an Ingredient as found when named correctly or offered among the alternatives', () => {
    const score = scoreScan(['leek', 'milk', 'butter'], { detections: [d('leek'), d('oat milk', ['milk'])] }, 1200);
    expect(score).toMatchObject({ expected: 3, found: 2, missed: ['butter'], madeUp: [], unidentified: 0, ms: 1200 });
  });

  it('counts a named Detection with no right answer among its options as made up', () => {
    const score = scoreScan(['egg'], { detections: [d('egg'), d('salmon', ['cod'])] }, 0);
    expect(score.madeUp).toEqual(['salmon']);
  });

  it('counts Unidentified Items separately, as neither found nor made up', () => {
    const score = scoreScan(['egg'], { detections: [d(null), d(null, ['egg'])] }, 0);
    expect(score).toMatchObject({ found: 1, madeUp: [], unidentified: 2 });
  });
});

describe('summarise', () => {
  it('reports the overall found rate and whether the ADR 0001 bar is met', () => {
    const passing = summarise([
      scoreScan(['a', 'b', 'c', 'd', 'e'], { detections: ['a', 'b', 'c', 'd', 'e'].map((x) => d(x)) }, 100),
      scoreScan(['f', 'g', 'h', 'i', 'j'], { detections: ['f', 'g', 'h', 'i'].map((x) => d(x)) }, 300),
    ]);
    expect(passing).toMatchObject({ found: 9, expected: 10, foundRate: 0.9, madeUp: 0, meetsBar: true, maxMs: 300 });

    const phantom = summarise([scoreScan(['a'], { detections: [d('a'), d('z')] }, 0)]);
    expect(phantom).toMatchObject({ foundRate: 1, madeUp: 1, meetsBar: false });
  });
});
