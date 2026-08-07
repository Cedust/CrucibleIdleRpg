import { describe, expect, it } from 'vitest';
import {
  investedPoints,
  maximumInvestableCapacity,
  nodeById,
  nodesFor,
  purchaseFailure,
  respecCost,
} from './mastery';

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
