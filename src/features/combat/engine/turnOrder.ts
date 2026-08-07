import type { ActorRef, CombatState } from './combatState';

/**
 * Zugordnung und Pending-Queue einer Runde (docs/spec/COMBAT-RUN.md#11-rundenablauf).
 *
 * Die Ordnung ist eine **totale Ordnung in drei Stufen** und verbraucht **keinen** PRNG-Zug:
 * Keine Funktion dieses Moduls nimmt einen PRNG entgegen, die Reihenfolge ist damit für jeden
 * Zustand eindeutig bestimmt.
 *
 * Reine Funktionen ohne Timer, DOM oder Store (AGENTS.md); jede Queue-Operation liefert ein
 * neues Array.
 */

/** Ein Akteur als Sortier-Eintrag: Verweis plus die drei Ordnungs-Stufen. */
export interface TurnOrderEntry {
  ref: ActorRef;
  /** Stufe 1 — höhere Initiative zuerst. */
  initiative: number;
  /**
   * Stufe 3 — niedrigerer Slot-Index zuerst: Charaktere in Team-Reihenfolge, Gegner in
   * Formations-Index-Reihenfolge.
   */
  slotIndex: number;
}

/**
 * Die dreistufige totale Ordnung: höhere Initiative → Gegner vor Charakter → niedrigerer
 * Slot-Index. Rückgabe wie bei `Array.prototype.sort`.
 */
export function compareTurnOrder(a: TurnOrderEntry, b: TurnOrderEntry): number {
  if (a.initiative !== b.initiative) {
    return b.initiative - a.initiative;
  }

  if (a.ref.side !== b.ref.side) {
    return a.ref.side === 'enemy' ? -1 : 1;
  }

  return a.slotIndex - b.slotIndex;
}

/**
 * Sortier-Einträge aller **lebenden** Akteure. Besiegte Akteure fallen heraus
 * (docs/spec/CHARACTERS.md#1-team).
 */
export function turnOrderEntries(state: CombatState): TurnOrderEntry[] {
  const entries: TurnOrderEntry[] = [];

  state.enemies.forEach((enemy, index) => {
    if (enemy.health > 0) {
      entries.push({
        ref: { side: 'enemy', index },
        initiative: enemy.initiative,
        slotIndex: enemy.formationIndex,
      });
    }
  });

  state.characters.forEach((character, index) => {
    if (character.health > 0) {
      entries.push({
        ref: { side: 'character', index },
        initiative: character.stats.utility.initiative,
        slotIndex: character.slotIndex,
      });
    }
  });

  return entries;
}

/**
 * Pending-Queue zu Rundenbeginn: alle lebenden Akteure in Zugordnung. Sie enthält im weiteren
 * Verlauf der Runde nur noch die **offenen** Aktionen.
 */
export function buildPendingQueue(state: CombatState): ActorRef[] {
  return turnOrderEntries(state)
    .sort(compareTurnOrder)
    .map((entry) => entry.ref);
}

export function sameActor(a: ActorRef, b: ActorRef): boolean {
  return a.side === b.side && a.index === b.index;
}

/**
 * Ein Zug entnimmt das vorderste Element (COMBAT §1.1). `actor` ist `undefined`, wenn die
 * Runde abgearbeitet ist.
 */
export function takeNextActor(queue: readonly ActorRef[]): {
  actor: ActorRef | undefined;
  remaining: ActorRef[];
} {
  return { actor: queue[0], remaining: queue.slice(1) };
}

/**
 * Suppression (docs/spec/SIGNATURES.md#13-suppression-quinn-ranged): verschiebt die noch
 * offene Aktion des Ziels um `places` **offene** Plätze nach hinten. `min(idx + places, Länge)`
 * **nach** dem Entfernen klemmt ans Rundenende — die Aktion verfällt nie. `null`, wenn das
 * Ziel nicht mehr offen ist.
 */
export function suppressPendingAction(
  queue: readonly ActorRef[],
  target: ActorRef,
  places: number,
): ActorRef[] | null {
  const index = queue.findIndex((ref) => sameActor(ref, target));

  if (index === -1) {
    return null;
  }

  const remaining = queue.filter((_, position) => position !== index);
  const insertAt = Math.min(index + Math.max(Math.trunc(places), 0), remaining.length);

  return [...remaining.slice(0, insertAt), target, ...remaining.slice(insertAt)];
}

/**
 * Entfernt alle inzwischen besiegten Akteure aus der offenen Queue. Ein Verweis, der ins Leere
 * zeigt, fällt ebenfalls heraus (AGENTS.md).
 */
export function pruneDefeated(state: CombatState, queue: readonly ActorRef[]): ActorRef[] {
  return queue.filter((ref) => {
    const actor = ref.side === 'character' ? state.characters[ref.index] : state.enemies[ref.index];
    return actor !== undefined && actor.health > 0;
  });
}
