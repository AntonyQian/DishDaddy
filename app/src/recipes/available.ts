import type { RecipeSearchRequest } from '@fridge/shared';
import { loadEquipment, loadStaples } from '@/lib/kitchen';
import { loadLatestScan } from '@/lib/latestScan';
import { buildSearchRequest } from './recipeMatch';

/** The RecipeSearchRequest for the latest Scan plus the user's Staples and Equipment. */
export async function loadSearchRequest(): Promise<RecipeSearchRequest> {
  const [latest, staples, equipment] = await Promise.all([loadLatestScan(), loadStaples(), loadEquipment()]);
  return buildSearchRequest(latest, staples, equipment);
}
