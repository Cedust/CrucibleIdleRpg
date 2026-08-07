import { CHARACTERS } from '@/game/characters/characters';
import { resumePrng, type ResumablePrng } from '@/shared/utils/prng';
import {
  beginRound,
  isAlive,
  type ActorRef,
  type CombatCharacter,
  type CombatEnemy,
  type CombatState,
} from './combatState';
import type { CombatEvent } from './combatEvents';
import { resolveCounters } from './counter';
import { NO_MITIGATION, resolveEnemyAttack } from './damagePipeline';
import {
  NO_CRIT_NODES,
  resolveCharacterAttack,
  type AttackContext,
  type Hit,
} from './outgoingDamage';
import { resolveRegeneration } from './regeneration';
import { pruneDefeated, takeNextActor } from './turnOrder';

/**
 * Das Schrittwerk der Kampf-Engine — die reine „Zustand → nächster Takt"-Funktion
 * (docs/spec/SIMULATION.md#1-grundmodell-verbindlich).
 *
 * **Ein Takt = ein Akteur am Zug** (docs/spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit).
 * Der Kampf wird **nicht vorab** durchgerechnet: `nextTick` erzeugt genau einen Zug-Block und
 * hört auf. Playback und Catch-up rufen **dieselbe** Funktion — `runCombat` ist nichts als eine
 * Schleife darüber, keine zweite Code-Bahn.
 *
 * **Reinheit** (AGENTS.md): kein Timer, kein DOM, kein Store, kein `Date.now()`. Auch der
 * Zufall ist Teil des Eingangszustands — `CombatState.combatPrngState` trägt die Position im
 * `combat`-Strom, jeder Takt nimmt sie auf und schreibt sie zurück. Derselbe Zustand liefert
 * damit zweimal denselben Takt; der Eingangszustand wird nie verändert.
 *
 * **Endlichkeit:** Gegner werden nicht geheilt und Charakterangriffe verursachen stets vollen,
 * positiven Schaden (COMBAT §2.2) — die Gegner-Gesamt-Health sinkt monoton, jeder Kampf ist in
 * endlicher Rundenzahl entschieden (docs/spec/COMBAT-RUN.md#11-rundenablauf, Punkt 7). Ein Rundenlimit gibt es
 * deshalb nicht (COMBAT §1.1).
 *
 * **Nicht hier:** Takt-Länge, Pause und Catch-up — diese Datei kennt keine Zeit
 * (docs/backlog/tasks/007-playback-und-store.md).
 */

/** Der Stand eines Kampfes (COMBAT §1.1, Abbruch-/Endbedingungen). */
export type CombatOutcome = 'ongoing' | 'victory' | 'wipe';

/** Was ein Zug außerhalb des Kampfzustands braucht. */
export interface CombatContext {
  /**
   * Waffen-Damage-Range und freigeschaltete Crit-Knoten eines Charakters — pro Charakter
   * verschieden, sobald Items (M3) und Skilltree (M2) existieren.
   */
  contextFor: (character: CombatCharacter) => AttackContext;
  /**
   * Der auf den Tank umgeleitete Anteil `m` des DD-Ticks
   * (docs/spec/SIGNATURES.md#11-mitigation-korvin-tank). In M1 konstant `0`
   * (docs/backlog/ROADMAP.md).
   */
  mitigation: number;
}

/**
 * Die Weapon Foundation: feste Signaturwaffe je Charakter, kein Generator-Crit-Knoten und keine
 * Mitigation. Mastery ergänzt später nur die Knoten, ohne dass das Schrittwerk davon erfährt.
 */
export const M1_COMBAT_CONTEXT: CombatContext = {
  contextFor: (character) => ({
    damageRange: CHARACTERS[character.id].weapon.damageRange,
    precision: CHARACTERS[character.id].weapon.precision,
    critNodes: NO_CRIT_NODES,
  }),
  mitigation: NO_MITIGATION,
};

