import { createReadStream } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { csvRows, filterRecipes, parseDuration, parseRVector, selectTop, type RawRecipe } from './filterRecipes';

const SAMPLE = new URL('./fixtures/sample-recipes.csv', import.meta.url);

async function* chunksOf(text: string, size: number) {
  for (let i = 0; i < text.length; i += size) yield text.slice(i, i + size);
}
async function collect<T>(it: AsyncIterable<T>) {
  const out: T[] = [];
  for await (const x of it) out.push(x);
  return out;
}

describe('csvRows', () => {
  const text = 'a,b,c\r\n1,"x, ""y""",3\n"multi\nline",,\n';

  it('handles quotes, escaped quotes, empty fields, CRLF and newlines inside quotes', async () => {
    expect(await collect(csvRows(chunksOf(text, 1000)))).toEqual([
      ['a', 'b', 'c'], ['1', 'x, "y"', '3'], ['multi\nline', '', ''],
    ]);
  });

  it('gives the same rows however the input is split into chunks', async () => {
    const whole = await collect(csvRows(chunksOf(text, 1000)));
    for (const size of [1, 2, 3, 5]) expect(await collect(csvRows(chunksOf(text, size)))).toEqual(whole);
  });

  it('keeps a last row that has no trailing newline', async () => {
    expect(await collect(csvRows(chunksOf('a,b\n1,2', 3)))).toEqual([['a', 'b'], ['1', '2']]);
  });
});

describe('parseRVector', () => {
  it('reads R c(...) vectors, NA and character(0)', () => {
    expect(parseRVector('c("a", "b, c", NA)')).toEqual(['a', 'b, c', null]);
    expect(parseRVector('character(0)')).toEqual([]);
    expect(parseRVector('NA')).toEqual([]);
    expect(parseRVector('')).toEqual([]);
  });

  it('reads a single value that R prints without c()', () => {
    expect(parseRVector('"only one"')).toEqual(['only one']);
  });

  it('unescapes quotes inside strings', () => {
    expect(parseRVector('c("say \\"hi\\"")')).toEqual(['say "hi"']);
  });
});

describe('parseDuration', () => {
  it('reads ISO 8601 durations as minutes', () => {
    expect(parseDuration('PT45M')).toBe(45);
    expect(parseDuration('PT1H30M')).toBe(90);
    expect(parseDuration('P1DT2H')).toBe(26 * 60);
    expect(parseDuration('PT2H')).toBe(120);
  });
  it('is null for missing or unreadable durations', () => {
    expect(parseDuration('NA')).toBeNull();
    expect(parseDuration('')).toBeNull();
    expect(parseDuration('PT0M')).toBeNull();
  });
});

describe('filterRecipes on the sample CSV', () => {
  const run = (opts = {}) => filterRecipes(csvRows(createReadStream(SAMPLE, { encoding: 'utf8' })), { topN: 100, ...opts });

  it('keeps only recipes that pass every filter', async () => {
    const ids = (await run({ maxCategoryShare: 1 })).map((r) => r.id).sort();
    expect(ids).toEqual(['101', '102', '111', '112', '113', '114', '115']);
  });

  it('turns a row into a RawRecipe', async () => {
    const r = (await run({ maxCategoryShare: 1 })).find((x) => x.id === '101')!;
    expect(r).toMatchObject({
      name: 'Cheese Omelette', imageUrl: 'https://img.example/a.jpg', servings: 1, minutes: 10, category: 'Breakfast',
      rating: 4.8, reviewCount: 120,
      ingredients: [{ name: 'egg', quantity: '3' }, { name: 'cheddar cheese', quantity: '40 g' }, { name: 'butter', quantity: '1 tbsp' }, { name: 'salt', quantity: '1 pinch' }],
    });
    expect(r.steps[0]).toBe('Beat the eggs with "salt".');
  });

  it('keeps newlines inside a step, single-value vectors and missing quantities', async () => {
    const all = await run({ maxCategoryShare: 1 });
    expect(all.find((x) => x.id === '102')!.steps[0]).toBe('Step one.\nStill step one.');
    expect(all.find((x) => x.id === '114')!.steps).toEqual(['Just one step.']);
    expect(all.find((x) => x.id === '115')!.ingredients.map((i) => i.quantity)).toEqual(['2', '', '1', '1 cup']);
  });

  it('limits to the top N and caps how many come from one category', async () => {
    const top = await run({ topN: 5, maxCategoryShare: 0.4 });
    expect(top).toHaveLength(5);
    expect(top.filter((r) => r.category === 'Dessert')).toHaveLength(2);
  });
});

describe('selectTop', () => {
  const r = (id: string, rating: number, reviewCount: number, category = 'x'): RawRecipe => ({
    id, name: id, imageUrl: 'u', servings: 1, minutes: 5, category, rating, reviewCount, ingredients: [], steps: [],
  });

  it('ranks by rating weighted by how many reviews back it', () => {
    const ids = selectTop([r('few', 4.9, 10), r('many', 4.9, 500), r('lower', 4.6, 500)], { topN: 3, maxCategoryShare: 1 }).map((x) => x.id);
    expect(ids).toEqual(['many', 'few', 'lower']);
  });

  it('is deterministic when scores tie', () => {
    const ids = selectTop([r('b', 4.8, 50), r('a', 4.8, 50)], { topN: 2, maxCategoryShare: 1 }).map((x) => x.id);
    expect(ids).toEqual(['a', 'b']);
  });
});
