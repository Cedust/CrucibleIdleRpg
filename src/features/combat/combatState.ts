import { CHARACTERS, TEAM_ORDER } from '@/game/characters/characters';
import { ACCURACY_CAP } from '@/game/curves/combatConstants';
import {
  ENEMY_ACCURACY_BONUS,
  ENEMY_ATTACK_MULTIPLIER,
  ENEMY_HEALTH_MULTIPLIER,
} from '@/game/curves/enemyCurves';
import { ENEMIES } from '@/game/enemies/enemies';
import type {
  CharacterId,
  CharacterStats,
  EnemyDefinition,
  EnemyId,
  FloorId,
  FormationDefinition,
  Lane,
  Role,
} from '@/game/types';
import {
  derivePrng,
  deriveSeed,
  PRNG_STREAM,
  type Prng,
  type PrngStream,
} from '@/shared/utils/prng';
import { deriveCharacterStats, type CharacterProgression } from './characterStats';
import { buildPendingQueue } from './turnOrder';

/**
 * Kampfzustand — Typen und deterministischer Aufbau aus Floor-Seed und Formation
 * (docs/spec/COMBAT.md#11-rundenablauf, docs/spec/COMBAT.md#13-gegnerformation).
 *
 * Reine Daten und reine Funktionen: kein Timer, kein DOM, kein Store, kein `Date.now()`
 * (AGENTS.md §5). Der Zustand ist damit als Ganzes serialisierbar und vergleichbar — das
 * Speichern ist trotzdem verboten (docs/spec/SIMULATION.md#5-kampfzustand-und-reload), der
 * Zustand lebt nur zur Laufzeit.
 *
 * Der laufende PRNG liegt bewusst **nicht** im Zustand: Der Zustand trägt den `floorSeed`,
 * aus dem sich jeder Strom über `combatStreamPrng` reproduzieren lässt.
 */

/** Welche Seite ein Akteur besetzt — Stufe 2 der Zugordnung (COMBAT §1.1). */
export type CombatSide = 'character' | 'enemy';

/**
 * Verweis auf einen Akteur im Kampfzustand. `index` ist der Array-Index in
 * `CombatState.characters` bzw. `CombatState.enemies` — beide Arrays stehen in
 * Slot-Reihenfolge, Gegner aufsteigend nach `formationIndex`.
 */
export interface ActorRef {
  side: CombatSide;
  index: number;
}

/** Ein Charakter im Kampf: abgeleitete Kampfwerte plus veränderlicher Zustand. */
export interface CombatCharacter {
  id: CharacterId;
  /** Spieltext, Englisch. */
  name: string;
  role: Role;
  /** 0–2 in Team-Reihenfolge Korvin → Rhaya → Quinn (docs/spec/CHARACTERS.md#1-team). */
  slotIndex: number;
  stats: CharacterStats;
  /** Aktuelle Health; `0` heißt besiegt und fällt aus Reihenfolge und Verteilung heraus. */
  health: number;
  maxHealth: number;
  /** Wird zu Rundenbeginn neu gesetzt und stackt nicht (COMBAT §1.1). */
  barrier: number;
}

/** Ein Gegner im Kampf: auf den Floor skalierte Stats plus die gewürfelte Initiative. */
export interface CombatEnemy {
  definitionId: EnemyId;
  /** Spieltext, Englisch. */
  name: string;
  role: Role;
  lane: Lane;
  /** 0–5 über beide Lanes: Frontline 1–3, dann Backline 1–3 (COMBAT §1.3). */
  formationIndex: number;
  /** Aktuelle Health; `0` heißt besiegt. */
  health: number;
  maxHealth: number;
  /** Team-weite Angriffsstärke `S` (COMBAT §2.3). */
  attack: number;
  accuracy: number;
  /** Einmalig zu Kampfbeginn gewürfelt, für den restlichen Kampf fix (COMBAT §1.1). */
  initiative: number;
  bulwarkContribution: number;
}

export interface CombatState {
  floorId: FloorId;
  /** Globaler Floor-Index 0–299, Index in die Gegner-Kurven (curves/enemyCurves.ts). */
  floorIndex: number;
  /** Wurzel aller Ströme dieses Kampfes (docs/spec/SIMULATION.md#4-seeds-und-zufalls-ströme). */
  floorSeed: number;
  /** Genau drei Charaktere in Slot-Reihenfolge. */
  characters: readonly CombatCharacter[];
  /** Nur besetzte Formations-Slots, aufsteigend nach `formationIndex`. */
  enemies: readonly CombatEnemy[];
  /** `0` vor der ersten Runde; `beginRound` zählt hoch. */
  round: number;
  /** Offene Aktionen der laufenden Runde (COMBAT §1.1). */
  pending: readonly ActorRef[];
}

