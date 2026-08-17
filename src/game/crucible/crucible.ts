import type { Act1DungeonId } from '@/game/encounters/act1';
import { ACT_1_DUNGEON_IDS } from '@/game/encounters/act1';
import type { CharacterId, DerivedStatPercent } from '@/game/types';
import type { ArmorSlot } from '@/game/types';

/**
 * Crucible — Node-Katalog, Rangwerte und Kostenfunktion der drei Trees
 * (docs/spec/PROGRESSION.md#3-crucible-globaler-skilltree). Deklarativer, typisierter
 * Balancing-Content getrennt von Logik und Stores (AGENTS.md); die Kampfwirkungen der
 * Molten-Nodes stehen in docs/spec/SIGNATURES.md.
 */

export const CRUCIBLE_TREES = ['anvil', 'smelting', 'molten'] as const;
export type CrucibleTreeId = (typeof CRUCIBLE_TREES)[number];

/** Nur Smelting und Molten sind flexibel; alle Anvil-Freischaltungen sind permanent. */
export const RESPECCABLE_TREES = ['smelting', 'molten'] as const;
export type RespeccableTreeId = (typeof RESPECCABLE_TREES)[number];

/**
 * Save-Keys aller Nodes, die Engine oder Stores referenzieren. Die IDs sind explizit
 * deklariert und bleiben bei Label-Änderungen stabil (Pre-Release-Save-Policy, AGENTS.md).
 */
export const CRUCIBLE_IDS = {
  waystones: 'anvil.waystones',
  armory: 'anvil.armory',
  blacksmith: 'anvil.blacksmith',
  jeweler: 'anvil.jeweler',
  overpower: 'smelting.overpower',
  ironSkin: 'smelting.iron-skin',
  unyielding: 'smelting.unyielding',
  quickStep: 'smelting.quick-step',
  mitigation: 'molten.mitigation',
  sunder: 'molten.sunder',
  suppression: 'molten.suppression',
  rally: 'molten.rally',
  ambush: 'molten.ambush',
  menace: 'molten.menace',
  momentum: 'molten.momentum',
  secondWind: 'molten.second-wind',
  runeGrimoire: 'anvil.rune-grimoire',
  talisman: 'anvil.talisman',
  runicFocus: 'anvil.runic-focus',
  runeMastery: 'anvil.rune-mastery',
} as const;

/** Feste Armory-Reihenfolge aus PROGRESSION §3.1 — keine Spielerentscheidung. */
export const ARMORY_SLOT_ORDER: readonly ArmorSlot[] = ['chest', 'legs', 'head', 'feet'];

/** Gekaufte Node-Ränge — die alleinige Wahrheit des Crucible-Standes im Save. */
export type CrucibleRanks = Readonly<Record<string, number>>;

export interface CrucibleNode {
  id: string;
  tree: CrucibleTreeId;
  /** Spieltext, Englisch. */
  name: string;
  maxRank: number;
  /** Node-Voraussetzung: Mindestrang eines anderen Nodes; `matching` verlangt den Zielrang. */
  prerequisites: readonly { nodeId: string; rank: number | 'matching' }[];
  /** Spieltext, Englisch — Anzeige der Wirkung je Rang. */
  effect: string;
  /**
   * Sichtbar, aber bis zum genannten Meilenstein/Folgetask nicht kaufbar
   * (docs/backlog/ROADMAP.md). Spieltext, Englisch.
   */
  lockedUntil?: string;
}

const node = (
  id: string,
  tree: CrucibleTreeId,
  name: string,
  maxRank: number,
  effect: string,
  options: Partial<Pick<CrucibleNode, 'prerequisites' | 'lockedUntil'>> = {},
): CrucibleNode => ({
  id,
  tree,
  name,
  maxRank,
  prerequisites: options.prerequisites ?? [],
  effect,
  ...(options.lockedUntil === undefined ? {} : { lockedUntil: options.lockedUntil }),
});

/**
 * Der vollständige Katalog (PROGRESSION §3.1–§3.3). Gesperrte Nodes erscheinen sichtbar als
 * Voraussetzungen späterer Systeme; kaufbar sind seit M4 Waystones, Armory, Blacksmith,
 * Smelting und der komplette Molten-Tree — zusammen 201 aktive Relic-Shard-Kosten.
 */
