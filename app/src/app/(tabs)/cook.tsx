import type { Recipe } from '@fridge/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '@/components/AppBar';
import { Button, EmptyState, T } from '@/components/ui';
import { Failed, Loading } from '@/recipes/StateViews';
import { loadRecipe } from '@/recipes/loadRecipe';
import { useAsync } from '@/recipes/useAsync';
import { COLORS, RADIUS } from '@/theme';

/** One step at a time, big enough to read from across the counter, with Back and Next. */
function CookSteps({ recipe }: { recipe: Recipe }) {
  const [step, setStep] = useState(0);
  const last = recipe.steps.length - 1;
  const done = step > last;

  if (done) {
    return (
      <View style={styles.done}>
        <T style={{ fontSize: 56 }}>🍽️</T>
        <T style={styles.doneTitle}>Enjoy your meal!</T>
        <T dim style={styles.doneText}>{recipe.name} is ready.</T>
        <Button title="Back to Kitchen" onPress={() => router.navigate('/')} style={{ alignSelf: 'stretch' }} />
        <Button title="Cook it again" variant="secondary" onPress={() => setStep(0)} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  return (
    <View style={styles.body}>
      <View style={{ gap: 4 }}>
        <T style={styles.eyebrow}>COOKING</T>
        <T style={styles.recipeName} numberOfLines={2}>{recipe.name}</T>
      </View>

      <View style={{ gap: 8 }}>
        <T dim style={styles.progressText}>Step {step + 1} of {recipe.steps.length}</T>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${((step + 1) / recipe.steps.length) * 100}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.card} contentContainerStyle={{ padding: 20, gap: 12 }}>
        <View style={styles.stepNo}>
          <T style={styles.stepNoText}>{step + 1}</T>
        </View>
        <T style={styles.stepText}>{recipe.steps[step]}</T>
      </ScrollView>

      <View style={styles.buttons}>
        <Button title="Back" variant="secondary" disabled={step === 0} onPress={() => setStep((s) => s - 1)} style={{ flex: 1 }} />
        <Button
          title={step === last ? 'Finish' : 'Next step'}
          icon={step === last ? undefined : 'arrow-forward'}
          onPress={() => setStep((s) => s + 1)}
          style={{ flex: 2 }}
        />
      </View>
    </View>
  );
}

export default function CookModeScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [state, retry] = useAsync(() => (id ? loadRecipe(id) : Promise.resolve(null)), [id]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <AppBar subtitle="Cook Mode" />
      {state.status === 'loading' && <Loading label="Getting your recipe…" />}
      {state.status === 'error' && <Failed title="Could not load the recipe" message={state.message} onRetry={retry} />}
      {state.status === 'ready' && !state.value && (
        <EmptyState
          title="Nothing cooking yet"
          text="Pick a recipe and tap Start Cooking. Its steps show up here, one at a time."
          action={{ label: 'Browse recipes', onPress: () => router.navigate('/recipes') }}
        />
      )}
      {state.status === 'ready' && state.value && <CookSteps key={state.value.id} recipe={state.value} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 130, gap: 20 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: COLORS.primary },
  recipeName: { fontSize: 24, fontWeight: '800', lineHeight: 30, letterSpacing: -0.4 },
  progressText: { fontSize: 13, fontWeight: '700' },
  track: { height: 8, borderRadius: 4, backgroundColor: COLORS.chipBg, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  card: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  stepNo: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stepNoText: { color: COLORS.primary, fontSize: 18, fontWeight: '800' },
  stepText: { fontSize: 22, lineHeight: 32, fontWeight: '600' },
  buttons: { flexDirection: 'row', gap: 12 },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, paddingBottom: 130 },
  doneTitle: { fontSize: 26, fontWeight: '800' },
  doneText: { fontSize: 15, marginBottom: 12 },
});
