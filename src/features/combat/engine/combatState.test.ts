import { describe, expect, it } from 'vitest';
import { CHARACTERS, TEAM_ORDER } from '@/game/characters/characters';
import { ACCURACY_CAP } from '@/game/curves/combatConstants';
import {
  ENEMY_ACCURACY_BONUS,
  ENEMY_ATTACK_MULTIPLIER,
  ENEMY_HEALTH_MULTIPLIER,
} from '@/game/curves/enemyCurves';
import { ENEMIES } from '@/game/enemies/enemies';
import type { CharacterId, EnemyDefinition, EnemyId, FormationDefinition } from '@/game/types';
import { deriveSeed, PRNG_STREAM } from '@/shared/utils/prng';
import { neutralProgression } from './characterStats';
import {
  beginRound,
  buildCombatState,
  combatStreamPrng,
  deriveFloorSeed,
  deriveRunSeed,
  deriveStreamPrng,
  initStreamPrng,
  occupiedSlots,
  type CombatSetup,
  type TeamMemberSetup,
} from './combatState';

/**
 * Die Tests prüfen die **Struktur** des Aufbaus — Seed-Kette, Wurf-Reihenfolge, Slot-Zuordnung,
 * Rundenbeginn —, nicht das Tuning des Platzhalter-Contents
 * (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten).
 */

const SAVE_SEED = 4242;

/**
 * Lückenhafte Testformation: Frontline-Slots 0 und 2, Backline-Slots 3 und 5. Die Lücken machen
 * sichtbar, dass der Formations-Index leere Slots mitzählt (docs/spec/COMBAT-RUN.md#13-gegnerformation).
 * Die `id` ist in diesen Fixtures nominal — der Aufbau liest ausschließlich die Slots.
 */
const FORMATION: FormationDefinition = {
  id: 'rampBothLanes',
  slots: {
    frontline: ['slagBulwark', null, 'ashenGhoul'],
    backline: ['cinderWretch', null, 'cinderWretch'],
  },
};

/** Besetzung in Formations-Index-Reihenfolge — die Wurf-Reihenfolge der Initiative. */
const FORMATION_ORDER: readonly EnemyId[] = [
  'slagBulwark',
  'ashenGhoul',
  'cinderWretch',
  'cinderWretch',
];

function definitionOf(id: EnemyId): EnemyDefinition {
  return ENEMIES[id];
}

function team(overrides: Partial<Record<CharacterId, number>> = {}): TeamMemberSetup[] {
  return TEAM_ORDER.map((id) => {
    const carried = overrides[id];
    return carried === undefined
      ? { id, progression: neutralProgression(1) }
      : { id, progression: neutralProgression(1), carriedHealth: carried };
  });
}

function setup(overrides: Partial<CombatSetup> = {}): CombatSetup {
  const runSeed = deriveRunSeed(SAVE_SEED, 'A1-D1', 1);

  return {
    floorId: 'A1-D1-01',
    floorIndex: 0,
    floorSeed: deriveFloorSeed(runSeed, 0),
    formation: FORMATION,
    team: team(),
    ...overrides,
  };
}

describe('Seed-Kette', () => {
  it('bildet saveSeed → runSeed → floorSeed → Strom über deriveSeed', () => {
    const runSeed = deriveRunSeed(SAVE_SEED, 'A1-D1', 3);
    const floorSeed = deriveFloorSeed(runSeed, 7);

    expect(runSeed).toBe(deriveSeed(SAVE_SEED, 'A1-D1', 3));
    expect(floorSeed).toBe(deriveSeed(runSeed, 7));
    expect(initStreamPrng(floorSeed).seed).toBe(deriveSeed(floorSeed, PRNG_STREAM.init));
    expect(combatStreamPrng(floorSeed).seed).toBe(deriveSeed(floorSeed, PRNG_STREAM.combat));
  });

  it('trennt die Ströme: init, combat und loot laufen auseinander', () => {
    const floorSeed = deriveFloorSeed(deriveRunSeed(SAVE_SEED, 'A1-D1', 1), 0);
    const seeds = [PRNG_STREAM.init, PRNG_STREAM.combat, PRNG_STREAM.loot].map(
      (stream) => deriveStreamPrng(floorSeed, stream).seed,
    );

    expect(new Set(seeds).size).toBe(3);
  });

  it('unterscheidet Runs und Floors', () => {
    const run1 = deriveRunSeed(SAVE_SEED, 'A1-D1', 1);
    const run2 = deriveRunSeed(SAVE_SEED, 'A1-D1', 2);

    expect(run1).not.toBe(run2);
    expect(deriveFloorSeed(run1, 0)).not.toBe(deriveFloorSeed(run1, 1));
    expect(deriveFloorSeed(run1, 0)).not.toBe(deriveFloorSeed(run2, 0));
  });
});

