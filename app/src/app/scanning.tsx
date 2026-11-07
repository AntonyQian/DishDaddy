import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button, T } from '@/components/ui';
import { postScan } from '@/lib/api';
import { useScan } from '@/scan/ScanContext';

/** Rough time per photo. The server checks photos in parallel, so this only paces the message. */
const SECONDS_PER_PHOTO = 3;

export default function ScanningScreen() {
  const { photos, setResult } = useScan();
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(1);
  const attempt = useRef(0);

  const send = useCallback(() => {
    const thisAttempt = ++attempt.current;
    postScan(photos)
      .then((result) => {
        if (thisAttempt !== attempt.current) return;
        setResult(result);
        router.replace('/review');
      })
      .catch((e: unknown) => {
        if (thisAttempt !== attempt.current) return;
        setError(e instanceof Error ? e.message : String(e));
      });
  }, [photos, setResult]);

  const retry = () => {
    setError(null);
    setChecking(1);
    send();
  };

  useEffect(() => {
    if (photos.length === 0) {
      router.back();
      return;
    }
    send();
    const attempts = attempt;
    return () => {
      attempts.current++; // ignore an answer that arrives after leaving this screen
    };
  }, [send, photos.length]);

  useEffect(() => {
    if (error) return;
    const timer = setInterval(() => setChecking((n) => Math.min(n + 1, photos.length)), SECONDS_PER_PHOTO * 1000);
    return () => clearInterval(timer);
  }, [error, photos.length]);

  if (error) {
    return (
      <View style={styles.container}>
        <T style={styles.title}>The Scan did not go through</T>
        <T dim style={styles.text}>
          {error}
        </T>
        <T dim style={styles.text}>
          Your {photos.length} photo{photos.length > 1 ? 's are' : ' is'} kept.
        </T>
        <Button title="Retry" onPress={retry} />
        <Button title="Back to photos" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <T style={styles.title}>
        Checking photo {checking} of {photos.length}…
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 14, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  text: { textAlign: 'center' },
});
