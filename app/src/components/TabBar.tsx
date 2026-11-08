import { MaterialIcons } from '@expo/vector-icons';
import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { PressScale } from '@/components/motion';

import { COLORS, FONT } from '@/theme';

// expo-router does not export the tab bar's props type, so take it from the Tabs component.
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

type IconName = keyof typeof MaterialIcons.glyphMap;

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Kitchen', icon: 'kitchen' },
  recipes: { label: 'Recipes', icon: 'menu-book' },
  cook: { label: 'Cook Mode', icon: 'soup-kitchen' },
};

/** The floating pill bar: near-black glass, rounded, with the current tab as a solid indigo pill. */
export function TabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const tabs = state.routes.filter((r) => TABS[r.name]);
  const [width, setWidth] = useState(0);
  const slot = width / Math.max(1, tabs.length);
  const current = Math.max(0, tabs.findIndex((r) => r.key === state.routes[state.index]?.key));
  // The indigo pill glides to the chosen tab instead of jumping.
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withSpring(current * slot, { damping: 16, stiffness: 190, mass: 0.8 });
  }, [current, slot, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        <View style={styles.track} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {width > 0 && <Animated.View pointerEvents="none" style={[styles.pill, { width: slot }, pill]} />}
          {tabs.map((route, n) => {
            const tab = TABS[route.name];
            const focused = current === n;
            const onPress = () => {
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigateToTab(route.key);
            };
            return (
              <PressScale
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={tab.label}
                onPress={onPress}
                to={0.9}
                style={styles.item}>
                <MaterialIcons name={tab.icon} size={24} color={focused ? COLORS.onPrimary : COLORS.muted} />
                <Text style={[styles.label, { color: focused ? COLORS.onPrimary : COLORS.muted }]}>{tab.label}</Text>
              </PressScale>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 20 },
  bar: {
    width: '100%', maxWidth: 440,
    paddingHorizontal: 6, paddingVertical: 4, backgroundColor: COLORS.floating, borderRadius: 999,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: COLORS.primaryContainer, shadowOpacity: 0.35, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  track: { flexDirection: 'row', width: '100%' },
  pill: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 999, backgroundColor: COLORS.primary },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderRadius: 999 },
  label: { fontFamily: FONT.bold, fontSize: 11, marginTop: 2 },
});
