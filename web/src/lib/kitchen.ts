'use client';

import { useCallback, useEffect, useState } from 'react';

// The Kitchen lives in the browser, under the same key and shape the phone app uses for its latest scan.
const KEY = 'latestScan';

export const SAMPLE_KITCHEN = ['egg', 'milk', 'cheddar cheese', 'spinach', 'tomato', 'butter', 'chicken breast', 'potato'];

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

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed?.ingredients) ? parsed.ingredients.map(String) : [];
  } catch {
    return [];
  }
}

function write(ingredients: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ingredients, confirmedAt: new Date().toISOString() }));
  } catch {
    // storage full or blocked: the Kitchen just will not survive a reload
  }
}

/** The Kitchen's Ingredients: `null` until read from the browser, then the list. Changes are saved as they happen. */
export function useKitchen() {
  const [items, setItems] = useState<string[] | null>(null);
  useEffect(() => setItems(read()), []);

  const set = useCallback((next: string[]) => {
    setItems(next);
    write(next);
  }, []);

  return {
    items,
    set,
    add: (name: string) => set(mergeIngredients(items ?? [], [name])),
    remove: (name: string) => set(removeIngredient(items ?? [], name)),
  };
}