/** Das Ergebnis eines Takts. */
export interface TickResult {
  /** Der Folgezustand; bei bereits entschiedenem Kampf der unveränderte Eingangszustand. */
  state: CombatState;
  /** Der Akteur dieses Takts — `undefined` nur, wenn der Kampf bereits entschieden war. */
  actor: ActorRef | undefined;
  /** Der Zug-Block in fester Reihenfolge (combatEvents.ts). */
  events: readonly CombatEvent[];
  /** Der Stand **nach** diesem Takt. */
  outcome: CombatOutcome;
}

/**
 * Sieg, Wipe oder offen (COMBAT §1.1). Beides gleichzeitig ist strukturell ausgeschlossen: Nur
 * Charaktere fällen Gegner, und ein gefallener Charakter countert nicht mehr — überlebt also
 * kein Charakter, hat auch kein Counter mehr getroffen. Die Prüfreihenfolge ist trotzdem
 * festgelegt, damit sie nicht offenbleibt: Sieg zuerst.
 */
export function combatOutcome(state: CombatState): CombatOutcome {
  if (!state.enemies.some(isAlive)) {
    return 'victory';
  }

  return state.characters.some(isAlive) ? 'ongoing' : 'wipe';
}

/* ------------------------------------------------------------------ Zug-Auflösung */

/**
 * Der veränderliche Arbeitsstand eines Takts: flache Kopien der Akteure, in die der Zug seine
 * Ergebnisse schreibt. Der Eingangszustand bleibt unangetastet — die Auflösungs-Funktionen
 * lesen ihn, das Anwenden passiert ausschließlich hier.
 */
interface TurnDraft {
  characters: CombatCharacter[];
  enemies: CombatEnemy[];
  effectiveDamage: Record<CombatCharacter['id'], number>;
  events: CombatEvent[];
}

function draftOf(state: CombatState): TurnDraft {
  return {
    characters: state.characters.map((character) => ({ ...character })),
    enemies: state.enemies.map((enemy) => ({ ...enemy })),
    effectiveDamage: { ...state.effectiveDamage },
    events: [],
  };
}

/**
 * Zieht einem Gegner den Endschaden eines Treffers ab und meldet ihn, gefolgt vom `defeat`,
 * falls er daran fällt. Health wird bei `0` gedeckelt: Sie sinkt monoton und wird nie negativ
 * (docs/spec/COMBAT-RUN.md#11-rundenablauf, Punkt 7).
 *
 * Ein Treffer auf einen bereits gefallenen Gegner ändert nichts und meldet nichts — der Fall
 * entsteht, wenn ein früherer Treffer desselben Zuges das Ziel schon gefällt hat.
 */
function damageEnemy(draft: TurnDraft, source: ActorRef, hit: Hit): void {
  const enemy = draft.enemies[hit.target.index];

  if (enemy === undefined || !isAlive(enemy)) {
    return;
  }

  const removedHealth = Math.min(hit.damage, enemy.health);
  enemy.health -= removedHealth;

  if (source.side === 'character') {
    const character = draft.characters[source.index];
    if (character !== undefined) {
      draft.effectiveDamage[character.id] += removedHealth;
    }
  }

  draft.events.push({
    type: 'hit',
    source,
    target: hit.target,
    kind: hit.kind,
    damage: hit.damage,
    crit: hit.crit,
    targetHealth: enemy.health,
    ...(hit.chainIndex === undefined ? {} : { chainIndex: hit.chainIndex }),
  });

  if (!isAlive(enemy)) {
    draft.events.push({ type: 'defeat', actor: hit.target });
  }
}

/* ------------------------------------------------------------------ Takt */

/**
 * Rechnet **einen** Takt: Der vorderste Akteur der Pending-Queue handelt.
 *
 * Ist die Queue leer, beginnt der Takt mit dem **Rundenbeginn** (Barrier-Reset, neue Queue,
 * COMBAT §1.1) — der Rundenwechsel ist damit kein eigener, leerer Takt, sondern der Kopf des
 * ersten Zug-Blocks der Runde. Er verbraucht keinen PRNG-Zug.
 *
 * Ein bereits entschiedener Kampf liefert den Eingangszustand unverändert zurück; das
 * Schrittwerk steht still, statt eine Runde ins Leere zu rechnen.
 */
