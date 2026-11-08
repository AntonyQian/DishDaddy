import type { RecipeMatch } from '@fridge/shared';
import { FlatList, StyleSheet } from 'react-native';

import { CONFIRMED, Screen, T, WARN } from '@/components/ui';
import { searchRecipes } from '@/lib/api';
import { loadSearchRequest } from '@/recipes/available';
import { RecipeRow } from '@/recipes/RecipeRow';
import { Failed, Loading } from '@/recipes/StateViews';
import { useAsync } from '@/recipes/useAsync';

function MatchRow({ match }: { match: RecipeMatch }) {
  const n = match.missing.length;
  return (
    <RecipeRow
      id={match.recipeId}
      name={match.name}
      minutes={match.minutes}
      cuisine={match.cuisine}
      badge={<T style={{ color: n === 0 ? CONFIRMED : WARN, fontWeight: '600' }}>{n === 0 ? 'Nothing missing' : `${n} missing`}</T>}
    />
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
  empty: { textAlign: 'center', marginTop: 40 },
});
