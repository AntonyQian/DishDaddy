import { Pressable, StyleSheet, View, type ColorValue } from 'react-native';

import { Badge, CONFIRMED, Chip, T } from '@/components/ui';
import { COLORS } from '@/theme';
import type { CapturedPhoto } from '@/scan/types';
import { Crop, IngredientInput, OffListWarning, boxColor } from './components';
import { choicesFor, kindOf, type ReviewItem } from './reviewState';

/** One row of Review: confirm or remove, answer "Is this X or Y?", or name an Unidentified Item. */
export function ItemRow({
  item, photo, selected, vocabulary, borderColor, onSelect, onConfirm, onRemove, onChoose, onName, onBarcode,
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
  onBarcode: () => void;
}) {
  const kind = kindOf(item);
  const isConfirmed = item.status === 'confirmed';
  const options = choicesFor(item);

  return (
    <Pressable
      onPress={onSelect}
      style={[styles.row, { borderColor: selected ? boxColor(item) : borderColor, borderWidth: selected ? 2 : 1 }]}>
      <View style={styles.rowTop}>
        {kind === 'unidentified' && photo && item.detection && <Crop photo={photo} box={item.detection.box} />}
        <View style={{ flex: 1, gap: 4 }}>
          {isConfirmed ? (
            <Badge tone="ready" label="✓ Confirmed" />
          ) : kind === 'named' ? (
            <Badge tone="ok" label="Match" />
          ) : kind === 'choice' ? (
            <Badge tone="warn" label="Check this" />
          ) : kind === 'unidentified' ? (
            <Badge tone="neutral" label="Unknown item" />
          ) : null}
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
        {!isConfirmed && kind === 'named' && <Chip title="Confirm" onPress={onConfirm} />}
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
      {!isConfirmed && item.detection && (
        <View style={styles.chips}>
          <Chip title="Scan barcode" onPress={onBarcode} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10, backgroundColor: COLORS.card },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemName: { fontSize: 17, fontWeight: '600' },
  meta: { fontSize: 13 },
  tick: { fontSize: 20, color: CONFIRMED, fontWeight: '700' },
  remove: { paddingHorizontal: 6 },
  removeText: { fontSize: 24 },
});
