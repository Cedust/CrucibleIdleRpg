/**
 * Gemeinsame Interfaces für den deklarativen Balancing-Content (siehe AGENTS.md §4).
 * Content liegt getrennt von der Spiellogik unter src/game/. Alle Spieltexte Englisch.
 *
 * Die Regeln aus SPEC.md §1–§3 sind festgelegt, die Zahlen noch offen (BALANCING.md §5).
 * Diese Datei beschreibt die Form, die der Content annimmt.
 */

export type CharacterId = 'korvin' | 'rhaya' | 'quinn';
export type EnemyId = string;

/** Rolle bestimmt Zielregeln und Formationsplatz (SPEC §1.2/§1.3). */
export type Role = 'tank' | 'melee' | 'ranged';

/** Die beiden Lanes der 2×3-Gegnerformation (SPEC §1.3). */
export type Lane = 'frontline' | 'backline';

/** Core-Stats speisen die Derived Stats über je eigene Kurven (SPEC §3.0). */
export interface CoreStats {
  might: number;
  toughness: number;
  vitality: number;
}

/** Attack/Defense/Health entstehen aus Baseline + Attribut + Core-Stat (SPEC §3.0). */
export interface DerivedStats {
  attack: number;
  defense: number;
  health: number;
}

/**
 * Offensive Stats — paarweise Chance + Damage je Muster (SPEC §3.0).
 * Chancen als Anteil 0..1; Damage-Werte als Anteil des rohen Grundschadens (SPEC §2.1).
 * critDamage ist ein Gesamt-Multiplikator: 2 = 200 %, neutral ist 1.
 */
export interface OffensiveStats {
  critChance: number;
  critDamage: number;
  multiHitChance: number;
  multiHitDamage: number;
  splashChance: number;
  splashDamage: number;
  counterChance: number;
  counterDamage: number;
}

/** Defensive Stats (SPEC §3.0). Regeneration ist die einzige Heilquelle vor dem Endgame. */
export interface DefensiveStats {
  barrier: number;
  blockChance: number;
  evasion: number;
  regeneration: number;
}

/** Utility Stats (SPEC §3.0). multiHitChain zählt nur die Zusatztreffer. */
export interface UtilityStats {
  initiative: number;
  multiHitChain: number;
  splashRadius: number;
}

export interface CharacterDefinition {
  id: CharacterId;
  /** Spieltext, Englisch. */
  name: string;
  role: Role;
  /** Startwerte auf Level 1, vor Attributen und Ausrüstung. */
  baseCore: CoreStats;
  baseDerived: DerivedStats;
  baseOffensive: OffensiveStats;
  baseDefensive: DefensiveStats;
  baseUtility: UtilityStats;
}

/**
 * Gegner haben genau vier Stats (SPEC §1.3). `attack` ist die team-weite Angriffsstärke `S`
 * und wird auf die lebenden Charaktere verteilt (SPEC §2.3).
 */
export interface EnemyDefinition {
  id: EnemyId;
  /** Spieltext, Englisch. */
  name: string;
  role: Role;
  health: number;
  attack: number;
  accuracy: number;
  /** Einmalig zu Kampfbeginn innerhalb dieser Grenzen gewürfelt (inklusive). */
  initiativeRange: { min: number; max: number };
  /** Beitrag zum Bulwark-Malus, solange dieser Gegner in der Frontline lebt (SPEC §2.4). */
  bulwarkContribution: number;
}
