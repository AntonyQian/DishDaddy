import { StyleSheet, View } from 'react-native';

import { T } from '@/components/ui';
import { COLORS, FONT } from '@/theme';

/** "You have 5 of 7 ingredients" with a bar; green when you have them all. */
export function IngredientBar({ have, total }: { have: number; total: number }) {
  if (total <= 0) return null;
  const complete = have >= total;
  return (
    <View style={styles.wrap}>
      <T style={styles.label}>
        You have <T style={[styles.count, { color: complete ? COLORS.ok : COLORS.text }]}>{have} of {total}</T> ingredients
      </T>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, (have / total) * 100)}%`, backgroundColor: complete ? COLORS.ok : COLORS.sage }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, color: COLORS.muted },
  count: { fontFamily: FONT.bodyBold, fontSize: 13 },
  track: { height: 6, borderRadius: 3, backgroundColor: COLORS.border, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
