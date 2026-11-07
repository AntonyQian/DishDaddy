import { router, useTheme } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View, type ColorValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, T } from '@/components/ui';
import { saveLatestScan } from '@/lib/latestScan';
import { useIngredientList } from '@/lib/useIngredientList';
import { Crop, IngredientInput, OffListWarning, PhotoWithBoxes, boxColor } from '@/review/components';
import {
  add, choicesFor, choose, confirm, confirmAll, confirmedIngredients, kindOf, name, remove, startReview, type ReviewItem,
} from '@/review/reviewState';
import { useScan } from '@/scan/ScanContext';
import type { CapturedPhoto } from '@/scan/types';

export default function ReviewScreen() {
  const { photos, result, reset } = useScan();
  const vocabulary = useIngredientList();
  const { colors } = useTheme();
  const [items, setItems] = useState<ReviewItem[]>(() => (result ? startReview(result) : []));
  const [photoIndex, setPhotoIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string>();
  const [picking, setPicking] = useState(false);
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
      router.dismissTo('/');
    } catch (e) {
      Alert.alert('Could not save the Scan', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const finish = () => {
    if (pendingCount === 0) return done();
    Alert.alert(
      `${pendingCount} item${pendingCount > 1 ? 's' : ''} not reviewed`,
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
              <Chip key={p.uri} title={`${i + 1}. ${p.spot}`} selected={i === photoIndex} onPress={() => setPhotoIndex(i)} />
            ))}
          </View>
        )}

        <View style={styles.listHeader}>
          <T style={styles.heading}>Found {visible.filter((i) => i.detection).length} items</T>
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
          />
        ))}

        <Button title="+ Add ingredient" variant="secondary" onPress={() => setPicking(true)} />
      </ScrollView>

      <View style={[styles.footer, { borderColor: colors.border }]}>
        <T dim style={styles.footerText}>
          {confirmed.length} confirmed{pendingCount ? `, ${pendingCount} to review` : ''}
        </T>
        <Button title="Done" onPress={finish} busy={saving} />
      </View>

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

function ItemRow({
  item, photo, selected, vocabulary, borderColor, onSelect, onConfirm, onRemove, onChoose, onName,
}: {
  item: ReviewItem;
  photo?: CapturedPhoto;
  selected: boolean;
  vocabulary: readonly string[];
  borderColor: ColorValue;
  onSelect: () => void;
  onConfirm: () => void;
  onRemove: () => void;
  onChoose: (ingredient: string) => void;
  onName: (text: string) => void;
}) {
  const kind = kindOf(item);
  const isConfirmed = item.status === 'confirmed';
  const options = choicesFor(item);

  return (
    <Pressable
      onPress={onSelect}
      style={[styles.row, { borderColor: selected ? boxColor(item) : borderColor, borderLeftColor: boxColor(item) }]}>
      <View style={styles.rowTop}>
        {kind === 'unidentified' && photo && item.detection && <Crop photo={photo} box={item.detection.box} />}
        <View style={{ flex: 1, gap: 2 }}>
          {kind === 'unidentified' && !isConfirmed ? (
            <T style={styles.itemName}>What is this?</T>
          ) : kind === 'choice' && !isConfirmed ? (
            <T style={styles.itemName}>Is this {options.join(' or ')}?</T>
          ) : (
            <T style={styles.itemName}>{item.ingredient}</T>
          )}
          {item.detection && (
            <T dim style={styles.meta}>
              {item.detection.label}
              {item.detection.visibleText ? ` · “${item.detection.visibleText}”` : ''}
            </T>
          )}
          {isConfirmed && item.ingredient && <OffListWarning ingredient={item.ingredient} vocabulary={vocabulary} />}
        </View>
        {isConfirmed ? (
          <T style={styles.tick}>✓</T>
        ) : (
          kind === 'named' && <Chip title="Confirm" onPress={onConfirm} />
        )}
        <Pressable accessibilityRole="button" accessibilityLabel="Remove" onPress={onRemove} hitSlop={8} style={styles.remove}>
          <T dim style={styles.removeText}>×</T>
        </Pressable>
      </View>

      {!isConfirmed && kind === 'choice' && (
        <View style={styles.chips}>
          {options.map((o) => (
            <Chip key={o} title={o} onPress={() => onChoose(o)} />
          ))}
          <Chip title="Something else" onPress={onSelect} />
        </View>
      )}
      {!isConfirmed && (kind === 'unidentified' || (kind === 'choice' && selected)) && (
        <>
          {kind === 'unidentified' && options.length > 0 && (
            <View style={styles.chips}>
              {options.map((o) => (
                <Chip key={o} title={o} onPress={() => onChoose(o)} />
              ))}
            </View>
          )}
          <IngredientInput vocabulary={vocabulary} placeholder="Type what it is" onSubmit={onName} />
        </>
      )}
    </Pressable>
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
  row: { borderWidth: 1, borderLeftWidth: 5, borderRadius: 10, padding: 12, gap: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemName: { fontSize: 17, fontWeight: '600' },
  meta: { fontSize: 13 },
  tick: { fontSize: 20, color: '#1E9E5A', fontWeight: '700' },
  remove: { paddingHorizontal: 6 },
  removeText: { fontSize: 24 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  footerText: { flex: 1 },
  modal: { flex: 1, padding: 20, gap: 16 },
});
