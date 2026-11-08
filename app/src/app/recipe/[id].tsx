import type { Recipe, SubstitutionRequest } from '@fridge/shared';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, Icon, Screen, T } from '@/components/ui';
import { getSubstitutions } from '@/lib/api';
import { loadStaples } from '@/lib/kitchen';
import { loadLatestScan } from '@/lib/latestScan';
import { loadRecipe } from '@/recipes/loadRecipe';
import { NutritionLine } from '@/recipes/NutritionStrip';
import { difficultyOf } from '@/recipes/recipeFacts';
import { missingIngredients, norm } from '@/recipes/recipeMatch';
import { SaveToggle } from '@/recipes/SaveToggle';
import { Failed, Loading } from '@/recipes/StateViews';
import {
  acceptSwap, hasOpenSwaps, isStillMissing, offerSwaps, rejectSwap, startSwaps, swapLabel, visibleSwaps,
  type Swap, type SwapState,
} from '@/recipes/substitutions';
import { useAsync } from '@/recipes/useAsync';
import { COLORS, FONT, RADIUS } from '@/theme';

async function loadDetail(id: string) {
  const [recipe, latest, staples] = await Promise.all([loadRecipe(id), loadLatestScan(), loadStaples()]);
  const have: SubstitutionRequest = { ingredients: [...(latest?.ingredients ?? [])], staples: [...staples] };
  return { recipe, have, missing: missingIngredients(recipe, have) };
}

type SuggestState = { status: 'idle' } | { status: 'loading' } | { status: 'error'; message: string } | { status: 'done' };

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function SectionHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionHead}>
      <T style={styles.sectionTitle}>{title}</T>
      {right}
    </View>
  );
}

function SwapRow({ swap, onAccept, onReject }: { swap: Swap; onAccept: () => void; onReject: () => void }) {
  const accepted = swap.status === 'accepted';
  return (
    <View style={[styles.swap, accepted && styles.swapAccepted]}>
      <T style={styles.swapLabel}>{accepted ? `Using ${swap.use.join(' + ')}` : swapLabel(swap)}</T>
      {!!swap.note && <T dim style={{ fontSize: 13 }}>{swap.note}</T>}
      {!accepted && (
        <View style={styles.swapButtons}>
          <Button title="Accept" onPress={onAccept} style={styles.swapButton} />
          <Button title="Reject" variant="secondary" onPress={onReject} style={styles.swapButton} />
        </View>
      )}
    </View>
  );
}

