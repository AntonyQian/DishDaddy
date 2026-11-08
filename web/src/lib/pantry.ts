// What the Kitchen screen shows for each confirmed Ingredient: a group and a picture. Both are guessed from the name.

export const CATEGORIES = ['Vegetables', 'Proteins', 'Dairy & Eggs', 'Staples', 'Sauces & Spices', 'Other'] as const;
export type Category = (typeof CATEGORIES)[number];

// Checked in this order, so "black pepper" is a spice before "pepper" can make it a vegetable.
const RULES: [Category, string[]][] = [
  ['Sauces & Spices', [
    'sauce', 'spice', 'powder', 'salt', 'black pepper', 'pepper flakes', 'cumin', 'paprika', 'cinnamon', 'oregano', 'thyme',
    'rosemary', 'bay leaf', 'vinegar', 'ketchup', 'mustard', 'mayonnaise', 'honey', 'jam', 'syrup', 'stock', 'seasoning',
    'chilli', 'cayenne', 'nutmeg', 'turmeric', 'vanilla', 'paste', 'peanut butter', 'pesto', 'salsa', 'hummus',
  ]],
  ['Dairy & Eggs', ['egg', 'milk', 'cheese', 'butter', 'cream', 'yogurt', 'yoghurt', 'mozzarella', 'parmesan', 'feta', 'ricotta', 'cheddar']],
  ['Proteins', [
    'chicken', 'beef', 'pork', 'bacon', 'ham', 'sausage', 'salami', 'turkey', 'tuna', 'salmon', 'cod', 'prawn', 'shrimp',
    'tofu', 'chickpea', 'lentil', 'bean', 'lamb', 'fish', 'mince',
  ]],
  ['Staples', ['rice', 'pasta', 'flour', 'bread', 'oats', 'sugar', 'tortilla', 'noodle', 'cornmeal', 'oil', 'baking', 'yeast', 'couscous', 'quinoa']],
  ['Vegetables', [
    'spinach', 'tomato', 'onion', 'garlic', 'carrot', 'potato', 'broccoli', 'lettuce', 'cucumber', 'pepper', 'mushroom', 'leek',
    'cabbage', 'courgette', 'aubergine', 'avocado', 'apple', 'banana', 'lemon', 'lime', 'orange', 'berr', 'grape', 'mango',
    'pear', 'kale', 'celery', 'cauliflower', 'corn', 'pea', 'ginger', 'shallot', 'coriander', 'parsley', 'basil', 'mint',
    'chive', 'herb', 'pumpkin', 'squash', 'beet', 'radish', 'olive', 'pickle',
  ]],
];

export function categoryOf(ingredient: string): Category {
  const name = ingredient.toLowerCase();
  return RULES.find(([, words]) => words.some((w) => name.includes(w)))?.[0] ?? 'Other';
}

/** Per group, how many of the Ingredients fall in it, in the design's order; groups with none are left out. */
export function categoriesOf(ingredients: readonly string[]): [Category, number][] {
  return CATEGORIES.map((c) => [c, ingredients.filter((i) => categoryOf(i) === c).length] as [Category, number]).filter(([, n]) => n > 0);
}

const PICTURES: [string, string][] = [
  ['egg', '🥚'], ['milk', '🥛'], ['cheese', '🧀'], ['butter', '🧈'], ['tomato', '🍅'], ['potato', '🥔'], ['carrot', '🥕'],
  ['onion', '🧅'], ['garlic', '🧄'], ['broccoli', '🥦'], ['spinach', '🥬'], ['lettuce', '🥬'], ['kale', '🥬'], ['cabbage', '🥬'],
  ['mushroom', '🍄'], ['chicken', '🍗'], ['bacon', '🥓'], ['beef', '🥩'], ['pork', '🥩'], ['mince', '🥩'], ['steak', '🥩'],
  ['salmon', '🐟'], ['tuna', '🐟'], ['cod', '🐟'], ['fish', '🐟'], ['prawn', '🦐'], ['shrimp', '🦐'], ['rice', '🍚'],
  ['pasta', '🍝'], ['noodle', '🍝'], ['bread', '🍞'], ['apple', '🍎'], ['banana', '🍌'], ['lemon', '🍋'], ['lime', '🍋'],
  ['orange', '🍊'], ['strawberr', '🍓'], ['avocado', '🥑'], ['corn', '🌽'], ['bell pepper', '🫑'], ['cucumber', '🥒'],
  ['honey', '🍯'], ['olive', '🫒'],
];

const GROUP_PICTURE: Record<Category, string> = {
  Vegetables: '🥬', Proteins: '🍗', 'Dairy & Eggs': '🥛', Staples: '🌾', 'Sauces & Spices': '🧂', Other: '🍽️',
};

export function emojiFor(ingredient: string): string {
  const name = ingredient.toLowerCase();
  return PICTURES.find(([w]) => name.includes(w))?.[1] ?? GROUP_PICTURE[categoryOf(ingredient)];
}