export function nextTick(state: CombatState, context: CombatContext): TickResult {
  const decided = combatOutcome(state);

  if (decided !== 'ongoing') {
    return { state, actor: undefined, events: [], outcome: decided };
  }

  const events: CombatEvent[] = [];
  let current = state;

  if (current.pending.length === 0) {
    current = beginRound(current);
    events.push({ type: 'roundStart', round: current.round });
  }

  const { actor, remaining } = takeNextActor(current.pending);

  if (actor === undefined) {
    throw new Error(`Runde ${current.round} ohne handlungsfähigen Akteur bei offenem Kampf`);
  }

  events.push({ type: 'turnStart', round: current.round, actor });

  const prng = resumePrng(current.combatPrngState);
  const draft = draftOf(current);

  if (actor.side === 'character') {
    resolveCharacterTurn(current, draft, actor, prng, context);
  } else {
    resolveEnemyTurn(current, draft, actor, prng, context);
  }

  events.push(...draft.events);

  const applied: CombatState = {
    ...current,
    combatPrngState: prng.state(),
    characters: draft.characters,
    effectiveDamage: draft.effectiveDamage,
    enemies: draft.enemies,
    pending: remaining,
  };
  const next: CombatState = { ...applied, pending: pruneDefeated(applied, remaining) };
  const outcome = combatOutcome(next);

  // Das Rundenende meldet nur der offene Kampf — ist er entschieden, steht das Ergebnis am
  // Blockende, nicht ein Rundenwechsel, der nicht mehr kommt.
  if (outcome !== 'ongoing') {
    events.push({ type: 'combatEnd', outcome });
  } else if (next.pending.length === 0) {
    events.push({ type: 'roundEnd', round: next.round });
  }

  return { state: next, actor, events, outcome };
}

/* ------------------------------------------------------------------ Schnelldurchlauf */

/**
 * Notbremse gegen einen Implementierungsfehler, **kein** Rundenlimit (COMBAT §1.1): Jeder Kampf
 * ist durch die monoton sinkende Gegner-Health in endlicher Rundenzahl entschieden
 * (docs/spec/COMBAT-RUN.md#11-rundenablauf, Punkt 7). Bleibt `runCombat` trotzdem hängen, ist die Invariante
 * verletzt — dann ist ein Fehler besser als eine Endlosschleife.
 */
export const TICK_LIMIT = 100_000;

/** Das Ergebnis eines am Stück gerechneten Kampfes. */
export interface CombatRunResult {
  state: CombatState;
  events: readonly CombatEvent[];
  outcome: 'victory' | 'wipe';
  /** Zahl der gerechneten Takte — die Zahl der Zug-Blöcke. */
  ticks: number;
}

/**
 * Rechnet den Kampf bis zum Ende — **Takt für Takt über `nextTick`**. Es gibt keine zweite
 * Code-Bahn für den Schnelldurchlauf (docs/spec/SIMULATION.md#1-grundmodell-verbindlich): Ob
 * das Playback die Takte einzeln abruft oder diese Schleife sie am Stück rechnet, ändert am
 * Verlauf nichts.
 *
 * Auch diese Funktion kennt keine Zeit. Das Zeitbudget des Catch-up liegt in der Anzeige-Schicht
 * (docs/spec/SIMULATION.md#3-zeitverhalten--catch-up, Task 007).
 */
export function runCombat(
  state: CombatState,
  context: CombatContext,
  tickLimit: number = TICK_LIMIT,
): CombatRunResult {
  const events: CombatEvent[] = [];
  let current = state;
  let outcome = combatOutcome(current);
  let ticks = 0;

  while (outcome === 'ongoing') {
    if (ticks >= tickLimit) {
      throw new Error(`Kampf nach ${tickLimit} Takten nicht entschieden — Endlichkeit verletzt`);
    }

    const tick = nextTick(current, context);

    current = tick.state;
    outcome = tick.outcome;
    ticks += 1;
    events.push(...tick.events);
  }

  return { state: current, events, outcome, ticks };
}