describe('occupiedSlots — Formations-Index', () => {
  it('liefert Frontline vor Backline und zählt leere Slots im Index mit', () => {
    expect(occupiedSlots(FORMATION)).toEqual([
      { enemyId: 'slagBulwark', lane: 'frontline', formationIndex: 0 },
      { enemyId: 'ashenGhoul', lane: 'frontline', formationIndex: 2 },
      { enemyId: 'cinderWretch', lane: 'backline', formationIndex: 3 },
      { enemyId: 'cinderWretch', lane: 'backline', formationIndex: 5 },
    ]);
  });

  it('deckelt bei sechs Gegnern und liefert bei leerer Formation nichts', () => {
    const voll: FormationDefinition = {
      id: 'rampBothLanesCrowded',
      slots: {
        frontline: ['ashenGhoul', 'ashenGhoul', 'ashenGhoul'],
        backline: ['cinderWretch', 'cinderWretch', 'cinderWretch'],
      },
    };
    const leer: FormationDefinition = {
      id: 'rampSingleLanePair',
      slots: { frontline: [null, null, null], backline: [null, null, null] },
    };

    expect(occupiedSlots(voll)).toHaveLength(6);
    expect(occupiedSlots(leer)).toEqual([]);
  });
});

describe('buildCombatState — Gegner', () => {
  it('würfelt die Initiative über den init-Strom in Formations-Index-Reihenfolge', () => {
    const konfiguration = setup();
    const prng = initStreamPrng(konfiguration.floorSeed);
    const erwartet = FORMATION_ORDER.map((id) => {
      const definition = definitionOf(id);
      return prng.nextInt(definition.initiativeRange.min, definition.initiativeRange.max);
    });

    const state = buildCombatState(konfiguration);

    expect(state.enemies.map((enemy) => enemy.initiative)).toEqual(erwartet);
  });

  it('hält jede Initiative in ihrer Range', () => {
    const state = buildCombatState(setup());

    state.enemies.forEach((enemy) => {
      const range = definitionOf(enemy.definitionId).initiativeRange;
      expect(enemy.initiative).toBeGreaterThanOrEqual(range.min);
      expect(enemy.initiative).toBeLessThanOrEqual(range.max);
    });
  });

  it('liefert bei gleichem Floor-Seed bit-identische Initiative-Werte', () => {
    const konfiguration = setup();

    expect(buildCombatState(konfiguration)).toEqual(buildCombatState(konfiguration));
  });

  it('liefert bei anderem Floor-Seed eine andere Initiative-Ziehung', () => {
    const runSeed = deriveRunSeed(SAVE_SEED, 'A1-D1', 1);
    const a = buildCombatState(setup({ floorSeed: deriveFloorSeed(runSeed, 0) }));
    const b = buildCombatState(setup({ floorSeed: deriveFloorSeed(runSeed, 1) }));

    expect(a.enemies.map((enemy) => enemy.initiative)).not.toEqual(
      b.enemies.map((enemy) => enemy.initiative),
    );
  });

  it('übernimmt Lane, Formations-Index und Bulwark-Beitrag aus Vorlage und Definition', () => {
    const state = buildCombatState(setup());

    expect(state.enemies.map((enemy) => enemy.formationIndex)).toEqual([0, 2, 3, 5]);
    expect(state.enemies.map((enemy) => enemy.lane)).toEqual([
      'frontline',
      'frontline',
      'backline',
      'backline',
    ]);
    expect(state.enemies.map((enemy) => enemy.bulwarkContribution)).toEqual(
      FORMATION_ORDER.map((id) => definitionOf(id).bulwarkContribution),
    );
  });

  it('skaliert Health und Attack mit der Floor-Kurve', () => {
    const floorIndex = 10;
    const state = buildCombatState(setup({ floorIndex }));
    const gegner = state.enemies[0];
    const definition = definitionOf('slagBulwark');

    expect(gegner?.health).toBeCloseTo(
      definition.health * (ENEMY_HEALTH_MULTIPLIER[floorIndex] as number),
      8,
    );
    expect(gegner?.health).toBe(gegner?.maxHealth);
    expect(gegner?.attack).toBeCloseTo(
      definition.attack * (ENEMY_ATTACK_MULTIPLIER[floorIndex] as number),
      8,
    );
  });

  it('addiert die Accuracy-Rampe und deckelt sie bei ACCURACY_CAP', () => {
    const floorIndex = 10;
    const flach = buildCombatState(setup({ floorIndex }));
    const definition = definitionOf('slagBulwark');

    expect(flach.enemies[0]?.accuracy).toBeCloseTo(
      definition.accuracy + (ENEMY_ACCURACY_BONUS[floorIndex] as number),
      8,
    );

    const tief = buildCombatState(
      setup({
        floorIndex: ENEMY_ACCURACY_BONUS.length - 1,
        formation: {
          id: 'rampSingleLanePair',
          slots: { frontline: ['emberHound', null, null], backline: [null, null, null] },
        },
      }),
    );

    // 0.75 + 0.25 läge über dem Deckel.
    expect(tief.enemies[0]?.accuracy).toBe(ACCURACY_CAP);
  });
});

