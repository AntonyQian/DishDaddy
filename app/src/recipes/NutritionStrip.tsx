import { StyleSheet, View } from 'react-native';

import { T } from '@/components/ui';
import { portionNutrition } from './scale';

const text = (n: { calories?: number; proteinGrams?: number }) =>
  [n.calories !== undefined ? `${n.calories} kcal` : null, n.proteinGrams !== undefined ? `${n.proteinGrams} g protein` : null]
    .filter(Boolean)
    .join(' · ');

/**
 * Calories and protein under a recipe's title. The numbers in the data are per serving.
 * Without `servings` the line says "per serving"; with it, the line shows the total for that many
 * servings, and says what one serving is when there are several.
 */
export function NutritionLine({ calories, proteinGrams, servings }: { calories?: number; proteinGrams?: number; servings?: number }) {
  const each = { calories, proteinGrams };
  if (!text(each)) return null;
  if (servings === undefined) return <T dim style={styles.line}>{text(each)} per serving</T>;

  return (
    <View style={{ gap: 2 }}>
      <T style={styles.total}>
        {text(portionNutrition(each, servings))} <T dim style={styles.line}>for {servings} {servings === 1 ? 'serving' : 'servings'}</T>
      </T>
      {servings > 1 && <T dim style={styles.line}>{text(each)} per serving</T>}
    </View>
  );
}

const styles = StyleSheet.create({
  line: { fontSize: 12, fontVariant: ['tabular-nums'] },
  total: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
