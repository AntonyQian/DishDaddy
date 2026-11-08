import type { Recipe } from '@fridge/shared';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { RoundButton } from '@/components/ui';
import { isRecipeSaved, toggleSavedRecipe } from '@/lib/savedRecipes';

/** The bookmark button in a recipe's header: saves or unsaves the Recipe on the device. */
export function SaveToggle({ recipe }: { recipe: Recipe }) {
  const [saved, setSaved] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    isRecipeSaved(recipe.id).then((s) => live && setSaved(s), () => live && setSaved(false));
    return () => { live = false; };
  }, [recipe.id]);

  const toggle = async () => {
    if (busy || saved === null) return;
    setBusy(true);
    try {
      setSaved(await toggleSavedRecipe(recipe));
    } catch {
      Alert.alert(saved ? 'Could not unsave this Recipe' : 'Could not save this Recipe', 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return <RoundButton icon={saved ? 'bookmark' : 'bookmark-border'} label={saved ? 'Unsave recipe' : 'Save recipe'} active={!!saved} onPress={toggle} />;
}
