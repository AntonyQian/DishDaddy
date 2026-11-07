import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from 'expo-router';
import { useRef, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { Button, T } from '@/components/ui';
import { lookupBarcode, productToIngredient } from './barcode';
import { IngredientInput } from './components';

type Phase = { name: 'scanning' } | { name: 'looking' } | { name: 'manual'; reason: string };

/**
 * Scans a barcode and answers with the Ingredient it is. When the barcode isn't
 * found, can't be looked up, or doesn't map to the ingredient list, falls back to
 * the manual picker so the user is never stuck.
 */
export function BarcodeModal({
  visible, vocabulary, onResult, onClose,
}: {
  visible: boolean;
  vocabulary: readonly string[];
  onResult: (ingredient: string) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>({ name: 'scanning' });
  // onBarcodeScanned fires many times a second for one code; only the first counts.
  const locked = useRef(false);
  // Bumped on close, so a lookup that finishes after Cancel is ignored.
  const session = useRef(0);

  const close = () => {
    session.current++;
    locked.current = false;
    setPhase({ name: 'scanning' });
    onClose();
  };
  const finish = (ingredient: string) => {
    onResult(ingredient);
    close();
  };

  const onScanned = async ({ data }: { data: string }) => {
    if (locked.current) return;
    locked.current = true;
    const mine = session.current;
    setPhase({ name: 'looking' });
    try {
      const product = await lookupBarcode(data);
      if (mine !== session.current) return;
      const ingredient = product && productToIngredient(product, vocabulary);
      if (ingredient) return finish(ingredient);
      setPhase({ name: 'manual', reason: product ? `We found “${product.name}” but can’t match it to an ingredient.` : 'That barcode isn’t in the database.' });
    } catch {
      if (mine !== session.current) return;
      setPhase({ name: 'manual', reason: 'Couldn’t look that barcode up.' });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        {phase.name === 'manual' ? (
          <>
            <T style={styles.heading}>{phase.reason}</T>
            <T dim>Pick the ingredient instead.</T>
            <IngredientInput vocabulary={vocabulary} placeholder="e.g. ketchup" autoFocus onSubmit={finish} />
            <Button title="Scan again" variant="secondary" onPress={() => { locked.current = false; setPhase({ name: 'scanning' }); }} />
          </>
        ) : !permission?.granted ? (
          <>
            <T>The camera is needed to scan a barcode.</T>
            <Button title="Allow camera" onPress={requestPermission} />
          </>
        ) : (
          <>
            <T style={styles.heading}>{phase.name === 'looking' ? 'Looking it up…' : 'Point at the barcode'}</T>
            <View style={styles.camera}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
                onBarcodeScanned={onScanned}
              />
            </View>
          </>
        )}
        <Button title="Cancel" variant="secondary" onPress={close} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, padding: 20, gap: 16 },
  heading: { fontSize: 18, fontWeight: '700' },
  camera: { flex: 1, borderRadius: 12, overflow: 'hidden' },
});
