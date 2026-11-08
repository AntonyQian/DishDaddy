'use client';

import { useEffect, useState } from 'react';

import { getIngredients } from './api';

/** Every ingredient name the recipe collection knows, for autocomplete. Empty until it loads, or if the server is down. */
export function useIngredients(): string[] {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    let live = true;
    getIngredients().then((l) => live && setList(l), () => {});
    return () => { live = false; };
  }, []);
  return list;
}

/** Names that start with the query first, then ones that merely contain it. */
export function suggest(query: string, vocabulary: readonly string[], limit = 6): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts = vocabulary.filter((v) => v.startsWith(q));
  const has = vocabulary.filter((v) => !v.startsWith(q) && v.includes(q));
  return [...starts, ...has].slice(0, limit);
}
