// Scaling a Recipe to a number of servings: ingredient amounts, the amounts mentioned in steps, and nutrition.

const NUM = String.raw`\d+(?:\s+\d+/\d+|/\d+|\.\d+)?`;
const AMOUNT = new RegExp(String.raw`^\s*(${NUM})(?:\s*[-–]\s*(${NUM}))?\s*(.*)$`);

/** "1 1/2" is 1.5, "1/2" is 0.5, "3" is 3. */
function valueOf(text: string): number {
  return text.trim().split(/\s+/).reduce((sum, part) => {
    const [a, b] = part.split('/').map(Number);
    return sum + (b ? a / b : a);
  }, 0);
}

// What a measure is snapped to: eighths, plus thirds, so 2/3 of an ounce does not become 5/8.
const FRACTIONS: [number, string][] = [
  [0, ''], [1 / 8, '1/8'], [1 / 4, '1/4'], [1 / 3, '1/3'], [3 / 8, '3/8'], [1 / 2, '1/2'],
  [5 / 8, '5/8'], [2 / 3, '2/3'], [3 / 4, '3/4'], [7 / 8, '7/8'], [1, ''],
];

/** 2.667 is "2 2/3", 0.5 is "1/2", 3 is "3". */
function formatFraction(x: number): string {
  let whole = Math.floor(x + 1e-9);
  const rest = x - whole;
  const [value, text] = FRACTIONS.reduce((best, f) => (Math.abs(f[0] - rest) < Math.abs(best[0] - rest) ? f : best));
  if (value === 1) whole += 1;
  return [whole > 0 || !text ? String(whole) : '', value === 1 ? '' : text].filter(Boolean).join(' ');
}

const PLURALS: Record<string, string> = {
  cup: 'cups', clove: 'cloves', can: 'cans', package: 'packages', stick: 'sticks', slice: 'slices', sprig: 'sprigs', bunch: 'bunches',
};
const SINGULARS = Object.fromEntries(Object.entries(PLURALS).map(([one, many]) => [many, one]));

const MEASURES = new Set(['cup', 'cups', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'kg', 'ml', 'l']);
const UNSCALED = new Set(['pinch', 'dash']);

/** Formats a number of a measure, switching to a smaller measure when it is small. */
function formatMeasure(unit: string, value: number): { text: string; unit: string } {
  let u = unit === 'cups' ? 'cup' : unit;
  let v = value;
  if (u === 'cup' && v < 1 / 4) { v *= 16; u = 'tbsp'; }
  if (u === 'tbsp' && v < 1) { v *= 3; u = 'tsp'; }
  if (u === 'lb' && v < 1 / 4) { v *= 16; u = 'oz'; }
  if (u === 'tsp' && v < 1 / 8) return { text: '1', unit: 'pinch' };
  if (u === 'g' || u === 'ml') return { text: String(v >= 20 ? Math.round(v / 5) * 5 : Math.round(v)), unit: u };
  return { text: formatFraction(v), unit: u };
}

/** Things you count are rounded to the nearest half, and never to nothing. */
const formatCount = (value: number) => formatFraction(Math.max(0.5, Math.round(value * 2) / 2));

/**
 * An ingredient amount at another size: "1 1/2 cups" is "1/2 cup" at a third, "1 tbsp" is "1 tsp".
 * Amounts that are not a number ("to taste", "1 pinch") stay as they are.
 */
export function scaleAmount(amount: string, factor: number): string {
  const m = AMOUNT.exec(amount);
  if (!m || factor === 1) return amount;
  const [, lowText, highText, rest] = m;
  const [first = '', ...more] = rest.split(' ');
  const word = first.toLowerCase();
  if (UNSCALED.has(word)) return amount;

  const lo = valueOf(lowText) * factor;
  const hi = highText ? valueOf(highText) * factor : undefined;
  const tail = more.length ? ` ${more.join(' ')}` : '';

  if (MEASURES.has(word)) {
    const a = formatMeasure(word, lo);
    const b = hi === undefined ? undefined : formatMeasure(word, hi);
    // a range stays in one unit: use the smaller unit's conversion only when both ends agree
    const unit = b && b.unit !== a.unit ? word : a.unit;
    const range = b && b.unit === a.unit ? `${a.text}-${b.text}` : b ? `${formatFraction(lo)}-${formatFraction(hi!)}` : a.text;
    const shown = unit === 'pinch' ? '1' : range;
    const top = hi ?? lo;
    const name = unit === 'cup' ? (top > 1 ? 'cups' : 'cup') : unit;
    return `${shown} ${name}${tail}`.trim();
  }

  // counted things: "3 large", "2 cloves", "1 can", or a bare number
  const text = hi === undefined ? formatCount(lo) : `${formatCount(lo)}-${formatCount(hi)}`;
  const one = SINGULARS[word] ?? (word in PLURALS ? word : undefined);
  const unit = one ? (Math.max(lo, hi ?? lo) > 1 ? PLURALS[one] : one) : first;
  return `${text}${unit ? ` ${unit}` : ''}${tail}`.trim();
}

const STEP_MEASURE = new RegExp(String.raw`(?<![\d/.])(${NUM}(?:\s*[-–]\s*${NUM})?)\s*(cups?|tbsp|tsp|oz|lb|g|kg|ml)\b`, 'gi');

/** The measured amounts written in a step, scaled; times, temperatures and pan sizes are left alone. */
export function scaleStep(step: string, factor: number): string {
  if (factor === 1) return step;
  return step.replace(STEP_MEASURE, (_whole, qty: string, unit: string) => scaleAmount(`${qty} ${unit}`, factor));
}

/** Per-serving calories and protein, for a number of servings. Whatever the Recipe lacks stays out. */
export function portionNutrition(
  perServing: { calories?: number; proteinGrams?: number },
  servings: number,
): { calories?: number; proteinGrams?: number } {
  return {
    ...(perServing.calories !== undefined && { calories: Math.round(perServing.calories * servings) }),
    ...(perServing.proteinGrams !== undefined && { proteinGrams: Math.round(perServing.proteinGrams * servings) }),
  };
}

/** Some fonts draw the space in "1 1/2" so narrow that it reads "11/2"; an en space keeps the two apart. */
export const spaceFractions = (text: string) => text.replace(/(\d) (\d+\/\d+)/g, '$1\u2002$2');
