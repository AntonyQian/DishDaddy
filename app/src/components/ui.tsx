import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, View,
  type StyleProp, type TextStyle, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { goBack } from '@/lib/navigation';
import { COLORS, FONT, RADIUS } from '@/theme';

// Kept under their old names: other screens import these.
export const ACCENT = COLORS.primary;
export const WARN = COLORS.warnText;
export const DANGER = COLORS.danger;
export const CONFIRMED = COLORS.ok;

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

export function Icon({ name, size = 22, color = COLORS.text }: { name: IconName; size?: number; color?: string }) {
  return <MaterialIcons name={name} size={size} color={color} />;
}

const FONT_BY_WEIGHT: Record<string, string> = {
  '400': FONT.medium, '500': FONT.medium, '600': FONT.semi, '700': FONT.bold, '800': FONT.extra, '900': FONT.extra, bold: FONT.bold,
};

/**
 * The app's text, always Plus Jakarta Sans. Screens ask for a size and weight; this picks the
 * matching font file (custom fonts have one file per weight). Body text is medium, as in the design.
 */
export function T({ children, style, dim, numberOfLines }: {
  children: ReactNode; style?: StyleProp<TextStyle>; dim?: boolean; numberOfLines?: number;
}) {
  const flat = StyleSheet.flatten(style) ?? {};
  const fontFamily = flat.fontFamily ?? FONT_BY_WEIGHT[String(flat.fontWeight ?? '400')] ?? FONT.medium;
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ color: COLORS.text, fontSize: 16 }, dim && { color: COLORS.muted }, style, { fontFamily, fontWeight: undefined }]}>
      {children}
    </Text>
  );
}

type Variant = 'primary' | 'secondary' | 'danger';

const BUTTON: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: COLORS.primary, fg: COLORS.onPrimary },
  secondary: { bg: COLORS.surfaceLow, fg: COLORS.text, border: COLORS.border },
  danger: { bg: COLORS.dangerSoft, fg: COLORS.danger },
};

export function Button({
  title, onPress, variant = 'primary', disabled, busy, style, icon,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Trailing icon, e.g. an arrow. */
  icon?: IconName;
}) {
  const { bg, fg, border } = BUTTON[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: border ?? bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}>
      {busy ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.buttonRow}>
          <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
          {icon && <Icon name={icon} size={20} color={fg} />}
        </View>
      )}
    </Pressable>
  );
}

/** A round 44 px icon button, like the design's back and bookmark buttons. */
export function RoundButton({ icon, label, onPress, active }: { icon: IconName; label: string; onPress: () => void; active?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.round, active && { backgroundColor: COLORS.primarySoft }, pressed && { transform: [{ scale: 0.93 }] }]}>
      <Icon name={icon} size={22} color={active ? COLORS.primary : COLORS.text} />
    </Pressable>
  );
}

/**
 * A sub-screen with its own header, drawn below the status bar: a round back button, a small
 * eyebrow, and a title, as on the design's recipe screen. The native header is transparent on
 * newer iOS and let content slide underneath it, so screens draw their own.
 */
export function Screen({ title, eyebrow, back, right, children }: {
  title: string; eyebrow?: string; back?: boolean; right?: ReactNode; children: ReactNode;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerSide}>
          {back && <RoundButton icon="arrow-back" label="Back" onPress={() => goBack()} />}
        </View>
        <View style={styles.headerCenter}>
          {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        </View>
        <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>{right}</View>
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </SafeAreaView>
  );
}

/** A filter pill, with an optional count: the active one is solid indigo, the others white. */
export function Chip({ title, onPress, selected, count }: { title: string; onPress: () => void; selected?: boolean; count?: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipOn : styles.chipOff,
        { opacity: pressed ? 0.85 : 1 },
      ]}>
      <Text style={{ color: selected ? COLORS.onPrimary : COLORS.text, fontFamily: FONT.semi, fontSize: 13 }}>{title}</Text>
      {count !== undefined && (
        <View style={[styles.count, { backgroundColor: selected ? COLORS.primaryContainer : COLORS.chipBg }]}>
          <Text style={{ color: selected ? COLORS.onPrimary : COLORS.muted, fontFamily: FONT.bold, fontSize: 11 }}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

/** White surface with a hairline border and the design's 32 px corners. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type Tone = 'solid' | 'ready' | 'ok' | 'protein' | 'warn' | 'neutral';

const BADGE: Record<Tone, { bg: string; fg: string }> = {
  solid: { bg: COLORS.primary, fg: COLORS.onPrimary },
  ready: { bg: COLORS.primarySoft, fg: COLORS.primary },
  ok: { bg: COLORS.okSoft, fg: COLORS.ok },
  protein: { bg: COLORS.chipBg, fg: COLORS.gold },
  warn: { bg: COLORS.warnSoft, fg: COLORS.warnText },
  neutral: { bg: COLORS.chipBg, fg: COLORS.muted },
};

/** A small pill label such as "In Stock" or "Missing 2", with an optional leading icon. */
export function Badge({ label, tone = 'neutral', icon, style }: { label: string; tone?: Tone; icon?: IconName; style?: StyleProp<ViewStyle> }) {
  const { bg, fg } = BADGE[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {icon && <Icon name={icon} size={12} color={fg} />}
      <Text style={{ color: fg, fontFamily: FONT.bold, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

/** A friendly empty state: what is missing, why, and the one thing to do about it. */
export function EmptyState({ title, text, action }: { title: string; text: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Text style={{ fontSize: 34 }}>🥗</Text>
      </View>
      <T style={styles.emptyTitle}>{title}</T>
      <T dim style={styles.emptyText}>{text}</T>
      {action && <Button title={action.label} onPress={action.onPress} style={{ alignSelf: 'stretch', marginTop: 8 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, backgroundColor: COLORS.background },
  headerSide: { width: 48, justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  eyebrow: { fontFamily: FONT.bold, fontSize: 11, letterSpacing: 0.8, color: COLORS.primary, textTransform: 'uppercase' },
  headerTitle: { fontSize: 18, fontFamily: FONT.bold, color: COLORS.text },
  round: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
  },
  button: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { fontSize: 15, fontFamily: FONT.bold },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: RADIUS.full, borderWidth: 1 },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipOff: { backgroundColor: COLORS.card, borderColor: COLORS.border },
  count: { minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.full },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  emptyText: { textAlign: 'center', fontSize: 15 },
});