export const CRUCIBLE_NODES: readonly CrucibleNode[] = [
  node(
    CRUCIBLE_IDS.waystones,
    'anvil',
    'Waystones',
    4,
    'Unlocks the entry of A1-D2 / A1-D3 / A1-D4 / A1-D5.',
  ),
  node(
    CRUCIBLE_IDS.armory,
    'anvil',
    'Armory',
    4,
    'Unlocks Chest / Legs / Head / Feet for all characters.',
  ),
  node(CRUCIBLE_IDS.blacksmith, 'anvil', 'Blacksmith', 1, 'Unlocks the Blacksmith system.', {
    prerequisites: [{ nodeId: CRUCIBLE_IDS.armory, rank: 1 }],
  }),
  node(CRUCIBLE_IDS.jeweler, 'anvil', 'Jeweler', 1, 'Unlocks the Jeweler system.', {
    prerequisites: [{ nodeId: CRUCIBLE_IDS.blacksmith, rank: 1 }],
    lockedUntil: 'Crafting (M4)',
  }),
  node(CRUCIBLE_IDS.overpower, 'smelting', 'Overpower', 5, '+3% Attack per rank.'),
  node(CRUCIBLE_IDS.ironSkin, 'smelting', 'Iron Skin', 5, '+3% Defense per rank.'),
  node(CRUCIBLE_IDS.unyielding, 'smelting', 'Unyielding', 5, '+3% Health per rank.'),
  node(CRUCIBLE_IDS.quickStep, 'smelting', 'Quick Step', 5, '+1 Initiative per rank.'),
  node(
    CRUCIBLE_IDS.mitigation,
    'molten',
    'Mitigation',
    5,
    'Korvin redirects 10/15/20/25/30% of each ally damage tick to himself.',
  ),
  node(
    CRUCIBLE_IDS.sunder,
    'molten',
    'Sunder',
    5,
    'Rhaya reduces hit frontline Bulwark by 2/4/6/8/10 pp per attack, capped at 4/8/12/16/20 pp per combat.',
  ),
  node(
    CRUCIBLE_IDS.suppression,
    'molten',
    'Suppression',
    5,
    "Quinn's hit delays the target's open action by 1/2/3/4/5 queue places.",
  ),
  node(
    CRUCIBLE_IDS.rally,
    'molten',
    'Rally',
    5,
    'Fallen characters re-enter the next floor with 10/15/20/25/30% of their Max Health.',
  ),
  node(CRUCIBLE_IDS.ambush, 'molten', 'Ambush', 5, '+5/10/15/20/25% final damage in round 1.', {
    prerequisites: [{ nodeId: CRUCIBLE_IDS.sunder, rank: 1 }],
  }),
  node(
    CRUCIBLE_IDS.menace,
    'molten',
    'Menace',
    5,
    '-2/4/6/8/10% enemy Accuracy while Korvin lives.',
    {
      prerequisites: [{ nodeId: CRUCIBLE_IDS.mitigation, rank: 1 }],
    },
  ),
  node(
    CRUCIBLE_IDS.momentum,
    'molten',
    'Momentum',
    5,
    'Up to +1/2/3/4/5 Initiative as rounds pass.',
    {
      prerequisites: [{ nodeId: CRUCIBLE_IDS.suppression, rank: 1 }],
    },
  ),
  node(
    CRUCIBLE_IDS.secondWind,
    'molten',
    'Second Wind',
    5,
    'Once per dungeon the first lethal hit leaves 10/15/20/25/30% Max Health.',
    {
      prerequisites: [{ nodeId: CRUCIBLE_IDS.rally, rank: 1 }],
    },
  ),
  node(
    CRUCIBLE_IDS.runeGrimoire,
    'anvil',
    'Rune Grimoire',
    1,
    'Unlocks the Rune system and Rune level cap 1.',
    {
      lockedUntil: 'Runes (M5)',
    },
  ),
  node(CRUCIBLE_IDS.talisman, 'anvil', 'Talisman', 3, 'Unlocks the Rite for character 1 / 2 / 3.', {
    prerequisites: [{ nodeId: CRUCIBLE_IDS.runeGrimoire, rank: 1 }],
    lockedUntil: 'Runes (M5)',
  }),
  node(
    CRUCIBLE_IDS.runicFocus,
    'anvil',
    'Runic Focus',
    3,
    'Unlocks the Modifier for character 1 / 2 / 3.',
    {
      prerequisites: [{ nodeId: CRUCIBLE_IDS.talisman, rank: 'matching' }],
      lockedUntil: 'Runes (M5)',
    },
  ),
  node(
    CRUCIBLE_IDS.runeMastery,
    'anvil',
    'Rune Mastery',
    4,
    'Raises the Rune level cap to 2 / 3 / 4 / 5.',
    {
      prerequisites: [{ nodeId: CRUCIBLE_IDS.runeGrimoire, rank: 1 }],
      lockedUntil: 'Runes (M5)',
    },
  ),
];

