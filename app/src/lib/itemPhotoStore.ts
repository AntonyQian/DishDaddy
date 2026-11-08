// Keeps Ingredient photos on the device: the files in the app's own folder (the camera's cache
// can be cleared by the system) and the list of which Ingredient uses which, in AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { ItemPhotos } from './itemPhotos';

const KEY = 'itemPhotos';

export async function loadItemPhotos(): Promise<ItemPhotos> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ItemPhotos) : {};
  } catch {
    return {};
  }
}

export const saveItemPhotos = (photos: ItemPhotos) => AsyncStorage.setItem(KEY, JSON.stringify(photos));

const folder = () => new Directory(Paths.document, 'item-photos');

/**
 * Copies the photos' files into the app's folder so they outlast the camera cache. A file that can't
 * be copied is dropped, so that Ingredient simply keeps its emoji. On the web there is no file
 * folder and a stored photo would not fit in browser storage, so nothing is kept.
 */
export async function persistPhotos(photos: ItemPhotos): Promise<ItemPhotos> {
  if (Platform.OS === 'web') return {};
  const dir = folder();
  if (!dir.exists) dir.create({ intermediates: true });
  const copies = new Map<string, string | null>();
  const out: ItemPhotos = {};
  for (const [name, photo] of Object.entries(photos)) {
    if (!copies.has(photo.uri)) {
      try {
        if (photo.uri.startsWith(dir.uri)) copies.set(photo.uri, photo.uri);
        else {
          const extension = photo.uri.split('.').pop()?.split('?')[0] || 'jpg';
          const target = new File(dir, `${Date.now()}-${copies.size}.${extension}`);
          await new File(photo.uri).copy(target);
          copies.set(photo.uri, target.uri);
        }
      } catch {
        copies.set(photo.uri, null);
      }
    }
    const uri = copies.get(photo.uri);
    if (uri) out[name] = { ...photo, uri };
  }
  return out;
}

/** Deletes the stored files that none of `kept` points to. */
export function sweepPhotoFiles(kept: ItemPhotos) {
  if (Platform.OS === 'web') return;
  try {
    const dir = folder();
    if (!dir.exists) return;
    const used = new Set(Object.values(kept).map((p) => p.uri));
    for (const entry of dir.list()) if (entry instanceof File && !used.has(entry.uri)) entry.delete();
  } catch {
    // A file that can't be deleted now is swept next time.
  }
}

