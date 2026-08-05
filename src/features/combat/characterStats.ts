import {
  ATTRIBUTE_BONUS_PER_POINT,
  BASELINE_GROWTH,
  CORE_STAT_PER_POINT,
} from '@/game/curves/characterCurves';
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
 * Derived = (Baseline + Core-Stat-Beitrag) × (1 + Attribut-Bonus) × (1 + Crucible-Bonus)
 * ```
 *
 * Die Baseline wächst je Charakterlevel (docs/spec/CHARACTERS.md#5-charakterlevel), der
 * Core-Stat-Beitrag stammt aus Item-Innate und Emerald-Gems.
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

/**
 * Baseline-Multiplikator für ein Level. Die Tabelle deckt Level 1–100 ab; Level außerhalb
 * werden auf die Tabellengrenzen geklemmt, damit der Index typsicher greift
 * (AGENTS.md).
 */
function baselineGrowth(stat: keyof DerivedStats, level: number): number {
  const table = BASELINE_GROWTH[stat];
  const index = Math.min(Math.max(Math.trunc(level), 1), table.length) - 1;
  return table[index] as number;
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
    const baseline = definition.baseDerived[stat] * baselineGrowth(stat, progression.level);
    const coreContribution = core[source.core] * CORE_STAT_PER_POINT;
    const attributeBonus =
      progression.attributePoints[source.attribute] * ATTRIBUTE_BONUS_PER_POINT;

    return (
      (baseline + coreContribution) * (1 + attributeBonus) * (1 + progression.crucibleBonus[stat])
    );
  };

  return {
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
}
