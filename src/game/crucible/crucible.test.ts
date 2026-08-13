import { describe, expect, it } from 'vitest';
import {
  ambushBonus,
  CRUCIBLE_IDS,
  CRUCIBLE_NODES,
  CRUCIBLE_TREES,
  crucibleNodeById,
  deriveUnlockedDungeonIds,
  formatRelicShards,
  investedRelicShards,
  meetsPrerequisites,
  menaceReduction,
  mitigationShare,
  momentumCap,
  purchaseCrucibleNode,
  purchaseFailure,
  rallyShare,
  rankCost,
  respecCrucibleTree,
  secondWindShare,
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
  it('contains exactly the three current trees', () => {
    expect(CRUCIBLE_TREES).toEqual(['anvil', 'smelting', 'molten']);
  });

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

  it('requires Blacksmith rank 1 before Jeweler', () => {
    const jeweler = crucibleNodeById(CRUCIBLE_IDS.jeweler);
    if (jeweler === undefined) throw new Error('Node fehlt im Katalog');

    expect(jeweler.prerequisites).toEqual([{ nodeId: CRUCIBLE_IDS.blacksmith, rank: 1 }]);
    expect(meetsPrerequisites({ [CRUCIBLE_IDS.armory]: 1 }, ALL_DUNGEONS, jeweler, 1)).toBe(false);
    expect(meetsPrerequisites({ [CRUCIBLE_IDS.blacksmith]: 1 }, ALL_DUNGEONS, jeweler, 1)).toBe(
      true,
    );
  });

  it('keeps the future equipment, crafting and rune unlocks locked', () => {
    const lockedIds = CRUCIBLE_NODES.filter((node) => node.lockedUntil !== undefined).map(
      (node) => node.id,
    );
    expect(lockedIds.sort()).toEqual(
      [
        CRUCIBLE_IDS.armory,
        CRUCIBLE_IDS.blacksmith,
        CRUCIBLE_IDS.jeweler,
        CRUCIBLE_IDS.runeGrimoire,
        CRUCIBLE_IDS.talisman,
        CRUCIBLE_IDS.runicFocus,
        CRUCIBLE_IDS.runeMastery,
      ].sort(),
    );
  });

  it('places the rune unlock branch in Anvil Sparks with stable prerequisites', () => {
    const runeGrimoire = crucibleNodeById(CRUCIBLE_IDS.runeGrimoire);
    const talisman = crucibleNodeById(CRUCIBLE_IDS.talisman);
    const runicFocus = crucibleNodeById(CRUCIBLE_IDS.runicFocus);
    const runeMastery = crucibleNodeById(CRUCIBLE_IDS.runeMastery);

    expect(CRUCIBLE_IDS.runeGrimoire).toBe('anvil.rune-grimoire');
    expect(CRUCIBLE_IDS.talisman).toBe('anvil.talisman');
    expect(CRUCIBLE_IDS.runicFocus).toBe('anvil.runic-focus');
    expect(CRUCIBLE_IDS.runeMastery).toBe('anvil.rune-mastery');
    expect([runeGrimoire?.tree, talisman?.tree, runicFocus?.tree, runeMastery?.tree]).toEqual([
      'anvil',
      'anvil',
      'anvil',
      'anvil',
    ]);
    expect(runeGrimoire?.prerequisites).toEqual([]);
    expect(talisman?.prerequisites).toEqual([{ nodeId: CRUCIBLE_IDS.runeGrimoire, rank: 1 }]);
    expect(runicFocus?.prerequisites).toEqual([
      { nodeId: CRUCIBLE_IDS.talisman, rank: 'matching' },
    ]);
    expect(runeMastery?.prerequisites).toEqual([{ nodeId: CRUCIBLE_IDS.runeGrimoire, rank: 1 }]);
  });

  it('offers exactly 190 active relic shard costs: 10 anvil, 60 smelting, 120 molten (PROGRESSION §3.4)', () => {
    const active = CRUCIBLE_NODES.filter((node) => node.lockedUntil === undefined);
    const costOf = (tree: string): number =>
      active
        .filter((node) => node.tree === tree)
        .reduce((total, node) => total + totalRankCost(node.maxRank), 0);

    expect(costOf('anvil')).toBe(10);
    expect(costOf('smelting')).toBe(60);
    expect(costOf('molten')).toBe(120);
  });
});

describe('rank costs (PROGRESSION §3)', () => {
  it('formats singular and plural Relic Shard amounts', () => {
    expect(formatRelicShards(1)).toBe('1 Relic Shard');
    expect(formatRelicShards(0)).toBe('0 Relic Shards');
    expect(formatRelicShards(3)).toBe('3 Relic Shards');
  });

  it('prices each rank at its rank number', () => {
    expect([1, 2, 3, 4, 5].map(rankCost)).toEqual([1, 2, 3, 4, 5]);
  });

  it('prices full nodes at 15, four ranks at 10 and three ranks at 6', () => {
    expect(totalRankCost(5)).toBe(15);
    expect(totalRankCost(4)).toBe(10);
    expect(totalRankCost(3)).toBe(6);
    expect(totalRankCost(0)).toBe(0);
  });

  it('sums invested Relic Shards per tree from the rank triangle', () => {
    const ranks = {
      [CRUCIBLE_IDS.waystones]: 2,
      [CRUCIBLE_IDS.overpower]: 5,
      [CRUCIBLE_IDS.quickStep]: 1,
      [CRUCIBLE_IDS.rally]: 3,
    };
    expect(investedRelicShards(ranks, 'anvil')).toBe(3);
    expect(investedRelicShards(ranks, 'smelting')).toBe(16);
    expect(investedRelicShards(ranks, 'molten')).toBe(6);
    expect(investedRelicShards(ranks)).toBe(25);
  });
});

