import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'latestScan';

/** The confirmed Ingredient list from the most recent Review. */
export interface LatestScan {
  ingredients: string[];
  confirmedAt: string;
}

export async function saveLatestScan(ingredients: string[]): Promise<LatestScan> {
  const scan: LatestScan = { ingredients, confirmedAt: new Date().toISOString() };
  await AsyncStorage.setItem(KEY, JSON.stringify(scan));
  return scan;
}

export async function loadLatestScan(): Promise<LatestScan | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as LatestScan) : null;
}
