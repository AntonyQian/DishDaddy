import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, FONT } from '@/theme';

// expo-router does not export the tab bar's props type, so take it from the Tabs component.
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Kitchen', icon: 'fridge-outline' },
  scan: { label: 'Scan', icon: 'barcode-scan' },
  recipes: { label: 'Recipes', icon: 'book-open-page-variant-outline' },
  goals: { label: 'Goals', icon: 'target' },
};

/** The design's bottom bar: the current tab is a green pill, the others quiet icons with labels. */
export function TabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, i) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === i;
        const onPress = () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={onPress}
            style={styles.item}>
            <View style={[styles.pill, focused && styles.pillActive]}>
              <MaterialCommunityIcons name={tab.icon} size={24} color={focused ? COLORS.onPrimary : COLORS.muted} />
              <Text style={[styles.label, { color: focused ? COLORS.onPrimary : COLORS.muted }]}>{tab.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: COLORS.card, paddingTop: 8, paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border,
    shadowColor: COLORS.text, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 8,
  },
  item: { flex: 1, alignItems: 'center' },
  pill: { alignItems: 'center', gap: 2, minWidth: 68, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  pillActive: { backgroundColor: COLORS.primary },
  label: { fontFamily: FONT.bodySemi, fontSize: 11, letterSpacing: 0.3 },
});
