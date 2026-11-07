import { FIXTURE_INGREDIENTS } from '@fridge/shared';
import { useEffect, useState } from 'react';
import { getIngredients } from './api';

/** The ingredient list for autocomplete and the picker; the fixture list until loaded. */
export function useIngredientList(): readonly string[] {
  const [list, setList] = useState<readonly string[]>(FIXTURE_INGREDIENTS);
  useEffect(() => {
    let live = true;
    getIngredients().then((l) => live && setList(l));
    return () => {
      live = false;
    };
  }, []);
  return list;
}
