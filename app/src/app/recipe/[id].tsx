import type { Recipe } from '@fridge/shared';
import { useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Screen, T, WARN } from '@/components/ui';
import { getRecipe } from '@/lib/api';
import { loadStaples } from '@/lib/kitchen';
import { loadLatestScan } from '@/lib/latestScan';
import { missingIngredients } from '@/recipes/recipeMatch';
import { Failed, Loading } from '@/recipes/StateViews';
import { useAsync } from '@/recipes/useAsync';

async function loadDetail(id: string) {
  const [recipe, latest, staples] = await Promise.all([getRecipe(id), loadLatestScan(), loadStaples()]);
  return { recipe, missing: missingIngredients(recipe, { ingredients: latest?.ingredients ?? [], staples }) };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <T style={styles.heading}>{title}</T>
      {children}
    </View>
  );
}

/** The Recipe itself; `missing` holds its Missing Ingredients, highlighted in the list. */
function RecipeDetail({ recipe, missing }: { recipe: Recipe; missing: ReadonlySet<string> }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <T style={styles.title}>{recipe.name}</T>
      <T dim>
        {recipe.cuisine} · {recipe.minutes} min · serves {recipe.servings}
        {recipe.highProtein ? ' · high protein' : ''}
      </T>

      <Section title={missing.size ? `Ingredients (${missing.size} missing)` : 'Ingredients'}>
        {recipe.ingredients.map((i, n) => {
          const isMissing = missing.has(i.ingredient);
          return (
            <View key={`${i.ingredient}-${n}`} style={[styles.ingredient, isMissing && styles.missingRow]}>
              <T style={[styles.ingredientName, isMissing && styles.missingText]}>
                {i.ingredient}{isMissing ? ' (missing)' : ''}
              </T>
              {!!i.quantity && <T dim>{i.quantity}</T>}
            </View>
          );
        })}
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
      {state.status === 'ready' && <RecipeDetail recipe={state.value.recipe} missing={state.value.missing} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 8, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700' },
  section: { marginTop: 16, gap: 6 },
  heading: { fontSize: 18, fontWeight: '700' },
  ingredient: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  ingredientName: { flex: 1 },
  missingRow: { backgroundColor: 'rgba(199,119,0,0.15)' },
  missingText: { color: WARN, fontWeight: '600' },
  step: { flexDirection: 'row', gap: 8 },
  stepNo: { fontWeight: '700', width: 24 },
});
