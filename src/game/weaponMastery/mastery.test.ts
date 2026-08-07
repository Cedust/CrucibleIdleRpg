import { describe, expect, it } from 'vitest';
import {
  investedPoints,
  MASTERY_IDS,
  maximumInvestableCapacity,
  nodeById,
  nodesFor,
  purchaseFailure,
  respecCost,
} from './mastery';

const CHARACTER_IDS = ['korvin', 'rhaya', 'quinn'] as const;

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

describe('weapon mastery rules', () => {
  it('contains all five disciplines and preserves the 229-rank capacity', () => {
    const nodes = nodesFor('korvin');
    expect(new Set(nodes.map((node) => node.discipline))).toEqual(
      new Set(['finesse', 'tempest', 'dominance', 'valor', 'weapon']),
    );
    expect(maximumInvestableCapacity('korvin')).toBe(229);
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
