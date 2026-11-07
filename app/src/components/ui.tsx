import { useTheme } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

export const ACCENT = '#208AEF';
export const WARN = '#C77700';
export const DANGER = '#D93025';
export const CONFIRMED = '#1E9E5A';

export function T({ children, style, dim }: { children: ReactNode; style?: StyleProp<TextStyle>; dim?: boolean }) {
  const { colors } = useTheme();
  return <Text style={[{ color: colors.text, fontSize: 16 }, dim && { opacity: 0.6 }, style]}>{children}</Text>;
}

type Variant = 'primary' | 'secondary' | 'danger';

export function Button({
  title, onPress, variant = 'primary', disabled, busy, style,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const bg = variant === 'primary' ? ACCENT : variant === 'danger' ? DANGER : colors.card;
  const fg = variant === 'secondary' ? colors.text : 'white';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: colors.border, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        style,
      ]}>
      {busy ? <ActivityIndicator color={fg} /> : <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function Chip({ title, onPress, selected }: { title: string; onPress: () => void; selected?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { borderColor: selected ? ACCENT : colors.border, backgroundColor: selected ? ACCENT : colors.card, opacity: pressed ? 0.7 : 1 },
      ]}>
      <Text style={{ color: selected ? 'white' : colors.text, fontWeight: '500' }}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center',
    justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
});
