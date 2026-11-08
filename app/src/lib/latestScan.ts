import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'latestScan';

/**
 * The Ingredients in the user's Kitchen. Each confirmed Review adds to them, and the user removes
 * what gets used up. (The name and storage key date from when only the latest Scan was kept.)
 */
export interface LatestScan {
  ingredients: string[];
  /** When the list was last changed. */
  confirmedAt: string;
}

const tidy = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/** Everything in `existing` plus anything new in `added`, tidied and without repeats, in order. */
export function mergeIngredients(existing: readonly string[], added: readonly string[]): string[] {
  return [...new Set([...existing, ...added].map(tidy).filter(Boolean))];
}

export function removeIngredient(ingredients: readonly string[], name: string): string[] {
  const gone = tidy(name);
  return ingredients.filter((i) => tidy(i) !== gone);
}

/** Puts an Ingredient back at `index` (Undo); it is not added twice. */
export function insertIngredient(ingredients: readonly string[], name: string, index: number): string[] {
  if (ingredients.some((i) => tidy(i) === tidy(name))) return [...ingredients];
  const next = [...ingredients];
  next.splice(Math.min(Math.max(index, 0), next.length), 0, tidy(name));
  return next;
}

/** Stores exactly this list, replacing what was there. */
export async function saveLatestScan(ingredients: string[]): Promise<LatestScan> {
  const scan: LatestScan = { ingredients, confirmedAt: new Date().toISOString() };
  await AsyncStorage.setItem(KEY, JSON.stringify(scan));
  return scan;
}

export async function loadLatestScan(): Promise<LatestScan | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as LatestScan) : null;
}

/** Adds a confirmed Scan's Ingredients to the Kitchen. */
export async function addScanToKitchen(ingredients: readonly string[]): Promise<LatestScan> {
  const current = await loadLatestScan();
  return saveLatestScan(mergeIngredients(current?.ingredients ?? [], ingredients));
}
