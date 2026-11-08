import type { RecipeMatch } from '@fridge/shared';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '@/components/AppBar';
import { Badge, Chip, Icon, T } from '@/components/ui';
import { getHealth, searchRecipes } from '@/lib/api';
import { MOCK_SCAN, SERVER_URL } from '@/lib/config';
import { loadEquipment, loadStaples } from '@/lib/kitchen';
import { loadLatestScan, type LatestScan } from '@/lib/latestScan';
import { categoriesOf, categoryOf, emojiFor, type Category } from '@/lib/pantry';
import { loadSearchRequest } from '@/recipes/available';
import { useScan } from '@/scan/ScanContext';
import { COLORS, FONT, RADIUS } from '@/theme';

/** One confirmed Ingredient as a tile: a picture, its name and group, and a shortcut to Recipes. */
function PantryTile({ ingredient }: { ingredient: string }) {
  return (
    <View style={styles.tile}>
      <Badge label={categoryOf(ingredient)} tone="neutral" />
      <View style={styles.tilePicture}>
        <View style={styles.tileCircle}>
          <T style={{ fontSize: 40 }}>{emojiFor(ingredient)}</T>
        </View>
      </View>
      <T style={styles.tileName} numberOfLines={2}>{ingredient}</T>
      <Pressable accessibilityRole="button" onPress={() => router.navigate('/recipes')} style={styles.tileButton}>
        <Icon name="soup-kitchen" size={14} color={COLORS.text} />
        <T style={styles.tileButtonText}>Recipes</T>
      </Pressable>
    </View>
  );
}

function LinkRow({ icon, title, caption, to }: { icon: 'kitchen' | 'bookmark' | 'tune'; title: string; caption: string; to: '/staples' | '/equipment' | '/saved' }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(to)} style={({ pressed }) => [styles.link, pressed && { opacity: 0.9 }]}>
      <View style={styles.linkIcon}>
        <Icon name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <T style={styles.linkTitle}>{title}</T>
        <T dim style={styles.linkCaption}>{caption}</T>
      </View>
      <Icon name="chevron-right" size={22} color={COLORS.outline} />
    </Pressable>
  );
}

