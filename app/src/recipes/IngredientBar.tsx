import { StyleSheet, View } from 'react-native';

import { T } from '@/components/ui';
import { COLORS, FONT } from '@/theme';

/** "You have 5 of 7 ingredients" with a thin bar, in the design's small label style. */
export function IngredientBar({ have, total }: { have: number; total: number }) {
  if (total <= 0) return null;
  return (
    <View style={styles.wrap}>
      <T style={styles.label} numberOfLines={1}>
        You have <T style={styles.count}>{have} of {total}</T> ingredients
      </T>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, (have / total) * 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: 6, paddingRight: 12 },
  label: { fontSize: 11, fontFamily: FONT.bold, color: COLORS.muted },
  count: { fontSize: 11, fontFamily: FONT.extra, color: COLORS.primary },
  track: { height: 5, borderRadius: 3, backgroundColor: COLORS.chipBg, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3, backgroundColor: COLORS.primary },
});
