import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Button, T, Screen } from '@/components/ui';
import { getHealth } from '@/lib/api';
import { MOCK_SCAN, SERVER_URL } from '@/lib/config';
import { loadLatestScan, type LatestScan } from '@/lib/latestScan';
import { useScan } from '@/scan/ScanContext';

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button title="Start a Scan" onPress={startScan} />
      {scan.photos.length > 0 && (
        <Button title={`Continue Scan (${scan.photos.length} photos)`} variant="secondary" onPress={() => router.push('/scan')} />
      )}
      <Button title="Saved Recipes" variant="secondary" onPress={() => router.push('/saved')} />
      <Button title="Staples" variant="secondary" onPress={() => router.push('/staples')} />
      <Button title="Equipment" variant="secondary" onPress={() => router.push('/equipment')} />

      {latest && (
        <View style={styles.section}>
          <T style={styles.heading}>Latest Scan</T>
          <T dim>{new Date(latest.confirmedAt).toLocaleString()}</T>
          <T>{latest.ingredients.length ? latest.ingredients.join(', ') : 'No Ingredients confirmed'}</T>
          <Button title="Find recipes" onPress={() => router.push('/recipes')} style={styles.find} />
        </View>
      )}

      <View style={styles.section}>
        <T dim style={styles.small}>
          Server {SERVER_URL}: {server === 'checking' ? 'checking…' : server === 'ok' ? 'connected' : 'not reachable'}
          {MOCK_SCAN ? ' (mock Scans on)' : ''}
        </T>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  section: { marginTop: 16, gap: 4 },
  heading: { fontSize: 18, fontWeight: '700' },
  small: { fontSize: 13 },
  find: { marginTop: 8 },
});

export default function HomeScreen() {
  return (
    <Screen title="Fridge to Recipe">
      <HomeScreenBody />
    </Screen>
  );
}
