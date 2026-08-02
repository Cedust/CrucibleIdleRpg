import { describe, expect, it } from 'vitest';
import { TEAM_ORDER } from '@/game/characters/characters';
import { FORMATIONS } from '@/game/encounters/formations';
import type {
  CharacterId,
  DamageRange,
  DefensiveStats,
  FormationDefinition,
  Lane,
  OffensiveStats,
  Role,
  UtilityStats,
} from '@/game/types';
import { neutralProgression } from './characterStats';
import {
  buildCombatState,
  combatStreamPrng,
  deriveFloorSeed,
  deriveRunSeed,
  type CombatCharacter,
  type CombatEnemy,
  type CombatSetup,
  type CombatState,
} from './combatState';
import {
  combatOutcome,
  M1_COMBAT_CONTEXT,
  nextTick,
  runCombat,
  type CombatContext,
} from './combatEngine';
import type { CombatEvent, CombatEventType } from './combatEvents';
import { NO_MITIGATION } from './damagePipeline';
import { NO_CRIT_NODES } from './outgoingDamage';

/**
 * Geprüft wird die **Struktur** des Schrittwerks — Reinheit, Reproduzierbarkeit, Zug-Block,
 * Monotonie, Sieg und Wipe —, nicht das Tuning des Platzhalter-Contents
 * (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten). Wo die Event-Reihenfolge
 * geprüft wird, stehen eigene Eingangswerte, die jeden Proc erzwingen: Der Block-Aufbau hängt
 * dann nicht am Wurf.
 */

/* ------------------------------------------------------------------ Gestellte Kämpfe */

const DAMAGE_RANGE: DamageRange = { min: 0.9, max: 1.1 };

const contextWith = (mitigation = NO_MITIGATION): CombatContext => ({
  contextFor: () => ({ damageRange: DAMAGE_RANGE, critNodes: NO_CRIT_NODES }),
  mitigation,
});

interface CharacterSetup {
  id: CharacterId;
  role: Role;
  slotIndex: number;
  attack?: number;
  health?: number;
  maxHealth?: number;
  offensive?: Partial<OffensiveStats>;
  defensive?: Partial<DefensiveStats>;
  utility?: Partial<UtilityStats>;
}

function character(setup: CharacterSetup): CombatCharacter {
  const maxHealth = setup.maxHealth ?? 1000;

  return {
    id: setup.id,
    name: setup.id,
    role: setup.role,
    slotIndex: setup.slotIndex,
    stats: {
      core: { might: 0, toughness: 0, vitality: 0 },
      derived: { attack: setup.attack ?? 100, defense: 0, health: maxHealth },
      offensive: {
        critChance: 0,
        critDamage: 2,
        multiHitChance: 0,
        multiHitDamage: 0.5,
        splashChance: 0,
        splashDamage: 0.4,
        counterChance: 0,
        counterDamage: 0.6,
        ...setup.offensive,
      },
      defensive: { barrier: 0, blockChance: 0, evasion: 0, regeneration: 0, ...setup.defensive },
      utility: {
        initiative: 10,
        multiHitChain: 2,
        multiHitChainFactor: 0.6,
        splashRadius: 1,
        ...setup.utility,
      },
    },
    health: setup.health ?? maxHealth,
    maxHealth,
    barrier: 0,
  };
}

interface EnemySetup {
  formationIndex: number;
  health?: number;
  attack?: number;
  initiative?: number;
}

function enemy(setup: EnemySetup): CombatEnemy {
  const lane: Lane = setup.formationIndex < 3 ? 'frontline' : 'backline';
  const health = setup.health ?? 100_000;

  return {
    definitionId: `enemy-${setup.formationIndex}`,
    name: `Enemy ${setup.formationIndex}`,
    role: lane === 'frontline' ? 'melee' : 'ranged',
    lane,
    formationIndex: setup.formationIndex,
    health,
    maxHealth: health,
    attack: setup.attack ?? 30,
    accuracy: 1,
    initiative: setup.initiative ?? 5,
    // Ohne Deckung bleibt der Endschaden gleich dem rohen Treffer — der Test misst den Block,
    // nicht den Bulwark-Malus (docs/spec/COMBAT.md#24-bulwark-deckung-der-backline).
    bulwarkContribution: 0,
  };
}

