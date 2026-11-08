import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, View,
  type StyleProp, type TextStyle, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, FONT } from '@/theme';

// Kept under their old names: other screens import these.
export const ACCENT = COLORS.primary;
export const WARN = COLORS.warnText;
export const DANGER = COLORS.danger;
export const CONFIRMED = COLORS.ok;

const BODY_BY_WEIGHT: Record<string, string> = {
  '400': FONT.body, '500': FONT.bodyMedium, '600': FONT.bodySemi, '700': FONT.bodyBold, '800': FONT.bodyBold, bold: FONT.bodyBold,
};
const HEAD_BY_WEIGHT: Record<string, string> = {
  '600': FONT.headSemi, '700': FONT.headBold, '800': FONT.headBold, bold: FONT.headBold,
};

/**
 * The app's text. Existing screens ask for a size and weight; this picks the
 * matching font file from them (custom fonts have one file per weight), and
 * uses Epilogue for headings (big and bold) and Manrope for everything else.
 */
export function T({ children, style, dim, numberOfLines }: {
  children: ReactNode; style?: StyleProp<TextStyle>; dim?: boolean; numberOfLines?: number;
}) {
  const flat = StyleSheet.flatten(style) ?? {};
  const weight = String(flat.fontWeight ?? '400');
  const heading = (flat.fontSize ?? 16) >= 18 && !!HEAD_BY_WEIGHT[weight];
  const fontFamily = flat.fontFamily ?? (heading ? HEAD_BY_WEIGHT[weight] : BODY_BY_WEIGHT[weight] ?? FONT.body);
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ color: COLORS.text, fontSize: 16 }, dim && { color: COLORS.muted }, style, { fontFamily, fontWeight: undefined }]}>
      {children}
    </Text>
  );
}

type Variant = 'primary' | 'secondary' | 'danger';

const BUTTON: Record<Variant, { bg: string; fg: string }> = {
  primary: { bg: COLORS.primary, fg: COLORS.onPrimary },
  secondary: { bg: COLORS.primarySoft, fg: COLORS.primary },
  danger: { bg: COLORS.dangerSoft, fg: COLORS.danger },
};

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
  const { bg, fg } = BUTTON[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [styles.button, { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 }, style]}>
      {busy ? <ActivityIndicator color={fg} /> : <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

/**
 * A screen with its own header, drawn below the status bar. The native header is
 * transparent on newer iOS and let content slide underneath it, so screens draw
 * their own and do not depend on it.
 */
export function Screen({ title, back, children }: { title: string; back?: boolean; children: ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top']}>
      <View style={styles.header}>
        {back ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={12} style={styles.headerBack}>
            <Text style={{ color: COLORS.primary, fontSize: 30, lineHeight: 32, fontFamily: FONT.bodyMedium }}>‹</Text>
          </Pressable>
        ) : (
          <View style={styles.headerBack} />
        )}
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.headerBack} />
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </SafeAreaView>
  );
}

export function Chip({ title, onPress, selected }: { title: string; onPress: () => void; selected?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: selected ? COLORS.primary : COLORS.border,
          backgroundColor: selected ? COLORS.primary : COLORS.card,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      <Text style={{ color: selected ? COLORS.onPrimary : COLORS.text, fontFamily: FONT.bodySemi, fontSize: 14 }}>{title}</Text>
    </Pressable>
  );
}

/** White surface with a hairline border and 16 px corners. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type Tone = 'solid' | 'ok' | 'protein' | 'warn' | 'neutral';

const BADGE: Record<Tone, { bg: string; fg: string; border?: string }> = {
  solid: { bg: COLORS.primary, fg: COLORS.onPrimary },
  ok: { bg: COLORS.okSoft, fg: COLORS.primary, border: '#BBF7D0' },
  protein: { bg: COLORS.proteinSoft, fg: COLORS.tertiary, border: COLORS.proteinBorder },
  warn: { bg: COLORS.warnSoft, fg: COLORS.warnText, border: '#FDE68A' },
  neutral: { bg: COLORS.chipBg, fg: COLORS.muted },
};

/** A small pill label, e.g. "High protein" or "2 missing". */
export function Badge({ label, tone = 'neutral', style }: { label: string; tone?: Tone; style?: StyleProp<ViewStyle> }) {
  const { bg, fg, border } = BADGE[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border ?? bg }, style]}>
      <Text style={{ color: fg, fontFamily: FONT.bodyBold, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10,
    backgroundColor: COLORS.card, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: COLORS.border,
  },
  headerBack: { width: 44, alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: FONT.headSemi, color: COLORS.text },
  button: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontFamily: FONT.bodyBold },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
});
