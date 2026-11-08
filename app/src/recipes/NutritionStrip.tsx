import { StyleSheet, View } from 'react-native';

import { T } from '@/components/ui';
import { COLORS, FONT } from '@/theme';

/** Calories and protein per serving, as in the design. Renders nothing when the Recipe has neither. */
export function NutritionStrip({ calories, proteinGrams }: { calories?: number; proteinGrams?: number }) {
  if (calories === undefined && proteinGrams === undefined) return null;
  return (
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
});
