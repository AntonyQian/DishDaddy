import type { Recipe } from '@fridge/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { Screen, T } from '@/components/ui';
import { loadSavedRecipes } from '@/lib/savedRecipes';
import { RecipeRow } from '@/recipes/RecipeRow';
import { Loading } from '@/recipes/StateViews';

export default function SavedRecipesScreen() {
  const [saved, setSaved] = useState<Recipe[] | null>(null);

  // Reload on focus so a Recipe unsaved on its detail screen drops off when the user comes back.
  useFocusEffect(
    useCallback(() => {
      loadSavedRecipes().then(setSaved, () => setSaved([]));
    }, []),
  );

  return (
    <Screen title="Saved Recipes" back>
      {saved === null ? (
        <Loading label="Loading Saved Recipes…" />
      ) : (
        <FlatList
          data={saved}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => (
            <RecipeRow
              id={item.id}
              name={item.name}
              minutes={item.minutes}
              cuisine={item.cuisine}
              imageUrl={item.imageUrl}
              calories={item.calories}
              proteinGrams={item.proteinGrams}
              highProtein={item.highProtein}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<T dim style={styles.empty}>No Saved Recipes yet. Save one from its Recipe page.</T>}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 16 },
  empty: { textAlign: 'center', marginTop: 40 },
});