/* ------------------------------------------------------------------ Züge */

/**
 * Der Zug eines Charakters: **ein Basisangriff** auf das priorisierte Ziel samt Offensiv-Procs
 * (COMBAT §2.1), danach die Regeneration (COMBAT §1.1, §2.6).
 *
 * Die Trefferliste steht **vor** dem Anwenden fest: Sie wird gegen den Zustand zu Zugbeginn
 * aufgelöst, inklusive des Bulwark-Malus je Ziel. Ein Nebenziel profitiert also nicht davon,
 * dass der Grundtreffer soeben einen Frontline-Gegner gefällt hat — der Zug ist ein Block
 * (docs/spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit).
 */
function resolveCharacterTurn(
  state: CombatState,
  draft: TurnDraft,
  actor: ActorRef,
  prng: ResumablePrng,
  context: CombatContext,
): void {
  const character = state.characters[actor.index];

  if (character === undefined) {
    throw new Error(`Zug eines unbekannten Charakters: Slot ${actor.index}`);
  }

  const attack = resolveCharacterAttack(state, character, prng, context.contextFor(character));

  if (attack.primaryTarget !== undefined) {
    draft.events.push({ type: 'attack', source: actor, target: attack.primaryTarget });
  }

  for (const hit of attack.hits) {
    damageEnemy(draft, actor, hit);
  }

  // Regeneration — einmal je Handlung, unabhängig von der Trefferzahl (COMBAT §2.6).
  const regeneration = resolveRegeneration(character);

  if (regeneration.healed > 0) {
    const healed = draft.characters[actor.index];

    if (healed !== undefined) {
      healed.health = regeneration.health;
      draft.events.push({
        type: 'regeneration',
        actor,
        healed: regeneration.healed,
        health: regeneration.health,
      });
    }
  }
}

/**
 * Der Zug eines Gegners: ein team-weiter Schwung durch die Schadenspipeline (COMBAT §2.3),
 * **danach** die Counter der getroffenen Überlebenden in Slot-Reihenfolge (COMBAT §1.1, §2.1).
 *
 * Beide Auflösungen laufen gegen den Zustand zu Zugbeginn — deshalb steht die Verteilung fest,
 * bevor der erste Charakter fällt, und ein Counter beeinflusst die noch laufende Verteilung
 * nicht. Erst danach wird angewandt.
 */
function resolveEnemyTurn(
  state: CombatState,
  draft: TurnDraft,
  actor: ActorRef,
  prng: ResumablePrng,
  context: CombatContext,
): void {
  const enemy = state.enemies[actor.index];

  if (enemy === undefined) {
    throw new Error(`Zug eines unbekannten Gegners: Slot ${actor.index}`);
  }

  const attack = resolveEnemyAttack(state.characters, enemy, prng, context.mitigation);
  const counters = resolveCounters(state, actor, attack.results, prng, context.contextFor);

  draft.events.push({ type: 'enemyAttack', source: actor, attack: attack.attack });

  for (const result of attack.results) {
    const character = draft.characters[result.ref.index];

    if (character === undefined) {
      continue;
    }

    character.health = result.health;
    character.barrier = result.barrier;

    draft.events.push({
      type: 'damageTaken',
      source: actor,
      target: result.ref,
      evaded: result.evaded,
      blocked: result.blocked,
      barrierAbsorbed: result.barrierAbsorbed,
      healthLost: result.healthLost,
      health: result.health,
    });

    if (result.defeated) {
      draft.events.push({ type: 'defeat', actor: result.ref });
    }
  }

  for (const counter of counters) {
    if (counter.hit !== undefined) {
      damageEnemy(draft, counter.source, counter.hit);
    }
  }
}
