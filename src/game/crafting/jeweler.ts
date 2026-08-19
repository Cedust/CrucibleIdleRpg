import { GEM_LABEL, GEM_POOLS, gemValueRange } from '@/game/items/gems';
import { RARITY_LABEL } from '@/game/crafting/blacksmith';
import { RARITY_LAYER } from '@/game/items/itemLayers';
import { lootStreamPrng } from '@/game/rewards/lootRewards';
import type { ArmorItem, GemStock, Range, RegularGemColor, SocketedGem } from '@/game/types';
import { deriveSeed, type Prng, type ResumablePrng } from '@/shared/utils/prng';

/**
 * Jeweler — Inlay-, Attune- und Recut-Regeln samt Kosten-Content
 * (docs/spec/ITEMS.md#8-jeweler--inlay-attune--recut). Hier liegt der einzige Zufall im
 * Handwerk: Affix und Wert fallen beim Inlay, der Wert beim Recut über den seedbaren
 * `loot`-Strom; Attune ist RNG-frei und erhält die relative Range-Position.
 */

/**
 * Ableitungs-Label der Craft-Seeds — Teil des Determinismus, deshalb Konstante
 * (docs/spec/SIMULATION.md#4-seeds-und-zufalls-ströme).
 */
const CRAFT_SEED_LABEL = 'craft';

/**
 * Loot-Strom eines Handwerks-Rolls. Der `craftCounter` ist wie der `runCounter` ein monoton
 * steigender, mit der Aktion persistierter Zähler: ein Reload liefert denselben Zähler und
 * damit exakt denselben Roll — Save-Scumming ist unmöglich.
 */
export function craftLootPrng(saveSeed: number, craftCounter: number): ResumablePrng {
  return lootStreamPrng(deriveSeed(saveSeed, CRAFT_SEED_LABEL, craftCounter));
}

/**
 * PLATZHALTER — Gold-Anteil des Inlay
 * (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten). Verbindlich ist nur, dass
 * jede Handwerks-Aktion Gold kostet (ITEMS §2); der Betrag ist Tuning.
 */
export const INLAY_GOLD_COST = 25;

/** Gold- und Gem-Bestände — die beiden Zahlmittel der Station. */
export interface JewelerFunds {
  gold: number;
  gems: GemStock;
}

/** Der Sperrgrund eines Inlay oder `null`, wenn es ausführbar ist. Spieltext, Englisch. */
export function inlayFailure(
  item: ArmorItem,
  socketIndex: number,
  color: RegularGemColor,
  funds: JewelerFunds,
): string | null {
  if (item.sockets.length === 0) {
    return 'The piece has no sockets. Masterwork opens the first socket.';
  }
  if (!Number.isInteger(socketIndex) || socketIndex < 0 || socketIndex >= item.sockets.length) {
    return 'No socket selected.';
  }
  if (funds.gems[color] < 1) {
    return `No ${GEM_LABEL[color]} in stock.`;
  }
  if (funds.gold < INLAY_GOLD_COST) {
    return 'Not enough Gold.';
  }
  return null;
}

/** Gleichverteilter Zug aus einem nicht-leeren Pool. */
function pick<T>(pool: readonly [T, ...T[]], prng: Prng): T {
  return pool[prng.nextInt(0, pool.length - 1)] ?? pool[0];
}

/** Gleichverteilter Wert innerhalb der geschlossenen Range eines Affixes. */
function rollValue(range: Range, prng: Prng): number {
  return range.min + prng.next() * (range.max - range.min);
}

/**
 * Rollt einen frischen Gem der Farbe: erst der Affix aus dem Farb-Pool, dann der Wert aus
 * dessen Range — die Wurf-Reihenfolge ist Teil des Determinismus. PLATZHALTER sind die
 * uniformen Pool-Gewichte (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten);
 * verbindlich ist, dass beide Würfe über den übergebenen `loot`-Strom laufen (ITEMS §8).
 */
