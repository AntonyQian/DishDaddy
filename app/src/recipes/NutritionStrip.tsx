import { StyleSheet } from 'react-native';

import { T } from '@/components/ui';

/** One quiet line under a recipe's title: "264 kcal · 5 g protein" per serving. Renders nothing when there is no data. */
export function NutritionLine({ calories, proteinGrams }: { calories?: number; proteinGrams?: number }) {
  const parts = [
    calories !== undefined ? `${calories} kcal` : null,
    proteinGrams !== undefined ? `${proteinGrams} g protein` : null,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return <T dim style={styles.line}>{parts.join(' · ')} per serving</T>;
}

const styles = StyleSheet.create({
  line: { fontSize: 12, fontVariant: ['tabular-nums'] },
});
