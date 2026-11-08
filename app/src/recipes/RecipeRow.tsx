import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Icon, T } from '@/components/ui';
import { COLORS, FONT, RADIUS } from '@/theme';
import { IngredientBar } from './IngredientBar';
import { NutritionLine } from './NutritionStrip';

/**
 * One Recipe in a list (Recipe Matches, Saved Recipes), laid out like the design's card: a rounded
 * photo, an "In Stock" pill, the title and time, then a footer with a "Cook Now" button.
 * `missing` and `have` are only given for Recipe Matches, where they say whether you can cook it now.
 */
export function RecipeRow({ id, name, minutes, cuisine, imageUrl, calories, proteinGrams, missing, have }: {
  id: string;
  name: string;
  minutes: number;
  cuisine: string;
  imageUrl?: string;
  calories?: number;
  proteinGrams?: number;
  missing?: string[];
  have?: number;
}) {
  const open = () => router.push({ pathname: '/recipe/[id]', params: { id } });
  const ready = missing?.length === 0;
  return (
    <Pressable accessibilityRole="button" onPress={open} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}>
      <View style={styles.top}>
        <View style={styles.photo}>
          {!!imageUrl && <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />}
        </View>
        <View style={styles.info}>
          <View style={styles.tags}>
            {missing && (
              <Badge
                tone={ready ? 'ready' : 'warn'}
                icon={ready ? 'check-circle' : undefined}
                label={ready ? 'In Stock' : `Missing ${missing.length}`}
              />
            )}
          </View>
          <T style={styles.name} numberOfLines={2}>{name}</T>
          <View style={styles.meta}>
            <Icon name="schedule" size={13} color={COLORS.outline} />
            <T dim style={styles.metaText} numberOfLines={1}>{minutes} mins • {cuisine === 'Other' ? 'Everyday cooking' : cuisine}</T>
          </View>
          <NutritionLine calories={calories} proteinGrams={proteinGrams} />
        </View>
      </View>
      <View style={styles.footer}>
        {missing && have !== undefined ? <IngredientBar have={have} total={have + missing.length} /> : <View style={{ flex: 1 }} />}
        <View style={styles.cook}>
          <T style={styles.cookText}>Cook Now</T>
          <Icon name="arrow-forward" size={16} color={COLORS.onPrimary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 14,
    shadowColor: COLORS.primary, shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  top: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  photo: { width: 96, height: 96, borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: COLORS.surfaceLow, borderWidth: 1, borderColor: COLORS.border },
  info: { flex: 1, minWidth: 0, gap: 4 },
  tags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 17, fontWeight: '700', lineHeight: 22, letterSpacing: -0.2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, flexShrink: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.chipBg },
  cook: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 8 },
  cookText: { color: COLORS.onPrimary, fontSize: 12, fontFamily: FONT.bold },
});
