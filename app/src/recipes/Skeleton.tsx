import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { COLORS } from '@/theme';

/** A grey recipe card that gently pulses while recipes load. */
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
      <View style={styles.photo} />
      <View style={styles.body}>
        <View style={[styles.line, { width: '70%', height: 20 }]} />
        <View style={[styles.line, { width: '35%' }]} />
        <View style={[styles.line, { width: '100%', height: 36, borderRadius: 12 }]} />
        <View style={[styles.line, { width: '100%', height: 44, borderRadius: 22 }]} />
      </View>
    </Animated.View>
  );
}

export function RecipeListSkeleton() {
  return (
    <View style={{ padding: 16, gap: 16 }}>
      <RecipeCardSkeleton />
      <RecipeCardSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  photo: { height: 168, backgroundColor: COLORS.border },
  body: { padding: 16, gap: 10 },
  line: { height: 14, borderRadius: 7, backgroundColor: COLORS.border },
});
