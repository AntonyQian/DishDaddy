import { describe, expect, it } from 'vitest';
import { lookupBarcode, productToIngredient, type Product } from './barcode';

const VOCAB = ['ketchup', 'tomato', 'milk', 'oat milk', 'greek yogurt', 'yogurt', 'tomato paste', 'egg', 'chicken breast'];

const heinz: Product = {
  name: 'Heinz Tomato Ketchup 570g',
  brand: 'Heinz',
  categories: ['en:condiments', 'en:sauces', 'en:tomato-sauces', 'en:ketchups'],
};

describe('productToIngredient', () => {
  it('maps a branded Product to the Ingredient a recipe would name', () => {
    expect(productToIngredient(heinz, VOCAB)).toBe('ketchup');
  });

  it('prefers the generic name over the brand-laden product name', () => {
    expect(productToIngredient({ name: 'Alpro The Original', genericName: 'Oat milk', categories: [] }, VOCAB)).toBe('oat milk');
  });

  it('prefers the more specific phrase over a shorter one inside it', () => {
    expect(productToIngredient({ name: 'Napolina Tomato Paste', categories: [] }, VOCAB)).toBe('tomato paste');
    expect(productToIngredient({ name: 'Fage Total Greek Yogurt', categories: [] }, VOCAB)).toBe('greek yogurt');
  });

  it('falls back to the categories, most specific first', () => {
    expect(productToIngredient({ name: 'Mystery Brand 500g', categories: ['en:dairies', 'en:milks'] }, VOCAB)).toBe('milk');
  });

  it('matches whole words only', () => {
    expect(productToIngredient({ name: 'Eggplant Parmigiana', categories: [] }, VOCAB)).toBeNull();
  });

  it('returns null when nothing maps to the ingredient list', () => {
    expect(productToIngredient({ name: 'Kimchi', categories: ['en:fermented-foods'] }, VOCAB)).toBeNull();
  });
});

const respond = (status: number, body: unknown) => async () => new Response(JSON.stringify(body), { status });

describe('lookupBarcode', () => {
  it('returns the Product Open Food Facts knows for a code', async () => {
    const fetchFn = respond(200, {
      status: 1,
      product: { product_name: 'Heinz Tomato Ketchup 570g', brands: 'Heinz, Kraft', generic_name: '', categories_tags: ['en:ketchups'] },
    });
    expect(await lookupBarcode('5000157024671', fetchFn)).toEqual({
      name: 'Heinz Tomato Ketchup 570g', brand: 'Heinz', genericName: undefined, categories: ['en:ketchups'],
    });
  });

  it('returns null when the barcode is not in the database', async () => {
    expect(await lookupBarcode('0000000000000', respond(200, { status: 0 }))).toBeNull();
    expect(await lookupBarcode('0000000000000', respond(404, { status: 0 }))).toBeNull();
  });

  it('throws when the lookup itself fails, so the caller can fall back to the picker', async () => {
    await expect(lookupBarcode('1', respond(500, {}))).rejects.toThrow();
  });

  it('puts only the digits of the code in the URL', async () => {
    let url = '';
    await lookupBarcode(' 5000157024671/../x ', async (u) => ((url = String(u)), new Response('{"status":0}')));
    expect(url).toContain('/product/5000157024671.json');
  });
});
