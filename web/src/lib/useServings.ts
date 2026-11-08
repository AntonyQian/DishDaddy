'use client';

import { useEffect, useState } from 'react';

/** How many servings the user cooks, remembered in the browser. Most meals are for one person. */
export function useServings() {
  const [servings, setServings] = useState(1);
  useEffect(() => {
    const n = Number(localStorage.getItem('servings'));
    if (Number.isInteger(n) && n >= 1 && n <= 12) setServings(n);
  }, []);
  const change = (d: 1 | -1) => setServings((s) => {
    const next = Math.min(12, Math.max(1, s + d));
    localStorage.setItem('servings', String(next));
    return next;
  });
  return [servings, change] as const;
}
