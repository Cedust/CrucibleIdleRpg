import { describe, expect, it } from 'vitest';
import {
  CRUCIBLE_IDS,
  CRUCIBLE_NODES,
  crucibleNodeById,
  deriveUnlockedDungeonIds,
  investedCrystals,
  meetsPrerequisites,
  mitigationShare,
  purchaseCrucibleNode,
  purchaseFailure,
  rallyShare,
  rankCost,
  respecCrucibleTree,
  smeltingEffects,
  sunderEffect,
  suppressionPlaces,
  totalRankCost,
  type CompletedDungeons,
} from './crucible';

const NO_DUNGEONS: CompletedDungeons = {
  'A1-D1': false,
  'A1-D2': false,
  'A1-D3': false,
  'A1-D4': false,
  'A1-D5': false,
};

const ALL_DUNGEONS: CompletedDungeons = {
  'A1-D1': true,
  'A1-D2': true,
  'A1-D3': true,
  'A1-D4': true,
  'A1-D5': true,
};

describe('crucible node catalog', () => {
  it('declares a unique id for every node', () => {
    const ids = CRUCIBLE_NODES.map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('resolves every engine-referenced id against the catalog', () => {
    for (const [key, id] of Object.entries(CRUCIBLE_IDS)) {
      expect(crucibleNodeById(id), `CRUCIBLE_IDS.${key} (${id}) fehlt im Katalog`).toBeDefined();
    }
  });

  it('references only catalog ids in prerequisites', () => {
    for (const node of CRUCIBLE_NODES) {
      for (const prerequisite of node.prerequisites) {
        expect(
          crucibleNodeById(prerequisite.nodeId),
          `${node.id} verlangt unbekanntes ${prerequisite.nodeId}`,
        ).toBeDefined();
      }
    }
  });

  it('locks armory, blacksmith, jeweler, masterwork and the four molten deepenings', () => {
    const lockedIds = CRUCIBLE_NODES.filter((node) => node.lockedUntil !== undefined).map(
      (node) => node.id,
    );
    expect(lockedIds.sort()).toEqual(
      [
        CRUCIBLE_IDS.armory,
        CRUCIBLE_IDS.blacksmith,
        CRUCIBLE_IDS.jeweler,
        CRUCIBLE_IDS.ambush,
        CRUCIBLE_IDS.menace,
        CRUCIBLE_IDS.momentum,
        CRUCIBLE_IDS.secondWind,
        CRUCIBLE_IDS.runeGrimoire,
        CRUCIBLE_IDS.talisman,
        CRUCIBLE_IDS.runicFocus,
        CRUCIBLE_IDS.runeMastery,
      ].sort(),
    );
  });

  it('offers exactly 130 active crystal costs: 10 anvil, 60 smelting, 60 molten (PROGRESSION §3.5)', () => {
    const active = CRUCIBLE_NODES.filter((node) => node.lockedUntil === undefined);
    const costOf = (tree: string): number =>
      active
        .filter((node) => node.tree === tree)
        .reduce((total, node) => total + totalRankCost(node.maxRank), 0);

    expect(costOf('anvil')).toBe(10);
    expect(costOf('smelting')).toBe(60);
    expect(costOf('molten')).toBe(60);
    expect(costOf('masterwork')).toBe(0);
  });
});

describe('rank costs (PROGRESSION §3)', () => {
  it('prices each rank at its rank number', () => {
    expect([1, 2, 3, 4, 5].map(rankCost)).toEqual([1, 2, 3, 4, 5]);
  });

  it('prices full nodes at 15, four ranks at 10 and three ranks at 6', () => {
    expect(totalRankCost(5)).toBe(15);
    expect(totalRankCost(4)).toBe(10);
    expect(totalRankCost(3)).toBe(6);
    expect(totalRankCost(0)).toBe(0);
  });

  it('sums invested crystals per tree from the rank triangle', () => {
    const ranks = {
      [CRUCIBLE_IDS.waystones]: 2,
      [CRUCIBLE_IDS.overpower]: 5,
      [CRUCIBLE_IDS.quickStep]: 1,
      [CRUCIBLE_IDS.rally]: 3,
    };
    expect(investedCrystals(ranks, 'anvil')).toBe(3);
    expect(investedCrystals(ranks, 'smelting')).toBe(16);
    expect(investedCrystals(ranks, 'molten')).toBe(6);
    expect(investedCrystals(ranks)).toBe(25);
  });
});

describe('purchase rules', () => {
  it('buys the next rank for its rank number in crystals', () => {
    const first = purchaseCrucibleNode({}, 3, NO_DUNGEONS, CRUCIBLE_IDS.overpower);
    expect(first).toEqual({ ranks: { [CRUCIBLE_IDS.overpower]: 1 }, crystals: 2 });
    if (first === null) throw new Error('Kauf abgelehnt');

    const second = purchaseCrucibleNode(
      first.ranks,
      first.crystals,
      NO_DUNGEONS,
      CRUCIBLE_IDS.overpower,
    );
    expect(second).toEqual({ ranks: { [CRUCIBLE_IDS.overpower]: 2 }, crystals: 0 });
  });

  it('caps every node at its maximum rank', () => {
    const ranks = { [CRUCIBLE_IDS.overpower]: 5 };
    expect(purchaseFailure(ranks, 100, NO_DUNGEONS, CRUCIBLE_IDS.overpower)).toBe(
      'Node is already at maximum rank.',
    );
    expect(purchaseCrucibleNode(ranks, 100, NO_DUNGEONS, CRUCIBLE_IDS.overpower)).toBeNull();
  });

  it('rejects unknown nodes, unaffordable ranks and locked nodes', () => {
    expect(purchaseFailure({}, 100, NO_DUNGEONS, 'anvil.unknown')).toBe('Unknown Crucible node.');
    expect(purchaseFailure({}, 0, NO_DUNGEONS, CRUCIBLE_IDS.overpower)).toBe(
      'Requires 1 Crystals.',
    );
    for (const id of [
      CRUCIBLE_IDS.armory,
      CRUCIBLE_IDS.blacksmith,
      CRUCIBLE_IDS.jeweler,
      CRUCIBLE_IDS.ambush,
      CRUCIBLE_IDS.menace,
      CRUCIBLE_IDS.momentum,
      CRUCIBLE_IDS.secondWind,
      CRUCIBLE_IDS.runeGrimoire,
    ]) {
      expect(purchaseFailure({}, 100, ALL_DUNGEONS, id)).toMatch(/^Locked until /);
    }
  });

  it('requires the completed-dungeon flag for each waystone rank', () => {
    expect(purchaseFailure({}, 100, NO_DUNGEONS, CRUCIBLE_IDS.waystones)).toBe(
      'Requires completing A1-D1.',
    );

    const oneDone: CompletedDungeons = { ...NO_DUNGEONS, 'A1-D1': true };
    expect(purchaseFailure({}, 100, oneDone, CRUCIBLE_IDS.waystones)).toBeNull();

    const rankOne = { [CRUCIBLE_IDS.waystones]: 1 };
    expect(purchaseFailure(rankOne, 100, oneDone, CRUCIBLE_IDS.waystones)).toBe(
      'Requires completing A1-D2.',
    );
  });

  it('validates matching-rank prerequisites (Runic Focus rank n requires Talisman rank n)', () => {
    const runicFocus = crucibleNodeById(CRUCIBLE_IDS.runicFocus);
    if (runicFocus === undefined) throw new Error('Node fehlt im Katalog');
    const talismanOne = { [CRUCIBLE_IDS.talisman]: 1 };
    expect(meetsPrerequisites(talismanOne, ALL_DUNGEONS, runicFocus, 1)).toBe(true);
    expect(meetsPrerequisites(talismanOne, ALL_DUNGEONS, runicFocus, 2)).toBe(false);
  });
});

describe('tree respec (PROGRESSION §3)', () => {
  const ranks = {
    [CRUCIBLE_IDS.waystones]: 2,
    [CRUCIBLE_IDS.overpower]: 3,
    [CRUCIBLE_IDS.quickStep]: 2,
    [CRUCIBLE_IDS.mitigation]: 4,
  };

  it('removes all ranks of the chosen tree atomically and refunds exactly the invested crystals', () => {
    const respec = respecCrucibleTree(ranks, 5, 'smelting');
    expect(respec).toEqual({
      ranks: { [CRUCIBLE_IDS.waystones]: 2, [CRUCIBLE_IDS.mitigation]: 4 },
      crystals: 5 + 6 + 3,
    });
  });

  it('respecs smelting and molten independently and never touches anvil ranks', () => {
    const molten = respecCrucibleTree(ranks, 0, 'molten');
    expect(molten).toEqual({
      ranks: {
        [CRUCIBLE_IDS.waystones]: 2,
        [CRUCIBLE_IDS.overpower]: 3,
        [CRUCIBLE_IDS.quickStep]: 2,
      },
      crystals: 10,
    });
  });

  it('rejects a respec without investment', () => {
    expect(respecCrucibleTree({ [CRUCIBLE_IDS.waystones]: 2 }, 0, 'smelting')).toBeNull();
  });
});

describe('derived dungeon entries (PERSISTENCE §2.3)', () => {
  it('derives A1-D1 plus one entry per waystone rank', () => {
    expect(deriveUnlockedDungeonIds({})).toEqual(['A1-D1']);
    expect(deriveUnlockedDungeonIds({ [CRUCIBLE_IDS.waystones]: 2 })).toEqual([
      'A1-D1',
      'A1-D2',
      'A1-D3',
    ]);
    expect(deriveUnlockedDungeonIds({ [CRUCIBLE_IDS.waystones]: 4 })).toEqual([
      'A1-D1',
      'A1-D2',
      'A1-D3',
      'A1-D4',
      'A1-D5',
    ]);
  });
});

describe('rank values (SIGNATURES §1, PROGRESSION §3.2, §4)', () => {
  it('maps mitigation ranks to 10/15/20/25/30% and 0 before unlock', () => {
    expect(mitigationShare({})).toBe(0);
    expect(mitigationShare({ [CRUCIBLE_IDS.mitigation]: 1 })).toBe(0.1);
    expect(mitigationShare({ [CRUCIBLE_IDS.mitigation]: 5 })).toBe(0.3);
  });

  it('maps sunder ranks to per-attack and cap percentage points', () => {
    expect(sunderEffect({})).toBeNull();
    expect(sunderEffect({ [CRUCIBLE_IDS.sunder]: 1 })).toEqual({ perAttack: 0.02, cap: 0.04 });
    expect(sunderEffect({ [CRUCIBLE_IDS.sunder]: 5 })).toEqual({ perAttack: 0.1, cap: 0.2 });
  });

  it('maps suppression ranks to queue places', () => {
    expect(suppressionPlaces({})).toBe(0);
    expect(suppressionPlaces({ [CRUCIBLE_IDS.suppression]: 3 })).toBe(3);
  });

  it('maps rally ranks to 10/15/20/25/30% of max health', () => {
    expect(rallyShare({})).toBe(0);
    expect(rallyShare({ [CRUCIBLE_IDS.rally]: 3 })).toBe(0.2);
  });

  it('adds smelting nodes additively within the crucible layer and quick step flat', () => {
    expect(
      smeltingEffects({
        [CRUCIBLE_IDS.overpower]: 5,
        [CRUCIBLE_IDS.ironSkin]: 2,
        [CRUCIBLE_IDS.unyielding]: 1,
        [CRUCIBLE_IDS.quickStep]: 4,
      }),
    ).toEqual({
      crucibleBonus: { attack: 0.15, defense: 0.06, health: 0.03 },
      initiative: 4,
    });
    expect(smeltingEffects({})).toEqual({
      crucibleBonus: { attack: 0, defense: 0, health: 0 },
      initiative: 0,
    });
  });
});
