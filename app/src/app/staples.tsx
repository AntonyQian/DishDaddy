import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Badge, DANGER, Icon, Screen, T } from '@/components/ui';
import { addStaple, DEFAULT_STAPLES, loadStaples, removeStaple, saveStaples } from '@/lib/kitchen';
import { groupStaples } from '@/lib/staples';
import { useIngredientList } from '@/lib/useIngredientList';
import { IngredientInput } from '@/review/components';
import { COLORS, RADIUS } from '@/theme';

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function StaplesBody() {
  const vocabulary = useIngredientList();
  const [staples, setStaples] = useState<string[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    loadStaples().then(
      (s) => live && setStaples(s),
      () => {
        if (!live) return;
        setStaples([...DEFAULT_STAPLES]);
        setProblem('Could not load your Staples, so the defaults are shown.');
      },
    );
    return () => { live = false; };
  }, []);

  if (!staples) return null;

  const update = (next: string[]) => {
    setStaples(next);
    saveStaples(next).then(
      () => setProblem(null),
      () => setProblem('Could not save your Staples on this device.'),
    );
  };

  const groups = groupStaples(staples);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <T dim>Staples are things you always have. Recipe Matches never list them as missing.</T>
      {!!problem && <T style={{ color: DANGER }}>{problem}</T>}
      <IngredientInput
        vocabulary={vocabulary}
        placeholder="Add a Staple"
        onSubmit={(name) => update(addStaple(staples, name))}
      />
      {staples.length === 0 && <T dim>No Staples yet.</T>}
      {groups.map(([group, items]) => (
        <View key={group} style={styles.group}>
          <View style={styles.groupHead}>
            <T style={styles.groupTitle}>{group}</T>
            <Badge label={String(items.length)} tone="neutral" />
          </View>
          <View style={styles.card}>
            {items.map((s, n) => (
              <View key={s} style={[styles.row, n > 0 && styles.rowBorder]}>
                <T style={styles.name}>{capital(s)}</T>
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${s}`} hitSlop={10} onPress={() => update(removeStaple(staples, s))}>
                  <Icon name="delete-outline" size={20} color={COLORS.outline} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  group: { gap: 8 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupTitle: { fontSize: 18, fontWeight: '700' },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: COLORS.chipBg },
  name: { fontSize: 15, fontWeight: '600', flex: 1 },
});

export default function StaplesScreen() {
  return (
    <Screen title="Staples" back>
      <StaplesBody />
    </Screen>
  );
}
