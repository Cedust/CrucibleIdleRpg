import { describe, expect, it } from 'vitest';
import { createArmorItem } from '@/game/items/armor';
import {
  AMBER_AFFIXES,
  EMERALD_AFFIXES,
  RUBY_AFFIXES,
  SAPPHIRE_AFFIXES,
  type ArmorLoadout,
} from '@/game/types';
import { GEM_POOLS, GEM_VALUE_RANGES, gemEffects, gemValueRange } from './gems';

describe('GEM_POOLS (ITEMS §8)', () => {
  it('bindet jede Farbe an ihren Stat-Kategorie-Pool', () => {
    expect(GEM_POOLS.amber).toEqual(AMBER_AFFIXES);
    expect(GEM_POOLS.ruby).toEqual(RUBY_AFFIXES);
    expect(GEM_POOLS.sapphire).toEqual(SAPPHIRE_AFFIXES);
    expect(GEM_POOLS.emerald).toEqual(EMERALD_AFFIXES);
  });

  it('trägt für jeden Affix eine nicht-leere Range mit min ≤ max', () => {
    const affixes = Object.values(GEM_POOLS).flat();
    expect(new Set(affixes).size).toBe(Object.keys(GEM_VALUE_RANGES).length);
    for (const affix of affixes) {
      const range = GEM_VALUE_RANGES[affix];
      expect(range.min).toBeGreaterThan(0);
      expect(range.max).toBeGreaterThanOrEqual(range.min);
    }
  });
});

describe('gemValueRange (ITEMS §8)', () => {
  it('liefert auf Level 1 exakt die Basis-Range', () => {
    for (const affix of Object.values(GEM_POOLS).flat()) {
      expect(gemValueRange(affix, 1)).toEqual(GEM_VALUE_RANGES[affix]);
    }
  });

  it('hebt die Range je Level streng monoton an beiden Grenzen', () => {
    for (let level = 2; level <= 5; level += 1) {
      const previous = gemValueRange('might', level - 1);
      const current = gemValueRange('might', level);
      expect(current.min).toBeGreaterThan(previous.min);
      expect(current.max).toBeGreaterThan(previous.max);
      expect(current.max).toBeGreaterThan(current.min);
    }
  });
});

describe('gemEffects (ITEMS §8)', () => {
  function loadoutWithGems(): ArmorLoadout {
    return {
      chest: {
        ...createArmorItem('chest'),
        rarity: 'rare',
        sockets: [
          { color: 'amber', affix: 'critChance', gemLevel: 1, value: 0.02 },
          { color: 'emerald', affix: 'might', gemLevel: 1, value: 2 },
        ],
      },
      head: {
        ...createArmorItem('head'),
        rarity: 'magic',
        sockets: [{ color: 'sapphire', affix: 'barrier', gemLevel: 1, value: 4 }],
      },
    };
  }

  it('aggregiert Amber/Ruby in Offensive, Sapphire in Defensive, Emerald in Core', () => {
    const effects = gemEffects(loadoutWithGems());

    expect(effects.offensive.critChance).toBeCloseTo(0.02);
    expect(effects.core.might).toBe(2);
    expect(effects.defensive.barrier).toBe(4);
    expect(effects.core.toughness).toBe(0);
    expect(effects.offensive.critDamage).toBe(0);
  });

  it('summiert gleiche Affixe über Sockel und Slots hinweg', () => {
    const loadout: ArmorLoadout = {
      chest: {
        ...createArmorItem('chest'),
        rarity: 'rare',
        sockets: [
          { color: 'ruby', affix: 'critDamage', gemLevel: 1, value: 0.1 },
          { color: 'ruby', affix: 'critDamage', gemLevel: 1, value: 0.05 },
        ],
      },
      legs: {
        ...createArmorItem('legs'),
        rarity: 'magic',
        sockets: [{ color: 'ruby', affix: 'critDamage', gemLevel: 1, value: 0.02 }],
      },
    };

    expect(gemEffects(loadout).offensive.critDamage).toBeCloseTo(0.17);
  });

  it('liefert für leere Sockel und fehlende Slots überall den neutralen Beitrag 0', () => {
    const effects = gemEffects({ chest: createArmorItem('chest') });

    expect(Object.values(effects.core).every((value) => value === 0)).toBe(true);
    expect(Object.values(effects.offensive).every((value) => value === 0)).toBe(true);
    expect(Object.values(effects.defensive).every((value) => value === 0)).toBe(true);
  });
});
