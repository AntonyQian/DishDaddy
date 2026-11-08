import type { Recipe } from '@fridge/shared';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { EmptyState, Screen } from '@/components/ui';
import { loadSavedRecipes } from '@/lib/savedRecipes';
import { RecipeRow } from '@/recipes/RecipeRow';
import { RecipeListSkeleton } from '@/recipes/Skeleton';

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
        <RecipeListSkeleton />
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
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No saved recipes yet"
              text="Tap Save Recipe on any recipe and it will wait for you here, even offline."
              action={{ label: 'Find recipes', onPress: () => router.push('/recipes') }}
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 16, flexGrow: 1 },
});
