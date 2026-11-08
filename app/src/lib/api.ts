import { File } from 'expo-file-system';
import { FIXTURE_INGREDIENTS, type HealthResponse, type IngredientsResponse, type ScanResult } from '@fridge/shared';
import type { CapturedPhoto } from '@/scan/types';
import { MOCK_SCAN, SERVER_URL } from './config';
import { mockScanResult } from './mockScan';

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${SERVER_URL}/health`);
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return res.json();
}

/** Sends a Scan's photos to POST /scan. */
export async function postScan(photos: CapturedPhoto[]): Promise<ScanResult> {
  if (MOCK_SCAN) return mockScanResult(photos.length);

  const body = new FormData();
  photos.forEach((p, i) => {
    // Expo's fetch (SDK 52+) does not accept React Native's { uri, name, type } file
    // object. It takes a Blob, or any object with bytes(): read the photo with
    // expo-file-system and give the part an explicit name and type for the server.
    const file = new File(p.uri);
    const part = { name: `photo-${i + 1}.jpg`, type: 'image/jpeg', bytes: () => file.bytes() };
    body.append('photos', part as unknown as Blob);
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(`${SERVER_URL}/scan`, { method: 'POST', body, signal: controller.signal });
    if (!res.ok) {
      const message = await res.json().then((j: { error?: string }) => j.error).catch(() => undefined);
      throw new Error(message ?? `Server returned ${res.status}`);
    }
    return res.json();
  } catch (e) {
    if (controller.signal.aborted) throw new Error('The server took too long to answer');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** The ingredient list from GET /ingredients, or the fixture list until that endpoint exists. */
export async function getIngredients(): Promise<readonly string[]> {
  try {
    const res = await fetch(`${SERVER_URL}/ingredients`);
    if (!res.ok) throw new Error(String(res.status));
    const json: IngredientsResponse = await res.json();
    return json.ingredients;
  } catch {
    return FIXTURE_INGREDIENTS;
  }
}
