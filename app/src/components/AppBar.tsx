import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { COLORS, FONT } from '@/theme';

/** The top bar of the three tab screens: the chef avatar, the app name and a line under it, as in the design. */
export function AppBar({ title = 'DishDaddy', subtitle }: { title?: string; subtitle?: string }) {
  return (
    <View style={styles.bar}>
      <View style={styles.avatar}>
        <Text style={{ fontSize: 22 }}>🧑‍🍳</Text>
      </View>
      <View>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

/** A tab screen: the app bar, then the content, drawn below the status bar. */
export function TabScreen({ title, subtitle, children }: { title?: string; subtitle?: string; children: ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top']}>
      <AppBar title={title} subtitle={subtitle} />
      <View style={{ flex: 1 }}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 8 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primarySoft, borderWidth: 2, borderColor: COLORS.primary,
  },
  title: { fontFamily: FONT.extra, fontSize: 22, color: COLORS.text, letterSpacing: -0.4 },
  subtitle: { fontFamily: FONT.bold, fontSize: 11, color: COLORS.primary },
});
