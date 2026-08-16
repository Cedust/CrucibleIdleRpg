import { isAlive, type CombatEnemy } from '../combatState';

/**
 * Bulwark — Deckung der Backline (docs/spec/DAMAGE-SYSTEM.md#14-bulwark-deckung-der-backline).
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
 * **Sunder** (docs/spec/SIGNATURES.md#12-sunder-rhaya-melee) senkt das `bᵢ` einzelner
 * Frontline-Gegner während des Kampfes — `applySunder` unten; `bulwarkContribution` liegt im
 * Kampfzustand und bedient dieselbe Formel.
 *
 * Reine Funktionen ohne Timer, DOM oder Store (AGENTS.md); kein PRNG-Zug.
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

/** Wendet die Deckung des Ziels auf einen einzelnen Treffer an (COMBAT §2.1, letzter Schritt). */
export function applyBulwark(
  damage: number,
  enemies: readonly CombatEnemy[],
  target: Pick<CombatEnemy, 'lane'>,
): number {
  return damage * bulwarkDamageFactor(enemies, target);
}

/** Abbau je Angriff und kumulatives Cap eines Sunder-Rangs (docs/spec/SIGNATURES.md#12-sunder-rhaya-melee). */
export interface SunderEffect {
  perAttack: number;
  cap: number;
}

/**
 * Eine Sunder-Anwendung — genau einmal je Angriff und getroffenem Frontline-Ziel
 * (docs/spec/SIGNATURES.md#12-sunder-rhaya-melee). Der Abbau ist dreifach begrenzt: durch den
 * Rangwert je Angriff, das kumulative Cap je Ziel und Kampf und dadurch, dass `bᵢ` nie unter
 * `0` fällt.
 */
export function applySunder(
  target: Pick<CombatEnemy, 'bulwarkContribution' | 'sunderedBulwark'>,
  effect: SunderEffect,
): Pick<CombatEnemy, 'bulwarkContribution' | 'sunderedBulwark'> {
  const applied = Math.min(
    effect.perAttack,
    Math.max(effect.cap - target.sunderedBulwark, 0),
    target.bulwarkContribution,
  );

  return {
    bulwarkContribution: target.bulwarkContribution - applied,
    sunderedBulwark: target.sunderedBulwark + applied,
  };
}
