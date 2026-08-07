import { ATTRIBUTE_BONUS_PER_POINT } from '@/game/curves/characterCurves';
import {
  MASTERY_BALANCE,
  MASTERY_IDS,
  nodeById,
  WEAPON_MODE_KEYS,
  WEAPON_MODES,
} from '@/game/weaponMastery/mastery';
import type {
  AttributePoints,
  CharacterDefinition,
  CharacterStats,
  CoreStats,
  DerivedStatPercent,
  DerivedStats,
} from '@/game/types';

/**
 * Herleitung der effektiven Kampfwerte eines Charakters — reine Funktion ohne Store, Timer
 * oder DOM (AGENTS.md). Sämtliche Zahlen stammen aus dem Balancing-Content unter
 * `src/game/`; hier steht ausschließlich die Struktur der Zusammensetzung.
 *
 * Die drei Derived Stats entstehen multiplikativ geschichtet
 * (docs/spec/CHARACTERS.md#2-stats):
 *
 * ```
 * Derived = (feste Basis + Core-Stat) × (1 + Attribut-Bonus) × (1 + Crucible-Bonus)
 * ```
 *
 * Die feste Basis stammt bei Attack aus der Signaturwaffe, bei Defense und Health aus der
 * Charakter-Definition. Level verändert keinen Derived Stat; Core-Stats stammen aus
 * Item-Innate und Emerald-Gems.
 *
 * Offensive, Defensive und Utility Stats haben keine solche Schichtung — sie kommen direkt
 * aus der Charakter-Definition. Die Achsen-Trennung bleibt dabei gewahrt: keine Quelle
 * dieser Herleitung überträgt zwischen Offense und Defense
 * (docs/spec/DAMAGE-SYSTEM.md#15-feststehende-regeln).
 */

/**
 * Welche Quelle welchen Derived Stat speist (docs/spec/CHARACTERS.md#2-stats) — Struktur,
 * kein Balancing.
 */
const DERIVED_SOURCES: Record<
  keyof DerivedStats,
  { core: keyof CoreStats; attribute: keyof AttributePoints }
> = {
  attack: { core: 'might', attribute: 'ferocity' },
  defense: { core: 'toughness', attribute: 'resilience' },
  health: { core: 'vitality', attribute: 'vigor' },
};

/** Veränderlicher Zustand eines Charakters außerhalb seiner Definition. */
export interface CharacterProgression {
  /** Charakterlevel 1–100 (docs/spec/CHARACTERS.md#5-charakterlevel). */
  level: number;
  /** Core-Stat-Punkte aus Item-Innate und Emerald-Gems, zusätzlich zur Definition. */
  coreStats: CoreStats;
  /** Verteilte Attributpunkte (docs/spec/CHARACTERS.md#3-attribute-level-up-progression). */
  attributePoints: AttributePoints;
  /** Crucible-Ebene je Derived Stat als Anteil; `0` ist neutral. */
  crucibleBonus: DerivedStatPercent;
  masteryRanks?: Readonly<Record<string, number>>;
}

/**
 * Fortschritt ohne jede Zusatzquelle: keine Core-Stats, keine Attributpunkte, kein
 * Crucible-Bonus. Der Stand in M1 — Vergabe folgt in M2/M3.
 */
export function neutralProgression(level: number): CharacterProgression {
  return {
    level,
    coreStats: { might: 0, toughness: 0, vitality: 0 },
    attributePoints: { ferocity: 0, resilience: 0, vigor: 0 },
    crucibleBonus: { attack: 0, defense: 0, health: 0 },
  };
}

export function deriveCharacterStats(
  definition: CharacterDefinition,
  progression: CharacterProgression,
): CharacterStats {
  const core: CoreStats = {
    might: definition.baseCore.might + progression.coreStats.might,
    toughness: definition.baseCore.toughness + progression.coreStats.toughness,
    vitality: definition.baseCore.vitality + progression.coreStats.vitality,
  };

  const deriveStat = (stat: keyof DerivedStats): number => {
    const source = DERIVED_SOURCES[stat];
    const base = stat === 'attack' ? definition.weapon.baseDamage : definition.baseDerived[stat];
    const coreContribution = core[source.core];
    const attributeBonus =
      progression.attributePoints[source.attribute] * ATTRIBUTE_BONUS_PER_POINT;

    return (base + coreContribution) * (1 + attributeBonus) * (1 + progression.crucibleBonus[stat]);
  };

  const stats: CharacterStats = {
    core,
    derived: {
      attack: deriveStat('attack'),
      defense: deriveStat('defense'),
      health: deriveStat('health'),
    },
    offensive: { ...definition.baseOffensive },
    defensive: { ...definition.baseDefensive },
    utility: { ...definition.baseUtility },
  };

  for (const [id, rank] of Object.entries(progression.masteryRanks ?? {})) {
    const node = nodeById(definition.id, id);
    if (node?.stat === undefined || node.perRank === undefined) continue;
    const bonus = node.perRank * rank;
    if (node.stat === 'attack' || node.stat === 'defense') {
      stats.derived[node.stat] += bonus;
    } else if (node.stat in stats.offensive) {
      const key = node.stat as keyof CharacterStats['offensive'];
      stats.offensive[key] += bonus;
    } else if (node.stat in stats.defensive) {
      const key = node.stat as keyof CharacterStats['defensive'];
      stats.defensive[key] += bonus;
    } else if (node.stat !== 'precision' && node.stat !== 'minRng' && node.stat !== 'maxRng') {
      const key = node.stat as keyof CharacterStats['utility'];
      stats.utility[key] += bonus;
    }
  }

  const ranks = progression.masteryRanks ?? {};
  const has = (id: string): boolean => (ranks[id] ?? 0) > 0;

  for (const key of WEAPON_MODE_KEYS) {
    if (has(MASTERY_IDS[key])) {
      stats.derived.attack += WEAPON_MODES[key].attackFlat;
    }
  }
  if (has(MASTERY_IDS.immovableGuard)) {
    stats.defensive.blockChance += MASTERY_BALANCE.immovableGuard.blockChanceFlat;
  }

  for (const key of ['critChance', 'multiHitChance', 'splashChance', 'counterChance'] as const) {
    stats.offensive[key] = Math.min(stats.offensive[key], 1);
  }
  stats.defensive.blockChance = Math.min(stats.defensive.blockChance, 1);
  return stats;
}