describe('buildCombatState — Team', () => {
  it('stellt die drei Charaktere in Team-Reihenfolge auf, unabhängig von der Eingabe-Reihenfolge', () => {
    const state = buildCombatState(setup({ team: [...team()].reverse() }));

    expect(state.characters.map((character) => character.id)).toEqual([...TEAM_ORDER]);
    expect(state.characters.map((character) => character.slotIndex)).toEqual([0, 1, 2]);
  });

  it('startet ohne übernommene Health auf voller Health und ohne Barrier', () => {
    const state = buildCombatState(setup());

    state.characters.forEach((character) => {
      expect(character.maxHealth).toBeCloseTo(CHARACTERS[character.id].baseDerived.health, 8);
      expect(character.health).toBe(character.maxHealth);
      expect(character.barrier).toBe(0);
    });
  });

  it('übernimmt die Health des vorigen Floors und klemmt sie auf die Max-Health', () => {
    const state = buildCombatState(setup({ team: team({ korvin: 42, rhaya: 99999, quinn: -5 }) }));

    expect(state.characters[0]?.health).toBe(42);
    expect(state.characters[1]?.health).toBe(state.characters[1]?.maxHealth);
    expect(state.characters[2]?.health).toBe(0);
  });

  it('meldet ein unvollständiges Team', () => {
    expect(() =>
      buildCombatState(setup({ team: team().filter((member) => member.id !== 'rhaya') })),
    ).toThrow(/rhaya/);
  });
});

describe('buildCombatState — Reinheit des Zustands', () => {
  it('enthält nur Daten: keine Funktionen, keine Referenz auf Timer, DOM oder Store', () => {
    const state = buildCombatState(setup());

    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });

  it('startet vor der ersten Runde mit leerer Pending-Queue', () => {
    const state = buildCombatState(setup());

    expect(state.round).toBe(0);
    expect(state.pending).toEqual([]);
  });
});

describe('beginRound', () => {
  /** Barrier ist im Platzhalter-Content 0 — für die Reset-Regel braucht es einen Wert > 0. */
  function mitBarrier(state: ReturnType<typeof buildCombatState>, barrier: number) {
    return {
      ...state,
      characters: state.characters.map((character) => ({
        ...character,
        stats: {
          ...character.stats,
          defensive: { ...character.stats.defensive, barrier },
        },
      })),
    };
  }

  it('setzt die Barrier zu Rundenbeginn neu und zählt die Runde hoch', () => {
    const state = beginRound(mitBarrier(buildCombatState(setup()), 30));

    expect(state.round).toBe(1);
    expect(state.characters.map((character) => character.barrier)).toEqual([30, 30, 30]);
  });

  it('lässt den Rest der Vorrunde verfallen — Barrier stackt nicht', () => {
    const erste = beginRound(mitBarrier(buildCombatState(setup()), 30));

    // Mitten in der Runde wird ein Teil der Barrier verbraucht, ein anderer bleibt übrig.
    const verbraucht = {
      ...erste,
      characters: erste.characters.map((character, index) => ({
        ...character,
        barrier: index === 0 ? 0 : 12,
      })),
    };

    const zweite = beginRound(verbraucht);

    expect(zweite.round).toBe(2);
    expect(zweite.characters.map((character) => character.barrier)).toEqual([30, 30, 30]);
  });

  it('gibt besiegten Charakteren keine Barrier', () => {
    const state = beginRound(mitBarrier(buildCombatState(setup({ team: team({ rhaya: 0 }) })), 30));

    expect(state.characters.map((character) => character.barrier)).toEqual([30, 0, 30]);
  });

  it('baut die Pending-Queue aus allen lebenden Akteuren auf', () => {
    const state = beginRound(buildCombatState(setup({ team: team({ rhaya: 0 }) })));

    // Zwei lebende Charaktere plus vier Gegner.
    expect(state.pending).toHaveLength(6);
    expect(state.pending.some((ref) => ref.side === 'character' && ref.index === 1)).toBe(false);
  });

  it('verbraucht keinen PRNG-Zug: mehrfacher Aufbau derselben Runde ist identisch', () => {
    const basis = buildCombatState(setup());

    expect(beginRound(basis)).toEqual(beginRound(basis));
    // Der Zustand der Vorrunde bleibt unberührt.
    expect(basis.round).toBe(0);
    expect(basis.pending).toEqual([]);
  });
});
