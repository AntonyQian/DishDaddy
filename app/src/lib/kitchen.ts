// The user's Staples and Equipment, which feed every RecipeSearchRequest.
// Stub: returns the defaults until T12 stores them on the device.

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

export async function loadStaples(): Promise<string[]> {
  return [...DEFAULT_STAPLES];
}

export async function loadEquipment(): Promise<string[]> {
  return [...DEFAULT_EQUIPMENT];
}
