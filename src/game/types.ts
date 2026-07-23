/**
 * Gemeinsame Interfaces für den deklarativen Balancing-Content (siehe AGENTS.md §4).
 * Content liegt getrennt von der Spiellogik unter src/game/. Alle Spieltexte Englisch.
 */

export type AbilityId = string;
export type CharacterId = string;
export type EnemyId = string;

export interface AbilityDefinition {
  id: AbilityId;
  name: string;
  description: string;
  /** Basisschaden vor Skalierung/Zufall. */
  power: number;
  /** Rundencooldown (0 = jede Runde einsetzbar). */
  cooldown: number;
}

export interface CombatantBaseStats {
  maxHp: number;
  attack: number;
  defense: number;
  /** Initiative — bestimmt die Zugreihenfolge. */
  speed: number;
}

export interface CharacterDefinition {
  id: CharacterId;
  name: string;
  baseStats: CombatantBaseStats;
  abilities: AbilityId[];
}

export interface EnemyDefinition {
  id: EnemyId;
  name: string;
  baseStats: CombatantBaseStats;
  abilities: AbilityId[];
}
