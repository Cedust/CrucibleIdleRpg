import { rollSigilDrop } from '@/game/sigils/sigilDrops';
import type { SigilCodex } from '@/game/sigils/types';
import type { EncounterClass, FloorId, FloorLoot, GemColor } from '@/game/types';
import { REGULAR_GEM_COLORS } from '@/game/types';
import { derivePrng, PRNG_STREAM, type Prng, type ResumablePrng } from '@/shared/utils/prng';

/** Ein Akt umfasst 5 Dungeons × 20 Floors (docs/spec/PROGRESSION.md#1-struktur-akte-dungeons-floors). */
const FLOORS_PER_ACT = 100;

/**
 * PLATZHALTER — Mengen, Chancen und Staffelungen des Drop-Modells bleiben bis zum
 * Balancing-Pass offen (docs/backlog/OPEN_ISSUES.md#1-offene-balancing-fragen--tuning-notizen).
 * Verbindlich ist die Struktur aus docs/spec/ITEMS.md#6-drops-gems-cinder--sigils: reguläre
 * Gems von allen Gegnern nach Floor-Tiefe gestaffelt, Diamond nur Elite/Boss ab Akt 2,
 * Cinder garantiert vom Boss und als monoton steigende Elite-Chance ohne Akt-Reset.
 */
export const LOOT_BALANCING = {
  /** Chance je besiegtem Gegner auf einen regulären Gem, auf globalem Floor-Index 0. */
  gemChanceBase: 0.35,
  /** Tiefen-Staffelung: Zuwachs der Gem-Chance je globalem Floor. */
  gemChancePerFloor: 0.002,
  /** Obergrenze der Gem-Chance je Gegner. */
  gemChanceCap: 0.9,
  /** Diamond-Chance eines Elite-/Boss-Siegs ab Akt 2. */
  diamondChance: 0.25,
  /** Elite-Cinder-Chance auf globalem Floor-Index 0. */
  eliteCinderChanceBase: 0.1,
  /** Monotoner Zuwachs der Elite-Cinder-Chance je globalem Floor (kein Akt-Reset). */
  eliteCinderChancePerFloor: 0.002,
  /** Obergrenze der Elite-Cinder-Chance. */
  eliteCinderChanceCap: 0.75,
} as const;

/**
 * PLATZHALTER — Runewords folgen derselben deklarativen Balancing-Policy wie das übrige Loot.
 * Regel bleibt: jeder besiegte Gegner liefert nach Grimoire-Freischaltung mindestens einen
 * Runeword, die Tiefe fügt einen Seed-basierten Bonus hinzu, Elite und Boss einen festen Bonus.
 */
export const RUNEWORD_BALANCING = {
  depthFloorsPerTier: 25,
  eliteBonus: 2,
  bossBonus: 5,
} as const;

/** Eingaben der Loot-Auswertung eines Floor-Siegs — alle drei stehen mit dem Encounter fest. */
export interface FloorLootInput {
  floorId: FloorId;
  classification: EncounterClass;
  /** Globaler Floor-Index `0..299` über alle drei Akte. */
  floorIndex: number;
  enemyCount: number;
  /** Das Rune Grimoire ist das strikte System-Gate vor jedem Runewords-Drop. */
  runeGrimoireUnlocked?: boolean;
}

/** Akt-Nummer eines globalen Floor-Index — Grundlage der Akt-2-Diamond-Grenze (ITEMS §6). */
export function actForFloorIndex(floorIndex: number): number {
  return Math.floor(floorIndex / FLOORS_PER_ACT) + 1;
}

/** Chance je besiegtem Gegner auf einen regulären Gem, tiefenabhängig gestaffelt. */
export function gemDropChance(floorIndex: number): number {
  return Math.min(
    LOOT_BALANCING.gemChanceBase + floorIndex * LOOT_BALANCING.gemChancePerFloor,
    LOOT_BALANCING.gemChanceCap,
  );
}

