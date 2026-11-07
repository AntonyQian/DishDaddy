import type { Box } from '@fridge/shared';
import { Image } from 'expo-image';
import { useTheme } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ACCENT, CONFIRMED, Chip, T, WARN } from '@/components/ui';
import type { CapturedPhoto } from '@/scan/types';
import { isOnList, kindOf, suggest, type ReviewItem } from './reviewState';

export function boxColor(item: ReviewItem): string {
  if (item.status === 'confirmed') return CONFIRMED;
  const kind = kindOf(item);
  return kind === 'choice' ? WARN : kind === 'unidentified' ? '#888' : ACCENT;
}

/** A Scan photo with a box drawn over each of its Detections. */
export function PhotoWithBoxes({
  photo,
  items,
  selectedId,
  onSelect,
}: {
  photo: CapturedPhoto;
  items: ReviewItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={{ width: '100%', aspectRatio: photo.width / photo.height }}>
      <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="fill" />
      {items.map((item) => {
        const [ymin, xmin, ymax, xmax] = item.detection!.box;
        const color = boxColor(item);
        return (
          <Pressable
            key={item.id}
            accessibilityLabel={item.ingredient ?? 'Unidentified Item'}
            onPress={() => onSelect(item.id)}
            style={{
              position: 'absolute',
              top: `${ymin / 10}%`,
              left: `${xmin / 10}%`,
              height: `${(ymax - ymin) / 10}%`,
              width: `${(xmax - xmin) / 10}%`,
              borderWidth: item.id === selectedId ? 4 : 2,
              borderColor: color,
              borderRadius: 4,
            }}>
            <Text style={[styles.boxLabel, { backgroundColor: color }]} numberOfLines={1}>
              {item.ingredient ?? '?'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** The part of a photo inside a Detection's box, scaled to fit `size`. */
export function Crop({ photo, box, size = 72 }: { photo: CapturedPhoto; box: Box; size?: number }) {
  const [ymin, xmin, ymax, xmax] = box;
  const cropW = Math.max(1, ((xmax - xmin) / 1000) * photo.width);
  const cropH = Math.max(1, ((ymax - ymin) / 1000) * photo.height);
  const scale = size / Math.max(cropW, cropH);
  return (
    <View style={{ width: cropW * scale, height: cropH * scale, overflow: 'hidden', borderRadius: 6 }}>
      <Image
        source={{ uri: photo.uri }}
        contentFit="fill"
        style={{
          position: 'absolute',
          width: photo.width * scale,
          height: photo.height * scale,
          left: -(xmin / 1000) * photo.width * scale,
          top: -(ymin / 1000) * photo.height * scale,
        }}
      />
    </View>
  );
}

export function OffListWarning({ ingredient, vocabulary }: { ingredient: string; vocabulary: readonly string[] }) {
  if (isOnList(ingredient, vocabulary)) return null;
  return <T style={styles.warning}>“{ingredient}”: we can’t match recipes on this yet</T>;
}

/** A text input with autocomplete over the ingredient list. Submitting free text is allowed. */
export function IngredientInput({
  vocabulary,
  placeholder,
  onSubmit,
  autoFocus,
}: {
  vocabulary: readonly string[];
  placeholder: string;
  onSubmit: (name: string) => void;
  autoFocus?: boolean;
}) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const matches = suggest(text, vocabulary, 6);
  const submit = (name: string) => {
    if (!name.trim()) return;
    onSubmit(name);
    setText('');
  };
  const typedOffList = text.trim() !== '' && matches.length === 0;

  return (
    <View style={{ gap: 8 }}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="gray"
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={() => submit(text)}
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
      />
      {matches.length > 0 && (
        <View style={styles.chips}>
          {matches.map((m) => (
            <Chip key={m} title={m} onPress={() => submit(m)} />
          ))}
        </View>
      )}
      {typedOffList && (
        <View style={styles.chips}>
          <Chip title={`Use “${text.trim()}”`} onPress={() => submit(text)} />
          <T style={styles.warning}>we can’t match recipes on this yet</T>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  boxLabel: { position: 'absolute', top: -2, left: -2, color: 'white', fontSize: 11, fontWeight: '700', paddingHorizontal: 4, maxWidth: 140 },
  warning: { color: WARN, fontSize: 13 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
});
