import { Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';

/** Kitchen, Scan, Recipes and Goals. Everything else (Review, a Recipe, Staples…) opens on top of these. */
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Kitchen' }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
      <Tabs.Screen name="recipes" options={{ title: 'Recipes' }} />
      <Tabs.Screen name="goals" options={{ title: 'Goals' }} />
    </Tabs>
  );
}
