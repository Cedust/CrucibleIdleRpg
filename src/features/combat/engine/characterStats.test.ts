import { describe, expect, it } from 'vitest';
import { CHARACTERS, TEAM_ORDER } from '@/game/characters/characters';
import { CRUCIBLE_IDS } from '@/game/crucible/crucible';
import { ATTRIBUTE_BONUS_PER_POINT } from '@/game/curves/characterCurves';
import { createTeamArmor } from '@/game/items/armor';
import { createDefaultSave } from '@/features/save/saveSchema';
import type { CharacterDefinition } from '@/game/types';
import { nodeById } from '@/game/weaponMastery/mastery';
import {
  deriveCharacterStats,
  effectiveStatsFromSave,
  neutralProgression,
  progressionFromSave,
  type CharacterProgression,
} from './characterStats';

const PROBAND: CharacterDefinition = {
  id: 'korvin',
  name: 'Proband',
  role: 'tank',
  baseCore: { might: 0, toughness: 0, vitality: 0 },
  baseDerived: { defense: 200, health: 400 },
  weapon: { baseDamage: 100, damageRange: { min: 0.9, max: 1.1 }, precision: 0.75 },
  baseOffensive: {
    critChance: 0.11,
    critDamage: 1.7,
    multiHitChance: 0.12,
    multiHitDamage: 0.55,
    splashChance: 0.13,
    splashDamage: 0.45,
    counterChance: 0.14,
    counterDamage: 0.65,
  },
  baseDefensive: { barrier: 20, blockChance: 0.15, evasion: 0.06, regeneration: 7 },
  baseUtility: { initiative: 9, multiHitChain: 2, multiHitChainFactor: 0.5, splashRadius: 2 },
};

function progression(overrides: Partial<CharacterProgression> = {}): CharacterProgression {
  return { ...neutralProgression(1), ...overrides };
}

