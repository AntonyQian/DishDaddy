// The user's Staples and Equipment, stored on the device. They feed every RecipeSearchRequest.
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Equipment names as the recipe collection uses them. */
export const ALL_EQUIPMENT: readonly string[] = [
  'hob', 'oven', 'grill', 'microwave', 'blender', 'hand mixer', 'food processor',
  'stand mixer', 'slow cooker', 'toaster', 'rice cooker', 'pressure cooker', 'air fryer',
];

export const DEFAULT_EQUIPMENT: readonly string[] = ['hob', 'oven', 'grill', 'microwave'];

export const DEFAULT_STAPLES: readonly string[] = [
  'salt', 'black pepper', 'olive oil', 'vegetable oil', 'flour', 'sugar',
  'paprika', 'cumin', 'chilli powder', 'cinnamon', 'oregano',
];

const STAPLES_KEY = 'staples';
const EQUIPMENT_KEY = 'equipment';

async function loadList(key: string, defaults: readonly string[]): Promise<string[]> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as string[]) : [...defaults];
}

export function loadStaples(): Promise<string[]> {
  return loadList(STAPLES_KEY, DEFAULT_STAPLES);
}

export function loadEquipment(): Promise<string[]> {
  return loadList(EQUIPMENT_KEY, DEFAULT_EQUIPMENT);
}

export async function saveEquipment(equipment: string[]): Promise<void> {
  await AsyncStorage.setItem(EQUIPMENT_KEY, JSON.stringify(equipment));
}

export async function saveStaples(staples: string[]): Promise<void> {
  await AsyncStorage.setItem(STAPLES_KEY, JSON.stringify(staples));
}

/** Adds a Staple at the end of the list, lower-cased and trimmed; a blank or repeated name changes nothing. */
export function addStaple(staples: readonly string[], name: string): string[] {
  const staple = name.trim().toLowerCase();
  return !staple || staples.includes(staple) ? [...staples] : [...staples, staple];
}

export function removeStaple(staples: readonly string[], name: string): string[] {
  return staples.filter((s) => s !== name);
}

/** Ticks or unticks one piece of Equipment, keeping the ALL_EQUIPMENT order. */
export function toggleEquipment(equipment: readonly string[], item: string): string[] {
  const has = equipment.includes(item);
  return ALL_EQUIPMENT.filter((e) => (e === item ? !has : equipment.includes(e)));
}