export function rollGem(color: RegularGemColor, prng: Prng): SocketedGem {
  switch (color) {
    case 'amber': {
      const affix = pick(GEM_POOLS.amber, prng);
      return { color, affix, gemLevel: 1, value: rollValue(gemValueRange(affix, 1), prng) };
    }
    case 'ruby': {
      const affix = pick(GEM_POOLS.ruby, prng);
      return { color, affix, gemLevel: 1, value: rollValue(gemValueRange(affix, 1), prng) };
    }
    case 'sapphire': {
      const affix = pick(GEM_POOLS.sapphire, prng);
      return { color, affix, gemLevel: 1, value: rollValue(gemValueRange(affix, 1), prng) };
    }
    case 'emerald': {
      const affix = pick(GEM_POOLS.emerald, prng);
      return { color, affix, gemLevel: 1, value: rollValue(gemValueRange(affix, 1), prng) };
    }
  }
}

/**
 * Inlay: verbraucht genau einen Gem der Farbe aus dem Bestand, rollt Affix und Wert über
 * den `loot`-Strom und bindet den Gem an den Sockel (ITEMS §8). Ein belegter Sockel wird
 * überschrieben — der bisherige gebundene Gem ist verloren, der Bestand bleibt davon
 * unberührt. `null`, wenn `inlayFailure` die Aktion ablehnt.
 */
export function applyInlay(
  item: ArmorItem,
  socketIndex: number,
  color: RegularGemColor,
  funds: JewelerFunds,
  prng: Prng,
): { item: ArmorItem; gold: number; gems: GemStock } | null {
  if (inlayFailure(item, socketIndex, color, funds) !== null) {
    return null;
  }

  const gem = rollGem(color, prng);
  return {
    item: {
      ...item,
      sockets: item.sockets.map((existing, index) => (index === socketIndex ? gem : existing)),
    },
    gold: funds.gold - INLAY_GOLD_COST,
    gems: { ...funds.gems, [color]: funds.gems[color] - 1 },
  };
}

/**
 * PLATZHALTER — Fodder-Kurve des Attune
 * (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten). Verbindlich ist die
 * Struktur: jedes Level braucht mehr Gems gleicher Farbe (ITEMS §8, Fodder-Sink); die
 * Parameter sind Tuning.
 */
export const ATTUNE_FODDER_CURVE = { base: 2, growth: 1.5 } as const;

/** Fodder-Kosten des Attune vom übergebenen Gem-Level auf das nächste. */
export function attuneFodderCost(gemLevel: number): number {
  return Math.ceil(ATTUNE_FODDER_CURVE.base * ATTUNE_FODDER_CURVE.growth ** (gemLevel - 1));
}

/**
 * PLATZHALTER — Gold-Anteile von Attune und Recut
 * (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten). Verbindlich ist nur, dass
 * jede Handwerks-Aktion Gold kostet (ITEMS §2); die Beträge sind Tuning.
 */
export const ATTUNE_GOLD_COST = 40;
export const RECUT_GOLD_COST = 15;

/** Der gebundene Gem eines Sockels oder `null` bei leerem oder ungültigem Sockel. */
export function socketedGemAt(item: ArmorItem, socketIndex: number): SocketedGem | null {
  if (!Number.isInteger(socketIndex) || socketIndex < 0 || socketIndex >= item.sockets.length) {
    return null;
  }
  return item.sockets[socketIndex] ?? null;
}

/** Der Sperrgrund eines Attune oder `null`, wenn es ausführbar ist. Spieltext, Englisch. */
export function attuneFailure(
  item: ArmorItem,
  socketIndex: number,
  funds: JewelerFunds,
): string | null {
  const gem = socketedGemAt(item, socketIndex);
  if (gem === null) {
    return 'The socket holds no gem.';
  }
  const cap = RARITY_LAYER[item.rarity].gemLevelCap;
  if (gem.gemLevel >= cap) {
    return item.rarity === 'legendary'
      ? 'Gem level is at the Legendary maximum.'
      : `Gem level is at the ${RARITY_LABEL[item.rarity]} cap. Masterwork raises the cap.`;
  }
  if (funds.gems[gem.color] < attuneFodderCost(gem.gemLevel)) {
    return `Not enough ${GEM_LABEL[gem.color]} fodder.`;
  }
  if (funds.gold < ATTUNE_GOLD_COST) {
    return 'Not enough Gold.';
  }
  return null;
}

