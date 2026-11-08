import type { Recipe } from '@fridge/shared';

// What the user always has (Staples), what they cook with (Equipment) and what they saved. Pure rules: the hooks that keep them in the browser are in usePrefs.ts.

export const DEFAULT_STAPLES: readonly string[] = [
  'salt', 'black pepper', 'olive oil', 'vegetable oil', 'flour', 'sugar', 'paprika', 'cumin', 'chilli powder', 'cinnamon', 'oregano',
];

/** The appliances we support, as the recipe collection names them, in the order they are shown. */
export const ALL_EQUIPMENT: readonly string[] = [
  'hob', 'oven', 'grill', 'microwave', 'blender', 'mixer', 'meat grinder',
  'slow cooker', 'toaster', 'rice cooker', 'air fryer', 'pressure cooker',
];

export const DEFAULT_EQUIPMENT: readonly string[] = ['hob', 'oven', 'grill', 'microwave'];

const LABELS: Record<string, string> = { hob: 'Hob / stove', mixer: 'Mixers' };

/** What to call a piece of Equipment on screen: "Hob / stove", "Mixers", "Air fryer". */
export function equipmentLabel(item: string): string {
  return LABELS[item] ?? item.charAt(0).toUpperCase() + item.slice(1);
}

// Names from earlier versions of the list, and what they became.
const OLD_NAMES: Record<string, string> = { 'hand mixer': 'mixer', 'stand mixer': 'mixer', 'food processor': 'blender', stove: 'hob' };

/** Brings a saved list up to date: old names become current ones, unknown names go, each appears once, in display order. */
export function normaliseEquipment(saved: readonly string[]): string[] {
  const names = new Set(saved.map((e) => OLD_NAMES[e.trim().toLowerCase()] ?? e.trim().toLowerCase()));
  return ALL_EQUIPMENT.filter((e) => names.has(e));
}

/** Ticks or unticks one piece of Equipment, keeping the display order. */
export function toggleEquipment(equipment: readonly string[], item: string): string[] {
  const has = equipment.includes(item);
  return ALL_EQUIPMENT.filter((e) => (e === item ? !has : equipment.includes(e)));
}

/** Adds a Staple at the end, lower-cased and trimmed; a blank or repeated name changes nothing. */
export function addStaple(staples: readonly string[], name: string): string[] {
  const staple = name.trim().toLowerCase();
  return !staple || staples.includes(staple) ? [...staples] : [...staples, staple];
}

export const removeStaple = (staples: readonly string[], name: string) => staples.filter((s) => s !== name);

/** Saves a recipe (newest first), or unsaves it if it is already saved. */
export function toggleSaved(saved: readonly Recipe[], recipe: Recipe): Recipe[] {
  return saved.some((r) => r.id === recipe.id) ? saved.filter((r) => r.id !== recipe.id) : [recipe, ...saved];
}