export default function KitchenScreen() {
  const scan = useScan();
  const [latest, setLatest] = useState<LatestScan | null>(null);
  const [staples, setStaples] = useState(0);
  const [equipment, setEquipment] = useState(0);
  const [suggestion, setSuggestion] = useState<RecipeMatch | null>(null);
  const [server, setServer] = useState<'checking' | 'ok' | 'down'>('checking');
  const [category, setCategory] = useState<Category | 'All'>('All');

  useFocusEffect(
    useCallback(() => {
      loadLatestScan()
        .then((l) => {
          setLatest(l);
          if (!l || l.ingredients.length === 0) return setSuggestion(null);
          return loadSearchRequest()
            .then(searchRecipes)
            .then((matches) => setSuggestion(matches.find((m) => m.missing.length === 0) ?? null));
        })
        .catch(() => {
          setLatest(null);
          setSuggestion(null);
        });
      loadStaples().then((s) => setStaples(s.length), () => {});
      loadEquipment().then((e) => setEquipment(e.length), () => {});
      getHealth().then(() => setServer('ok'), () => setServer('down'));
    }, []),
  );

  const startScan = () => {
    const begin = () => {
      scan.reset();
      router.push('/scan');
    };
    if (scan.photos.length === 0) return begin();
    Alert.alert('Start a new Scan?', `Your ${scan.photos.length} photos from the current Scan will be dropped.`, [
      { text: 'Keep them', style: 'cancel' },
      { text: 'Start new', style: 'destructive', onPress: begin },
    ]);
  };

  const ingredients = latest?.ingredients ?? [];
  const groups = categoriesOf(ingredients);
  const shown = category === 'All' ? ingredients : ingredients.filter((i) => categoryOf(i) === category);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <AppBar title="Hi, Chef!" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ gap: 4 }}>
          <View style={styles.eyebrow}>
            <Icon name="kitchen" size={15} color={COLORS.primary} />
            <T style={styles.eyebrowText}>Smart Pantry</T>
          </View>
          <T style={styles.h1}>What are we cooking today?</T>
        </View>

        <View style={styles.hero}>
          <View style={{ flex: 1 }}>
            <T style={styles.heroLabel}>AI VISION RESTOCK</T>
            <T style={styles.heroTitle}>Quick Scan Pantry</T>
            <T style={styles.heroText}>Snap your fridge or shelf to update stock in seconds.</T>
            <View style={styles.heroRow}>
              <Pressable accessibilityRole="button" onPress={startScan} style={({ pressed }) => [styles.scanButton, pressed && { opacity: 0.9 }]}>
                <Icon name="photo-camera" size={18} color={COLORS.primary} />
                <T style={styles.scanButtonText}>Scan Now</T>
              </Pressable>
              <T style={styles.heroCount}>{ingredients.length} in stock</T>
            </View>
            {scan.photos.length > 0 && (
              <Pressable accessibilityRole="button" onPress={() => router.push('/scan')} style={{ marginTop: 10 }}>
                <T style={styles.continue}>Continue Scan ({scan.photos.length} photos) →</T>
              </Pressable>
            )}
          </View>
          <View style={styles.heroArt}>
            <MaterialCommunityIcons name="fridge-outline" size={56} color={COLORS.onPrimaryMuted} />
          </View>
        </View>

        {ingredients.length === 0 ? (
          <View style={styles.empty}>
            <T style={{ fontSize: 36 }}>🥗</T>
            <T style={styles.emptyTitle}>Your kitchen is empty</T>
            <T dim style={styles.emptyText}>Scan your fridge and what we find shows up here.</T>
          </View>
        ) : (
          <>
            <View style={{ gap: 8 }}>
              <T style={styles.sectionTitle}>Categories</T>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
                <Chip title="All" count={ingredients.length} selected={category === 'All'} onPress={() => setCategory('All')} />
                {groups.map(([c, n]) => (
                  <Chip key={c} title={c} count={n} selected={category === c} onPress={() => setCategory(c)} />
                ))}
              </ScrollView>
            </View>

            <View style={{ gap: 8 }}>
              <T style={styles.sectionTitle}>Fresh in Stock</T>
              <View style={styles.grid}>
                {shown.map((i) => (
                  <PantryTile key={i} ingredient={i} />
                ))}
              </View>
            </View>
          </>
        )}

        {suggestion && (
          <View style={styles.chef}>
            <View style={styles.chefIcon}>
              <Icon name="lightbulb" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <T style={styles.chefTitle}>Chef Suggestion</T>
              <T dim style={styles.chefText} numberOfLines={2}>
                {suggestion.name} in {suggestion.minutes} mins
              </T>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: suggestion.recipeId } })}
              style={styles.chefButton}>
              <T style={styles.chefButtonText}>Cook Now</T>
            </Pressable>
          </View>
        )}

        <View style={{ gap: 8 }}>
          <T style={styles.sectionTitle}>Your kitchen</T>
          <LinkRow icon="kitchen" title="Staples" caption={`${staples} always on hand`} to="/staples" />
          <LinkRow icon="tune" title="Equipment" caption={`${equipment} appliances you cook with`} to="/equipment" />
          <LinkRow icon="bookmark" title="Saved Recipes" caption="Cook these again" to="/saved" />
        </View>

        <T dim style={styles.status}>
          Server {SERVER_URL}: {server === 'checking' ? 'checking…' : server === 'ok' ? 'connected' : 'not reachable'}
          {MOCK_SCAN ? ' (mock Scans on)' : ''}
        </T>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 130, gap: 24 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrowText: { fontSize: 11, fontWeight: '700', color: COLORS.muted },
  h1: { fontSize: 30, fontWeight: '800', lineHeight: 38, letterSpacing: -0.6 },
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl,
    shadowColor: COLORS.primary, shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  heroLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: COLORS.onPrimaryMuted },
  heroTitle: { fontSize: 22, fontWeight: '700', color: COLORS.onPrimary, marginTop: 2 },
  heroText: { fontSize: 12, color: COLORS.onPrimaryMuted, marginTop: 4 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  scanButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.card, borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 9 },
  scanButtonText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  heroCount: { fontSize: 11, fontWeight: '700', color: COLORS.onPrimaryMuted },
  continue: { fontSize: 12, fontWeight: '700', color: COLORS.onPrimary },
  heroArt: { width: 96, height: 96, borderRadius: RADIUS.xl, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(224,224,255,0.25)' },
  empty: { alignItems: 'center', gap: 4, padding: 28, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  tile: {
    width: '47%', flexGrow: 1, padding: 12, gap: 8, backgroundColor: COLORS.card, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
  },
  tilePicture: { alignItems: 'center', paddingVertical: 4 },
  tileCircle: { width: 80, height: 80, borderRadius: RADIUS.lg, backgroundColor: COLORS.surfaceLow, alignItems: 'center', justifyContent: 'center' },
  tileName: { fontSize: 15, fontWeight: '700', textTransform: 'capitalize', paddingHorizontal: 4 },
  tileButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: COLORS.surfaceLow, borderRadius: RADIUS.full, paddingVertical: 8 },
  tileButtonText: { fontSize: 11, fontFamily: FONT.semi },
  chef: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: COLORS.surfaceLow, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
  },
  chefIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.chipBg, alignItems: 'center', justifyContent: 'center' },
  chefTitle: { fontSize: 15, fontWeight: '700' },
  chefText: { fontSize: 12 },
  chefButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 8 },
  chefButtonText: { color: COLORS.onPrimary, fontSize: 11, fontWeight: '700' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  linkIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  linkTitle: { fontSize: 15, fontWeight: '700' },
  linkCaption: { fontSize: 12 },
  status: { fontSize: 11, textAlign: 'center' },
});
