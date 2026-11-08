import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, T } from '@/components/ui';
import { COLORS, FONT } from '@/theme';
import { NutritionStrip } from './NutritionStrip';

/**
 * One Recipe in a list (Recipe Matches, Saved Recipes) as a photo card; tapping it opens the Recipe.
 * `missing` is only given for Recipe Matches, where it says whether the user can cook it now.
 */
export function RecipeRow({ id, name, minutes, cuisine, imageUrl, calories, proteinGrams, highProtein, missing }: {
  id: string;
  name: string;
  minutes: number;
  cuisine: string;
  imageUrl?: string;
  calories?: number;
  proteinGrams?: number;
  highProtein?: boolean;
  missing?: string[];
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/recipe/[id]', params: { id } })}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}>
      <View style={styles.photo}>
        {!!imageUrl && <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />}
        {missing && (
          <Badge
            style={styles.topLeft}
            tone={missing.length === 0 ? 'solid' : 'warn'}
            label={missing.length === 0 ? 'Nothing missing' : `${missing.length} missing`}
          />
        )}
        {highProtein && <Badge style={styles.topRight} tone="protein" label="High protein" />}
        <View style={styles.time}>
          <Text style={styles.timeText}>⏱ {minutes} min</Text>
        </View>
      </View>

      <View style={styles.body}>
        <T style={styles.name}>{name}</T>
        <T dim style={styles.cuisine}>{cuisine === 'Other' ? 'Everyday cooking' : `${cuisine} cooking`}</T>
        <NutritionStrip calories={calories} proteinGrams={proteinGrams} />
        {!!missing?.length && (
          <T dim style={styles.missing}>
            Missing: {missing.slice(0, 3).join(', ')}{missing.length > 3 ? ` +${missing.length - 3} more` : ''}
          </T>
        )}
        <View style={styles.cta}>
          <Text style={styles.ctaText}>View recipe  →</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  photo: { height: 168, backgroundColor: COLORS.primarySoft },
  topLeft: { position: 'absolute', top: 12, left: 12 },
  topRight: { position: 'absolute', top: 12, right: 12 },
  time: {
    position: 'absolute', right: 12, bottom: 12, backgroundColor: 'rgba(31,41,55,0.78)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  timeText: { color: 'white', fontFamily: FONT.bodySemi, fontSize: 12 },
  body: { padding: 16, gap: 10 },
  name: { fontSize: 19, fontWeight: '700' },
  cuisine: { fontSize: 14, marginTop: -6 },
  missing: { fontSize: 13 },
  cta: { backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  ctaText: { color: COLORS.onPrimary, fontFamily: FONT.bodyBold, fontSize: 15 },
});
