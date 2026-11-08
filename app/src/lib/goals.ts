// The user's daily protein and calorie targets, stored on the device. Recipes show how much of them one serving covers.
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Goals {
  proteinGrams: number;
  calories: number;
}

export const DEFAULT_GOALS: Goals = { proteinGrams: 100, calories: 2000 };

const KEY = 'goals';

const LIMITS = {
  proteinGrams: { min: 20, max: 300, step: 5 },
  calories: { min: 1000, max: 5000, step: 50 },
} as const;

const sensible = (key: keyof Goals, value: unknown): value is number =>
  typeof value === 'number' && value >= LIMITS[key].min && value <= LIMITS[key].max;

export async function loadGoals(): Promise<Goals> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && sensible('proteinGrams', parsed.proteinGrams) && sensible('calories', parsed.calories)) {
      return { proteinGrams: parsed.proteinGrams, calories: parsed.calories };
    }
  } catch {
    // unreadable storage: use the defaults
  }
  return { ...DEFAULT_GOALS };
}

export async function saveGoals(goals: Goals): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(goals));
}

/** One tap of the + or − button, kept within the limits. */
export function stepGoal(key: keyof Goals, value: number, direction: 1 | -1): number {
  const { min, max, step } = LIMITS[key];
  return Math.min(max, Math.max(min, value + direction * step));
}

/** What share of a daily goal an amount covers, as a whole percent; null when it can't be worked out. */
export function percentOfGoal(amount: number | undefined, goal: number): number | null {
  return amount === undefined || goal <= 0 ? null : Math.round((amount / goal) * 100);
}
