import type { Recipe } from '@fridge/shared';
import { useEffect, useState } from 'react';

import { Button, DANGER, T } from '@/components/ui';
import { isRecipeSaved, toggleSavedRecipe } from '@/lib/savedRecipes';

/** Saves or unsaves the Recipe on the device. */
export function SaveToggle({ recipe }: { recipe: Recipe }) {
  const [saved, setSaved] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    isRecipeSaved(recipe.id).then((s) => live && setSaved(s), () => live && setSaved(false));
    return () => { live = false; };
  }, [recipe.id]);

  const toggle = async () => {
    setBusy(true);
    setProblem(null);
    try {
      setSaved(await toggleSavedRecipe(recipe));
    } catch {
      setProblem(saved ? 'Could not unsave this Recipe. Try again.' : 'Could not save this Recipe. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        title={saved ? 'Saved ✓ (tap to unsave)' : 'Save Recipe'}
        variant={saved ? 'secondary' : 'primary'}
        onPress={toggle}
        disabled={saved === null}
        busy={busy}
      />
      {!!problem && <T style={{ color: DANGER }}>{problem}</T>}
    </>
  );
}