function gestellt(characters: CombatCharacter[], enemies: CombatEnemy[]): CombatState {
  const floorSeed = 4711;

  return {
    floorId: 'A1-D1-01',
    floorIndex: 0,
    floorSeed,
    combatPrngState: combatStreamPrng(floorSeed).state(),
    characters,
    enemies,
    round: 0,
    pending: [],
  };
}

/* ------------------------------------------------------------------ Echter Content */

const SAVE_SEED = 4242;

function floorSetup(overrides: Partial<CombatSetup> = {}): CombatSetup {
  const formation = FORMATIONS.rampBothLanesCrowded as FormationDefinition;

  return {
    floorId: 'A1-D1-11',
    floorIndex: 10,
    floorSeed: deriveFloorSeed(deriveRunSeed(SAVE_SEED, 'A1-D1', 1), 10),
    formation,
    team: TEAM_ORDER.map((id) => ({ id, progression: neutralProgression(20) })),
    ...overrides,
  };
}

const types = (events: readonly CombatEvent[]): CombatEventType[] =>
  events.map((event) => event.type);

const totalEnemyHealth = (state: CombatState): number =>
  state.enemies.reduce((sum, entry) => sum + entry.health, 0);

/* ------------------------------------------------------------------ Tests */

describe('nextTick — Reinheit (AGENTS.md §5)', () => {
  const state = buildCombatState(floorSetup());

  it('lässt den Eingangszustand unangetastet', () => {
    const kopie = structuredClone(state);

    nextTick(state, M1_COMBAT_CONTEXT);

    expect(state).toEqual(kopie);
  });

  it('liefert für denselben Eingangszustand zweimal denselben Takt', () => {
    const erster = nextTick(state, M1_COMBAT_CONTEXT);
    const zweiter = nextTick(state, M1_COMBAT_CONTEXT);

    // Der PRNG-Fortschritt liegt im Zustand, nicht in einer mitgeschleppten Instanz — ein Takt
    // hängt damit ausschließlich an seinem Eingang.
    expect(zweiter.state).toEqual(erster.state);
    expect(zweiter.events).toEqual(erster.events);
  });

  it('rückt die Position im combat-Strom mit dem Zug vor', () => {
    const { state: nachher } = nextTick(state, M1_COMBAT_CONTEXT);

    expect(nachher.combatPrngState).not.toBe(state.combatPrngState);
  });
});

describe('Determinismus — gleicher Seed, gleicher Verlauf', () => {
  it('rechnet einen ganzen Kampf bit-identisch reproduzierbar', () => {
    const erster = runCombat(buildCombatState(floorSetup()), M1_COMBAT_CONTEXT);
    const zweiter = runCombat(buildCombatState(floorSetup()), M1_COMBAT_CONTEXT);

    expect(zweiter.outcome).toBe(erster.outcome);
    expect(zweiter.ticks).toBe(erster.ticks);
    expect(zweiter.events).toEqual(erster.events);
    expect(zweiter.state).toEqual(erster.state);
  });

  it('läuft mit einem anderen Floor-Seed anders', () => {
    const runSeed = deriveRunSeed(SAVE_SEED, 'A1-D1', 1);
    const a = runCombat(
      buildCombatState(floorSetup({ floorSeed: deriveFloorSeed(runSeed, 10) })),
      M1_COMBAT_CONTEXT,
    );
    const b = runCombat(
      buildCombatState(floorSetup({ floorSeed: deriveFloorSeed(runSeed, 11) })),
      M1_COMBAT_CONTEXT,
    );

    expect(b.events).not.toEqual(a.events);
  });

  it('liefert einzeln abgerufene Takte und die Schleife am Stück identisch', () => {
    const start = buildCombatState(floorSetup());
    const amStueck = runCombat(start, M1_COMBAT_CONTEXT);

    // Dasselbe Schrittwerk, nur von Hand getrieben — es gibt keine zweite Code-Bahn
    // (docs/spec/SIMULATION.md#1-grundmodell-verbindlich).
    const events: CombatEvent[] = [];
    let einzeln = start;
    let ticks = 0;

    for (;;) {
      const tick = nextTick(einzeln, M1_COMBAT_CONTEXT);

      if (tick.actor === undefined) {
        break;
      }

      einzeln = tick.state;
      events.push(...tick.events);
      ticks += 1;
    }

    expect(ticks).toBe(amStueck.ticks);
    expect(events).toEqual(amStueck.events);
    expect(einzeln).toEqual(amStueck.state);
  });
});

