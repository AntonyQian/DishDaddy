import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { router, useIsFocused } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ACCENT, Button, T } from '@/components/ui';
import { useScan } from '@/scan/ScanContext';

/** What to photograph next, in order. */
const SPOTS = ['Shelves', 'Door', 'Drawer', 'Cupboard'];
const SPOT_HINTS: Record<string, string> = {
  Shelves: 'Photograph the shelves, front on, with the light on',
  Door: 'Now the door shelves',
  Drawer: 'Pull the drawer out and shoot from above',
  Cupboard: 'Anything in the cupboard you want to cook with',
};

export default function ScanCaptureScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const focused = useIsFocused();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [taking, setTaking] = useState(false);
  const { photos, addPhoto, removePhoto } = useScan();

  // The first spot not yet photographed, so removing a photo brings its prompt back.
  const spot = SPOTS.find((s) => !photos.some((p) => p.spot === s)) ?? 'Anything else';

  if (!permission) return <View style={styles.center} />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <T style={styles.centerText}>The camera is needed to see what is in your fridge.</T>
        <Button title="Allow camera" onPress={requestPermission} />
      </View>
    );
  }

  const takePhoto = async () => {
    if (!camera.current || taking) return;
    setTaking(true);
    try {
      const pic = await camera.current.takePictureAsync({ quality: 0.7, shutterSound: false });
      addPhoto({ uri: pic.uri, width: pic.width, height: pic.height, spot });
    } catch (e) {
      Alert.alert('Could not take the photo', e instanceof Error ? e.message : String(e));
    } finally {
      setTaking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.cameraWrap}>
        {/* Only one camera preview may be active, so unmount it when this screen is hidden. */}
        {focused && (
          <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setReady(true)} />
        )}
        <View style={styles.prompt}>
          <Text style={styles.promptTitle}>{spot}</Text>
          <Text style={styles.promptHint}>{SPOT_HINTS[spot] ?? 'Anything the other photos missed'}</Text>
        </View>
        <View style={styles.controls}>
          <View style={styles.controlSide} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            onPress={takePhoto}
            disabled={!ready || taking}
            style={({ pressed }) => [styles.shutter, (pressed || taking || !ready) && { opacity: 0.6 }]}
          />
          <View style={[styles.controlSide, { alignItems: 'flex-end' }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Scan photos"
              onPress={() => router.push('/scanning')}
              disabled={photos.length === 0}
              style={({ pressed }) => [styles.scanPill, (photos.length === 0 || pressed) && { opacity: photos.length === 0 ? 0.4 : 0.7 }]}>
              <Text style={styles.scanPillText}>
                {photos.length ? `Scan ${photos.length} ›` : 'Scan ›'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView horizontal contentContainerStyle={styles.thumbs} style={styles.thumbsBar}>
        {photos.length === 0 && <T dim>Take 2–3 photos: shelves, door, drawer.</T>}
        {photos.map((p, i) => (
          <View key={p.uri}>
            <Image source={{ uri: p.uri }} style={styles.thumb} contentFit="cover" />
            <Text style={styles.thumbLabel}>
              {i + 1}. {p.spot}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove photo ${i + 1}`}
              onPress={() => removePhoto(p.uri)}
              style={styles.thumbRemove}
              hitSlop={8}>
              <Text style={styles.thumbRemoveText}>×</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, padding: 24, gap: 16, justifyContent: 'center' },
  centerText: { textAlign: 'center' },
  cameraWrap: { flex: 1, backgroundColor: 'black', justifyContent: 'space-between', alignItems: 'center' },
  prompt: { marginTop: 16, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)' },
  promptTitle: { color: 'white', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  promptHint: { color: 'white', fontSize: 14, textAlign: 'center' },
  controls: { width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20 },
  controlSide: { flex: 1 },
  scanPill: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 999, backgroundColor: ACCENT },
  scanPillText: { color: 'white', fontSize: 16, fontWeight: '700' },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'white',
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  thumbsBar: { flexGrow: 0 },
  thumbs: { padding: 12, gap: 12, alignItems: 'center', minHeight: 104 },
  thumb: { width: 64, height: 80, borderRadius: 8 },
  thumbLabel: { fontSize: 11, color: 'gray', marginTop: 2, maxWidth: 64 },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRemoveText: { color: 'white', fontSize: 16, lineHeight: 18 },
});
