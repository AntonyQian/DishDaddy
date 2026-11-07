// Stand-in ingredient list until T8 builds the real one from the recipe
// collection. The server normalises Detections to it, and the app falls back
// to it when GET /ingredients is not available yet.
export const FIXTURE_INGREDIENTS: readonly string[] = [
  'almond milk', 'apple', 'aubergine', 'avocado', 'bacon', 'baking powder',
  'banana', 'basil', 'bay leaf', 'beef mince', 'bell pepper', 'black pepper',
  'blueberries', 'bread', 'broccoli', 'brown sugar', 'butter', 'buttermilk',
  'cabbage', 'carrot', 'cauliflower', 'celery', 'cheddar cheese', 'chicken breast',
  'chicken stock', 'chicken thigh', 'chickpeas', 'chilli', 'chilli powder',
  'chives', 'chocolate', 'cinnamon', 'coconut milk', 'cod', 'coriander',
  'courgette', 'cream', 'cream cheese', 'cucumber', 'cumin', 'dijon mustard',
  'egg', 'feta cheese', 'fish sauce', 'flour', 'garlic', 'ginger', 'grapes',
  'greek yogurt', 'ham', 'honey', 'hummus', 'jam', 'kale', 'ketchup', 'leek',
  'lemon', 'lettuce', 'lime', 'mango', 'maple syrup', 'mayonnaise', 'milk',
  'mint', 'mozzarella', 'mushroom', 'mustard', 'oat milk', 'oats', 'olive oil',
  'olives', 'onion', 'orange', 'oregano', 'paprika', 'parmesan', 'parsley',
  'pasta', 'peanut butter', 'pear', 'peas', 'pesto', 'pickles', 'pork chop',
  'potato', 'prawns', 'red onion', 'rice', 'rosemary', 'salami', 'salmon',
  'salsa', 'salt', 'sausage', 'shallot', 'soy milk', 'soy sauce', 'soured cream',
  'spinach', 'spring onion', 'strawberries', 'sugar', 'sweet potato',
  'sweetcorn', 'thyme', 'tofu', 'tomato', 'tomato paste', 'tortilla', 'tuna',
  'turkey', 'vanilla extract', 'vegetable oil', 'vinegar', 'yogurt',
];
