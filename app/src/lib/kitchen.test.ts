import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => void store.set(k, v),
  },
}));

import {
  ALL_EQUIPMENT, equipmentLabel, normaliseEquipment,
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

describe('the Equipment list', () => {
  it('is exactly the twelve appliances we support, in this order', () => {
    expect(ALL_EQUIPMENT).toEqual([
      'hob', 'oven', 'grill', 'microwave', 'blender', 'mixer', 'meat grinder',
      'slow cooker', 'toaster', 'rice cooker', 'air fryer', 'pressure cooker',
    ]);
  });

  it('shows friendly names', () => {
    expect(equipmentLabel('hob')).toBe('Hob / stove');
    expect(equipmentLabel('mixer')).toBe('Mixers');
    expect(equipmentLabel('meat grinder')).toBe('Meat grinder');
    expect(equipmentLabel('air fryer')).toBe('Air fryer');
  });

  it('turns names saved by older versions into the current ones, once each, and drops the rest', () => {
    expect(normaliseEquipment(['hand mixer', 'stand mixer', 'food processor', 'oven', 'toaster oven', 'stove']))
      .toEqual(['hob', 'oven', 'blender', 'mixer']);
  });

  it('migrates Equipment already stored on the device', async () => {
    store.set('equipment', JSON.stringify(['hob', 'hand mixer', 'food processor']));
    expect(await loadEquipment()).toEqual(['hob', 'blender', 'mixer']);
  });
});
