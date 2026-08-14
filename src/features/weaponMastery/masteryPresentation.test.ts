import { describe, expect, it } from 'vitest';
import { nodeById, type MasteryNode } from '@/game/weaponMastery/mastery';
import { masteryNodeAvailability } from './masteryPresentation';

function node(id: string): MasteryNode {
  const found = nodeById('korvin', id);
  if (found === undefined) throw new Error(`Unknown mastery node ${id}`);
  return found;
}

describe('masteryNodeAvailability', () => {
  it('meldet voll investierte Nodes als max', () => {
    const chcI = node('finesse.chc-i');
    expect(masteryNodeAvailability('korvin', chcI, 60, { 'finesse.chc-i': chcI.maxRank }, 1)).toBe(
      'max',
    );
  });

  it('lässt die Sperr-Achse gegen fehlende Punkte gewinnen', () => {
    expect(masteryNodeAvailability('korvin', node('finesse.chc-ii'), 1, {}, 0)).toBe('locked');
  });

  it('sperrt Nodes mit fehlenden Prerequisites', () => {
    expect(masteryNodeAvailability('korvin', node('finesse.surestrike'), 60, {}, 1)).toBe('locked');
  });

  it('sperrt einen Master-Node, dessen exklusive Alternative aktiv ist', () => {
    const ranks = { 'finesse.executioner': 1, 'finesse.surestrike': 1 };
    expect(masteryNodeAvailability('korvin', node('finesse.perfect-exploit'), 80, ranks, 1)).toBe(
      'locked',
    );
    expect(
      masteryNodeAvailability(
        'korvin',
        node('finesse.perfect-exploit'),
        80,
        {
          'finesse.executioner': 1,
        },
        1,
      ),
    ).toBe('available');
  });

  it('sperrt einen Capstone, wenn ein fremder Shared Capstone aktiv ist', () => {
    const ranks = { 'finesse.perfect-exploit': 1, 'tempest.perfect-cadence': 1 };
    expect(masteryNodeAvailability('korvin', node('finesse.overcritical'), 80, ranks, 1)).toBe(
      'locked',
    );
    expect(
      masteryNodeAvailability(
        'korvin',
        node('finesse.overcritical'),
        80,
        {
          'finesse.perfect-exploit': 1,
        },
        1,
      ),
    ).toBe('available');
  });

  it('unterscheidet insufficient und available über freie Punkte', () => {
    expect(masteryNodeAvailability('korvin', node('finesse.chc-i'), 1, {}, 0)).toBe('insufficient');
    expect(masteryNodeAvailability('korvin', node('finesse.chc-i'), 1, {}, 1)).toBe('available');
  });
});
