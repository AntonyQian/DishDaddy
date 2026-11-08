import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button, T } from '@/components/ui';

export function Loading({ label }: { label: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
      <T dim>{label}</T>
    </View>
  );
}

export function Failed({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <T style={styles.title}>{title}</T>
      <T dim style={styles.message}>{message}</T>
      <Button title="Try again" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  message: { textAlign: 'center' },
});
