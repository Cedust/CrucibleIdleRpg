import { describe, expect, it } from 'vitest';
import type { CharacterId } from '@/game/types';
import type { ActorRef, CombatCharacter, CombatEnemy, CombatState } from './combatState';
import {
  buildPendingQueue,
  compareTurnOrder,
  pruneDefeated,
  suppressPendingAction,
  takeNextActor,
  turnOrderEntries,
} from './turnOrder';
import { characterFixture, combatStateFixture, enemyFixture } from './testFixtures';

/**
 * Eigene Eingangswerte statt Platzhalter-Content: Die Tests prüfen die **Ordnung**, nicht das
 * Tuning (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten). Die Zustände hier sind
 * von Hand gestellt, damit Gleichstände über alle drei Stufen erzwingbar sind.
 */

function character(
  id: CharacterId,
  slotIndex: number,
  initiative: number,
  health = 100,
): CombatCharacter {
  return characterFixture({
    id,
    slotIndex,
    health,
    maxHealth: 100,
    utility: { initiative },
  });
}

function enemy(formationIndex: number, initiative: number, health = 50): CombatEnemy {
  return enemyFixture({
    formationIndex,
    initiative,
    health,
    maxHealth: 50,
    attack: 10,
    accuracy: 0.5,
  });
}

function state(characters: CombatCharacter[], enemies: CombatEnemy[]): CombatState {
  return combatStateFixture(characters, enemies);
}

function labels(queue: readonly ActorRef[]): string[] {
  return queue.map((ref) => `${ref.side}:${ref.index}`);
}

describe('compareTurnOrder — dreistufige totale Ordnung', () => {
  it('Stufe 1: höhere Initiative zuerst', () => {
    const langsam = { ref: { side: 'enemy', index: 0 } as ActorRef, initiative: 5, slotIndex: 0 };
    const schnell = {
      ref: { side: 'character', index: 2 } as ActorRef,
      initiative: 9,
      slotIndex: 2,
    };

    expect(compareTurnOrder(schnell, langsam)).toBeLessThan(0);
    expect(compareTurnOrder(langsam, schnell)).toBeGreaterThan(0);
  });

  it('Stufe 2: bei Gleichstand steht der Gegner vor dem Charakter', () => {
    const gegner = { ref: { side: 'enemy', index: 5 } as ActorRef, initiative: 7, slotIndex: 5 };
    const charakter = {
      ref: { side: 'character', index: 0 } as ActorRef,
      initiative: 7,
      slotIndex: 0,
    };

    expect(compareTurnOrder(gegner, charakter)).toBeLessThan(0);
    expect(compareTurnOrder(charakter, gegner)).toBeGreaterThan(0);
  });

  it('Stufe 3: bei Gleichstand innerhalb einer Seite zuerst der niedrigere Slot-Index', () => {
    const vorn = { ref: { side: 'enemy', index: 0 } as ActorRef, initiative: 7, slotIndex: 1 };
    const hinten = { ref: { side: 'enemy', index: 1 } as ActorRef, initiative: 7, slotIndex: 4 };

    expect(compareTurnOrder(vorn, hinten)).toBeLessThan(0);
    expect(compareTurnOrder(hinten, vorn)).toBeGreaterThan(0);
  });
});

describe('buildPendingQueue — Ordnung über alle Akteure', () => {
  it('sortiert absteigend nach Initiative, über beide Seiten hinweg', () => {
    const queue = buildPendingQueue(
      state(
        [character('korvin', 0, 8), character('rhaya', 1, 12), character('quinn', 2, 14)],
        [enemy(0, 6), enemy(1, 13), enemy(3, 10)],
      ),
    );

    expect(labels(queue)).toEqual([
      'character:2', // Quinn 14
      'enemy:1', // Gegner 13
      'character:1', // Rhaya 12
      'enemy:2', // Gegner 10
      'character:0', // Korvin 8
      'enemy:0', // Gegner 6
    ]);
  });

  it('löst einen Gleichstand über alle drei Stufen auf: Gegner nach Formations-Index, dann Charaktere nach Slot', () => {
    // Alle neun Akteure auf derselben Initiative — Stufe 1 entscheidet nichts mehr.
    const queue = buildPendingQueue(
      state(
        [character('korvin', 0, 7), character('rhaya', 1, 7), character('quinn', 2, 7)],
        [enemy(0, 7), enemy(1, 7), enemy(2, 7), enemy(3, 7), enemy(4, 7), enemy(5, 7)],
      ),
    );

    expect(labels(queue)).toEqual([
      'enemy:0',
      'enemy:1',
      'enemy:2',
      'enemy:3',
      'enemy:4',
      'enemy:5',
      'character:0',
      'character:1',
      'character:2',
    ]);
  });

  it('ordnet auch bei lückenhafter Formation nach dem Formations-Index, nicht nach der Array-Position', () => {
    // Besetzt sind Backline-Slot 3 und Frontline-Slot 2; beide auf derselben Initiative.
    const gestellt = state([character('korvin', 0, 3)], [enemy(3, 9), enemy(2, 9)]);

    expect(turnOrderEntries(gestellt).map((entry) => entry.slotIndex)).toEqual([3, 2, 0]);

    // Array-Position 1 trägt den kleineren Formations-Index und handelt deshalb zuerst.
    expect(labels(buildPendingQueue(gestellt))).toEqual(['enemy:1', 'enemy:0', 'character:0']);
  });

  it('verbraucht keinen PRNG-Zug: gleicher Zustand liefert bei jedem Aufruf dieselbe Ordnung', () => {
    const gestellt = state(
      [character('korvin', 0, 7), character('rhaya', 1, 7), character('quinn', 2, 7)],
      [enemy(0, 7), enemy(4, 7)],
    );

    const erster = labels(buildPendingQueue(gestellt));

    for (let i = 0; i < 20; i += 1) {
      expect(labels(buildPendingQueue(gestellt))).toEqual(erster);
    }
  });

  it('nimmt nur lebende Akteure auf', () => {
    const queue = buildPendingQueue(
      state(
        [character('korvin', 0, 8), character('rhaya', 1, 12, 0), character('quinn', 2, 14)],
        [enemy(0, 13), enemy(1, 11, 0)],
      ),
    );

    expect(labels(queue)).toEqual(['character:2', 'enemy:0', 'character:0']);
  });
});

