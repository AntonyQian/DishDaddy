import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { COLORS } from '@/theme';

const GLOW = require('../../assets/images/glow.png');

/** The page background: black with two soft indigo glows, as on the website. Sits behind a screen's content. */
export function Backdrop() {
  return (
    <View pointerEvents="none" style={styles.fill}>
      <Image source={GLOW} contentFit="fill" style={[styles.glow, { top: -180, left: -200, width: 520, height: 520, opacity: 0.7 }]} />
      <Image source={GLOW} contentFit="fill" style={[styles.glow, { top: 260, right: -260, width: 560, height: 560, opacity: 0.4, tintColor: '#8A5BD6' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: COLORS.background, overflow: 'hidden' },
  glow: { position: 'absolute' },
});
