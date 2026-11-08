import type { Substitution } from '@fridge/shared';
import { norm } from '../recipes/search';

/**
 * Model output is untrusted: keep only swaps for this Recipe's Missing
 * Ingredients made entirely from what the user has, one per distinct swap.
 * Names come back in the Recipe's and the user's own spelling.
 */
export function filterSubstitutions(proposed: Substitution[], missing: string[], available: string[]): Substitution[] {
  const missingByNorm = new Map(missing.map((m) => [norm(m), m]));
  const availableByNorm = new Map(available.map((a) => [norm(a), a]));
  const seen = new Set<string>();
  const out: Substitution[] = [];

  for (const s of proposed) {
    const target = missingByNorm.get(norm(s.missing));
    if (!target || s.use.length === 0) continue;
    const use = [...new Set(s.use.map(norm))].map((u) => availableByNorm.get(u));
    if (use.some((u) => u === undefined)) continue;
    const key = `${norm(target)}|${use.map((u) => norm(u!)).sort().join('+')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const note = s.note?.trim();
    out.push({ missing: target, use: use as string[], ...(note ? { note } : {}) });
  }
  return out;
}
