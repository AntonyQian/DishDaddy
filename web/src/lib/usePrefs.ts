'use client';

import type { Recipe } from '@fridge/shared';
import { useMemo } from 'react';

import { getRecipe } from './api';
import { DEFAULT_EQUIPMENT, DEFAULT_STAPLES, normaliseEquipment, toggleSaved } from './prefs';
import { readStored, useStored } from './store';

const NO_SAVED: Recipe[] = [];
const SAVED_KEY = 'savedRecipes';

/** Staples, stored under the same key the phone app uses. */
export function useStaples() {
  return useStored<string[]>('staples', DEFAULT_STAPLES as string[]);
}

/** Equipment, stored under the same key the phone app uses, with older saved names brought up to date. */
export function useEquipment() {
  const [raw, set] = useStored<string[]>('equipment', DEFAULT_EQUIPMENT as string[]);
  return [useMemo(() => normaliseEquipment(raw), [raw]), set] as const;
}

/** Saved recipes, kept whole so they can be opened without asking the server. */
export function useSaved() {
  const [saved, setSaved] = useStored<Recipe[]>(SAVED_KEY, NO_SAVED);
  return {
    saved,
    isSaved: (id: string) => saved.some((r) => r.id === id),
    /** Saves or unsaves. A recipe only known by its id is fetched first. */
    toggle: async (recipeOrId: Recipe | string) => {
      const id = typeof recipeOrId === 'string' ? recipeOrId : recipeOrId.id;
      const recipe = readStored(SAVED_KEY, NO_SAVED).find((r) => r.id === id) ?? (typeof recipeOrId === 'string' ? await getRecipe(recipeOrId) : recipeOrId);
      // Read the list again after the fetch: another bookmark may have been saved while it was running.
      setSaved(toggleSaved(readStored(SAVED_KEY, NO_SAVED), recipe));
    },
  };
}
