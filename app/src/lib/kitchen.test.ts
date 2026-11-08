import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => void store.set(k, v),
  },
}));

import {
  addStaple, DEFAULT_EQUIPMENT, DEFAULT_STAPLES, loadEquipment, loadStaples, removeStaple, saveEquipment, saveStaples,
  toggleEquipment,
} from './kitchen';

beforeEach(() => store.clear());

describe('Staples and Equipment on the device', () => {
  it('starts with the default Staples and Equipment on first run', async () => {
    expect(await loadStaples()).toEqual(DEFAULT_STAPLES);
    expect(await loadEquipment()).toEqual(['hob', 'oven', 'grill', 'microwave']);
    expect(DEFAULT_EQUIPMENT).toContain('oven');
  });

  it('remembers Equipment after "oven" is unticked', async () => {
    await saveEquipment(toggleEquipment(await loadEquipment(), 'oven'));
    expect(await loadEquipment()).toEqual(['hob', 'grill', 'microwave']);
  });

  it('remembers Staples the user removed and added, tidied and without duplicates', async () => {
    let staples = removeStaple(await loadStaples(), 'sugar');
    staples = addStaple(staples, '  Soy Sauce ');
    staples = addStaple(staples, 'salt');
    await saveStaples(staples);
    const loaded = await loadStaples();
    expect(loaded).not.toContain('sugar');
    expect(loaded.filter((s) => s === 'salt')).toHaveLength(1);
    expect(loaded.at(-1)).toBe('soy sauce');
  });

  it('can empty the Staples list without the defaults coming back', async () => {
    await saveStaples([]);
    expect(await loadStaples()).toEqual([]);
  });
});
