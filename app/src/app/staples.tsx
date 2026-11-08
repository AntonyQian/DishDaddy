import { useTheme } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { DANGER, Screen, T } from '@/components/ui';
import { addStaple, DEFAULT_STAPLES, loadStaples, removeStaple, saveStaples } from '@/lib/kitchen';
import { useIngredientList } from '@/lib/useIngredientList';
import { IngredientInput } from '@/review/components';

function StaplesBody() {
  const { colors } = useTheme();
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
      {staples.map((s) => (
        <View key={s} style={[styles.row, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <T style={{ flex: 1 }}>{s}</T>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${s}`}
            hitSlop={12}
            onPress={() => update(removeStaple(staples, s))}>
            <T style={{ color: DANGER, fontWeight: '600' }}>Remove</T>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
});

export default function StaplesScreen() {
  return (
    <Screen title="Staples" back>
      <StaplesBody />
    </Screen>
  );
}
