import type { Recipe } from '@fridge/shared';
import { router, useFocusEffect, useTheme } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Screen, T } from '@/components/ui';
import { loadSavedRecipes } from '@/lib/savedRecipes';
import { Loading } from '@/recipes/StateViews';

function SavedRow({ recipe }: { recipe: Recipe }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } })}
      style={({ pressed }) => [styles.row, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}>
      <T style={styles.name}>{recipe.name}</T>
      <View style={styles.meta}>
        <T dim>{recipe.minutes} min</T>
        <T dim>{recipe.cuisine}</T>
      </View>
    </Pressable>
  );
}

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
          renderItem={({ item }) => <SavedRow recipe={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<T dim style={styles.empty}>No Saved Recipes yet. Save one from its Recipe page.</T>}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 10 },
  row: { padding: 14, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, gap: 6 },
  name: { fontSize: 17, fontWeight: '600' },
  meta: { flexDirection: 'row', gap: 16 },
  empty: { textAlign: 'center', marginTop: 40 },
});
