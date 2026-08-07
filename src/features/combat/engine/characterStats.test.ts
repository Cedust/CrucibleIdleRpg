import { describe, expect, it } from 'vitest';
import { CHARACTERS, TEAM_ORDER } from '@/game/characters/characters';
import { ATTRIBUTE_BONUS_PER_POINT } from '@/game/curves/characterCurves';
import type { CharacterDefinition } from '@/game/types';
import { nodeById } from '@/game/weaponMastery/mastery';
import {
  deriveCharacterStats,
  neutralProgression,
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