describe('Monotonie der Gegner-Health (SPEC § Invarianten, Punkt 7)', () => {
  it('sinkt über alle Takte eines Kampfes und steigt nie', () => {
    let current = buildCombatState(floorSetup());
    let vorher = totalEnemyHealth(current);
    let ticks = 0;

    while (combatOutcome(current) === 'ongoing') {
      const tick = nextTick(current, M1_COMBAT_CONTEXT);

      current = tick.state;
      ticks += 1;

      const nachher = totalEnemyHealth(current);

      expect(nachher).toBeLessThanOrEqual(vorher);
      vorher = nachher;
    }

    // Der Kampf ist entschieden, nicht abgebrochen — Endlichkeit ohne Rundenlimit.
    expect(ticks).toBeGreaterThan(0);
    expect(totalEnemyHealth(current)).toBe(0);
  });

  it('deckelt die Health eines gefällten Gegners bei 0, statt sie negativ werden zu lassen', () => {
    const state = gestellt(
      [character({ id: 'rhaya', role: 'melee', slotIndex: 1, attack: 10_000 })],
      [enemy({ formationIndex: 0, health: 5 })],
    );

    const { state: nachher } = nextTick(state, contextWith());

    expect(nachher.enemies[0]?.health).toBe(0);
  });
});

describe('Ein Takt = ein Zug-Block (SIMULATION §2)', () => {
  it('meldet je Takt genau einen turnStart', () => {
    let current = buildCombatState(floorSetup());

    while (combatOutcome(current) === 'ongoing') {
      const tick = nextTick(current, M1_COMBAT_CONTEXT);

      expect(types(tick.events).filter((type) => type === 'turnStart')).toHaveLength(1);
      current = tick.state;
    }
  });

  it('führt den Rundenbeginn im ersten Takt der Runde mit, statt einen leeren Takt zu rechnen', () => {
    const state = buildCombatState(floorSetup());
    const erster = nextTick(state, M1_COMBAT_CONTEXT);

    expect(erster.actor).toBeDefined();
    expect(types(erster.events).slice(0, 2)).toEqual(['roundStart', 'turnStart']);
    expect(erster.state.round).toBe(1);
  });

  it('schließt die Runde ab, sobald die Pending-Queue leer ist', () => {
    let current = buildCombatState(floorSetup());
    let runde = 0;

    // Erste vollständige Runde abfahren: Sie endet mit `roundEnd`, die nächste beginnt mit
    // `roundStart` (COMBAT §1.1).
    for (;;) {
      const tick = nextTick(current, M1_COMBAT_CONTEXT);

      current = tick.state;
      runde += 1;

      if (types(tick.events).includes('roundEnd')) {
        expect(current.pending).toEqual([]);
        break;
      }

      expect(runde).toBeLessThan(20);
    }

    expect(types(nextTick(current, M1_COMBAT_CONTEXT).events)[0]).toBe('roundStart');
  });
});

