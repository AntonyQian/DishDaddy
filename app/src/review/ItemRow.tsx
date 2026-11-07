import { Pressable, StyleSheet, View, type ColorValue } from 'react-native';

import { CONFIRMED, Chip, T } from '@/components/ui';
import type { CapturedPhoto } from '@/scan/types';
import { Crop, IngredientInput, OffListWarning, boxColor } from './components';
import { choicesFor, kindOf, type ReviewItem } from './reviewState';

/** One row of Review: confirm or remove, answer "Is this X or Y?", or name an Unidentified Item. */
export function ItemRow({
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { borderWidth: 1, borderLeftWidth: 5, borderRadius: 10, padding: 12, gap: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemName: { fontSize: 17, fontWeight: '600' },
  meta: { fontSize: 13 },
  tick: { fontSize: 20, color: CONFIRMED, fontWeight: '700' },
  remove: { paddingHorizontal: 6 },
  removeText: { fontSize: 24 },
});
