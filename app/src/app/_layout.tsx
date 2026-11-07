import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { ScanProvider } from '@/scan/ScanContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ScanProvider>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Fridge to Recipe' }} />
          <Stack.Screen name="scan" options={{ title: 'Scan' }} />
          <Stack.Screen name="scanning" options={{ title: 'Checking photos', headerBackVisible: false, gestureEnabled: false }} />
          <Stack.Screen name="review" options={{ title: 'Review' }} />
        </Stack>
      </ScanProvider>
    </ThemeProvider>
  );
}