describe('Zug-Block eines Charakters (COMBAT §2.1)', () => {
  /*
   * Alle Procs erzwungen: Multi Hit sicher (Chance 1, Kette 2), Splash sicher (Chance 1,
   * Radius 1), kein Crit. Die Gegner sind zu zäh, um zu fallen — der Block bleibt damit rein.
   */
  const state = gestellt(
    [
      character({
        id: 'rhaya',
        role: 'melee',
        slotIndex: 1,
        health: 500,
        offensive: { multiHitChance: 1, splashChance: 1 },
        defensive: { regeneration: 25 },
        utility: { initiative: 99 },
      }),
    ],
    [enemy({ formationIndex: 0 }), enemy({ formationIndex: 1 })],
  );

  it('meldet Angriff, Grundtreffer, Kette, Splash und danach die Regeneration', () => {
    const { events } = nextTick(state, contextWith());

    expect(types(events)).toEqual([
      'roundStart',
      'turnStart',
      'attack',
      'hit', // Grundtreffer
      'hit', // Kettenglied 1
      'hit', // Kettenglied 2
      'hit', // Splash-Nebenziel
      'regeneration',
    ]);
    // Die beiden Gegner sind noch nicht am Zug — die Runde läuft weiter.
    expect(types(events)).not.toContain('roundEnd');
  });

  it('trägt Erzeuger und Kettenstufe im Treffer', () => {
    const hits = nextTick(state, contextWith()).events.filter((event) => event.type === 'hit');

    expect(hits.map((hit) => hit.kind)).toEqual(['base', 'multiHit', 'multiHit', 'splash']);
    expect(hits.map((hit) => hit.chainIndex)).toEqual([undefined, 1, 2, undefined]);
    // Der Splash trifft das Nebenziel, alles andere das Primärziel.
    expect(hits.map((hit) => hit.target.index)).toEqual([0, 0, 0, 1]);
  });

  it('heilt einmal je Handlung und deckelt bei der maximalen Health', () => {
    const { state: nachher, events } = nextTick(state, contextWith());
    const heilungen = events.filter((event) => event.type === 'regeneration');

    expect(heilungen).toHaveLength(1);
    expect(heilungen[0]?.healed).toBe(25);
    expect(nachher.characters[0]?.health).toBe(525);
  });

  it('meldet keine Regeneration, wenn nichts zu heilen ist', () => {
    const voll = gestellt(
      [character({ id: 'rhaya', role: 'melee', slotIndex: 1, defensive: { regeneration: 25 } })],
      [enemy({ formationIndex: 0 })],
    );

    expect(types(nextTick(voll, contextWith()).events)).not.toContain('regeneration');
  });
});

describe('Zug-Block eines Gegners (COMBAT §1.1, §2.3)', () => {
  /*
   * Der Gegner zieht zuerst (Initiative 99) und trifft sicher; alle drei Charaktere countern
   * sicher. Die Counter folgen **nach** der vollständigen Verteilung, in Slot-Reihenfolge.
   */
  const team = TEAM_ORDER.map((id, slotIndex) =>
    character({
      id,
      role: slotIndex === 0 ? 'tank' : slotIndex === 1 ? 'melee' : 'ranged',
      slotIndex,
      offensive: { counterChance: 1 },
    }),
  );
  const state = gestellt(team, [enemy({ formationIndex: 0, initiative: 99 })]);

  it('meldet den team-weiten Schwung, die Verteilung und danach die Counter', () => {
    const { events } = nextTick(state, contextWith());

    expect(types(events)).toEqual([
      'roundStart',
      'turnStart',
      'enemyAttack',
      'damageTaken', // Korvin
      'damageTaken', // Rhaya
      'damageTaken', // Quinn
      'hit', // Counter Korvin
      'hit', // Counter Rhaya
      'hit', // Counter Quinn
    ]);
  });

  it('verteilt in Slot-Reihenfolge und countert in derselben', () => {
    const { events } = nextTick(state, contextWith());
    const getroffen = events.filter((event) => event.type === 'damageTaken');
    const counter = events.filter((event) => event.type === 'hit');

    expect(getroffen.map((event) => event.target.index)).toEqual([0, 1, 2]);
    expect(counter.map((event) => event.source.index)).toEqual([0, 1, 2]);
    expect(counter.every((event) => event.kind === 'counter')).toBe(true);
  });

  it('erhält die Summe der Verteilung: der Schwung bleibt S', () => {
    const { events } = nextTick(state, contextWith());
    const verloren = events
      .filter((event) => event.type === 'damageTaken')
      .reduce((sum, event) => sum + event.healthLost, 0);

    // Ohne Block, Defense und Barrier kommt der ganze Schwung an.
    expect(verloren).toBeCloseTo(30, 10);
  });
});