const NODES_BY_ID = new Map(CRUCIBLE_NODES.map((entry) => [entry.id, entry]));

export function crucibleNodeById(nodeId: string): CrucibleNode | undefined {
  return NODES_BY_ID.get(nodeId);
}

/* ------------------------------------------------------------------ Kosten */

/** Ein neuer Rang kostet genau seine Rangnummer in Relic Shards (PROGRESSION §3). */
export function rankCost(nextRank: number): number {
  return nextRank;
}

/** Formatiert einen Relic-Shard-Betrag mit korrektem englischen Numerus. */
export function formatRelicShards(amount: number): string {
  return `${amount} ${amount === 1 ? 'Relic Shard' : 'Relic Shards'}`;
}

/** Gesamtkosten der Ränge 1..rank: `rank × (rank + 1) / 2` — fünf Ränge kosten 15. */
export function totalRankCost(rank: number): number {
  const clamped = Math.max(Math.trunc(rank), 0);
  return (clamped * (clamped + 1)) / 2;
}

/** In einen Tree investierte Relic Shards — die exakte Erstattung seines Respecs. */
export function investedRelicShards(ranks: CrucibleRanks, tree?: CrucibleTreeId): number {
  return Object.entries(ranks).reduce((total, [id, rank]) => {
    const entry = crucibleNodeById(id);
    return entry !== undefined && (tree === undefined || entry.tree === tree)
      ? total + totalRankCost(rank)
      : total;
  }, 0);
}

/* ------------------------------------------------------------------ Kauf */

/** Vollendet-Flags je Dungeon — die Kaufvoraussetzung der Waystones (PROGRESSION §3.1). */
export type CompletedDungeons = Readonly<Record<Act1DungeonId, boolean>>;

/**
 * Erfüllt der Stand die Voraussetzungen für `rank` des Nodes? Waystone-Rang `n` verlangt das
 * Vollendet-Flag von `A1-D<n>`; Node-Voraussetzungen verlangen ihren Mindestrang bzw. bei
 * `matching` den Zielrang (PROGRESSION §3.1).
 */
export function meetsPrerequisites(
  ranks: CrucibleRanks,
  completedDungeons: CompletedDungeons,
  crucibleNode: CrucibleNode,
  rank: number,
): boolean {
  if (crucibleNode.id === CRUCIBLE_IDS.waystones) {
    for (let step = 1; step <= rank; step += 1) {
      const dungeonId = ACT_1_DUNGEON_IDS[step - 1];
      if (dungeonId === undefined || !completedDungeons[dungeonId]) {
        return false;
      }
    }
    return true;
  }

  return crucibleNode.prerequisites.every(
    ({ nodeId, rank: required }) =>
      (ranks[nodeId] ?? 0) >= (required === 'matching' ? rank : required),
  );
}

/** Der Sperrgrund eines Kaufs oder `null`, wenn der nächste Rang kaufbar ist. Spieltext, Englisch. */
export function purchaseFailure(
  ranks: CrucibleRanks,
  relicShards: number,
  completedDungeons: CompletedDungeons,
  nodeId: string,
): string | null {
  const entry = crucibleNodeById(nodeId);
  if (entry === undefined) return 'Unknown Crucible node.';
  if (entry.lockedUntil !== undefined) return `Locked until ${entry.lockedUntil}.`;

  const currentRank = ranks[entry.id] ?? 0;
  if (currentRank >= entry.maxRank) return 'Node is already at maximum rank.';
  if (!meetsPrerequisites(ranks, completedDungeons, entry, currentRank + 1)) {
    return entry.id === CRUCIBLE_IDS.waystones
      ? `Requires completing ${ACT_1_DUNGEON_IDS[currentRank] ?? ''}.`
      : 'A prerequisite node is missing.';
  }
  if (relicShards < rankCost(currentRank + 1)) {
    return `Requires ${formatRelicShards(rankCost(currentRank + 1))}.`;
  }
  return null;
}

