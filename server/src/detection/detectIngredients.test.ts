import { describe, expect, it } from 'vitest';
import type { Box } from '@fridge/shared';
import { createDetectIngredients } from './detectIngredients';
import type { ModelDetection, Photo, PhotoModel } from './types';

const VOCABULARY = ['egg', 'milk', 'spring onion', 'leek', 'coriander', 'parsley', 'greek yogurt', 'tomato'];
const BOX: Box = [100, 100, 200, 200];

const photo = (tag: string): Photo => ({ bytes: new TextEncoder().encode(tag), mimeType: 'image/jpeg' });
const seen = (name: string | null, extra: Partial<ModelDetection> = {}): ModelDetection => ({
  name, label: name ?? 'something', confidence: 0.9, box: BOX, alternatives: [], ...extra,
});

/** A model that answers per photo, keyed by the photo's bytes. */
function fakeModel(answers: Record<string, ModelDetection[]>): PhotoModel {
  return async (p) => answers[new TextDecoder().decode(p.bytes)] ?? [];
}

describe('detectIngredients', () => {
  it('normalises model names to the ingredient list', async () => {
    const detect = createDetectIngredients({
      model: fakeModel({ a: [seen('Eggs'), seen('scallions'), seen('Greek yoghurt')] }),
      vocabulary: VOCABULARY,
    });
    const result = await detect([photo('a')]);
    expect(result.detections.map((d) => d.ingredient)).toEqual(['egg', 'spring onion', 'greek yogurt']);
  });

  it('turns a name off the ingredient list into an Unidentified Item, keeping on-list alternatives', async () => {
    const detect = createDetectIngredients({
      model: fakeModel({
        a: [seen('mystery sauce', { alternatives: ['Tomatoes', 'unicorn jam'], visibleText: 'HOT' })],
      }),
      vocabulary: VOCABULARY,
    });
    const [d] = (await detect([photo('a')])).detections;
    expect(d).toMatchObject({ ingredient: null, label: 'mystery sauce', alternatives: ['tomato'], visibleText: 'HOT' });
  });

  it('drops an alternative that repeats the Ingredient itself', async () => {
    const detect = createDetectIngredients({
      model: fakeModel({ a: [seen('leek', { alternatives: ['leeks', 'spring onions'] })] }),
      vocabulary: VOCABULARY,
    });
    const [d] = (await detect([photo('a')])).detections;
    expect(d.alternatives).toEqual(['spring onion']);
  });

  it('keeps one Detection per Ingredient across photos: the most confident, with alternatives merged', async () => {
    const detect = createDetectIngredients({
      model: fakeModel({
        a: [seen('milk', { confidence: 0.6, alternatives: ['greek yogurt'] }), seen('egg')],
        b: [seen('Milk', { confidence: 0.95, box: [1, 2, 3, 4], alternatives: [] })],
      }),
      vocabulary: VOCABULARY,
    });
    const { detections } = await detect([photo('a'), photo('b')]);
    expect(detections.map((d) => d.ingredient).sort()).toEqual(['egg', 'milk']);
    expect(detections.find((d) => d.ingredient === 'milk')).toMatchObject({
      confidence: 0.95, photoIndex: 1, box: [1, 2, 3, 4], alternatives: ['greek yogurt'],
    });
  });

  it('never merges Unidentified Items, since it cannot tell them apart', async () => {
    const detect = createDetectIngredients({
      model: fakeModel({ a: [seen(null), seen(null)], b: [seen(null)] }),
      vocabulary: VOCABULARY,
    });
    expect((await detect([photo('a'), photo('b')])).detections).toHaveLength(3);
  });

  it('sends every photo to the model at once rather than one after another', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const model: PhotoModel = async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 10));
      inFlight--;
      return [];
    };
    await createDetectIngredients({ model, vocabulary: VOCABULARY })([photo('a'), photo('b'), photo('c')]);
    expect(maxInFlight).toBe(3);
  });

  it('fails the whole Scan when any photo fails, so no items go silently missing', async () => {
    const model: PhotoModel = async (p) => {
      if (new TextDecoder().decode(p.bytes) === 'b') throw new Error('model down');
      return [seen('egg')];
    };
    await expect(createDetectIngredients({ model, vocabulary: VOCABULARY })([photo('a'), photo('b')])).rejects.toThrow('model down');
  });
});
