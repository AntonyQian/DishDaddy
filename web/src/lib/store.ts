'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
};

/** The value stored right now, read straight from the browser. For code that has waited (a fetch) and must not use a stale copy. */
export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/**
 * A value kept in the browser. Every component using the same key sees changes at once, including
 * from another tab. `fallback` must be a constant so the value stays the same between renders.
 */
export function useStored<T>(key: string, fallback: T): [T, (next: T) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const value = useMemo(() => {
    try {
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }, [raw, fallback]);
  const set = useCallback(
    (next: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // storage full or blocked: the change just will not survive a reload
      }
      listeners.forEach((l) => l());
    },
    [key],
  );
  return [value, set];
}
