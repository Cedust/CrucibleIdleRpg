import { describe, expect, it } from 'vitest';
import { CRUCIBLE_IDS } from '@/game/crucible/crucible';
import type { Prng } from '@/shared/utils/prng';
import {
  activeRitesFrom,
  availableRunesForRiteSlot,
  createEmptyTeamRites,
  etchCost,
  etchRune,
  grantRuneGrimoireStarters,
  inscribeCandidates,
  inscribeRune,
  runeDepthFromFirstVictories,
  runeLevelCap,
  setRuneInRite,
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

describe('activeRitesFrom', () => {
  it('übernimmt nur vollständige Rite mit ihren aktuellen Leveln in den Kampf', () => {
    const empty = createEmptyTeamRites();
    const rites = {
      ...empty,
      rhaya: {
        ...empty.rhaya,
        triggerRuneId: 'rune.trigger.on-crit' as const,
        effectRuneId: 'rune.effect.bolt' as const,
      },
      quinn: { ...empty.quinn, triggerRuneId: 'rune.trigger.on-splash' as const },
    };

    expect(
      activeRitesFrom(rites, {
        'rune.trigger.on-crit': 3,
        'rune.effect.bolt': 2,
        'rune.trigger.on-splash': 1,
      }),
    ).toEqual({
      rhaya: {
        triggerRuneId: 'rune.trigger.on-crit',
        triggerLevel: 3,
        effectRuneId: 'rune.effect.bolt',
        effectLevel: 2,
      },
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

describe('Rune Grimoire actions', () => {
  const lastCandidatePrng: Prng = {
    seed: 1,
    next: () => 0.999,
    nextInt: (_min, max) => max,
    chance: () => false,
  };

  it('derives the reachable depth and only inscribes an unknown rune from that category pool', () => {
    const grimoire = {
      'rune.trigger.on-crit': 1,
      'rune.effect.heal': 1,
    } as const;
    const depth = runeDepthFromFirstVictories(['A1-D1-01', 'A1-D2-03', 'malformed']);

    expect(depth).toBe(3);
    expect(inscribeCandidates(grimoire, 'trigger', depth).map((rune) => rune.id)).toEqual([
      'rune.trigger.on-multi-hit',
      'rune.trigger.on-splash',
    ]);
    expect(inscribeRune(grimoire, 'trigger', depth, lastCandidatePrng)).toEqual({
      grimoire: {
        ...grimoire,
        'rune.trigger.on-splash': 1,
      },
      runeId: 'rune.trigger.on-splash',
    });
  });

  it('never spends a random draw for an exhausted or unreachable category pool', () => {
    const noDrawPrng: Prng = {
      seed: 2,
      next: () => 0,
      nextInt: () => {
        throw new Error('no candidate may draw from the craft stream');
      },
      chance: () => false,
    };

    expect(inscribeRune({}, 'modifier', 1, noDrawPrng)).toBeNull();
    expect(
      inscribeRune(
        {
          'rune.trigger.on-crit': 1,
          'rune.trigger.on-multi-hit': 1,
          'rune.trigger.on-splash': 1,
          'rune.trigger.on-counter': 1,
          'rune.trigger.on-block': 1,
          'rune.trigger.on-evade': 1,
        },
        'trigger',
        6,
        noDrawPrng,
      ),
    ).toBeNull();
  });

  it('etches one known rune without RNG, with rising cost and a strict cap', () => {
    const grimoire = { 'rune.trigger.on-crit': 1 } as const;

    expect(etchCost(1)).toEqual({ gold: 100, runewords: 8 });
    expect(etchCost(2)).toEqual({ gold: 150, runewords: 12 });
    expect(etchRune(grimoire, 'rune.trigger.on-crit', 2)).toEqual({
      'rune.trigger.on-crit': 2,
    });
    expect(etchRune({ 'rune.trigger.on-crit': 2 }, 'rune.trigger.on-crit', 2)).toBeNull();
  });
});

describe('Rite configuration', () => {
  const ranks = {
    [CRUCIBLE_IDS.runeGrimoire]: 1,
    [CRUCIBLE_IDS.talisman]: 2,
    [CRUCIBLE_IDS.runicFocus]: 1,
  };
  const grimoire = {
    'rune.trigger.on-crit': 1,
    'rune.trigger.on-multi-hit': 1,
    'rune.effect.heal': 1,
    'rune.effect.barrier': 1,
    'rune.modifier.echo': 1,
  } as const;

  it('only exposes known category matches that are not bound in another team slot', () => {
    const empty = createEmptyTeamRites();
    const rites = setRuneInRite(
      empty,
      grimoire,
      ranks,
      'korvin',
      'triggerRuneId',
      'rune.trigger.on-crit',
    );
    if (rites === null) throw new Error('Rite fehlt');

    expect(
      availableRunesForRiteSlot(rites, grimoire, 'rhaya', 'triggerRuneId').map((rune) => rune.id),
    ).toEqual(['rune.trigger.on-multi-hit']);
    expect(
      availableRunesForRiteSlot(rites, grimoire, 'korvin', 'triggerRuneId').map((rune) => rune.id),
    ).toEqual(['rune.trigger.on-crit', 'rune.trigger.on-multi-hit']);
  });

  it('atomically enforces rank gates, categories and team uniqueness while allowing free removal', () => {
    const empty = createEmptyTeamRites();
    const korvinTrigger = setRuneInRite(
      empty,
      grimoire,
      ranks,
      'korvin',
      'triggerRuneId',
      'rune.trigger.on-crit',
    );
    if (korvinTrigger === null) throw new Error('Rite fehlt');

    expect(
      setRuneInRite(
        korvinTrigger,
        grimoire,
        ranks,
        'rhaya',
        'triggerRuneId',
        'rune.trigger.on-crit',
      ),
    ).toBeNull();
    expect(
      setRuneInRite(
        korvinTrigger,
        grimoire,
        ranks,
        'rhaya',
        'triggerRuneId',
        'rune.effect.barrier',
      ),
    ).toBeNull();
    expect(
      setRuneInRite(korvinTrigger, grimoire, ranks, 'quinn', 'effectRuneId', 'rune.effect.barrier'),
    ).toBeNull();

    const cleared = setRuneInRite(korvinTrigger, grimoire, ranks, 'korvin', 'triggerRuneId', null);
    expect(cleared).toEqual({
      ...empty,
      korvin: { triggerRuneId: null, effectRuneId: null, modifierRuneId: null },
    });
    expect(grimoire['rune.trigger.on-crit']).toBe(1);
  });
});