/** Relative Position eines Werts in seiner Range; degenerierte Ranges liegen bei 0. */
function rangePosition(value: number, range: Range): number {
  return range.max > range.min ? (value - range.min) / (range.max - range.min) : 0;
}

/**
 * Das Attune-Ergebnis eines Gems: Level +1, Wert an gleicher relativer Position in der
 * gewachsenen Range (ITEMS §8). RNG-frei — dient dem Vollzug wie der Vorher-→-Nachher-Vorschau.
 */
export function attunedGem(gem: SocketedGem): SocketedGem {
  const currentRange = gemValueRange(gem.affix, gem.gemLevel);
  const nextRange = gemValueRange(gem.affix, gem.gemLevel + 1);
  return {
    ...gem,
    gemLevel: gem.gemLevel + 1,
    value: nextRange.min + rangePosition(gem.value, currentRange) * (nextRange.max - nextRange.min),
  };
}

/**
 * Attune: hebt das Gem-Level im Sockel um genau eine Stufe bis zum Seltenheits-Cap; die
 * Value-Range steigt und der Wert behält seine relative Position in der Range (ITEMS §8).
 * RNG-frei. Kostet Gold plus Gems gleicher Farbe als Fodder. `null`, wenn `attuneFailure`
 * die Aktion ablehnt.
 */
export function applyAttune(
  item: ArmorItem,
  socketIndex: number,
  funds: JewelerFunds,
): { item: ArmorItem; gold: number; gems: GemStock } | null {
  const gem = socketedGemAt(item, socketIndex);
  if (gem === null || attuneFailure(item, socketIndex, funds) !== null) {
    return null;
  }

  const attuned = attunedGem(gem);

  return {
    item: {
      ...item,
      sockets: item.sockets.map((existing, index) => (index === socketIndex ? attuned : existing)),
    },
    gold: funds.gold - ATTUNE_GOLD_COST,
    gems: { ...funds.gems, [gem.color]: funds.gems[gem.color] - attuneFodderCost(gem.gemLevel) },
  };
}

/** Der Sperrgrund eines Recut oder `null`, wenn es ausführbar ist. Spieltext, Englisch. */
export function recutFailure(item: ArmorItem, socketIndex: number, gold: number): string | null {
  if (socketedGemAt(item, socketIndex) === null) {
    return 'The socket holds no gem.';
  }
  if (gold < RECUT_GOLD_COST) {
    return 'Not enough Gold.';
  }
  return null;
}

/**
 * Recut: würfelt den Wert des gebundenen Gems innerhalb seiner aktuellen Range neu — über
 * den übergebenen `loot`-Strom (ITEMS §8). Affix, Farbe und Gem-Level bleiben unverändert.
 * `null`, wenn `recutFailure` die Aktion ablehnt.
 */
export function applyRecut(
  item: ArmorItem,
  socketIndex: number,
  gold: number,
  prng: Prng,
): { item: ArmorItem; gold: number } | null {
  const gem = socketedGemAt(item, socketIndex);
  if (gem === null || recutFailure(item, socketIndex, gold) !== null) {
    return null;
  }

  const recut: SocketedGem = {
    ...gem,
    value: rollValue(gemValueRange(gem.affix, gem.gemLevel), prng),
  };
  return {
    item: {
      ...item,
      sockets: item.sockets.map((existing, index) => (index === socketIndex ? recut : existing)),
    },
    gold: gold - RECUT_GOLD_COST,
  };
}