describe('purchase rules', () => {
  it('buys the next rank for its rank number in Relic Shards', () => {
    const first = purchaseCrucibleNode({}, 3, NO_DUNGEONS, CRUCIBLE_IDS.overpower);
    expect(first).toEqual({ ranks: { [CRUCIBLE_IDS.overpower]: 1 }, relicShards: 2 });
    if (first === null) throw new Error('Kauf abgelehnt');

    const second = purchaseCrucibleNode(
      first.ranks,
      first.relicShards,
      NO_DUNGEONS,
      CRUCIBLE_IDS.overpower,
    );
    expect(second).toEqual({ ranks: { [CRUCIBLE_IDS.overpower]: 2 }, relicShards: 0 });
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
      'Requires 1 Relic Shard.',
    );
    for (const id of [
      CRUCIBLE_IDS.armory,
      CRUCIBLE_IDS.blacksmith,
      CRUCIBLE_IDS.jeweler,
      CRUCIBLE_IDS.runeGrimoire,
    ]) {
      expect(purchaseFailure({}, 100, ALL_DUNGEONS, id)).toMatch(/^Locked until /);
    }
  });

  it('sells each molten deepening only from rank 1 of its base node (PROGRESSION §3.3)', () => {
    const pairs = [
      [CRUCIBLE_IDS.sunder, CRUCIBLE_IDS.ambush],
      [CRUCIBLE_IDS.mitigation, CRUCIBLE_IDS.menace],
      [CRUCIBLE_IDS.suppression, CRUCIBLE_IDS.momentum],
      [CRUCIBLE_IDS.rally, CRUCIBLE_IDS.secondWind],
    ] as const;

    for (const [base, deepening] of pairs) {
      expect(purchaseFailure({}, 100, NO_DUNGEONS, deepening)).toBe(
        'A prerequisite node is missing.',
      );
      expect(purchaseFailure({ [base]: 1 }, 100, NO_DUNGEONS, deepening)).toBeNull();
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

  it('removes all ranks of the chosen tree atomically and refunds the invested Relic Shards', () => {
    const respec = respecCrucibleTree(ranks, 5, 'smelting');
    expect(respec).toEqual({
      ranks: { [CRUCIBLE_IDS.waystones]: 2, [CRUCIBLE_IDS.mitigation]: 4 },
      relicShards: 5 + 6 + 3,
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
      relicShards: 10,
    });
  });

  it('refunds base nodes and deepenings in the same atomic molten respec', () => {
    const invested = {
      [CRUCIBLE_IDS.rally]: 2,
      [CRUCIBLE_IDS.secondWind]: 3,
      [CRUCIBLE_IDS.overpower]: 1,
    };

    const respec = respecCrucibleTree(invested, 0, 'molten');

    expect(respec).toEqual({ ranks: { [CRUCIBLE_IDS.overpower]: 1 }, relicShards: 3 + 6 });
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

  it('maps ambush ranks to 5/10/15/20/25% round-1 damage and 0 before unlock (SIGNATURES §2.1)', () => {
    expect(ambushBonus({})).toBe(0);
    expect(ambushBonus({ [CRUCIBLE_IDS.ambush]: 1 })).toBe(0.05);
    expect(ambushBonus({ [CRUCIBLE_IDS.ambush]: 5 })).toBe(0.25);
  });

  it('maps menace ranks to 2/4/6/8/10% accuracy reduction and 0 before unlock (SIGNATURES §2.2)', () => {
    expect(menaceReduction({})).toBe(0);
    expect(menaceReduction({ [CRUCIBLE_IDS.menace]: 1 })).toBe(0.02);
    expect(menaceReduction({ [CRUCIBLE_IDS.menace]: 5 })).toBe(0.1);
  });

  it('maps momentum ranks to the initiative cap and 0 before unlock (SIGNATURES §2.3)', () => {
    expect(momentumCap({})).toBe(0);
    expect(momentumCap({ [CRUCIBLE_IDS.momentum]: 3 })).toBe(3);
    expect(momentumCap({ [CRUCIBLE_IDS.momentum]: 5 })).toBe(5);
  });

  it('maps second wind ranks to 10/15/20/25/30% of max health and 0 before unlock (SIGNATURES §2.4)', () => {
    expect(secondWindShare({})).toBe(0);
    expect(secondWindShare({ [CRUCIBLE_IDS.secondWind]: 3 })).toBe(0.2);
    expect(secondWindShare({ [CRUCIBLE_IDS.secondWind]: 5 })).toBe(0.3);
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
