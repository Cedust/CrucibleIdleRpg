import { describe, expect, it } from 'vitest';
import { CRUCIBLE_IDS } from '@/game/crucible/crucible';
import {
  createEmptyTeamRites,
  grantRuneGrimoireStarters,
  runeLevelCap,
  unlockedRiteSlots,
  validateRuneCatalog,
  validateRuneGrimoire,
  validateTeamRites,
} from './runes';

describe('rune catalog', () => {
  it('contains exactly 6 triggers, 6 effects and 5 modifiers as marked balancing content', () => {
    expect(validateRuneCatalog()).toBeNull();
  });

  it('derives the Rune Grimoire cap 1 and Rune Mastery caps 2 through 5', () => {
    expect(runeLevelCap({})).toBe(0);
    expect(runeLevelCap({ [CRUCIBLE_IDS.runeGrimoire]: 1 })).toBe(1);
    expect(runeLevelCap({ [CRUCIBLE_IDS.runeGrimoire]: 1, [CRUCIBLE_IDS.runeMastery]: 4 })).toBe(5);
  });

  it('gates Rite slots per character through Talisman and Runic Focus ranks', () => {
    const ranks = {
      [CRUCIBLE_IDS.runeGrimoire]: 1,
      [CRUCIBLE_IDS.talisman]: 2,
      [CRUCIBLE_IDS.runicFocus]: 1,
    };
    expect(unlockedRiteSlots(ranks, 'korvin')).toEqual({
      trigger: true,
      effect: true,
      modifier: true,
    });
    expect(unlockedRiteSlots(ranks, 'rhaya')).toEqual({
      trigger: true,
      effect: true,
      modifier: false,
    });
    expect(unlockedRiteSlots(ranks, 'quinn')).toEqual({
      trigger: false,
      effect: false,
      modifier: false,
    });
  });
});

describe('Rune Grimoire grant and Rite validation', () => {
  const grimoireRanks = { [CRUCIBLE_IDS.runeGrimoire]: 1 };

  it('grants exactly the starter trigger and effect at level 1, idempotently', () => {
    const granted = grantRuneGrimoireStarters({}, grimoireRanks);
    expect(granted).toEqual({ 'rune.trigger.on-crit': 1, 'rune.effect.heal': 1 });
    expect(grantRuneGrimoireStarters(granted, grimoireRanks)).toEqual(granted);
    expect(validateRuneGrimoire(granted, grimoireRanks)).toBeNull();
  });

  it('rejects unknown, over-cap and missing-starter Grimoire states', () => {
    expect(validateRuneGrimoire({ 'rune.unknown': 1 } as never, grimoireRanks)).not.toBeNull();
    expect(
      validateRuneGrimoire({ 'rune.trigger.on-crit': 2, 'rune.effect.heal': 1 }, grimoireRanks),
    ).not.toBeNull();
    expect(validateRuneGrimoire({}, grimoireRanks)).not.toBeNull();
  });

  it('allows known starter runes to be Etched up to the unlocked Rune Mastery cap', () => {
    const masteryRanks = { ...grimoireRanks, [CRUCIBLE_IDS.runeMastery]: 1 };
    expect(
      validateRuneGrimoire({ 'rune.trigger.on-crit': 2, 'rune.effect.heal': 1 }, masteryRanks),
    ).toBeNull();
  });

  it('rejects team-duplicate runes and runes in unavailable Rite slots', () => {
    const grimoire = grantRuneGrimoireStarters({}, grimoireRanks);
    const rites = createEmptyTeamRites();
    const equipped = {
      ...rites,
      korvin: { ...rites.korvin, triggerRuneId: 'rune.trigger.on-crit' as const },
    };
    expect(validateTeamRites(equipped, grimoire, grimoireRanks)).not.toBeNull();

    const talismanRanks = { ...grimoireRanks, [CRUCIBLE_IDS.talisman]: 2 };
    const duplicate = {
      ...equipped,
      rhaya: { ...rites.rhaya, triggerRuneId: 'rune.trigger.on-crit' as const },
    };
    expect(validateTeamRites(duplicate, grimoire, talismanRanks)).not.toBeNull();
  });
});