/** Ein Team-Mitglied für den Kampfaufbau. */
export interface TeamMemberSetup {
  id: CharacterId;
  progression: CharacterProgression;
  /**
   * Übernommene Health aus dem vorigen Floor (Attrition,
   * docs/spec/PROGRESSION.md#4-checkpoints-wipe--abbruch). Ohne Angabe startet der Charakter
   * mit voller Health; `0` heißt besiegt und bleibt besiegt.
   */
  carriedHealth?: number;
}

export interface CombatSetup {
  floorId: FloorId;
  floorIndex: number;
  floorSeed: number;
  formation: FormationDefinition;
  /** Alle drei Charaktere; die Reihenfolge im Array ist unerheblich. */
  team: readonly TeamMemberSetup[];
}

/* ------------------------------------------------------------------ Seed-Kette */

/**
 * `runSeed = derive(saveSeed, dungeonId, runCounter)`
 * (docs/spec/SIMULATION.md#4-seeds-und-zufalls-ströme).
 */
export function deriveRunSeed(saveSeed: number, dungeonId: string, runCounter: number): number {
  return deriveSeed(saveSeed, dungeonId, runCounter);
}

/** `floorSeed = derive(runSeed, floorIndex)` (SIMULATION §4). */
export function deriveFloorSeed(runSeed: number, floorIndex: number): number {
  return deriveSeed(runSeed, floorIndex);
}

/**
 * PRNG eines benannten Stroms unterhalb des Floor-Seeds. Das Label kommt ausschließlich aus
 * `PRNG_STREAM` — ein Tippfehler wäre ein stiller Verhaltensbruch (AGENTS.md §5).
 */
export function deriveStreamPrng(floorSeed: number, stream: PrngStream): Prng {
  return derivePrng(floorSeed, stream);
}

/** Der `combat`-Strom eines Floors (COMBAT §2.1). */
export function combatStreamPrng(floorSeed: number): Prng {
  return deriveStreamPrng(floorSeed, PRNG_STREAM.combat);
}

/** Der `init`-Strom eines Floors — nur die Gegner-Initiative (COMBAT §1.1). */
export function initStreamPrng(floorSeed: number): Prng {
  return deriveStreamPrng(floorSeed, PRNG_STREAM.init);
}

/* ------------------------------------------------------------------ Aufbau */

/** Lane-Reihenfolge des Formations-Index (COMBAT §1.3). */
const LANE_ORDER: readonly Lane[] = ['frontline', 'backline'];

/** Ein besetzter Formations-Slot in Formations-Index-Reihenfolge. */
export interface FormationSlot {
  enemyId: EnemyId;
  lane: Lane;
  formationIndex: number;
}

/**
 * Die besetzten Slots einer Formation in Formations-Index-Reihenfolge (Frontline 1–3, dann
 * Backline 1–3). Leere Slots zählen im Index mit, damit ein Backline-Slot immer 3–5 trägt.
 */
export function occupiedSlots(formation: FormationDefinition): FormationSlot[] {
  const slots: FormationSlot[] = [];
  let formationIndex = 0;

  for (const lane of LANE_ORDER) {
    for (const enemyId of formation.slots[lane]) {
      if (enemyId !== null) {
        slots.push({ enemyId, lane, formationIndex });
      }
      formationIndex += 1;
    }
  }

  return slots;
}

/**
 * Wert einer Floor-Kurve. Die Tabellen decken die Floor-Indizes 0–299 ab; Indizes außerhalb
 * werden auf die Tabellengrenzen geklemmt, damit der Zugriff typsicher greift (AGENTS.md §9).
 */
function floorCurve(table: readonly number[], floorIndex: number): number {
  const index = Math.min(Math.max(Math.trunc(floorIndex), 0), table.length - 1);
  return table[index] as number;
}

/**
 * Gegner-Stats eines Floors: Health und Attack über die Floor-Multiplikatoren, Accuracy über
 * die additive Rampe mit Deckel (curves/enemyCurves.ts, curves/combatConstants.ts). Die
 * Initiative kommt von außen, weil ihre Wurf-Reihenfolge über die ganze Formation festliegt.
 *
 * Der Elite-/Boss-Multiplikator gehört zur Floor-Kette und ist hier noch nicht angewandt
 * (docs/backlog/ROADMAP.md, M2).
 */
