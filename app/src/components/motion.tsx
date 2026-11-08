// Motion for the app's black look: presses that spring and buzz, cards that rise in, numbers that count up.
// Built on Reanimated, which runs in Expo Go. On the web the haptics do nothing and the rest still animates.
import * as Haptics from 'expo-haptics';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { Platform, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeInDown, useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';

/** A light tap on the phone. Never throws: some devices have no haptics. */
export function tap() {
  if (Platform.OS === 'web') return; // the browser only allows vibration after a real tap, and desktops have none
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressProps = Omit<ComponentProps<typeof Pressable>, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** How far it shrinks while pressed. */
  to?: number;
  /** Buzz on press. On by default. */
  haptic?: boolean;
  /** Runs when the press starts, for effects like a sheen. */
  onPressStart?: () => void;
};

/** A Pressable that springs down when touched and back when let go, with a light tap. */
export function PressScale({ style, children, to = 0.95, haptic = true, onPressStart, onPressIn, onPressOut, onPress, ...rest }: PressProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        scale.value = withSpring(to, { damping: 14, stiffness: 420 });
        onPressStart?.();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 10, stiffness: 300 });
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) tap();
        onPress?.(e);
      }}
      style={[style, animated]}>
      {children}
    </AnimatedPressable>
  );
}

/** Rises and fades in. Pass the item's position so a list arrives one after another. */
export function FadeUp({ index = 0, children, style }: { index?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 70).duration(650).springify().damping(18)} style={style}>
      {children}
    </Animated.View>
  );
}

/** A number that counts up from 0 (or its last value) to `value`. */
export function useCountUp(value: number, ms = 900): number {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const from = shown;
    const start = Date.now();
    let frame = 0;
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (value - from) * eased));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // Only a new target restarts the count; `shown` is the starting point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, ms]);
  return shown;
}

/** A bar fill whose width glides to `fraction` (0 to 1) instead of jumping. Give it height and colour in `style`. */
export function ProgressFill({ fraction, style }: { fraction: number; style?: StyleProp<ViewStyle> }) {
  const f = useSharedValue(fraction);
  useEffect(() => {
    f.value = withSpring(fraction, { damping: 18, stiffness: 140 });
  }, [fraction, f]);
  const animated = useAnimatedStyle(() => ({ width: `${f.value * 100}%` }));
  return <Animated.View style={[style, animated]} />;
}
