import { describe, expect, it } from 'vitest';
import { CRUCIBLE_IDS, deriveUnlockedArmorSlots } from '@/game/crucible/crucible';
import { ARMOR_BASES, armorEffects, createArmorItem, createTeamArmor, innateValue } from './armor';

describe('Armory armor (ITEMS §1)', () => {
  it('unlocks exactly one team-wide permanent slot per rank in the specified order', () => {
    expect(deriveUnlockedArmorSlots({})).toEqual([]);
    expect(deriveUnlockedArmorSlots({ [CRUCIBLE_IDS.armory]: 1 })).toEqual(['chest']);
    expect(deriveUnlockedArmorSlots({ [CRUCIBLE_IDS.armory]: 2 })).toEqual(['chest', 'legs']);
    expect(deriveUnlockedArmorSlots({ [CRUCIBLE_IDS.armory]: 3 })).toEqual([
      'chest',
      'legs',
      'head',
    ]);
    expect(deriveUnlockedArmorSlots({ [CRUCIBLE_IDS.armory]: 4 })).toEqual([
      'chest',
      'legs',
      'head',
      'feet',
    ]);
  });

  it('creates a canonical Common +1 base with the fixed slot type and innate for every character', () => {
    const armor = createTeamArmor({ [CRUCIBLE_IDS.armory]: 4 });

    const commonLayers = {
      rarity: 'common',
      itemLevel: 1,
      sockets: [],
      prismaticSockets: [],
    } as const;
    for (const loadout of Object.values(armor)) {
      expect(loadout).toEqual({
        chest: { slot: 'chest', itemType: 'armor', innate: 'toughness', ...commonLayers },
        legs: { slot: 'legs', itemType: 'legguards', innate: 'toughness', ...commonLayers },
        head: { slot: 'head', itemType: 'helmet', innate: 'vitality', ...commonLayers },
        feet: { slot: 'feet', itemType: 'boots', innate: 'initiative', ...commonLayers },
      });
    }
  });

  it('maps Head to Vitality, Chest and Legs to Toughness, and Feet to Initiative', () => {
    const armor = createTeamArmor({ [CRUCIBLE_IDS.armory]: 4 });
    const effects = armorEffects(armor.korvin);

    expect(effects).toEqual({
      coreStats: { might: 0, toughness: 2, vitality: 1 },
      initiative: 1,
    });
  });

  it('keeps the item-level curve as explicit balancing content starting at +1 = 1', () => {
    expect(ARMOR_BASES.chest.innate).toBe('toughness');
    expect(innateValue(createArmorItem('chest'))).toBe(1);
  });

  it('scales the innate value strictly monotonically over the full temper range up to +100', () => {
    for (const slot of ['chest', 'legs', 'head', 'feet'] as const) {
      let previous = 0;
      for (let itemLevel = 1; itemLevel <= 100; itemLevel += 1) {
        const value = innateValue({ ...createArmorItem(slot), itemLevel });
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThan(previous);
        previous = value;
      }
    }
  });

  it('feeds the innate value at the current item level into the armor effects', () => {
    const tempered = {
      ...createTeamArmor({ [CRUCIBLE_IDS.armory]: 4 }).korvin,
      chest: { ...createArmorItem('chest'), rarity: 'magic', itemLevel: 40 } as const,
    };

    const effects = armorEffects(tempered);

    const chestValue = innateValue({ ...createArmorItem('chest'), itemLevel: 40 });
    expect(chestValue).toBeGreaterThan(1);
    // Chest (Item-Level 40) + Legs (+1) speisen Toughness; Head und Feet bleiben bei +1.
    expect(effects).toEqual({
      coreStats: { might: 0, toughness: chestValue + 1, vitality: 1 },
      initiative: 1,
    });
  });
});
