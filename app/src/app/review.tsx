import { router, useTheme } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, T, Screen } from '@/components/ui';
import { saveLatestScan } from '@/lib/latestScan';
import { useIngredientList } from '@/lib/useIngredientList';
import { ItemRow } from '@/review/ItemRow';
import { BarcodeModal } from '@/review/BarcodeModal';
import { IngredientInput, PhotoWithBoxes } from '@/review/components';
import {
  add, choose, confirm, confirmAll, confirmedIngredients, name, remove, startReview, type ReviewItem,
} from '@/review/reviewState';
import { useScan } from '@/scan/ScanContext';

function ReviewScreenBody() {
  const { photos, result, reset } = useScan();
  const vocabulary = useIngredientList();
  const { colors } = useTheme();
  const [items, setItems] = useState<ReviewItem[]>(() => (result ? startReview(result) : []));
  const [photoIndex, setPhotoIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string>();
  const [picking, setPicking] = useState(false);
  // Scanning a barcode either replaces this item's guess, or (null id) adds a new item.
  const [barcodeFor, setBarcodeFor] = useState<{ itemId: string | null }>();
  const [saving, setSaving] = useState(false);

  const visible = items.filter((i) => i.status !== 'removed');
  const onPhoto = visible.filter((i) => i.detection?.photoIndex === photoIndex);
  const confirmed = confirmedIngredients(items);
  const pendingCount = visible.filter((i) => i.status === 'pending').length;

  if (!result) {
    return (
      <View style={styles.empty}>
        <T>No Scan to review.</T>
        <Button title="Back" onPress={() => router.back()} />
      </View>
    );
  }

  const select = (item: ReviewItem) => {
    setSelectedId(item.id);
    if (item.detection) setPhotoIndex(item.detection.photoIndex);
  };

  const done = async () => {
    setSaving(true);
    try {
      await saveLatestScan(confirmed);
      reset();
      // Home stays under the Recipe Match list, so Back from it lands there.
      router.dismissTo('/');
      router.push('/recipes');
    } catch (e) {
      setSaving(false);
      Alert.alert('Could not save the Scan', e instanceof Error ? e.message : String(e));
    }
  };

  const retake = () =>
    Alert.alert('Retake photos?', `Your ${photos.length} photos and this Review will be dropped.`, [
      { text: 'Keep reviewing', style: 'cancel' },
      {
        text: 'Retake',
        style: 'destructive',
        onPress: () => {
          reset();
          router.dismissTo('/scan');
        },
      },
    ]);

  const finish = () => {
    if (pendingCount === 0) return done();
    Alert.alert(
      `${pendingCount} still to review`,
      'Only confirmed Ingredients are kept. Finish anyway?',
      [{ text: 'Keep reviewing', style: 'cancel' }, { text: 'Finish', onPress: done }],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {photos[photoIndex] && (
          <PhotoWithBoxes photo={photos[photoIndex]} items={onPhoto} selectedId={selectedId} onSelect={setSelectedId} />
        )}
        {photos.length > 1 && (
          <View style={styles.chips}>
            {photos.map((p, i) => (
              <Chip key={p.uri} title={`Photo ${i + 1}`} selected={i === photoIndex} onPress={() => setPhotoIndex(i)} />
            ))}
          </View>
        )}

        <View style={styles.listHeader}>
          <T style={styles.heading}>Found {visible.filter((i) => i.detection).length} in your photos</T>
          <Button title="Confirm all" variant="secondary" onPress={() => setItems(confirmAll)} style={styles.small} />
        </View>

        {visible.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            photo={item.detection ? photos[item.detection.photoIndex] : undefined}
            selected={item.id === selectedId}
            vocabulary={vocabulary}
            borderColor={colors.border}
            onSelect={() => select(item)}
            onConfirm={() => setItems((is) => confirm(is, item.id))}
            onRemove={() => setItems((is) => remove(is, item.id))}
            onChoose={(n) => setItems((is) => choose(is, item.id, n))}
            onName={(n) => setItems((is) => name(is, item.id, n))}
            onBarcode={() => setBarcodeFor({ itemId: item.id })}
          />
        ))}

        <Button title="+ Add ingredient" variant="secondary" onPress={() => setPicking(true)} />
        <Button title="Scan barcode" variant="secondary" onPress={() => setBarcodeFor({ itemId: null })} />
        <Button title="Retake photos" variant="danger" onPress={retake} />
      </ScrollView>

      <View style={[styles.footer, { borderColor: colors.border }]}>
        <T dim style={styles.footerText}>
          {confirmed.length} confirmed{pendingCount ? `, ${pendingCount} to review` : ''}
        </T>
        <Button title="Done" onPress={finish} busy={saving} />
      </View>

      <BarcodeModal
        visible={!!barcodeFor}
        vocabulary={vocabulary}
        onClose={() => setBarcodeFor(undefined)}
        onResult={(n) => setItems((is) => (barcodeFor?.itemId ? choose(is, barcodeFor.itemId, n) : add(is, n)))}
      />

      <Modal visible={picking} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPicking(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <T style={styles.heading}>Add an ingredient the camera missed</T>
          <IngredientInput
            vocabulary={vocabulary}
            placeholder="e.g. butter"
            autoFocus
            onSubmit={(n) => {
              setItems((is) => add(is, n));
              setPicking(false);
            }}
          />
          <Button title="Cancel" variant="secondary" onPress={() => setPicking(false)} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  empty: { flex: 1, padding: 24, gap: 16, justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  heading: { fontSize: 18, fontWeight: '700' },
  small: { paddingVertical: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  footerText: { flex: 1 },
  modal: { flex: 1, padding: 20, gap: 16 },
});

export default function ReviewScreen() {
  return (
    <Screen title="Review" back>
      <ReviewScreenBody />
    </Screen>
  );
}