function buildEnemy(
  definition: EnemyDefinition,
  slot: FormationSlot,
  floorIndex: number,
  initiative: number,
): CombatEnemy {
  const health = definition.health * floorCurve(ENEMY_HEALTH_MULTIPLIER, floorIndex);

  return {
    definitionId: definition.id,
    name: definition.name,
    role: definition.role,
    lane: slot.lane,
    formationIndex: slot.formationIndex,
    health,
    maxHealth: health,
    attack: definition.attack * floorCurve(ENEMY_ATTACK_MULTIPLIER, floorIndex),
    accuracy: Math.min(
      definition.accuracy + floorCurve(ENEMY_ACCURACY_BONUS, floorIndex),
      ACCURACY_CAP,
    ),
    initiative,
    bulwarkContribution: definition.bulwarkContribution,
  };
}

function buildCharacter(setup: TeamMemberSetup, slotIndex: number): CombatCharacter {
  const definition = CHARACTERS[setup.id];

  if (definition === undefined) {
    throw new Error(`Unbekannter Charakter im Team: ${setup.id}`);
  }

  const stats = deriveCharacterStats(definition, setup.progression);
  const maxHealth = stats.derived.health;
  const carried = setup.carriedHealth;

  return {
    id: definition.id,
    name: definition.name,
    role: definition.role,
    slotIndex,
    stats,
    health: carried === undefined ? maxHealth : Math.min(Math.max(carried, 0), maxHealth),
    maxHealth,
    // Die Barrier setzt erst der Rundenbeginn (COMBAT §1.1, Schritt 1).
    barrier: 0,
  };
}

/**
 * Baut den Kampfzustand deterministisch auf: Team in Slot-Reihenfolge, Gegner in
 * Formations-Index-Reihenfolge. Die Gegner-Initiative wird **einmalig** hier über den
 * `init`-Strom gewürfelt, in genau dieser Reihenfolge (COMBAT §1.1) — gleicher Floor-Seed
 * ⇒ bit-identische Initiative-Werte.
 *
 * Die Pending-Queue ist noch leer; sie entsteht mit dem ersten `beginRound`.
 */
export function buildCombatState(setup: CombatSetup): CombatState {
  const characters = TEAM_ORDER.map((id, slotIndex) => {
    const member = setup.team.find((entry) => entry.id === id);

    if (member === undefined) {
      throw new Error(`Team unvollständig — Charakter fehlt: ${id}`);
    }

    return buildCharacter(member, slotIndex);
  });

  const init = initStreamPrng(setup.floorSeed);
  const enemies = occupiedSlots(setup.formation).map((slot) => {
    const definition = ENEMIES[slot.enemyId];

    if (definition === undefined) {
      throw new Error(`Unbekannter Gegner in der Formation: ${slot.enemyId}`);
    }

    const initiative = init.nextInt(definition.initiativeRange.min, definition.initiativeRange.max);

    return buildEnemy(definition, slot, setup.floorIndex, initiative);
  });

  return {
    floorId: setup.floorId,
    floorIndex: setup.floorIndex,
    floorSeed: setup.floorSeed,
    characters,
    enemies,
    round: 0,
    pending: [],
  };
}

/* ------------------------------------------------------------------ Rundenbeginn */

/** Besiegte Akteure fallen aus Reihenfolge und Verteilung heraus (CHARACTERS §1). */
export function isAlive(actor: { health: number }): boolean {
  return actor.health > 0;
}

/** Löst einen Akteur-Verweis auf; `undefined`, wenn der Index ins Leere zeigt (AGENTS.md §9). */
export function actorAt(
  state: CombatState,
  ref: ActorRef,
): CombatCharacter | CombatEnemy | undefined {
  return ref.side === 'character' ? state.characters[ref.index] : state.enemies[ref.index];
}

/**
 * Rundenbeginn (COMBAT §1.1, Schritt 1): Die Barrier jedes lebenden Charakters wird auf den
 * Barrier-Stat **neu gesetzt** — der Rest der Vorrunde verfällt, Barrier stackt nicht. Danach
 * steht die Pending-Queue aus allen lebenden Akteuren in Zugordnung.
 *
 * Verbraucht keinen PRNG-Zug.
 */
export function beginRound(state: CombatState): CombatState {
  const characters = state.characters.map((character) => ({
    ...character,
    barrier: isAlive(character) ? character.stats.defensive.barrier : 0,
  }));

  const next: CombatState = {
    ...state,
    characters,
    round: state.round + 1,
    pending: [],
  };

  return { ...next, pending: buildPendingQueue(next) };
}
