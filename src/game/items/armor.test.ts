import { describe, expect, it } from 'vitest';
import { CRUCIBLE_IDS, deriveUnlockedArmorSlots } from '@/game/crucible/crucible';
import { ARMOR_BASES, armorEffects, createTeamArmor, innateValue } from './armor';

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

    for (const loadout of Object.values(armor)) {
      expect(loadout).toEqual({
        chest: {
          slot: 'chest',
          itemType: 'armor',
          rarity: 'common',
          itemLevel: 1,
          innate: 'toughness',
        },
        legs: {
          slot: 'legs',
          itemType: 'legguards',
          rarity: 'common',
          itemLevel: 1,
          innate: 'toughness',
        },
        head: {
          slot: 'head',
          itemType: 'helmet',
          rarity: 'common',
          itemLevel: 1,
          innate: 'vitality',
        },
        feet: {
          slot: 'feet',
          itemType: 'boots',
          rarity: 'common',
          itemLevel: 1,
          innate: 'initiative',
        },
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

  it('keeps the item-level curve as explicit balancing content', () => {
    expect(ARMOR_BASES.chest.innate).toBe('toughness');
    expect(
      innateValue({
        slot: 'chest',
        itemType: 'armor',
        rarity: 'common',
        itemLevel: 1,
        innate: 'toughness',
      }),
    ).toBe(1);
  });
});
