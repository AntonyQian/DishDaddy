import { router, useTheme } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { T } from '@/components/ui';

/** One Recipe in a list (Recipe Matches, Saved Recipes); tapping it opens the Recipe. `badge` leads the meta line. */
export function RecipeRow({ id, name, minutes, cuisine, badge }: {
  id: string; name: string; minutes: number; cuisine: string; badge?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/recipe/[id]', params: { id } })}
      style={({ pressed }) => [styles.row, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}>
      <T style={styles.name}>{name}</T>
      <View style={styles.meta}>
        {badge}
        <T dim>{minutes} min</T>
        <T dim>{cuisine}</T>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { padding: 14, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, gap: 6 },
  name: { fontSize: 17, fontWeight: '600' },
  meta: { flexDirection: 'row', gap: 16 },
});
