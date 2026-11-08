import type { Recipe, SubstitutionRequest } from '@fridge/shared';
import { useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { Button, CONFIRMED, Screen, T, WARN } from '@/components/ui';
import { getRecipe, getSubstitutions } from '@/lib/api';
import { loadStaples } from '@/lib/kitchen';
import { loadLatestScan } from '@/lib/latestScan';
import { findSavedRecipe } from '@/lib/savedRecipes';
import { missingIngredients } from '@/recipes/recipeMatch';
import { SaveToggle } from '@/recipes/SaveToggle';
import { Failed, Loading } from '@/recipes/StateViews';
import {
  acceptSwap, offerSwaps, rejectSwap, startSwaps, swapLabel, visibleSwaps, type Swap, type SwapState,
} from '@/recipes/substitutions';
import { useAsync } from '@/recipes/useAsync';

/** The Recipe from the server, or its saved copy when the server can't be reached, so Saved Recipes open offline. */
async function loadRecipe(id: string): Promise<Recipe> {
  try {
    return await getRecipe(id);
  } catch (e) {
    const saved = await findSavedRecipe(id).catch(() => undefined);
    if (saved) return saved;
    throw e;
  }
}

async function loadDetail(id: string) {
  const [recipe, latest, staples] = await Promise.all([loadRecipe(id), loadLatestScan(), loadStaples()]);
  const have: SubstitutionRequest = { ingredients: [...(latest?.ingredients ?? [])], staples: [...staples] };
  return { recipe, have, missing: missingIngredients(recipe, have) };
}

type SuggestState = { status: 'idle' } | { status: 'loading' } | { status: 'error'; message: string } | { status: 'done' };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <T style={styles.heading}>{title}</T>
      {children}
    </View>
  );
}

function SwapRow({ swap, onAccept, onReject }: { swap: Swap; onAccept: () => void; onReject: () => void }) {
  const accepted = swap.status === 'accepted';
  return (
    <View style={[styles.swap, accepted && styles.swapAccepted]}>
      <T style={styles.swapLabel}>{accepted ? `Using ${swap.use.join(' + ')}` : swapLabel(swap)}</T>
      {!!swap.note && <T dim>{swap.note}</T>}
      {!accepted && (
        <View style={styles.swapButtons}>
          <Button title="Accept" onPress={onAccept} style={styles.swapButton} />
          <Button title="Reject" variant="secondary" onPress={onReject} style={styles.swapButton} />
        </View>
      )}
    </View>
  );
}

/** The Recipe itself, its Missing Ingredients highlighted, with Substitutions for them. */
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <T style={styles.title}>{recipe.name}</T>
      <T dim>
        {recipe.cuisine} · {recipe.minutes} min · serves {recipe.servings}
        {recipe.highProtein ? ' · high protein' : ''}
      </T>
      <SaveToggle recipe={recipe} />

      <Section title={stillMissing.size ? `Ingredients (${stillMissing.size} missing)` : 'Ingredients'}>
        {recipe.ingredients.map((i, n) => {
          const isMissing = stillMissing.has(i.ingredient);
          const shown = missing.has(i.ingredient) ? visibleSwaps(swaps, i.ingredient) : [];
          return (
            <View key={`${i.ingredient}-${n}`} style={styles.ingredientBlock}>
              <View style={[styles.ingredient, isMissing && styles.missingRow]}>
                <T style={[styles.ingredientName, isMissing && styles.missingText]}>
                  {i.ingredient}{isMissing ? ' (missing)' : ''}
                </T>
                {!!i.quantity && <T dim>{i.quantity}</T>}
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

        {missing.size > 0 && !offered && suggest.status === 'idle' && (
          <Button title="Suggest substitutions" variant="secondary" onPress={suggestSubstitutions} />
        )}
        {suggest.status === 'loading' && (
          <View style={styles.inline}>
            <ActivityIndicator />
            <T dim>Finding substitutions…</T>
          </View>
        )}
        {suggest.status === 'error' && (
          <View style={styles.suggestError}>
            <T dim>Could not get substitutions: {suggest.message}</T>
            <Button title="Try again" variant="secondary" onPress={suggestSubstitutions} />
          </View>
        )}
        {suggest.status === 'done' && !offered && <T dim>No substitutions found for the missing ingredients.</T>}
      </Section>

      <Section title="Equipment">
        <T>{recipe.equipment.length ? recipe.equipment.join(', ') : 'None needed'}</T>
      </Section>

      <Section title="Steps">
        {recipe.steps.map((s, n) => (
          <View key={n} style={styles.step}>
            <T style={styles.stepNo}>{n + 1}.</T>
            <T style={{ flex: 1 }}>{s}</T>
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [state, retry] = useAsync(() => loadDetail(id), [id]);

  return (
    <Screen title={state.status === 'ready' ? state.value.recipe.name : 'Recipe'} back>
      {state.status === 'loading' && <Loading label="Loading recipe…" />}
      {state.status === 'error' && <Failed title="Could not load the recipe" message={state.message} onRetry={retry} />}
      {state.status === 'ready' && (
        <RecipeDetail key={id} recipe={state.value.recipe} have={state.value.have} missing={state.value.missing} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 8, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700' },
  section: { marginTop: 16, gap: 6 },
  heading: { fontSize: 18, fontWeight: '700' },
  ingredientBlock: { gap: 4 },
  ingredient: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  ingredientName: { flex: 1 },
  missingRow: { backgroundColor: 'rgba(199,119,0,0.15)' },
  missingText: { color: WARN, fontWeight: '600' },
  swap: { marginLeft: 16, padding: 8, gap: 4, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: WARN, backgroundColor: 'rgba(199,119,0,0.08)' },
  swapAccepted: { borderLeftColor: CONFIRMED, backgroundColor: 'rgba(30,158,90,0.12)' },
  swapLabel: { fontWeight: '600' },
  swapButtons: { flexDirection: 'row', gap: 8 },
  swapButton: { flex: 1 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  suggestError: { gap: 6 },
  step: { flexDirection: 'row', gap: 8 },
  stepNo: { fontWeight: '700', width: 24 },
});
