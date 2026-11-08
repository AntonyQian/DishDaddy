import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { ScanProvider } from '@/scan/ScanContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ScanProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="scan" />
          <Stack.Screen name="scanning" options={{ gestureEnabled: false }} />
          <Stack.Screen name="review" />
          <Stack.Screen name="equipment" />
          <Stack.Screen name="staples" />
        </Stack>
      </ScanProvider>
    </ThemeProvider>
  );
}
