import {
  isAlive,
  type ActorRef,
  type CombatCharacter,
  type CombatEnemy,
  type CombatState,
} from './combatState';

/**
 * Zielauswahl eines Charakter-Zuges (docs/spec/COMBAT-RUN.md#12-zielauswahl).
 *
 * Gegner wählen **kein** Einzelziel — ihr Angriff trifft das ganze Team über die
 * Schadenspipeline (COMBAT §2.3, Task 005). Dieses Modul beschreibt deshalb ausschließlich die
 * Richtung Charakter → Gegner.
 *
 * Reine Funktionen ohne Timer, DOM oder Store (AGENTS.md); keine Funktion hier nimmt einen
 * PRNG entgegen — die Zielauswahl verbraucht **keinen** Zufall.
 */

/** Ein Gegner als Ziel: sein Verweis in den Kampfzustand plus der Gegner selbst. */
export interface EnemyTarget {
  ref: ActorRef;
  enemy: CombatEnemy;
}

/** Alle lebenden Gegner in Formations-Index-Reihenfolge. */
export function livingEnemies(state: CombatState): EnemyTarget[] {
  const targets: EnemyTarget[] = [];

  state.enemies.forEach((enemy, index) => {
    if (isAlive(enemy)) {
      targets.push({ ref: { side: 'enemy', index }, enemy });
    }
  });

  return targets;
}

/**
 * Reguläre Priorisierung: **höchste Initiative zuerst** (COMBAT §1.2). Bei Gleichstand
 * entscheidet der niedrigere Formations-Index — dieselbe Stufe, die die Zugordnung als
 * Tiebreak nutzt (COMBAT §1.1, Stufe 3). Rückgabe wie bei `Array.prototype.sort`.
 */
export function comparePriority(a: EnemyTarget, b: EnemyTarget): number {
  if (a.enemy.initiative !== b.enemy.initiative) {
    return b.enemy.initiative - a.enemy.initiative;
  }

  return a.enemy.formationIndex - b.enemy.formationIndex;
}

/**
 * Die für einen Charakter überhaupt wählbaren Gegner — der **Rollen-Lock** (COMBAT §1.2):
 *
 * - **Tank & Melee:** nur die Frontline, solange dort ein Gegner lebt. Fällt sie vollständig,
 *   ist die Backline wählbar.
 * - **Ranged:** die Backline von Beginn an, dafür der laufende Bulwark-Malus
 *   (docs/spec/DAMAGE-SYSTEM.md#14-bulwark-deckung-der-backline).
 */
export function attackableEnemies(state: CombatState, attacker: CombatCharacter): EnemyTarget[] {
  const living = livingEnemies(state);

  if (attacker.role === 'ranged') {
    return living;
  }

  const frontline = living.filter((target) => target.enemy.lane === 'frontline');

  return frontline.length > 0 ? frontline : living;
}

/**
 * Das primäre Ziel eines Charakter-Zuges: aus den wählbaren Gegnern der nach Priorisierung
 * vorderste — **außer** ein Taunt greift.
 *
 * **Taunt:** Ein lebender gegnerischer Tank zwingt Tank und Melee, ihn **vorrangig**
 * anzugreifen; Ranged umgeht den Taunt (COMBAT §1.2). Pro Kampf steht höchstens ein
 * Tank-Gegner (COMBAT §1.3), die Vorrangregel ist damit eindeutig.
 *
 * `undefined`, wenn kein Gegner mehr lebt — dann findet kein Angriff statt.
 */
export function selectPrimaryTarget(
  state: CombatState,
  attacker: CombatCharacter,
): EnemyTarget | undefined {
  const candidates = attackableEnemies(state, attacker).sort(comparePriority);

  if (attacker.role !== 'ranged') {
    const taunting = candidates.find((target) => target.enemy.role === 'tank');

    if (taunting !== undefined) {
      return taunting;
    }
  }

  return candidates[0];
}

/**
 * Die Nebenziele eines Splash-Treffers: bis zu `splashRadius` weitere lebende Gegner,
 * **gleiche Lane zuerst**, dann reguläre Priorisierung (COMBAT §2.1, Schritt 4). Der Radius
 * wirkt Lane-übergreifend (docs/spec/CHARACTERS.md#2-stats) — das Primärziel selbst ist nie
 * Nebenziel.
 */
export function selectSplashTargets(
  state: CombatState,
  primary: EnemyTarget,
  splashRadius: number,
): EnemyTarget[] {
  const radius = Math.max(Math.trunc(splashRadius), 0);

  if (radius === 0) {
    return [];
  }

  const others = livingEnemies(state).filter((target) => target.ref.index !== primary.ref.index);
  const sameLane = others
    .filter((target) => target.enemy.lane === primary.enemy.lane)
    .sort(comparePriority);
  const otherLane = others
    .filter((target) => target.enemy.lane !== primary.enemy.lane)
    .sort(comparePriority);

  return [...sameLane, ...otherLane].slice(0, radius);
}
