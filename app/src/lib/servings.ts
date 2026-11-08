// How many servings the user usually cooks, kept on the device. Most meals are for one person.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_SERVINGS = 1;
export const MAX_SERVINGS = 12;

const KEY = 'servings';

export async function loadServings(): Promise<number> {
  try {
    const n = Number(await AsyncStorage.getItem(KEY));
    return Number.isInteger(n) && n >= 1 && n <= MAX_SERVINGS ? n : DEFAULT_SERVINGS;
  } catch {
    return DEFAULT_SERVINGS;
  }
}

export async function saveServings(servings: number): Promise<void> {
  await AsyncStorage.setItem(KEY, String(servings));
}

/** One tap of + or −, kept between 1 and 12. */
export function stepServings(servings: number, direction: 1 | -1): number {
  return Math.min(MAX_SERVINGS, Math.max(1, servings + direction));
}
