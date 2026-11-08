import { StyleSheet, View } from 'react-native';

import { T } from '@/components/ui';
import { percentOfGoal } from '@/lib/goals';
import { COLORS, FONT } from '@/theme';

/** Calories and protein per serving, as in the design. Renders nothing when the Recipe has neither. */
export function NutritionStrip({ calories, proteinGrams, goalProtein }: { calories?: number; proteinGrams?: number; goalProtein?: number }) {
  if (calories === undefined && proteinGrams === undefined) return null;
  const share = goalProtein === undefined ? null : percentOfGoal(proteinGrams, goalProtein);
  return (
    <View style={{ gap: 8 }}>
    <View style={styles.strip}>
      {calories !== undefined && (
        <View style={styles.cell}>
          <T style={styles.value}>🔥 {calories} <T dim style={styles.unit}>kcal</T></T>
        </View>
      )}
      {calories !== undefined && proteinGrams !== undefined && <View style={styles.divider} />}
      {proteinGrams !== undefined && (
        <View style={styles.cell}>
          <T style={styles.value}>💪 {proteinGrams}g <T dim style={styles.unit}>protein</T></T>
        </View>
      )}
      <T dim style={styles.per}>per serving</T>
    </View>
    {share !== null && share > 0 && (
      <View style={styles.goal}>
        <T style={styles.goalText}>🎯 Covers {share}% of your {goalProtein} g daily protein goal</T>
      </View>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background,
  },
  cell: { flexDirection: 'row', alignItems: 'center' },
  value: { fontFamily: FONT.bodyBold, fontSize: 15, fontVariant: ['tabular-nums'] },
  unit: { fontFamily: FONT.body, fontSize: 14 },
  divider: { width: 1, height: 18, backgroundColor: COLORS.border },
  per: { fontSize: 12, marginLeft: 'auto' },
  goal: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: COLORS.okSoft },
  goalText: { fontFamily: FONT.bodySemi, fontSize: 13, color: COLORS.ok },
});