/**
 * Wendet den Kauf des nächsten Rangs an: die Rangnummer wird in Relic Shards bezahlt, der Rang
 * steigt um eins. `null`, wenn `purchaseFailure` den Kauf ablehnt.
 */
export function purchaseCrucibleNode(
  ranks: CrucibleRanks,
  relicShards: number,
  completedDungeons: CompletedDungeons,
  nodeId: string,
): { ranks: CrucibleRanks; relicShards: number } | null {
  if (purchaseFailure(ranks, relicShards, completedDungeons, nodeId) !== null) {
    return null;
  }

  const nextRank = (ranks[nodeId] ?? 0) + 1;
  return {
    ranks: { ...ranks, [nodeId]: nextRank },
    relicShards: relicShards - rankCost(nextRank),
  };
}

/* ------------------------------------------------------------------ Respec */

/**
 * Kostenloser Tree-Respec (PROGRESSION §3): entfernt atomar alle Ränge des flexiblen Trees und
 * erstattet exakt die investierten Relic Shards. `null` ohne Investition; Anvil ist nie
 * respecbar.
 */
export function respecCrucibleTree(
  ranks: CrucibleRanks,
  relicShards: number,
  tree: RespeccableTreeId,
): { ranks: CrucibleRanks; relicShards: number } | null {
  const refunded = investedRelicShards(ranks, tree);
  if (refunded === 0) {
    return null;
  }

  return {
    ranks: Object.fromEntries(
      Object.entries(ranks).filter(([id]) => crucibleNodeById(id)?.tree !== tree),
    ),
    relicShards: relicShards + refunded,
  };
}

/* ------------------------------------------------------------------ Abgeleitete Einstiege */

/**
 * Die freigeschalteten Dungeon-Einstiege sind aus dem Waystone-Rang abgeleitet, nicht
 * gespeichert (docs/spec/PERSISTENCE.md#23-crucible-save-version): `A1-D1` plus ein Einstieg je
 * Rang.
 */
export function deriveUnlockedDungeonIds(ranks: CrucibleRanks): readonly Act1DungeonId[] {
  const waystoneRank = Math.min(ranks[CRUCIBLE_IDS.waystones] ?? 0, ACT_1_DUNGEON_IDS.length - 1);
  return ACT_1_DUNGEON_IDS.slice(0, waystoneRank + 1);
}

/**
 * Die aus `anvil.armory` abgeleiteten permanenten Slots. Der Save speichert die Items, aber
 * ihre zulässige Menge folgt ausschließlich dem Rang (PERSISTENCE §2).
 */
export function deriveUnlockedArmorSlots(ranks: CrucibleRanks): readonly ArmorSlot[] {
  const armoryRank = Math.min(ranks[CRUCIBLE_IDS.armory] ?? 0, ARMORY_SLOT_ORDER.length);
  return ARMORY_SLOT_ORDER.slice(0, armoryRank);
}

/** Der nächste teamweite Slot eines kaufbaren Armory-Rangs, sonst `undefined` bei Rang 4. */
export function nextArmorySlot(ranks: CrucibleRanks): ArmorSlot | undefined {
  return ARMORY_SLOT_ORDER[ranks[CRUCIBLE_IDS.armory] ?? 0];
}

/* ------------------------------------------------------------------ Rangwerte */

/** Umleitungsanteil `m` je Mitigation-Rang (SIGNATURES §1.1); `0` vor Freischaltung. */
const MITIGATION_SHARE = [0.1, 0.15, 0.2, 0.25, 0.3] as const;

/** Bulwark-Abbau je Angriff und kumulatives Cap je Sunder-Rang (SIGNATURES §1.2). */
const SUNDER_PER_ATTACK = [0.02, 0.04, 0.06, 0.08, 0.1] as const;
const SUNDER_CAP = [0.04, 0.08, 0.12, 0.16, 0.2] as const;

/** Max-Health-Anteil je Rally-Rang (PROGRESSION §4). */
const RALLY_SHARE = [0.1, 0.15, 0.2, 0.25, 0.3] as const;

/** Runde-1-Bonus auf den finalen ausgehenden Schaden je Ambush-Rang (SIGNATURES §2.1). */
const AMBUSH_BONUS = [0.05, 0.1, 0.15, 0.2, 0.25] as const;

