import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card, Chip, Screen, T } from '@/components/ui';
import { DEFAULT_GOALS, loadGoals, saveGoals, stepGoal, type Goals } from '@/lib/goals';
import { COLORS, FONT } from '@/theme';

const PRESETS = [
  { label: 'Everyday · 90 g', proteinGrams: 90 },
  { label: 'Active · 120 g', proteinGrams: 120 },
  { label: 'Building · 160 g', proteinGrams: 160 },
];

function Stepper({ label, value, unit, onStep }: { label: string; value: number; unit: string; onStep: (d: 1 | -1) => void }) {
  return (
    <Card style={styles.card}>
      <T style={styles.label}>{label}</T>
      <View style={styles.stepper}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Lower ${label}`} onPress={() => onStep(-1)} style={styles.round}>
          <MaterialCommunityIcons name="minus" size={24} color={COLORS.primary} />
        </Pressable>
        <View style={styles.valueBox}>
          <T style={styles.value}>{value}</T>
          <T dim style={styles.unit}>{unit}</T>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Raise ${label}`} onPress={() => onStep(1)} style={styles.round}>
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.primary} />
        </Pressable>
      </View>
    </Card>
  );
}

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);

  useEffect(() => {
    loadGoals().then(setGoals);
  }, []);

  const update = (next: Goals) => {
    setGoals(next);
    saveGoals(next).catch(() => {}); // a failed save only means the goal is forgotten at restart
  };

  return (
    <Screen title="Goals">
      <ScrollView contentContainerStyle={styles.container}>
        <T dim>Recipes show how much of your day one serving covers.</T>

        <Stepper
          label="Daily protein goal"
          value={goals.proteinGrams}
          unit="g"
          onStep={(d) => update({ ...goals, proteinGrams: stepGoal('proteinGrams', goals.proteinGrams, d) })}
        />
        <View style={styles.presets}>
          {PRESETS.map((p) => (
            <Chip
              key={p.label}
              title={p.label}
              selected={goals.proteinGrams === p.proteinGrams}
              onPress={() => update({ ...goals, proteinGrams: p.proteinGrams })}
            />
          ))}
        </View>

        <Stepper
          label="Daily calorie goal"
          value={goals.calories}
          unit="kcal"
          onStep={(d) => update({ ...goals, calories: stepGoal('calories', goals.calories, d) })}
        />

        <Card style={styles.tip}>
          <T style={styles.tipTitle}>How it is used</T>
          <T dim>
            A recipe with 35 g of protein per serving covers {Math.round((35 / goals.proteinGrams) * 100)}% of your{' '}
            {goals.proteinGrams} g goal. Goals stay on this phone.
          </T>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  card: { gap: 12 },
  label: { fontFamily: FONT.bodyBold, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.6, color: COLORS.primary },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  round: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  valueBox: { alignItems: 'center' },
  value: { fontSize: 44, fontWeight: '700', lineHeight: 50, fontVariant: ['tabular-nums'] },
  unit: { fontSize: 14, marginTop: -4 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tip: { gap: 6, backgroundColor: COLORS.primarySoft, borderColor: COLORS.ring },
  tipTitle: { fontFamily: FONT.bodyBold },
});
