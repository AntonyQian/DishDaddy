import { Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';

/** Kitchen, Recipes and Cook Mode, as in the design. Scan, Review, a Recipe, Staples… open on top of these. */
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Kitchen' }} />
      <Tabs.Screen name="recipes" options={{ title: 'Recipes' }} />
      <Tabs.Screen name="cook" options={{ title: 'Cook Mode' }} />
    </Tabs>
  );
}
