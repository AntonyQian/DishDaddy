import type { RecipeMatch } from '@fridge/shared';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { Chip, EmptyState, Screen, T } from '@/components/ui';
import { searchRecipes } from '@/lib/api';
import { loadLatestScan } from '@/lib/latestScan';
import { useGoals } from '@/lib/useGoals';
import { loadSearchRequest } from '@/recipes/available';
import { applyFilters, FILTER_LABELS, type MatchFilter } from '@/recipes/matchFilters';
import { RecipeRow } from '@/recipes/RecipeRow';
import { RecipeListSkeleton } from '@/recipes/Skeleton';
import { Failed } from '@/recipes/StateViews';
import { useAsync } from '@/recipes/useAsync';

const FILTERS = Object.keys(FILTER_LABELS) as MatchFilter[];

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
      have={match.usedCount}
      goalProtein={goalProtein}
    />
  );
}

/** Recipe Matches for the latest Scan; `scanned` is false before the first Scan has been confirmed. */
async function loadMatches() {
  const latest = await loadLatestScan();
  if (!latest || latest.ingredients.length === 0) return { scanned: false, matches: [] as RecipeMatch[] };
  return { scanned: true, matches: await searchRecipes(await loadSearchRequest()) };
}

/** Bumps each time the tab is focused again, so the list follows a new Scan or changed Staples and Equipment. */
function useRefocusKey() {
  const [key, setKey] = useState(0);
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else setKey((k) => k + 1);
    }, []),
  );
  return key;
}

export default function RecipeMatchesScreen() {
  const refocus = useRefocusKey();
  const [state, retry] = useAsync(loadMatches, [refocus]);
  const goals = useGoals();
  const [active, setActive] = useState<ReadonlySet<MatchFilter>>(new Set());

  const toggle = (f: MatchFilter) =>
    setActive((a) => {
      const next = new Set(a);
      if (!next.delete(f)) next.add(f);
      return next;
    });

  const ready = state.status === 'ready' ? state.value : null;
  const shown = ready ? applyFilters(ready.matches, active) : [];

  return (
    <Screen title="Recipe Matches">
      {state.status === 'loading' && <RecipeListSkeleton />}
      {state.status === 'error' && <Failed title="Could not find recipes" message={state.message} onRetry={retry} />}
      {ready && !ready.scanned && (
        <EmptyState
          title="Scan your fridge first"
          text="Take a few photos of what you have and we'll find recipes you can cook with it."
          action={{ label: 'Start a Scan', onPress: () => router.push('/scan') }}
        />
      )}
      {ready?.scanned && (
        <FlatList
          data={shown}
          keyExtractor={(m) => m.recipeId}
          renderItem={({ item }) => <MatchRow match={item} goalProtein={goals.proteinGrams} />}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.header}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                {FILTERS.map((f) => (
                  <Chip key={f} title={FILTER_LABELS[f]} selected={active.has(f)} onPress={() => toggle(f)} />
                ))}
              </ScrollView>
              <T dim style={styles.count}>
                {shown.length} {shown.length === 1 ? 'recipe' : 'recipes'}
                {active.size > 0 ? ` of ${ready.matches.length}` : ''}
              </T>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title={active.size > 0 ? 'No recipes match those filters' : 'No recipes found'}
              text={
                active.size > 0
                  ? 'Try turning one off.'
                  : 'Nothing in the collection uses your Ingredients and Equipment yet. Add more Ingredients or Equipment and try again.'
              }
              action={active.size > 0 ? { label: 'Clear filters', onPress: () => setActive(new Set()) } : undefined}
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 16, flexGrow: 1 },
  header: { gap: 10 },
  filters: { gap: 8 },
  count: { fontSize: 13 },
});
