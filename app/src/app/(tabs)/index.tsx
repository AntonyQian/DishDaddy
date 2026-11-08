import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, T, Screen } from '@/components/ui';
import { getHealth } from '@/lib/api';
import { MOCK_SCAN, SERVER_URL } from '@/lib/config';
import { loadLatestScan, type LatestScan } from '@/lib/latestScan';
import { useScan } from '@/scan/ScanContext';
import { COLORS, FONT } from '@/theme';

function Tile({ title, caption, to }: { title: string; caption: string; to: '/saved' | '/staples' | '/equipment' }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(to)} style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.8 : 1 }]}>
      <T style={styles.tileTitle}>{title}</T>
      <T dim style={styles.tileCaption}>{caption}</T>
    </Pressable>
  );
}

function HomeScreenBody() {
  const scan = useScan();
  const [latest, setLatest] = useState<LatestScan | null>(null);
  const [server, setServer] = useState<'checking' | 'ok' | 'down'>('checking');

  useFocusEffect(
    useCallback(() => {
      loadLatestScan().then(setLatest).catch(() => setLatest(null));
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

  const shown = latest?.ingredients.slice(0, 12) ?? [];
  const more = (latest?.ingredients.length ?? 0) - shown.length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <T style={styles.heroTitle}>What can you cook tonight?</T>
        <T style={styles.heroText}>Scan your fridge and get recipes that use what you already have.</T>
        <Button title="Start a Scan" variant="secondary" onPress={startScan} />
        {scan.photos.length > 0 && (
          <Button title={`Continue Scan (${scan.photos.length} photos)`} variant="secondary" onPress={() => router.push('/scan')} />
        )}
      </View>

      {latest && (
        <Card style={styles.latest}>
          <T style={styles.heading}>Your latest Scan</T>
          <T dim style={styles.small}>{new Date(latest.confirmedAt).toLocaleString()}</T>
          {latest.ingredients.length ? (
            <View style={styles.chips}>
              {shown.map((i) => <Badge key={i} tone="ok" label={i} />)}
              {more > 0 && <Badge tone="neutral" label={`+${more} more`} />}
            </View>
          ) : (
            <T dim>No Ingredients confirmed</T>
          )}
          <Button title="Find recipes" onPress={() => router.push('/recipes')} />
        </Card>
      )}

      <View style={styles.tiles}>
        <Tile title="Saved Recipes" caption="Cook these again" to="/saved" />
        <Tile title="Staples" caption="Always in your kitchen" to="/staples" />
        <Tile title="Equipment" caption="What you cook with" to="/equipment" />
      </View>

      <T dim style={styles.status}>
        Server {SERVER_URL}: {server === 'checking' ? 'checking…' : server === 'ok' ? 'connected' : 'not reachable'}
        {MOCK_SCAN ? ' (mock Scans on)' : ''}
      </T>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  hero: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 20, gap: 12 },
  heroTitle: { color: COLORS.onPrimary, fontSize: 26, fontWeight: '700', lineHeight: 32 },
  heroText: { color: COLORS.onPrimaryMuted, fontSize: 15 },
  latest: { gap: 10 },
  heading: { fontSize: 18, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  small: { fontSize: 13 },
  tiles: { gap: 10 },
  tile: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 2 },
  tileTitle: { fontFamily: FONT.bodyBold, fontSize: 16 },
  tileCaption: { fontSize: 13 },
  status: { fontSize: 12, textAlign: 'center', marginTop: 8 },
});

export default function HomeScreen() {
  return (
    <Screen title="Fridge to Recipe">
      <HomeScreenBody />
    </Screen>
  );
}