describe('Sieg und Wipe (COMBAT §1.1)', () => {
  it('erkennt den Sieg und beendet das Schrittwerk', () => {
    const state = gestellt(
      [character({ id: 'rhaya', role: 'melee', slotIndex: 1, attack: 10_000 })],
      [enemy({ formationIndex: 0, health: 10 })],
    );

    const tick = nextTick(state, contextWith());

    expect(tick.outcome).toBe('victory');
    expect(types(tick.events)).toEqual([
      'roundStart',
      'turnStart',
      'attack',
      'hit',
      'defeat',
      'combatEnd',
    ]);

    // Ein weiterer Aufruf steht still, statt ins Leere zu rechnen.
    const danach = nextTick(tick.state, contextWith());

    expect(danach.actor).toBeUndefined();
    expect(danach.events).toEqual([]);
    expect(danach.state).toBe(tick.state);
  });

  it('erkennt den Wipe und beendet das Schrittwerk', () => {
    const state = gestellt(
      [character({ id: 'korvin', role: 'tank', slotIndex: 0, maxHealth: 10 })],
      [enemy({ formationIndex: 0, attack: 10_000, initiative: 99 })],
    );

    const tick = nextTick(state, contextWith());

    expect(tick.outcome).toBe('wipe');
    expect(types(tick.events)).toEqual([
      'roundStart',
      'turnStart',
      'enemyAttack',
      'damageTaken',
      'defeat',
      'combatEnd',
    ]);
    expect(nextTick(tick.state, contextWith()).events).toEqual([]);
  });

  it('lässt einen gefallenen Akteur nicht mehr handeln', () => {
    /*
     * Der Gegner (Initiative 99) fällt Rhaya im ersten Takt; ihre offene Aktion entfällt, der
     * nächste Takt gehört Korvin (COMBAT §1.1).
     */
    const state = gestellt(
      [
        character({
          id: 'korvin',
          role: 'tank',
          slotIndex: 0,
          maxHealth: 100_000,
          utility: { initiative: 5 },
        }),
        character({
          id: 'rhaya',
          role: 'melee',
          slotIndex: 1,
          maxHealth: 10,
          utility: { initiative: 4 },
        }),
      ],
      [enemy({ formationIndex: 0, attack: 10_000, initiative: 99 })],
    );

    const erster = nextTick(state, contextWith());

    expect(erster.outcome).toBe('ongoing');
    expect(erster.state.characters[1]?.health).toBe(0);
    expect(erster.state.pending).toEqual([{ side: 'character', index: 0 }]);

    const zweiter = nextTick(erster.state, contextWith());

    expect(zweiter.actor).toEqual({ side: 'character', index: 0 });
  });
});

describe('runCombat — dieselbe Bahn wie das Playback', () => {
  it('endet mit Sieg oder Wipe und meldet die Zahl der Zug-Blöcke', () => {
    const ergebnis = runCombat(buildCombatState(floorSetup()), M1_COMBAT_CONTEXT);

    expect(['victory', 'wipe']).toContain(ergebnis.outcome);
    expect(ergebnis.ticks).toBe(
      ergebnis.events.filter((event) => event.type === 'turnStart').length,
    );
    expect(ergebnis.events.at(-1)).toEqual({ type: 'combatEnd', outcome: ergebnis.outcome });
  });

  it('bricht mit einem Fehler ab, statt bei verletzter Endlichkeit endlos zu laufen', () => {
    // Angriffskraft 0: Die Gegner-Health sinkt nicht mehr — genau der Fall, den die Invariante
    // ausschließt (docs/SPEC.md#invarianten, Punkt 7).
    const state = gestellt(
      [character({ id: 'rhaya', role: 'melee', slotIndex: 1, attack: 0 })],
      [enemy({ formationIndex: 0, attack: 0 })],
    );

    expect(() => runCombat(state, contextWith(), 50)).toThrow(/50 Takten/);
  });
});
