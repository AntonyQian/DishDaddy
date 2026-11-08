import { useTheme } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ACCENT, Screen, T } from '@/components/ui';
import { ALL_EQUIPMENT, loadEquipment, saveEquipment, toggleEquipment } from '@/lib/kitchen';

function EquipmentBody() {
  const { colors } = useTheme();
  const [equipment, setEquipment] = useState<string[] | null>(null);

  useEffect(() => {
    loadEquipment().then(setEquipment);
  }, []);

  if (!equipment) return null;

  const toggle = (item: string) => {
    const next = toggleEquipment(equipment, item);
    setEquipment(next);
    saveEquipment(next);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <T dim>Recipe Matches only use Equipment you have ticked.</T>
      {ALL_EQUIPMENT.map((item) => {
        const has = equipment.includes(item);
        return (
          <Pressable
            key={item}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: has }}
            onPress={() => toggle(item)}
            style={[styles.row, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <View style={[styles.box, { borderColor: has ? ACCENT : colors.border, backgroundColor: has ? ACCENT : 'transparent' }]}>
              {has && <T style={styles.tick}>✓</T>}
            </View>
            <T>{item}</T>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tick: { color: 'white', fontSize: 14, fontWeight: '700' },
});

export default function EquipmentScreen() {
  return (
    <Screen title="Equipment" back>
      <EquipmentBody />
    </Screen>
  );
}
