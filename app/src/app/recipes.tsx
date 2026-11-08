import type { RecipeMatch } from '@fridge/shared';
import { router, useTheme } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { CONFIRMED, Screen, T, WARN } from '@/components/ui';
import { searchRecipes } from '@/lib/api';
import { loadSearchRequest } from '@/recipes/available';
import { Failed, Loading } from '@/recipes/StateViews';
import { useAsync } from '@/recipes/useAsync';

function MatchRow({ match }: { match: RecipeMatch }) {
  const { colors } = useTheme();
  const n = match.missing.length;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: match.recipeId } })}
      style={({ pressed }) => [styles.row, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}>
      <T style={styles.name}>{match.name}</T>
      <View style={styles.meta}>
        <T style={{ color: n === 0 ? CONFIRMED : WARN, fontWeight: '600' }}>{n === 0 ? 'Nothing missing' : `${n} missing`}</T>
        <T dim>{match.minutes} min</T>
        <T dim>{match.cuisine}</T>
      </View>
    </Pressable>
  );
}

export default function RecipeMatchesScreen() {
  const [state, retry] = useAsync(async () => searchRecipes(await loadSearchRequest()), []);

  return (
    <Screen title="Recipe Matches" back>
      {state.status === 'loading' && <Loading label="Finding recipes…" />}
      {state.status === 'error' && <Failed title="Could not find recipes" message={state.message} onRetry={retry} />}
      {state.status === 'ready' && (
        <FlatList
          data={state.value}
          keyExtractor={(m) => m.recipeId}
          renderItem={({ item }) => <MatchRow match={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<T dim style={styles.empty}>No recipes use the Ingredients from your latest Scan.</T>}
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
