/** Common names the models use that the ingredient list spells differently. */
const SYNONYMS: Record<string, string> = {
  scallion: 'spring onion',
  'green onion': 'spring onion',
  cilantro: 'coriander',
  zucchini: 'courgette',
  eggplant: 'aubergine',
  yoghurt: 'yogurt',
  'greek yoghurt': 'greek yogurt',
  'sour cream': 'soured cream',
  capsicum: 'bell pepper',
  shrimp: 'prawns',
  prawn: 'prawns',
  'ground beef': 'beef mince',
  'minced beef': 'beef mince',
  corn: 'sweetcorn',
  'heavy cream': 'cream',
  'double cream': 'cream',
  'single cream': 'cream',
  'whole milk': 'milk',
  'semi-skimmed milk': 'milk',
  'skimmed milk': 'milk',
  catsup: 'ketchup',
  'tomato ketchup': 'ketchup',
  chili: 'chilli',
  'chili powder': 'chilli powder',
  'cheddar': 'cheddar cheese',
  'feta': 'feta cheese',
};

/** Candidate singular forms of a word: "tomatoes" → tomato, "berries" → berry. */
function singulars(word: string): string[] {
  const out: string[] = [];
  if (word.endsWith('ies')) out.push(`${word.slice(0, -3)}y`);
  if (word.endsWith('oes') || word.endsWith('ches') || word.endsWith('shes')) out.push(word.slice(0, -2));
  if (word.endsWith('s') && !word.endsWith('ss')) out.push(word.slice(0, -1));
  return out;
}

/**
 * Builds a function that maps a model's name for an item to the ingredient
 * list's name, or null when it doesn't match anything on the list.
 */
export function createNormaliser(vocabulary: readonly string[]): (name: string) => string | null {
  const known = new Set(vocabulary.map((v) => v.toLowerCase()));
  const lookup = (n: string) => {
    if (known.has(n)) return n;
    const synonym = SYNONYMS[n];
    return synonym && known.has(synonym) ? synonym : null;
  };

  return (name) => {
    const n = name.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!n) return null;
    const direct = lookup(n);
    if (direct) return direct;
    // Singularise the last word only: "spring onions" → "spring onion".
    const words = n.split(' ');
    const last = words.pop()!;
    for (const s of singulars(last)) {
      const hit = lookup([...words, s].join(' '));
      if (hit) return hit;
    }
    return null;
  };
}
