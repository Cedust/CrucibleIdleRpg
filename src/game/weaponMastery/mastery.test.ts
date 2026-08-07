import { describe, expect, it } from 'vitest';
import type { CharacterProgressionState } from '@/game/types';
import {
  investedPoints,
  MASTERY_BALANCE,
  MASTERY_IDS,
  maximumInvestableCapacity,
  nodeById,
  nodesFor,
  purchaseFailure,
  purchaseMasteryNode,
  respecCost,
  respecMasteryDiscipline,
  WEAPON_MODE_KEYS,
  WEAPON_MODES,
} from './mastery';

const CHARACTER_IDS = ['korvin', 'rhaya', 'quinn'] as const;

/** Effekt-Text eines Behavior-Nodes, egal in wessen Baum er lebt. */
function effectOf(id: string): string {
  for (const characterId of CHARACTER_IDS) {
    const node = nodeById(characterId, id);
    if (node) return node.effect;
  }
  throw new Error(`Node ohne Katalog-Eintrag: ${id}`);
}

describe('weapon mastery node ids', () => {
  it('declares a unique id for every node of every character', () => {
    for (const characterId of CHARACTER_IDS) {
      const ids = nodesFor(characterId).map((node) => node.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('resolves every engine-referenced id against the node catalog', () => {
    for (const [key, id] of Object.entries(MASTERY_IDS)) {
      const owners = CHARACTER_IDS.filter((characterId) => nodeById(characterId, id));
      expect(
        owners.length,
        `MASTERY_IDS.${key} (${id}) is missing from the catalog`,
      ).toBeGreaterThan(0);
    }
  });

  it('references only catalog ids in prerequisites and exclusiveWith', () => {
    for (const characterId of CHARACTER_IDS) {
      const nodes = nodesFor(characterId);
      const known = new Set(nodes.map((node) => node.id));
      for (const node of nodes) {
        for (const prerequisite of node.prerequisites) {
          expect(known.has(prerequisite), `${node.id} requires unknown ${prerequisite}`).toBe(true);
        }
        if (node.exclusiveWith) {
          expect(known.has(node.exclusiveWith), `${node.id} excludes unknown id`).toBe(true);
        }
      }
    }
  });

  it('keeps every exclusive master pair symmetric', () => {
    for (const characterId of CHARACTER_IDS) {
      const nodes = nodesFor(characterId);
      for (const node of nodes) {
        if (node.exclusiveWith === undefined) continue;
        const other = nodes.find((candidate) => candidate.id === node.exclusiveWith);
        expect(other?.exclusiveWith, `${node.id} ↔ ${node.exclusiveWith}`).toBe(node.id);
      }
    }
  });
});

describe('effect texts match the declared balance (mastery balancing declarative)', () => {
  const pp = (value: number): string => `${Math.round(Math.abs(value) * 100)}`;
  const signedPp = (value: number): string => `${value < 0 ? '-' : '+'}${pp(value)} pp`;
  const WORDS = ['one', 'two', 'three', 'four', 'five'] as const;

  it('describes every weapon mode with its flat attack and range deltas', () => {
    for (const key of WEAPON_MODE_KEYS) {
      const mode = WEAPON_MODES[key];
      const effect = effectOf(MASTERY_IDS[key]);

      expect(effect, key).toContain(`+${mode.attackFlat} Damage`);
      if (mode.minRngDelta !== 0) {
        expect(effect, key).toContain(`${signedPp(mode.minRngDelta)} MIN RNG`);
      }
      if (mode.maxRngDelta !== 0) {
        expect(effect, key).toContain(`${signedPp(mode.maxRngDelta)} MAX RNG`);
      }
      if (mode.precisionDelta !== 0) {
        expect(effect, key).toContain(`${signedPp(mode.precisionDelta)} Precision`);
      }
    }
  });

  it('mentions every declared behavior balance value in its effect text', () => {
    const balance = MASTERY_BALANCE;

    expect(effectOf(MASTERY_IDS.executioner)).toContain(
      `below ${pp(balance.executioner.healthThreshold)}%`,
    );
    expect(effectOf(MASTERY_IDS.executioner)).toContain(
      `+${pp(balance.executioner.bonusCritDamage)} pp Crit Damage`,
    );
    expect(effectOf(MASTERY_IDS.committedImpact)).toContain(
      `become ${pp(balance.committedImpact.minCleanRoll)}%`,
    );
    expect(effectOf(MASTERY_IDS.perfectCadence)).toContain(
      `Chain Factor to ${pp(balance.perfectCadence.chainFactorReset)}%`,
    );
    expect(effectOf(MASTERY_IDS.echoedStrike)).toContain(
      `${pp(balance.echoedStrike.damageFactor)}% finished damage`,
    );
    expect(effectOf(MASTERY_IDS.stormSurge)).toContain(
      `up to ${WORDS[balance.stormSurge.maxBonusHits - 1]} chain hits`,
    );
    expect(effectOf(MASTERY_IDS.epicenter)).toContain(`${pp(balance.epicenter.damageFactor)}% hit`);
    expect(effectOf(MASTERY_IDS.focusedBlast)).toContain(
      `up to ${pp(balance.focusedBlast.damageFactorCap)}% splash damage`,
    );
    expect(effectOf(MASTERY_IDS.aftershock)).toContain(
      `${pp(balance.aftershock.damageFactor)}% second wave`,
    );
    expect(effectOf(MASTERY_IDS.secondWind)).toContain(
      `${pp(balance.secondWind.damageFactor)}% separate hit`,
    );
    expect(effectOf(MASTERY_IDS.zeroingIn)).toContain(
      `up to ${WORDS[balance.zeroingIn.maxStacks - 1]} +${pp(balance.zeroingIn.rangePerStack)} pp range stacks`,
    );
    expect(effectOf(MASTERY_IDS.patientHunter)).toContain(
      `${WORDS[balance.patientHunter.maxStacks - 1]} stacks`,
    );
    expect(effectOf(MASTERY_IDS.patientHunter)).toContain(
      `stacks ${balance.patientHunter.maxRngFromStack}-${balance.patientHunter.maxStacks}`,
    );
    expect(effectOf(MASTERY_IDS.escalatingRetaliation)).toContain(
      `+${pp(balance.escalatingRetaliation.counterDamagePerStack * balance.escalatingRetaliation.maxStacks)} pp damage`,
    );
    expect(effectOf(MASTERY_IDS.immovableGuard)).toContain(
      `+${pp(balance.immovableGuard.blockChanceFlat)} pp Block Chance`,
    );
  });

  it('carries the perRank value in every stat node effect text', () => {
    for (const characterId of CHARACTER_IDS) {
      for (const node of nodesFor(characterId)) {
        if (node.perRank === undefined) continue;
        const expected = node.effect.includes(' pp ')
          ? `+${Math.round(node.perRank * 100)} pp `
          : `+${node.perRank} `;
        expect(node.effect.startsWith(expected), `${node.id}: ${node.effect}`).toBe(true);
      }
    }
  });
});

describe('weapon mastery stat node units (WEAPON-MASTERY §5)', () => {
  it('gibt DMG, DEF und INIT +1 Punkt je Rang', () => {
    expect(nodeById('korvin', 'weapon.dmg-i')?.perRank).toBe(1);
    expect(nodeById('korvin', 'weapon.def-i')?.perRank).toBe(1);
    expect(nodeById('rhaya', 'weapon.init')?.perRank).toBe(1);
  });

  it('gibt PRC, MIN RNG, MAX RNG und BLK +1 Prozentpunkt je Rang', () => {
    expect(nodeById('korvin', 'weapon.prc-i')?.perRank).toBe(0.01);
    expect(nodeById('korvin', 'weapon.blk')?.perRank).toBe(0.01);
    expect(nodeById('korvin', 'weapon.min-rng')?.perRank).toBe(0.01);
    expect(nodeById('rhaya', 'weapon.max-rng-i')?.perRank).toBe(0.01);
    expect(nodeById('quinn', 'weapon.min-rng-iii')?.perRank).toBe(0.01);
  });
});

function progression(
  overrides: Partial<CharacterProgressionState> = {},
): CharacterProgressionState {
  return {
    level: 80,
    xp: 0,
    freeAttributePoints: 0,
    attributePoints: { ferocity: 0, resilience: 0, vigor: 0 },
    freeMasteryPoints: 5,
    masteryRanks: {},
    ...overrides,
  };
}

describe('purchaseMasteryNode & respecMasteryDiscipline', () => {
  it('verbraucht einen Punkt und erhöht den Rang um eins, ohne den Eingang zu verändern', () => {
    const before = progression();
    const after = purchaseMasteryNode('korvin', before, 'finesse.chc-i');

    expect(after?.freeMasteryPoints).toBe(4);
    expect(after?.masteryRanks['finesse.chc-i']).toBe(1);
    expect(before.freeMasteryPoints).toBe(5);
    expect(before.masteryRanks['finesse.chc-i']).toBeUndefined();
  });

  it('lehnt gesperrte Käufe ab', () => {
    expect(
      purchaseMasteryNode('korvin', progression({ freeMasteryPoints: 0 }), 'finesse.chc-i'),
    ).toBeNull();
    expect(purchaseMasteryNode('korvin', progression(), 'finesse.unbekannt')).toBeNull();
    expect(purchaseMasteryNode('korvin', progression({ level: 1 }), 'finesse.chc-ii')).toBeNull();
  });

  it('erstattet genau die Discipline gegen Gold und lässt andere Ränge stehen', () => {
    const before = progression({
      freeMasteryPoints: 0,
      masteryRanks: { 'finesse.chc-i': 3, 'valor.ctc-i': 2 },
    });
    const respec = respecMasteryDiscipline(before, 'finesse', respecCost(3));

    expect(respec?.gold).toBe(0);
    expect(respec?.progression.freeMasteryPoints).toBe(3);
    expect(respec?.progression.masteryRanks).toEqual({ 'valor.ctc-i': 2 });
    expect(before.masteryRanks).toEqual({ 'finesse.chc-i': 3, 'valor.ctc-i': 2 });
  });

  it('lehnt Respec ohne Investition oder ohne Gold-Deckung ab', () => {
    expect(respecMasteryDiscipline(progression(), 'finesse', 10_000)).toBeNull();
    const invested = progression({ masteryRanks: { 'finesse.chc-i': 1 } });
    expect(respecMasteryDiscipline(invested, 'finesse', respecCost(1) - 1)).toBeNull();
  });
});

describe('weapon mastery rules', () => {
  it('contains all five disciplines and derives capacity from the exclusive master pairs', () => {
    const nodes = nodesFor('korvin');
    expect(new Set(nodes.map((node) => node.discipline))).toEqual(
      new Set(['finesse', 'tempest', 'dominance', 'valor', 'weapon']),
    );

    // Regel-Invariante statt Zahlen-Pin: Jedes exklusive Master-Paar trägt genau einen Rang.
    const totalRanks = nodes.reduce((total, node) => total + node.maxRank, 0);
    const exclusivePairs = nodes.filter((node) => node.exclusiveWith !== undefined).length / 2;
    expect(exclusivePairs).toBeGreaterThan(0);
    expect(maximumInvestableCapacity('korvin')).toBe(totalRanks - exclusivePairs);
  });

  it('enforces rank gates, prerequisites, master choices, caps, and the shared capstone lock', () => {
    expect(purchaseFailure('korvin', 1, {}, 1, 'finesse.chc-ii')).toBe('Requires level 20.');
    expect(purchaseFailure('korvin', 20, {}, 1, 'finesse.chc-ii')).toBe(
      'A connected prerequisite is required.',
    );
    const ranks = {
      'finesse.chc-i': 1,
      'finesse.chd-i': 1,
      'finesse.chc-ii': 1,
      'finesse.executioner': 1,
      'finesse.perfect-exploit': 1,
    };
    expect(purchaseFailure('korvin', 60, ranks, 1, 'finesse.surestrike')).toBe(
      'The alternative Master choice is active.',
    );
    expect(
      purchaseFailure(
        'korvin',
        80,
        {
          ...ranks,
          'finesse.overcritical': 1,
          'tempest.mhc-i': 1,
          'tempest.mhc-ii': 1,
          'tempest.chain-factor-i': 1,
          'tempest.converging-strikes': 1,
          'tempest.echoed-strike': 1,
        },
        1,
        'tempest.perfect-cadence',
      ),
    ).toBe('Another shared Discipline Capstone is active.');
  });

  it('keeps respec structure independent from its placeholder values', () => {
    expect(investedPoints({ 'finesse.chc-i': 3, 'valor.ctc-i': 1 }, 'finesse')).toBe(3);
    expect(respecCost(0)).toBe(0);
    expect(respecCost(4) - respecCost(3)).toBe(25);
    expect(nodeById('quinn', 'weapon.patient-hunter')?.maxRank).toBe(1);
  });
});