describe('Pending-Queue — Entnahme und Todesfall', () => {
  const gestellt = state(
    [character('korvin', 0, 8), character('rhaya', 1, 12), character('quinn', 2, 14)],
    [enemy(0, 13), enemy(1, 10)],
  );

  it('entnimmt das vorderste Element und lässt den Rest stehen', () => {
    const queue = buildPendingQueue(gestellt);
    const { actor, remaining } = takeNextActor(queue);

    expect(actor).toEqual({ side: 'character', index: 2 });
    expect(labels(remaining)).toEqual(labels(queue).slice(1));
    // Die Eingabe bleibt unberührt.
    expect(queue).toHaveLength(5);
  });

  it('liefert am Rundenende keinen Akteur mehr', () => {
    expect(takeNextActor([]).actor).toBeUndefined();
  });

  it('räumt besiegte Akteure aus einer bereits laufenden Runde', () => {
    const queue = buildPendingQueue(gestellt);
    // Rhaya und der Gegner auf Formations-Slot 0 fallen mitten in der Runde.
    const nachTod = state(
      [character('korvin', 0, 8), character('rhaya', 1, 12, 0), character('quinn', 2, 14)],
      [enemy(0, 13, 0), enemy(1, 10)],
    );

    expect(labels(queue)).toEqual([
      'character:2',
      'enemy:0',
      'character:1',
      'enemy:1',
      'character:0',
    ]);
    expect(labels(pruneDefeated(nachTod, queue))).toEqual([
      'character:2',
      'enemy:1',
      'character:0',
    ]);
  });

  it('entfernt Verweise, die ins Leere zeigen', () => {
    expect(pruneDefeated(gestellt, [{ side: 'enemy', index: 9 }])).toEqual([]);
  });
});

describe('suppressPendingAction — Queue-Operation der Suppression (SIGNATURES §1.3)', () => {
  const E2: ActorRef = { side: 'enemy', index: 2 };
  const E1: ActorRef = { side: 'enemy', index: 1 };
  const E4: ActorRef = { side: 'enemy', index: 4 };
  const RHAYA: ActorRef = { side: 'character', index: 1 };
  const KORVIN: ActorRef = { side: 'character', index: 0 };

  it('verschiebt um L offene Plätze nach hinten (Test-Vektor, L = 2)', () => {
    // Pending-Queue nach Quinns Zug, Quinn bereits entnommen.
    const queue = [E2, E1, RHAYA, E4, KORVIN];

    expect(suppressPendingAction(queue, E2, 2)).toEqual([E1, RHAYA, E2, E4, KORVIN]);
  });

  it('klemmt am Rundenende: idx 3 mit L = 2 verschiebt effektiv nur um 1 (Test-Vektor)', () => {
    const queue = [E1, RHAYA, E2, KORVIN, E4];

    expect(suppressPendingAction(queue, KORVIN, 2)).toEqual([E1, RHAYA, E2, E4, KORVIN]);
  });

  it('verschiebt um 0, wenn das Ziel bereits als Letztes steht', () => {
    const queue = [E1, E2];

    expect(suppressPendingAction(queue, E2, 3)).toEqual([E1, E2]);
  });

  it('liefert null, wenn das Ziel in dieser Runde schon gehandelt hat', () => {
    expect(suppressPendingAction([E1, RHAYA], E2, 2)).toBeNull();
  });
});