describe('deriveCharacterStats', () => {
  it('uses the same persisted progression inputs for Heroes and dungeon combat', () => {
    const base = createDefaultSave(42);
    const crucible = {
      [CRUCIBLE_IDS.armory]: 4,
      [CRUCIBLE_IDS.overpower]: 1,
      [CRUCIBLE_IDS.quickStep]: 2,
    };
    const save = {
      ...base,
      crucible,
      armor: createTeamArmor(crucible),
      characters: {
        ...base.characters,
        korvin: {
          ...base.characters.korvin,
          attributePoints: { ferocity: 2, resilience: 0, vigor: 0 },
        },
      },
    };

    expect(effectiveStatsFromSave(save, 'korvin')).toEqual(
      deriveCharacterStats(CHARACTERS.korvin, progressionFromSave(save, 'korvin')),
    );
    expect(effectiveStatsFromSave(save, 'korvin').utility.initiative).toBe(11);
  });

  it('adds bought mastery stat ranks and caps chance stats', () => {
    const stats = deriveCharacterStats(CHARACTERS.korvin, {
      ...neutralProgression(80),
      masteryRanks: { 'finesse.chc-i': 5, 'weapon.dmg-i': 5, 'weapon.def-i': 5 },
    });
    expect(stats.offensive.critChance).toBe(0.2);
    expect(stats.derived.attack).toBe(19);
    expect(stats.derived.defense).toBe(10);
  });
  it('uses the specified weapon profiles for the three level-one attack values', () => {
    expect(CHARACTERS.korvin.weapon).toEqual({
      baseDamage: 14,
      damageRange: { min: 0.7, max: 1.3 },
      precision: 0.7,
    });
    expect(CHARACTERS.rhaya.weapon).toEqual({
      baseDamage: 18,
      damageRange: { min: 0.8, max: 1.2 },
      precision: 0.8,
    });
    expect(CHARACTERS.quinn.weapon).toEqual({
      baseDamage: 20,
      damageRange: { min: 0.9, max: 1.1 },
      precision: 0.9,
    });

    for (const id of TEAM_ORDER) {
      const definition = CHARACTERS[id];
      expect(deriveCharacterStats(definition, neutralProgression(1)).derived).toEqual({
        attack: definition.weapon.baseDamage,
        ...definition.baseDerived,
      });
    }
  });

  it('reaches the spec full build: damage 24, defense 15, block chance 15 % (WEAPON-MASTERY §5.1)', () => {
    const stats = deriveCharacterStats(CHARACTERS.korvin, {
      ...neutralProgression(80),
      masteryRanks: {
        'weapon.dmg-i': 5,
        'weapon.dmg-ii': 5,
        'weapon.def-i': 5,
        'weapon.def-ii': 5,
        'weapon.blk': 5,
      },
    });

    expect(stats.derived.attack).toBe(24);
    expect(stats.derived.defense).toBe(15);
    expect(stats.defensive.blockChance).toBeCloseTo(0.15, 10);
  });

  it('applies defensive mastery nodes through the defensive branch', () => {
    const ohne = deriveCharacterStats(CHARACTERS.korvin, neutralProgression(80));
    const mit = deriveCharacterStats(CHARACTERS.korvin, {
      ...neutralProgression(80),
      masteryRanks: { 'weapon.blk': 1 },
    });

    expect(mit.defensive.blockChance).toBeGreaterThan(ohne.defensive.blockChance);
    expect(mit.defensive.blockChance).toBeLessThanOrEqual(1);
  });

  it('routes utility mastery nodes through the utility fallback', () => {
    const chainI = nodeById('korvin', 'tempest.chain-i');
    const init = nodeById('rhaya', 'weapon.init');

    expect(chainI?.perRank).toBeGreaterThan(0);
    expect(init?.perRank).toBeGreaterThan(0);

    const korvin = deriveCharacterStats(CHARACTERS.korvin, {
      ...neutralProgression(80),
      masteryRanks: { 'tempest.chain-i': 1 },
    });
    const rhaya = deriveCharacterStats(CHARACTERS.rhaya, {
      ...neutralProgression(80),
      masteryRanks: { 'weapon.init': 2 },
    });

    expect(korvin.utility.multiHitChain).toBeCloseTo(
      CHARACTERS.korvin.baseUtility.multiHitChain + (chainI?.perRank ?? 0),
      10,
    );
    expect(rhaya.utility.initiative).toBeCloseTo(
      CHARACTERS.rhaya.baseUtility.initiative + 2 * (init?.perRank ?? 0),
      10,
    );
  });

  it('caps every chance stat at 1 even for over-invested ranks', () => {
    // Absichtlich überzogene Ränge: Der Cap ist die Sicherung, kein legales Balancing.
    const stats = deriveCharacterStats(CHARACTERS.korvin, {
      ...neutralProgression(80),
      masteryRanks: {
        'finesse.chc-i': 999,
        'tempest.mhc-i': 999,
        'dominance.shc-i': 999,
        'valor.ctc-i': 999,
        'weapon.blk': 999,
      },
    });

    expect(stats.offensive.critChance).toBe(1);
    expect(stats.offensive.multiHitChance).toBe(1);
    expect(stats.offensive.splashChance).toBe(1);
    expect(stats.offensive.counterChance).toBe(1);
    expect(stats.defensive.blockChance).toBe(1);
  });

  it('leaves precision, MIN RNG and MAX RNG nodes to the combat context', () => {
    const ohne = deriveCharacterStats(CHARACTERS.korvin, neutralProgression(80));
    const mit = deriveCharacterStats(CHARACTERS.korvin, {
      ...neutralProgression(80),
      masteryRanks: { 'weapon.prc-i': 5, 'weapon.min-rng': 5, 'weapon.max-rng-i': 5 },
    });

    expect(mit).toEqual(ohne);
  });

  it('does not change derived stats automatically on level-up', () => {
    expect(deriveCharacterStats(PROBAND, progression({ level: 1 })).derived).toEqual(
      deriveCharacterStats(PROBAND, progression({ level: 100 })).derived,
    );
  });

  it('adds the quick step ranks flat onto the initiative (PROGRESSION §3.2)', () => {
    const stats = deriveCharacterStats(PROBAND, progression({ crucibleInitiative: 3 }));

    expect(stats.utility.initiative).toBe(PROBAND.baseUtility.initiative + 3);
    expect(deriveCharacterStats(PROBAND, progression()).utility.initiative).toBe(
      PROBAND.baseUtility.initiative,
    );
  });

  it('aggregiert gesockelte Gem-Affixe in Offensive, Defensive und Core (ITEMS §8)', () => {
    const base = createDefaultSave(42);
    const crucible = { [CRUCIBLE_IDS.armory]: 1 };
    const armor = createTeamArmor(crucible);
    const chest = armor.korvin.chest;
    if (chest === undefined) throw new Error('Chest fehlt');
    const save = {
      ...base,
      crucible,
      armor: {
        ...armor,
        korvin: {
          chest: {
            ...chest,
            rarity: 'rare' as const,
            sockets: [
              { color: 'amber', affix: 'critChance', gemLevel: 1, value: 0.02 } as const,
              { color: 'emerald', affix: 'might', gemLevel: 1, value: 2 } as const,
            ],
          },
        },
      },
    };
    const ohneGems = {
      ...save,
      armor: {
        ...save.armor,
        korvin: { chest: { ...chest, rarity: 'rare' as const, sockets: [null, null] } },
      },
    };

    const mit = effectiveStatsFromSave(save, 'korvin');
    const ohne = effectiveStatsFromSave(ohneGems, 'korvin');

    expect(mit.offensive.critChance).toBeCloseTo(ohne.offensive.critChance + 0.02, 10);
    expect(mit.core.might).toBe(ohne.core.might + 2);
    // Der Emerald-Might speist Attack über die Core-Schicht (CHARACTERS §2).
    expect(mit.derived.attack).toBeGreaterThan(ohne.derived.attack);
    // Heroes und Kampf lesen dieselbe Herleitung.
    expect(mit).toEqual(
      deriveCharacterStats(CHARACTERS.korvin, progressionFromSave(save, 'korvin')),
    );
  });

  it('addiert Gem-Zuschläge additiv und deckelt Chance-Stats weiterhin bei 1', () => {
    const stats = deriveCharacterStats(
      PROBAND,
      progression({
        offensiveBonus: {
          critChance: 5,
          critDamage: 0.1,
          multiHitChance: 0,
          multiHitDamage: 0,
          splashChance: 0,
          splashDamage: 0,
          counterChance: 0,
          counterDamage: 0,
        },
        defensiveBonus: { barrier: 4, blockChance: 0.02, evasion: 0, regeneration: 1.5 },
      }),
    );

    expect(stats.offensive.critChance).toBe(1);
    expect(stats.offensive.critDamage).toBeCloseTo(PROBAND.baseOffensive.critDamage + 0.1, 10);
    expect(stats.defensive.barrier).toBe(PROBAND.baseDefensive.barrier + 4);
    expect(stats.defensive.blockChance).toBeCloseTo(PROBAND.baseDefensive.blockChance + 0.02, 10);
    expect(stats.defensive.regeneration).toBeCloseTo(PROBAND.baseDefensive.regeneration + 1.5, 10);
  });

  it('scales a Gem-covered Crit Damage bonus only above its 100 percent neutral point', () => {
    const base = createDefaultSave(42);
    const crucible = { [CRUCIBLE_IDS.armory]: 1 };
    const armor = createTeamArmor(crucible);
    const chest = armor.korvin.chest;
    if (chest === undefined) throw new Error('Chest fehlt');
    const gem = { color: 'ruby', affix: 'critDamage', gemLevel: 1, value: 0.1 } as const;
    const withoutImprint = {
      ...base,
      crucible,
      armor: {
        ...armor,
        korvin: { chest: { ...chest, rarity: 'magic' as const, sockets: [gem] } },
      },
    };
    const withImprint = {
      ...withoutImprint,
      sigils: { 'sigil.burning-sentence': 3 },
      armor: {
        ...withoutImprint.armor,
        korvin: {
          chest: {
            ...withoutImprint.armor.korvin.chest,
            imprint: { sigilId: 'sigil.burning-sentence' },
          },
        },
      },
    };

    const before = effectiveStatsFromSave(withoutImprint, 'korvin').offensive.critDamage;
    const after = effectiveStatsFromSave(withImprint, 'korvin').offensive.critDamage;

    expect(after).toBeCloseTo(1 + (before - 1) * 1.12, 10);
  });

  it('applies the new formulas in their separate core, attribute and crucible layers', () => {
    const stats = deriveCharacterStats(
      PROBAND,
      progression({
        coreStats: { might: 40, toughness: 20, vitality: 10 },
        attributePoints: { ferocity: 25, resilience: 10, vigor: 5 },
        crucibleBonus: { attack: 0.2, defense: 0.1, health: 0.05 },
      }),
    );

    expect(ATTRIBUTE_BONUS_PER_POINT).toBe(0.0125);
    expect(stats.derived.attack).toBeCloseTo((100 + 40) * 1.3125 * 1.2, 8);
    expect(stats.derived.defense).toBeCloseTo((200 + 20) * 1.125 * 1.1, 8);
    expect(stats.derived.health).toBeCloseTo((400 + 10) * 1.0625 * 1.05, 8);
  });
});
