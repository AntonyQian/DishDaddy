import type { RecipeMatch } from '@fridge/shared';
import { FlatList, StyleSheet } from 'react-native';

import { Screen, T } from '@/components/ui';
import { searchRecipes } from '@/lib/api';
import { useGoals } from '@/lib/useGoals';
import { loadSearchRequest } from '@/recipes/available';
import { RecipeRow } from '@/recipes/RecipeRow';
import { Failed, Loading } from '@/recipes/StateViews';
import { useAsync } from '@/recipes/useAsync';

function MatchRow({ match, goalProtein }: { match: RecipeMatch; goalProtein: number }) {
  return (
    <RecipeRow
      id={match.recipeId}
      name={match.name}
      minutes={match.minutes}
      cuisine={match.cuisine}
      imageUrl={match.imageUrl}
      calories={match.calories}
      proteinGrams={match.proteinGrams}
      highProtein={match.highProtein}
      missing={match.missing}
      goalProtein={goalProtein}
    />
  );
}

export default function RecipeMatchesScreen() {
  const [state, retry] = useAsync(async () => searchRecipes(await loadSearchRequest()), []);
  const goals = useGoals();

  return (
    <Screen title="Recipe Matches">
      {state.status === 'loading' && <Loading label="Finding recipes…" />}
      {state.status === 'error' && <Failed title="Could not find recipes" message={state.message} onRetry={retry} />}
      {state.status === 'ready' && (
        <FlatList
          data={state.value}
          keyExtractor={(m) => m.recipeId}
          renderItem={({ item }) => <MatchRow match={item} goalProtein={goals.proteinGrams} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<T dim style={styles.empty}>No recipes use the Ingredients from your latest Scan.</T>}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 16 },
  empty: { textAlign: 'center', marginTop: 40 },
});
