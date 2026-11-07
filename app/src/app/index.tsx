import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getHealth } from '@/lib/api';
import { SERVER_URL } from '@/lib/config';

type Status = 'checking' | 'ok' | 'error';

export default function HomeScreen() {
  const [status, setStatus] = useState<Status>('checking');
  const [error, setError] = useState<string>();

  const check = () => {
    setStatus('checking');
    getHealth()
      .then(() => setStatus('ok'))
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
        setStatus('error');
      });
  };

  useEffect(check, []);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Server</Text>
      <Text selectable>{SERVER_URL}</Text>
      <Text style={styles.status}>
        {status === 'checking' && 'Checking…'}
        {status === 'ok' && 'Connected'}
        {status === 'error' && `Not reachable: ${error}`}
      </Text>
      {status === 'error' && (
        <Pressable onPress={check} style={styles.button}>
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 8, justifyContent: 'center' },
  label: { fontSize: 14, opacity: 0.6 },
  status: { fontSize: 18, fontWeight: '600', marginTop: 8 },
  button: { marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: '#208AEF', alignSelf: 'flex-start' },
  buttonText: { color: 'white', fontWeight: '600' },
});
