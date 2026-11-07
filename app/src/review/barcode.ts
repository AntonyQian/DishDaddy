// Barcode override (T7, ADR 0001): a barcode resolves to a Product, and a Product
// always resolves to an Ingredient. Pure so it can be tested without a camera.

export interface Product {
  name: string;
  brand?: string;
  genericName?: string;
  /** Open Food Facts category tags, general to specific ("en:sauces", "en:ketchups"). */
  categories: string[];
}

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

const FIELDS = 'product_name,brands,generic_name,categories_tags';

/** Looks a barcode up in Open Food Facts. Null when it isn't there; throws when the lookup itself fails. */
export async function lookupBarcode(code: string, fetchFn: FetchFn = fetch): Promise<Product | null> {
  const digits = code.replace(/\D/g, '');
  if (!digits) return null;
  // A dead connection would leave the scanner on "Looking it up…" forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  let res: Response;
  try {
    res = await fetchFn(`https://world.openfoodfacts.org/api/v2/product/${digits}.json?fields=${FIELDS}`, {
      headers: { 'User-Agent': 'FridgeToRecipe-HackCamp2026' },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Open Food Facts returned ${res.status}`);
  const json: { status?: number; product?: Record<string, unknown> } = await res.json();
  const p = json.product;
  if (json.status !== 1 || !p) return null;
  return {
    name: String(p.product_name ?? ''),
    brand: typeof p.brands === 'string' ? p.brands.split(',')[0].trim() || undefined : undefined,
    genericName: typeof p.generic_name === 'string' && p.generic_name ? p.generic_name : undefined,
    categories: Array.isArray(p.categories_tags) ? p.categories_tags.map(String) : [],
  };
}

const words = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
const sameWord = (token: string, word: string) => token === word || token === `${word}s` || token === `${word}es`;

/** The best Ingredient named in `text`: the longest phrase wins, then the right-most (the head noun). */
function ingredientIn(text: string, vocabulary: readonly string[]): string | null {
  const tokens = words(text);
  let best: { ingredient: string; length: number; end: number } | null = null;
  for (const ingredient of vocabulary) {
    const w = words(ingredient);
    for (let start = 0; start + w.length <= tokens.length; start++) {
      if (!w.every((word, k) => sameWord(tokens[start + k], word))) continue;
      const end = start + w.length;
      if (!best || w.length > best.length || (w.length === best.length && end > best.end)) {
        best = { ingredient, length: w.length, end };
      }
    }
  }
  return best?.ingredient ?? null;
}

/**
 * Maps a Product to an Ingredient on the ingredient list, or null if none fits.
 * Tries the generic name, then the categories (most specific first), then the
 * product name, which is last because brand names add noise.
 */
export function productToIngredient(product: Product, vocabulary: readonly string[]): string | null {
  const categories = [...product.categories].reverse().map((c) => c.replace(/^[a-z]{2}:/, '').replace(/-/g, ' '));
  for (const text of [product.genericName, ...categories, product.name]) {
    const found = text ? ingredientIn(text, vocabulary) : null;
    if (found) return found;
  }
  return null;
}
