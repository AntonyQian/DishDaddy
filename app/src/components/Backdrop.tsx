import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { COLORS } from '@/theme';

const GLOW = require('../../assets/images/glow.png');

/** Eases back and forth between 0 and 1 forever, so a glow drifts instead of sitting still. */
function useDrift(ms: number) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: ms, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [ms, t]);
  return t;
}

/** The page background: black with two soft indigo glows drifting slowly, as on the website. Sits behind a screen's content. */
export function Backdrop() {
  const a = useDrift(9000);
  const b = useDrift(12000);
  const first = useAnimatedStyle(() => ({ transform: [{ translateX: a.value * 70 }, { translateY: a.value * 50 }, { scale: 1 + a.value * 0.15 }] }));
  const second = useAnimatedStyle(() => ({ transform: [{ translateX: b.value * -80 }, { translateY: b.value * -60 }, { scale: 1.1 - b.value * 0.12 }] }));
  return (
    <View pointerEvents="none" style={styles.fill}>
      <Animated.View style={[styles.glow, { top: -180, left: -200, width: 520, height: 520, opacity: 0.7 }, first]}>
        <Image source={GLOW} contentFit="fill" style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[styles.glow, { top: 260, right: -260, width: 560, height: 560, opacity: 0.4 }, second]}>
        <Image source={GLOW} contentFit="fill" style={StyleSheet.absoluteFill} tintColor="#8A5BD6" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: COLORS.background, overflow: 'hidden' },
  glow: { position: 'absolute' },
});