/** Elite-Cinder-Chance: monoton steigend mit dem globalen Floor-Index, ohne Akt-Reset. */
export function eliteCinderChance(floorIndex: number): number {
  return Math.min(
    LOOT_BALANCING.eliteCinderChanceBase + floorIndex * LOOT_BALANCING.eliteCinderChancePerFloor,
    LOOT_BALANCING.eliteCinderChanceCap,
  );
}

/** Fester Elite-/Boss-Zuschlag zusätzlich zur Beute aller besiegten Gegner. */
export function runewordClassificationBonus(classification: EncounterClass): number {
  switch (classification) {
    case 'elite':
      return RUNEWORD_BALANCING.eliteBonus;
    case 'boss':
      return RUNEWORD_BALANCING.bossBonus;
    case 'normal':
      return 0;
  }
}

/**
 * Runewords sind nach der Grimoire-Freischaltung Beute aller Gegner. Jeder Gegner garantiert
 * eine Währung; je 25 globale Floors erweitert der `loot`-Wurf den möglichen Einzelbonus um
 * eine Stufe. Die Werte sind ausdrücklich austauschbarer Balancing-Content.
 */
export function rollRunewords(input: FloorLootInput, prng: Prng): number {
  if (input.runeGrimoireUnlocked !== true) return 0;

  const depthBonusLimit = Math.floor(input.floorIndex / RUNEWORD_BALANCING.depthFloorsPerTier);
  let runewords = runewordClassificationBonus(input.classification);
  for (let enemy = 0; enemy < input.enemyCount; enemy += 1) {
    runewords += 1 + prng.nextInt(0, depthBonusLimit);
  }
  return runewords;
}

/** Alle fünf Gem-Zähler auf `0` — Basis des Loot-Ergebnisses und des Save-Defaults. */
export function createEmptyGemStock(): Record<GemColor, number> {
  return { amber: 0, ruby: 0, sapphire: 0, emerald: 0, diamond: 0 };
}

/** Loot-Strom eines Floors (docs/spec/SIMULATION.md#4-seeds-und-zufalls-ströme). */
export function lootStreamPrng(floorSeed: number): ResumablePrng {
  return derivePrng(floorSeed, PRNG_STREAM.loot);
}

/**
 * Wertet den Loot eines Floor-Siegs aus — rein und deterministisch über den übergebenen
 * `loot`-Strom. Die Wurf-Reihenfolge ist Teil des Determinismus: erst je Gegner der reguläre
 * Gem-Wurf, dann der Diamond-Wurf (nur Elite/Boss ab Akt 2), der Elite-Cinder-Wurf, Sigil und
 * zuletzt Runewords. Der Boss-Cinder ist garantiert und verbraucht keinen Wurf.
 */
export function rollFloorLoot(input: FloorLootInput, codex: SigilCodex, prng: Prng): FloorLoot {
  const gems = createEmptyGemStock();
  const regularGemChance = gemDropChance(input.floorIndex);
  for (let enemy = 0; enemy < input.enemyCount; enemy += 1) {
    if (prng.chance(regularGemChance)) {
      const color = REGULAR_GEM_COLORS[prng.nextInt(0, REGULAR_GEM_COLORS.length - 1)];
      if (color !== undefined) {
        gems[color] += 1;
      }
    }
  }

  if (
    input.classification !== 'normal' &&
    actForFloorIndex(input.floorIndex) >= 2 &&
    prng.chance(LOOT_BALANCING.diamondChance)
  ) {
    gems.diamond += 1;
  }

  let cinder = 0;
  if (input.classification === 'boss') {
    cinder = 1;
  } else if (input.classification === 'elite' && prng.chance(eliteCinderChance(input.floorIndex))) {
    cinder = 1;
  }

  return {
    gems,
    cinder,
    sigil: rollSigilDrop(input.floorId, codex, prng),
    runewords: rollRunewords(input, prng),
  };
}
