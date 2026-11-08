import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { COLORS, RADIUS } from '@/theme';

/** A grey recipe card, shaped like the real one, that gently pulses while recipes load. */
export function RecipeCardSkeleton() {
  const [pulse] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.card, { opacity: pulse }]}>
      <View style={styles.top}>
        <View style={styles.photo} />
        <View style={styles.lines}>
          <View style={[styles.line, { width: 70, height: 18 }]} />
          <View style={[styles.line, { width: '90%', height: 18 }]} />
          <View style={[styles.line, { width: '55%' }]} />
        </View>
      </View>
      <View style={[styles.line, { height: 36, borderRadius: 18 }]} />
    </Animated.View>
  );
}

export function RecipeListSkeleton() {
  return (
    <View style={{ padding: 20, gap: 24 }}>
      <RecipeCardSkeleton />
      <RecipeCardSkeleton />
      <RecipeCardSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 14 },
  top: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  photo: { width: 96, height: 96, borderRadius: RADIUS.lg, backgroundColor: COLORS.chipBg },
  lines: { flex: 1, gap: 8 },
  line: { height: 12, borderRadius: 6, backgroundColor: COLORS.chipBg },
});
