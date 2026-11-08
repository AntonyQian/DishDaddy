import type { RecipeMatch } from '@fridge/shared';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppBar } from '@/components/AppBar';
import { Backdrop } from '@/components/Backdrop';
import { Chip, EmptyState, Icon, T } from '@/components/ui';
import { searchRecipes } from '@/lib/api';
import { loadLatestScan } from '@/lib/latestScan';
import { loadSearchRequest } from '@/recipes/available';
import { applyFilters, countFilters, FILTER_LABELS, matchesQuery, type MatchFilter } from '@/recipes/matchFilters';
import { RecipeRow } from '@/recipes/RecipeRow';
import { RecipeListSkeleton } from '@/recipes/Skeleton';
import { Failed } from '@/recipes/StateViews';
import { useAsync } from '@/recipes/useAsync';
import { COLORS, FONT, RADIUS } from '@/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const FILTERS = Object.keys(FILTER_LABELS) as MatchFilter[];

function MatchRow({ match }: { match: RecipeMatch }) {
  return (
    <RecipeRow
      id={match.recipeId}
      name={match.name}
      minutes={match.minutes}
      cuisine={match.cuisine}
      imageUrl={match.imageUrl}
      calories={match.calories}
      proteinGrams={match.proteinGrams}
      missing={match.missing}
      have={match.usedCount}
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
  const [active, setActive] = useState<ReadonlySet<MatchFilter>>(new Set());
  const [query, setQuery] = useState('');

  const toggle = (f: MatchFilter) =>
    setActive((a) => {
      const next = new Set(a);
      if (!next.delete(f)) next.add(f);
      return next;
    });
  const clear = () => {
    setActive(new Set());
    setQuery('');
  };

  const ready = state.status === 'ready' ? state.value : null;
  const counts = countFilters(ready?.matches ?? []);
  const shown = ready ? applyFilters(ready.matches, active).filter((m) => matchesQuery(m, query)) : [];
  const filtering = active.size > 0 || query.trim() !== '';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Backdrop />
      <AppBar />
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
          renderItem={({ item }) => <MatchRow match={item} />}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={{ gap: 24 }}>
              <View style={styles.search}>
                <Icon name="search" size={22} color={COLORS.outline} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search recipes…"
                  placeholderTextColor={COLORS.outline}
                  returnKeyType="search"
                  style={styles.searchInput}
                />
                {query !== '' && (
                  <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={8}>
                    <Icon name="close" size={20} color={COLORS.outline} />
                  </Pressable>
                )}
              </View>

              <View style={styles.hero}>
                <View style={styles.heroText}>
                  <View style={styles.heroBadge}>
                    <Icon name="check-circle" size={13} color={COLORS.primaryText} />
                    <T style={styles.heroBadgeText}>{counts.ready} In Stock</T>
                  </View>
                  <T style={styles.heroTitle}>Ready to cook</T>
                  <T dim style={styles.heroSub}>
                    {counts.ready > 0
                      ? 'Complete recipes ready with the ingredients you have right now.'
                      : 'Nothing is complete yet. Recipes below are close, with a few things missing.'}
                  </T>
                </View>
                <View style={styles.heroIcon}>
                  <Icon name="soup-kitchen" size={40} color={COLORS.primaryText} />
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <View style={styles.filterHead}>
                  <T style={styles.sectionTitle}>Filter Pantry Fits</T>
                  <Pressable accessibilityRole="button" onPress={clear} hitSlop={8}>
                    <T style={styles.clear}>Clear</T>
                  </Pressable>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                  <Chip title="All" count={counts.all} selected={!filtering} onPress={clear} />
                  {FILTERS.map((f) => (
                    <Chip key={f} title={FILTER_LABELS[f]} count={counts[f]} selected={active.has(f)} onPress={() => toggle(f)} />
                  ))}
                </ScrollView>
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title={filtering ? 'No recipes match' : 'No recipes found'}
              text={
                filtering
                  ? 'Try a different search or turn a filter off.'
                  : 'Nothing in the collection uses your Ingredients and Equipment yet. Add more Ingredients or Equipment and try again.'
              }
              action={filtering ? { label: 'Clear filters', onPress: clear } : undefined}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 130, gap: 24, flexGrow: 1 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 4,
    backgroundColor: COLORS.surfaceLow, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontFamily: FONT.medium, fontSize: 14, color: COLORS.text, outlineStyle: 'none' } as never,
  hero: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 16,
    backgroundColor: COLORS.surfaceLow, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg,
  },
  heroText: { flex: 1, gap: 4 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: COLORS.primarySoft, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3 },
  heroBadgeText: { color: COLORS.primaryText, fontSize: 11, fontWeight: '700' },
  heroTitle: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  heroSub: { fontSize: 12 },
  heroIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.chipBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  filterHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  clear: { color: COLORS.primaryText, fontSize: 13, fontWeight: '600' },
  filters: { gap: 8, paddingRight: 20 },
});