/** Relative Accuracy-Minderung je Menace-Rang (SIGNATURES §2.2). */
const MENACE_REDUCTION = [0.02, 0.04, 0.06, 0.08, 0.1] as const;

/** Max-Health-Anteil je Second-Wind-Rang (SIGNATURES §2.4). */
const SECOND_WIND_SHARE = [0.1, 0.15, 0.2, 0.25, 0.3] as const;

/** `+3 %` je Smelting-Rang auf den gekoppelten Derived Stat (PROGRESSION §3.2). */
export const SMELTING_BONUS_PER_RANK = 0.03;

function rankValue(values: readonly number[], rank: number): number {
  return rank >= 1 ? (values[Math.min(Math.trunc(rank), values.length) - 1] as number) : 0;
}

export function mitigationShare(ranks: CrucibleRanks): number {
  return rankValue(MITIGATION_SHARE, ranks[CRUCIBLE_IDS.mitigation] ?? 0);
}

export interface SunderEffect {
  /** Abbau in Prozentpunkten je Angriff und getroffenem Frontline-Ziel. */
  perAttack: number;
  /** Kumulatives Abbau-Cap je Ziel und Kampf. */
  cap: number;
}

export function sunderEffect(ranks: CrucibleRanks): SunderEffect | null {
  const rank = ranks[CRUCIBLE_IDS.sunder] ?? 0;
  if (rank < 1) return null;
  return { perAttack: rankValue(SUNDER_PER_ATTACK, rank), cap: rankValue(SUNDER_CAP, rank) };
}

/** Queue-Plätze `L` je Suppression-Rang (SIGNATURES §1.3); `0` vor Freischaltung. */
export function suppressionPlaces(ranks: CrucibleRanks): number {
  return ranks[CRUCIBLE_IDS.suppression] ?? 0;
}

export function rallyShare(ranks: CrucibleRanks): number {
  return rankValue(RALLY_SHARE, ranks[CRUCIBLE_IDS.rally] ?? 0);
}

export function ambushBonus(ranks: CrucibleRanks): number {
  return rankValue(AMBUSH_BONUS, ranks[CRUCIBLE_IDS.ambush] ?? 0);
}

export function menaceReduction(ranks: CrucibleRanks): number {
  return rankValue(MENACE_REDUCTION, ranks[CRUCIBLE_IDS.menace] ?? 0);
}

/** Initiative-Cap je Momentum-Rang (SIGNATURES §2.3); `0` vor Freischaltung. */
export function momentumCap(ranks: CrucibleRanks): number {
  return ranks[CRUCIBLE_IDS.momentum] ?? 0;
}

export function secondWindShare(ranks: CrucibleRanks): number {
  return rankValue(SECOND_WIND_SHARE, ranks[CRUCIBLE_IDS.secondWind] ?? 0);
}

/**
 * Wer welchen Signatur-Skill trägt (docs/spec/CHARACTERS.md#7-signatur-skills). Mitigation
 * braucht keinen Eintrag: Die Umleitung zielt strukturell auf die Tank-Rolle.
 */
export const SIGNATURE_OWNER = {
  sunder: 'rhaya',
  suppression: 'quinn',
} as const satisfies Record<string, CharacterId>;

/** Wirkung der Smelting-Nodes: Crucible-Ebene je Derived Stat plus flache Initiative. */
export interface SmeltingEffects {
  crucibleBonus: DerivedStatPercent;
  initiative: number;
}

/**
 * Innerhalb der Crucible-Ebene additiv, als Ebene multiplikativ zu Basis- und Attributebene
 * (PROGRESSION §3.2, docs/spec/CHARACTERS.md#2-stats). Quick Step addiert seinen Rang flach.
 */
export function smeltingEffects(ranks: CrucibleRanks): SmeltingEffects {
  return {
    crucibleBonus: {
      attack: SMELTING_BONUS_PER_RANK * (ranks[CRUCIBLE_IDS.overpower] ?? 0),
      defense: SMELTING_BONUS_PER_RANK * (ranks[CRUCIBLE_IDS.ironSkin] ?? 0),
      health: SMELTING_BONUS_PER_RANK * (ranks[CRUCIBLE_IDS.unyielding] ?? 0),
    },
    initiative: ranks[CRUCIBLE_IDS.quickStep] ?? 0,
  };
}
