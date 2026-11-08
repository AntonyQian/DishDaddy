import type { Recipe } from '@fridge/shared';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui';
import { isRecipeSaved, toggleSavedRecipe } from '@/lib/savedRecipes';

/** Saves or unsaves the Recipe on the device. */
export function SaveToggle({ recipe }: { recipe: Recipe }) {
  const [saved, setSaved] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    isRecipeSaved(recipe.id).then((s) => live && setSaved(s), () => live && setSaved(false));
    return () => { live = false; };
  }, [recipe.id]);

  const toggle = async () => {
    setBusy(true);
    try {
      setSaved(await toggleSavedRecipe(recipe));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      title={saved ? 'Saved ✓ (tap to unsave)' : 'Save Recipe'}
      variant={saved ? 'secondary' : 'primary'}
      onPress={toggle}
      disabled={saved === null}
      busy={busy}
    />
  );
}
