// How the Staples screen groups what the user always has on hand. Names are matched by their words, in this order.

export const STAPLE_GROUPS = ['Sauces & condiments', 'Seasonings & spices', 'Oils & fats', 'Baking & pantry', 'Other'] as const;
export type StapleGroup = (typeof STAPLE_GROUPS)[number];

// Cases a plain word list would get wrong, checked first.
const EXACT: [RegExp, StapleGroup][] = [
  [/peanut butter|nut butter/, 'Sauces & condiments'],
  [/baking (powder|soda)|bicarb/, 'Baking & pantry'],
  [/mustard (powder|seed)|dry mustard|ground mustard/, 'Seasonings & spices'],
];

const RULES: [StapleGroup, string[]][] = [
  ['Baking & pantry', [
    'flour', 'sugar', 'yeast', 'cornflour', 'cornstarch', 'cocoa', 'vanilla', 'oats', 'rice', 'pasta', 'noodle', 'bread',
    'couscous', 'quinoa', 'cornmeal', 'chocolate', 'sprinkles', 'gelatin',
  ]],
  ['Oils & fats', ['oil', 'butter', 'ghee', 'lard', 'shortening', 'margarine']],
  ['Sauces & condiments', [
    'sauce', 'ketchup', 'mustard', 'mayonnaise', 'vinegar', 'honey', 'syrup', 'jam', 'paste', 'pesto', 'salsa', 'dressing',
    'stock', 'broth', 'bouillon', 'hummus', 'tahini', 'miso',
  ]],
  ['Seasonings & spices', [
    'salt', 'pepper', 'cumin', 'paprika', 'cinnamon', 'oregano', 'thyme', 'rosemary', 'basil', 'bay leaf', 'chilli', 'cayenne',
    'nutmeg', 'turmeric', 'ginger', 'seasoning', 'spice', 'herb', 'powder', 'coriander', 'parsley', 'garlic', 'cardamom', 'clove',
  ]],
];

export function stapleGroupOf(staple: string): StapleGroup {
  const name = staple.toLowerCase();
  const exact = EXACT.find(([pattern]) => pattern.test(name));
  if (exact) return exact[1];
  return RULES.find(([, words]) => words.some((w) => name.includes(w)))?.[0] ?? 'Other';
}

/** The Staples in their groups, in a fixed group order, A to Z inside each; groups with none are left out. */
export function groupStaples(staples: readonly string[]): [StapleGroup, string[]][] {
  return STAPLE_GROUPS.map((group) => [
    group,
    staples.filter((s) => stapleGroupOf(s) === group).sort((a, b) => a.localeCompare(b)),
  ] as [StapleGroup, string[]]).filter(([, items]) => items.length > 0);
}
