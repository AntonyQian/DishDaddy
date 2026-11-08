import { MaterialIcons } from '@expo/vector-icons';
import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, FONT } from '@/theme';

// expo-router does not export the tab bar's props type, so take it from the Tabs component.
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

type IconName = keyof typeof MaterialIcons.glyphMap;

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Kitchen', icon: 'kitchen' },
  recipes: { label: 'Recipes', icon: 'menu-book' },
  cook: { label: 'Cook Mode', icon: 'soup-kitchen' },
};

/** The design's floating pill bar: white, rounded, with the current tab as a solid indigo pill. */
export function TabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
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
              style={[styles.item, focused && styles.itemActive]}>
              <MaterialIcons name={tab.icon} size={24} color={focused ? COLORS.onPrimary : COLORS.muted} />
              <Text style={[styles.label, { color: focused ? COLORS.onPrimary : COLORS.muted }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 20 },
  bar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%', maxWidth: 440,
    paddingHorizontal: 12, paddingVertical: 4, backgroundColor: COLORS.card, borderRadius: 999,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: COLORS.primary, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  item: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 6, borderRadius: 999, minWidth: 84 },
  itemActive: { backgroundColor: COLORS.primary },
  label: { fontFamily: FONT.bold, fontSize: 11, marginTop: 2 },
});
