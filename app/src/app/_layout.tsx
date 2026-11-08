import {
  PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold, useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ScanProvider } from '@/scan/ScanContext';
import { COLORS } from '@/theme';

// The design is light only, so screens that read the navigation theme get these colours too.
const THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.card,
    text: COLORS.text,
    border: COLORS.border,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold,
  });
  // Wait for the fonts, but never get stuck on a font that fails to load.
  if (!loaded && !error) return null;

  return (
    <ThemeProvider value={THEME}>
      <StatusBar style="dark" />
      <ScanProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="scan" />
          <Stack.Screen name="scanning" options={{ gestureEnabled: false }} />
          <Stack.Screen name="review" />
          <Stack.Screen name="recipe/[id]" />
          <Stack.Screen name="saved" />
          <Stack.Screen name="equipment" />
          <Stack.Screen name="staples" />
        </Stack>
      </ScanProvider>
    </ThemeProvider>
  );
}
