import { isAlive, type CombatEnemy } from './combatState';

/**
 * Bulwark — Deckung der Backline (docs/spec/COMBAT.md#24-bulwark-deckung-der-backline).
 *
 * Solange Frontline-Gegner leben, erleiden Backline-Gegner reduzierten Schaden. Jeder lebende
 * Frontline-Gegner trägt sein eigenes `bᵢ` bei, die Beiträge stapeln **multiplikativ**:
 *
 * ```
 * Malus  = 1 − Π (1 − bᵢ)     über alle lebenden Frontline-Gegner
 * Faktor = Π (1 − bᵢ)         der Anteil, der durchkommt
 * ```
 *
 * Für jedes `bᵢ < 1` bleibt der Malus damit strukturell unter 100 % und braucht keinen Cap.
 *
 * Der Malus greift **pro Treffer und Ziel** (COMBAT §2.1) — jeder Grund-, Multi-, Splash- und
 * Counter-Treffer bekommt den Faktor des Gegners, den er trifft.
 *
 * **Sunder** (docs/spec/COMBAT.md#32-sunder-rhaya-melee) senkt das `bᵢ` einzelner
 * Frontline-Gegner während des Kampfes. Er ist Crucible-gebunden und in M1 nicht umgesetzt;
 * er braucht hier keine eigene Bahn, weil `bulwarkContribution` im Kampfzustand liegt und
 * dieselbe Formel bedient.
 *
 * Reine Funktionen ohne Timer, DOM oder Store (AGENTS.md §5); kein PRNG-Zug.
 */

/**
 * Anteil des Schadens, der beim Ziel ankommt: `Π (1 − bᵢ)` über alle lebenden
 * Frontline-Gegner. `1` für Frontline-Ziele und für eine gefallene Frontline — dort deckt
 * niemand.
 */
export function bulwarkDamageFactor(
  enemies: readonly CombatEnemy[],
  target: Pick<CombatEnemy, 'lane'>,
): number {
  if (target.lane !== 'backline') {
    return 1;
  }

  return enemies.reduce(
    (factor, enemy) =>
      enemy.lane === 'frontline' && isAlive(enemy)
        ? factor * (1 - enemy.bulwarkContribution)
        : factor,
    1,
  );
}

/** Der Malus als Gegenstück zum Faktor — die Größe, die die UI und Kampf-Events nennen. */
export function bulwarkMalus(
  enemies: readonly CombatEnemy[],
  target: Pick<CombatEnemy, 'lane'>,
): number {
  return 1 - bulwarkDamageFactor(enemies, target);
}

/** Wendet die Deckung des Ziels auf einen einzelnen Treffer an (COMBAT §2.1, letzter Schritt). */
export function applyBulwark(
  damage: number,
  enemies: readonly CombatEnemy[],
  target: Pick<CombatEnemy, 'lane'>,
): number {
  return damage * bulwarkDamageFactor(enemies, target);
}