/** The Recipe itself, its Missing Ingredients marked, with Substitutions for them. */
function RecipeDetail({ recipe, have, missing }: { recipe: Recipe; have: SubstitutionRequest; missing: ReadonlySet<string> }) {
  const [swaps, setSwaps] = useState<SwapState>(() => startSwaps(missing));
  const [suggest, setSuggest] = useState<SuggestState>({ status: 'idle' });

  async function suggestSubstitutions() {
    setSuggest({ status: 'loading' });
    try {
      const found = await getSubstitutions(recipe.id, have);
      setSwaps((s) => offerSwaps(s, found));
      setSuggest({ status: 'done' });
    } catch (e) {
      setSuggest({ status: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  }

  const stillMissing = swaps.missing;
  const offered = swaps.swaps.length > 0;
  const canSuggest = stillMissing.size > 0 && !hasOpenSwaps(swaps) && (suggest.status === 'idle' || suggest.status === 'done');
  const available = recipe.ingredients.filter((i) => !isStillMissing(swaps, i.ingredient)).length;
  // Swaps show once per Missing Ingredient, under its first row, even when the Recipe lists it twice.
  const swapRows = new Set<number>();
  const seen = new Set<string>();
  recipe.ingredients.forEach((i, n) => {
    const item = norm(i.ingredient);
    if (seen.has(item)) return;
    seen.add(item);
    if ([...missing].some((m) => norm(m) === item)) swapRows.add(n);
  });

  const tags = [recipe.cuisine !== 'Other' ? recipe.cuisine : null, ...recipe.equipment.map(capital)].filter(Boolean) as string[];

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.photo}>
            {!!recipe.imageUrl && <Image source={{ uri: recipe.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />}
            <View style={styles.photoPill}>
              <T style={styles.photoPillText}>{difficultyOf(recipe)} • {recipe.minutes}m</T>
            </View>
          </View>
          {tags.length > 0 && (
            <View style={styles.tags}>
              {tags.map((t) => <Badge key={t} label={t} tone="neutral" />)}
            </View>
          )}
          <T style={styles.title}>{recipe.name}</T>
          <NutritionLine calories={recipe.calories} proteinGrams={recipe.proteinGrams} />
          <View style={styles.stats}>
            <View style={styles.stat}>
              <T dim style={styles.statLabel}>Prep & Cook</T>
              <T style={styles.statValue}>{recipe.minutes} mins</T>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <T dim style={styles.statLabel}>Difficulty</T>
              <T style={styles.statValue}>{difficultyOf(recipe)}</T>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <T dim style={styles.statLabel}>Serves</T>
              <T style={styles.statValue}>{recipe.servings}</T>
            </View>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <SectionHeader
            title="Ingredients"
            right={<Badge label={`${available} of ${recipe.ingredients.length} Available`} tone="neutral" />}
          />
          {recipe.ingredients.map((i, n) => {
            const isMissing = isStillMissing(swaps, i.ingredient);
            const shown = swapRows.has(n) ? visibleSwaps(swaps, i.ingredient) : [];
            const note = isMissing ? 'Missing from your kitchen' : i.original && norm(i.original) !== norm(i.ingredient) ? i.original : undefined;
            return (
              <View key={`${i.ingredient}-${n}`} style={{ gap: 6 }}>
                <View style={[styles.ingredient, isMissing && styles.ingredientMissing]}>
                  <View style={[styles.check, isMissing ? styles.checkOff : styles.checkOn]}>
                    {!isMissing && <Icon name="check" size={14} color={COLORS.onPrimary} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <T style={styles.ingredientName}>{capital(i.ingredient)}</T>
                    {!!note && <T style={[styles.ingredientNote, isMissing && { color: COLORS.warnText }]}>{note}</T>}
                  </View>
                  {!!i.quantity && <T dim style={styles.quantity}>{i.quantity}</T>}
                </View>
                {shown.map((s) => (
                  <SwapRow
                    key={s.id}
                    swap={s}
                    onAccept={() => setSwaps((st) => acceptSwap(st, s.id))}
                    onReject={() => setSwaps((st) => rejectSwap(st, s.id))}
                  />
                ))}
              </View>
            );
          })}

          {canSuggest && <Button title="Suggest substitutions" variant="secondary" onPress={suggestSubstitutions} />}
          {suggest.status === 'loading' && (
            <View style={styles.inline}>
              <ActivityIndicator color={COLORS.primary} />
              <T dim>Finding substitutions…</T>
            </View>
          )}
          {suggest.status === 'error' && (
            <View style={{ gap: 6 }}>
              <T dim>Could not get substitutions: {suggest.message}</T>
              <Button title="Try again" variant="secondary" onPress={suggestSubstitutions} />
            </View>
          )}
          {suggest.status === 'done' && !offered && <T dim>No substitutions found for the missing ingredients.</T>}
        </View>

        <View style={{ gap: 8 }}>
          <SectionHeader title="Cooking Steps" right={<T dim style={styles.stepCount}>{recipe.steps.length} steps</T>} />
          {recipe.steps.map((s, n) => (
            <View key={n} style={styles.step}>
              <View style={styles.stepHead}>
                <View style={styles.stepNo}>
                  <T style={styles.stepNoText}>{n + 1}</T>
                </View>
                <T style={styles.stepTitle}>Step {n + 1}</T>
              </View>
              <T dim style={styles.stepText}>{s}</T>
            </View>
          ))}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer} pointerEvents="box-none">
        <View style={styles.footerInner}>
          <Button
            title="Start Cooking"
            icon="arrow-forward"
            onPress={() => router.navigate({ pathname: '/cook', params: { id: recipe.id } })}
            style={styles.cookButton}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [state, retry] = useAsync(() => loadDetail(id), [id]);
  const recipe = state.status === 'ready' ? state.value.recipe : undefined;

  return (
    <Screen title={recipe?.name ?? 'Recipe'} eyebrow="Recipe detail" back right={recipe && <SaveToggle recipe={recipe} />}>
      {state.status === 'loading' && <Loading label="Loading recipe…" />}
      {state.status === 'error' && <Failed title="Could not load the recipe" message={state.message} onRetry={retry} />}
      {state.status === 'ready' && (
        <RecipeDetail key={id} recipe={state.value.recipe} have={state.value.have} missing={state.value.missing} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { padding: 20, gap: 24, paddingBottom: 130 },
  heroCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 12 },
  photo: { height: 208, borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: COLORS.surfaceLow, borderWidth: 1, borderColor: COLORS.border },
  photoPill: { position: 'absolute', right: 8, bottom: 8, backgroundColor: 'rgba(48,48,54,0.82)', borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 3 },
  photoPillText: { color: COLORS.inverseText, fontSize: 11, fontFamily: FONT.semi },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  title: { fontSize: 26, fontWeight: '700', lineHeight: 34, letterSpacing: -0.4 },
  stats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  stat: { alignItems: 'center', paddingVertical: 4, flex: 1 },
  statLabel: { fontSize: 11, fontWeight: '700' },
  statValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  ingredient: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  ingredientMissing: { backgroundColor: COLORS.warnSoft, borderColor: COLORS.warnBorder },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: COLORS.primary },
  checkOff: { borderWidth: 2, borderColor: COLORS.warnText },
  ingredientName: { fontSize: 14, fontWeight: '600' },
  ingredientNote: { fontSize: 12, color: COLORS.muted },
  quantity: { fontSize: 12, fontWeight: '700' },
  swap: { marginLeft: 16, padding: 12, gap: 6, borderRadius: RADIUS.md, backgroundColor: COLORS.warnSoft, borderWidth: 1, borderColor: COLORS.warnBorder },
  swapAccepted: { backgroundColor: COLORS.okSoft, borderColor: COLORS.okBorder },
  swapLabel: { fontWeight: '700', fontSize: 14 },
  swapButtons: { flexDirection: 'row', gap: 8 },
  swapButton: { flex: 1, paddingVertical: 10 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepCount: { fontSize: 12, fontWeight: '700' },
  step: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 8 },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepNo: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.chipBg, alignItems: 'center', justifyContent: 'center' },
  stepNoText: { fontSize: 11, fontWeight: '700' },
  stepTitle: { fontSize: 18, fontWeight: '700' },
  stepText: { fontSize: 14, lineHeight: 20, paddingLeft: 32 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 20 },
  footerInner: { width: '100%', maxWidth: 440, paddingVertical: 8 },
  cookButton: { paddingVertical: 16, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
});
