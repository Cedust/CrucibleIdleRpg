import { isAlive, type CombatCharacter } from './combatState';

/**
 * Regeneration — die einzige Heilquelle vor dem Endgame
 * (docs/spec/COMBAT.md#26-heilung--grenzen-und-auslösung).
 *
 * - **Flacher Wert**, kein Anteil der Max-Health.
 * - Triggert **einmal je eigener Handlung** (COMBAT §1.1), unabhängig von der Trefferzahl des
 *   Zuges — der Aufrufer ruft pro Handlung genau einmal auf, nicht pro Treffer.
 * - **Keine Überheilung:** Der Überschuss verfällt ohne Ersatzeffekt.
 * - **Besiegte Charaktere sind nicht heilbar** — Aufstehen geht ausschließlich per Rally an der
 *   Floor-Grenze (docs/spec/PROGRESSION.md#4-checkpoints-wipe--abbruch).
 *
 * Reine Funktion ohne Timer, DOM oder Store (AGENTS.md §5) und **ohne PRNG-Zug**: Die Heilung
 * ist deterministisch und darf die Kampf-Sequenz nicht verschieben (COMBAT §2.5). Der
 * Kampfzustand wird gelesen, nicht verändert — das Anwenden liegt im Schrittwerk (Task 006).
 */

export interface RegenerationResult {
  /** Tatsächlich geheilt — nach Deckelung auf die fehlende Health, also nie negativ. */
  healed: number;
  /** Health nach der Heilung. */
  health: number;
}

/**
 * Löst die Regeneration eines Charakters **nach dessen eigener Handlung** auf.
 *
 * Ein besiegter Charakter (`health === 0`) und ein Charakter auf voller Health liefern beide
 * `healed: 0`; der Unterschied liegt nur in der Begründung, nicht im Ergebnis.
 */
export function resolveRegeneration(character: CombatCharacter): RegenerationResult {
  if (!isAlive(character)) {
    return { healed: 0, health: character.health };
  }

  const missing = Math.max(character.maxHealth - character.health, 0);
  const healed = Math.min(Math.max(character.stats.defensive.regeneration, 0), missing);

  return { healed, health: character.health + healed };
}
