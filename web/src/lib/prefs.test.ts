import { describe, expect, it } from 'vitest';
import { addStaple, ALL_EQUIPMENT, DEFAULT_EQUIPMENT, equipmentLabel, normaliseEquipment, removeStaple, toggleEquipment, toggleSaved } from './prefs';
import type { Recipe } from '@fridge/shared';

describe('Equipment', () => {
  it('is exactly the twelve appliances we support, in this order', () => {
    expect(ALL_EQUIPMENT).toEqual([
      'hob', 'oven', 'grill', 'microwave', 'blender', 'mixer', 'meat grinder',
      'slow cooker', 'toaster', 'rice cooker', 'air fryer', 'pressure cooker',
    ]);
    expect(DEFAULT_EQUIPMENT).toEqual(['hob', 'oven', 'grill', 'microwave']);
  });

  it('shows friendly names', () => {
    expect(equipmentLabel('hob')).toBe('Hob / stove');
    expect(equipmentLabel('mixer')).toBe('Mixers');
    expect(equipmentLabel('air fryer')).toBe('Air fryer');
  });

  it('turns old names into current ones, once each, and drops the rest', () => {
    expect(normaliseEquipment(['hand mixer', 'stand mixer', 'food processor', 'oven', 'toaster oven', 'stove'])).toEqual(['hob', 'oven', 'blender', 'mixer']);
  });

  it('ticks and unticks one appliance, keeping the display order', () => {
    expect(toggleEquipment(['hob', 'oven'], 'blender')).toEqual(['hob', 'oven', 'blender']);
    expect(toggleEquipment(['hob', 'oven', 'blender'], 'oven')).toEqual(['hob', 'blender']);
  });
});

describe('Staples', () => {
  it('adds one tidied and without repeats, and removes one', () => {
    expect(addStaple(['salt'], '  Soy Sauce ')).toEqual(['salt', 'soy sauce']);
    expect(addStaple(['salt'], 'salt')).toEqual(['salt']);
    expect(addStaple(['salt'], '   ')).toEqual(['salt']);
    expect(removeStaple(['salt', 'sugar'], 'salt')).toEqual(['sugar']);
  });
});

describe('toggleSaved', () => {
  const r = (id: string) => ({ id, name: id, servings: 1, ingredients: [], equipment: [], cuisine: '', minutes: 1, steps: [], highProtein: false }) as Recipe;
  it('saves a recipe at the front, and unsaves it on the second tap', () => {
    const once = toggleSaved([r('a')], r('b'));
    expect(once.map((x) => x.id)).toEqual(['b', 'a']);
    expect(toggleSaved(once, r('b')).map((x) => x.id)).toEqual(['a']);
  });
});
