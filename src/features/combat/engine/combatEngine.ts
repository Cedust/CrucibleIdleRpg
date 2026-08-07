import type { CharacterId } from '@/game/types';
import { MASTERY_BALANCE } from '@/game/weaponMastery/mastery';
import { resumePrng, type ResumablePrng } from '@/shared/utils/prng';
import { applySunder, type SunderEffect } from './bulwark';
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
import {
  menacedAccuracy,
  NO_MITIGATION,
  resolveEnemyAttack,
  type IncomingDamageResult,
} from './damagePipeline';
import { masteryContextFor } from './masteryCombat';
import { resolveCharacterAttack, type AttackContext, type Hit } from './outgoingDamage';
import { resolveRegeneration } from './regeneration';
import { pruneDefeated, sameActor, suppressPendingAction, takeNextActor } from './turnOrder';

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
   * (docs/spec/SIGNATURES.md#11-mitigation-korvin-tank). `0` vor Freischaltung des
   * Crucible-Nodes `molten.mitigation`.
   */
  mitigation: number;
  /**
   * Sunder (docs/spec/SIGNATURES.md#12-sunder-rhaya-melee): Bulwark-Abbau je Angriff des
   * tragenden Charakters. Ohne Freischaltung nicht gesetzt.
   */
  sunder?: SunderEffect & { characterId: CharacterId };
  /**
   * Suppression (docs/spec/SIGNATURES.md#13-suppression-quinn-ranged): Queue-Plätze `L` je
   * Treffer des tragenden Charakters. Ohne Freischaltung nicht gesetzt.
   */
  suppression?: { characterId: CharacterId; places: number };
  /**
   * Ambush (docs/spec/SIGNATURES.md#21-ambush-nach-sunder): Bonus auf den finalen ausgehenden
   * Schaden aller charaktererzeugten Treffer in Runde 1. Ohne Freischaltung nicht gesetzt.
   */
  ambush?: { bonus: number };
  /**
   * Menace (docs/spec/SIGNATURES.md#22-menace-nach-mitigation): relative Accuracy-Minderung
   * eines Gegnerangriffs, solange der Tank zu Angriffsbeginn lebt. Ohne Freischaltung nicht
   * gesetzt.
   */
  menace?: { reduction: number };
  /**
   * Momentum (docs/spec/SIGNATURES.md#23-momentum-nach-suppression): Cap des temporären
   * Initiative-Bonus der Charaktere bei der Queue-Erzeugung. Ohne Freischaltung nicht gesetzt.
   */
  momentum?: { cap: number };
  /**
   * Second Wind (docs/spec/SIGNATURES.md#24-second-wind-nach-rally): Max-Health-Anteil, mit dem
   * der erste tödliche Treffer des Dungeon-Runs überlebt wird. Ohne Freischaltung nicht gesetzt.
   */
  secondWind?: { share: number };
}

/**
 * Die Weapon Foundation: feste Signaturwaffe je Charakter, kein Generator-Crit-Knoten und keine
 * Mitigation. Mastery ergänzt später nur die Knoten, ohne dass das Schrittwerk davon erfährt.
 */
export const DEFAULT_COMBAT_CONTEXT: CombatContext = {
  contextFor: (character) => ({
    ...masteryContextFor(character),
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
  /** Ambush (SIGNATURES §2.1): Multiplikator auf den finalen Schaden; `1` außerhalb Runde 1. */
  finalDamageFactor: number;
  /** Second-Wind-Verbrauch nach diesem Takt (SIGNATURES §2.4). */
  secondWindConsumed: boolean;
}

function draftOf(state: CombatState, finalDamageFactor: number): TurnDraft {
  return {
    characters: state.characters.map((character) => ({ ...character })),
    enemies: state.enemies.map((enemy) => ({ ...enemy })),
    effectiveDamage: { ...state.effectiveDamage },
    events: [],
    finalDamageFactor,
    secondWindConsumed: state.secondWindConsumed,
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

  // Ambush wirkt hier, nach allen bestehenden Modifikatoren einschließlich Bulwark — jeder
  // charaktererzeugte Treffer läuft durch diese Funktion, auch der Counter (SIGNATURES §2.1).
  const damage = hit.damage * draft.finalDamageFactor;
  const removedHealth = Math.min(damage, enemy.health);
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
    damage,
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
 * Löst den Angriffs-Kontext je Charakter-Objekt höchstens einmal pro Takt auf — im Catch-up
 * (bis 100k Takte über `runCombat`) der heißeste Pfad. Der Cache lebt genau einen Takt und
 * keyt auf Objekt-Identität; Kopien im Arbeitsstand lösen deshalb korrekt neu auf.
 */
function perTickContext(context: CombatContext): CombatContext {
  const cache = new Map<CombatCharacter, AttackContext>();

  return {
    ...context,
    contextFor: (character) => {
      let resolved = cache.get(character);
      if (resolved === undefined) {
        resolved = context.contextFor(character);
        cache.set(character, resolved);
      }
      return resolved;
    },
  };
}

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
    current = beginRound(current, context.momentum?.cap ?? 0);
    events.push({ type: 'roundStart', round: current.round });
  }

  const { actor, remaining } = takeNextActor(current.pending);

  if (actor === undefined) {
    throw new Error(`Runde ${current.round} ohne handlungsfähigen Akteur bei offenem Kampf`);
  }

  events.push({ type: 'turnStart', round: current.round, actor });

  const prng = resumePrng(current.combatPrngState);
  // Ambush gilt für alle charaktererzeugten Treffer der Runde 1 — auch die Counter eines
  // Gegner-Takts; ab Runde 2 ist der Multiplikator neutral (SIGNATURES §2.1).
  const ambushFactor =
    current.round === 1 && context.ambush !== undefined ? 1 + context.ambush.bonus : 1;
  const draft = draftOf(current, ambushFactor);
  const tickContext = perTickContext(context);
  let primaryTarget: ActorRef | undefined;

  if (actor.side === 'character') {
    primaryTarget = resolveCharacterTurn(current, draft, actor, prng, tickContext);
  } else {
    resolveEnemyTurn(current, draft, actor, prng, tickContext);
  }

  events.push(...draft.events);

  const applied: CombatState = {
    ...current,
    combatPrngState: prng.state(),
    characters: draft.characters,
    effectiveDamage: draft.effectiveDamage,
    enemies: draft.enemies,
    pending: remaining,
    secondWindConsumed: draft.secondWindConsumed,
  };
  let next: CombatState = { ...applied, pending: pruneDefeated(applied, remaining) };

  if (actor.side === 'character' && primaryTarget !== undefined) {
    next = applySuppression(next, tickContext, actor, primaryTarget);
  }

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
 * (COMBAT §2.1), danach die Regeneration (COMBAT §1.1, §2.6). Liefert das Primärziel des
 * Angriffs — den Ansatzpunkt der Suppression (SIGNATURES §1.3).
 *
 * Die Trefferliste steht **vor** dem Anwenden fest: Sie wird gegen den Zustand zu Zugbeginn
 * aufgelöst, inklusive des Bulwark-Malus je Ziel. Ein Nebenziel profitiert also nicht davon,
 * dass der Grundtreffer soeben einen Frontline-Gegner gefällt hat — der Zug ist ein Block
 * (docs/spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit). Sunder greift erst nach dem
 * Anwenden und wirkt damit ausschließlich auf nachfolgende Angriffe (SIGNATURES §1.2).
 */
function resolveCharacterTurn(
  state: CombatState,
  draft: TurnDraft,
  actor: ActorRef,
  prng: ResumablePrng,
  context: CombatContext,
): ActorRef | undefined {
  const character = state.characters[actor.index];

  if (character === undefined) {
    throw new Error(`Zug eines unbekannten Charakters: Slot ${actor.index}`);
  }

  const attack = resolveCharacterAttack(state, character, prng, context.contextFor(character));

  const changed = draft.characters[actor.index];
  if (changed !== undefined) {
    if (attack.consumeGuarded) changed.guarded = false;
    if (attack.nextZeroing !== undefined) changed.zeroing = attack.nextZeroing;
  }

  if (attack.primaryTarget !== undefined) {
    draft.events.push({ type: 'attack', source: actor, target: attack.primaryTarget });
  }

  for (const hit of attack.hits) {
    damageEnemy(draft, actor, hit);
  }

  applySunderForAttack(state, draft, character, context, attack.hits);

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

  return attack.primaryTarget;
}

/**
 * Sunder nach einem vollständigen Angriff des tragenden Charakters (SIGNATURES §1.2): je
 * mindestens einmal getroffenem Frontline-Ziel genau eine Anwendung — Multi Hit und
 * wiederholte Treffer desselben Angriffs stapeln nicht. Die Lane stammt aus dem Zustand zu
 * Zugbeginn; ein Counter läuft als eigenständiger Angriff erneut hierdurch.
 */
function applySunderForAttack(
  state: CombatState,
  draft: TurnDraft,
  attacker: CombatCharacter,
  context: CombatContext,
  hits: readonly Hit[],
): void {
  const sunder = context.sunder;

  if (sunder === undefined) {
    return;
  }
  if (attacker.id !== sunder.characterId) {
    return;
  }

  const hitFrontline = new Set<number>();
  for (const hit of hits) {
    if (state.enemies[hit.target.index]?.lane === 'frontline') {
      hitFrontline.add(hit.target.index);
    }
  }

  for (const index of hitFrontline) {
    const enemy = draft.enemies[index];
    if (enemy !== undefined) {
      Object.assign(enemy, applySunder(enemy, sunder));
    }
  }
}

/**
 * Suppression nach dem vollständigen Angriff (SIGNATURES §1.3): Die noch offene Aktion des
 * **primären** Ziels rutscht um `L` offene Plätze nach hinten — sofern das Ziel lebt, noch
 * nicht gehandelt hat und in dieser Runde noch nicht supprimiert wurde. Splash-Nebenziele
 * bleiben unberührt; ein Counter suppresst strukturell nie, weil sein Ziel bereits gehandelt
 * hat und nicht mehr in der Queue steht.
 */
function applySuppression(
  state: CombatState,
  context: CombatContext,
  actor: ActorRef,
  primaryTarget: ActorRef,
): CombatState {
  const suppression = context.suppression;
  const attacker = state.characters[actor.index];

  if (suppression === undefined || attacker === undefined) {
    return state;
  }
  if (attacker.id !== suppression.characterId || primaryTarget.side !== 'enemy') {
    return state;
  }

  const enemy = state.enemies[primaryTarget.index];
  if (enemy === undefined || !isAlive(enemy) || enemy.suppressedRound === state.round) {
    return state;
  }

  const pending = suppressPendingAction(state.pending, primaryTarget, suppression.places);
  if (pending === null) {
    return state;
  }

  return {
    ...state,
    enemies: state.enemies.map((candidate, index) =>
      index === primaryTarget.index ? { ...candidate, suppressedRound: state.round } : candidate,
    ),
    pending,
  };
}

/**
 * Second Wind (docs/spec/SIGNATURES.md#24-second-wind-nach-rally): verhindert einmal je
 * Dungeon-Run das erste tödliche Ergebnis eines Gegnerangriffs. Die Pipeline-Ergebnisse stehen
 * in Slot-Reihenfolge (Korvin → Rhaya → Quinn) — genau der festen, seedunabhängigen
 * Team-Reihenfolge des Verbrauchs. Weitere tödliche Ergebnisse desselben Angriffs bleiben
 * tödlich. Der Gerettete ist getroffen und lebt — er countert deshalb regulär und bleibt in
 * der Pending-Queue.
 */
function applySecondWind(
  state: CombatState,
  context: CombatContext,
  results: readonly IncomingDamageResult[],
): { results: readonly IncomingDamageResult[]; saved: ActorRef | undefined } {
  const secondWind = context.secondWind;

  if (secondWind === undefined || state.secondWindConsumed) {
    return { results, saved: undefined };
  }

  const index = results.findIndex((result) => result.defeated);
  const lethal = index === -1 ? undefined : results[index];
  const character = lethal === undefined ? undefined : state.characters[lethal.ref.index];

  if (lethal === undefined || character === undefined) {
    return { results, saved: undefined };
  }

  const health = secondWind.share * character.maxHealth;

  return {
    results: results.map((result, position) =>
      position === index ? { ...result, health, defeated: false } : result,
    ),
    saved: lethal.ref,
  };
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

  // Menace legt die Accuracy zu Angriffsbeginn fest — fällt der Tank an diesem Angriff, gilt
  // sie noch für dessen vollständige Auflösung (SIGNATURES §2.2).
  const attacker = {
    attack: enemy.attack,
    accuracy: menacedAccuracy(state.characters, enemy.accuracy, context.menace?.reduction ?? 0),
  };
  const attack = resolveEnemyAttack(state.characters, attacker, prng, context.mitigation);
  const { results, saved } = applySecondWind(state, context, attack.results);
  const counters = resolveCounters(state, actor, results, prng, context.contextFor);

  draft.events.push({ type: 'enemyAttack', source: actor, attack: attack.attack });

  for (const result of results) {
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

    if (saved !== undefined && sameActor(saved, result.ref)) {
      draft.secondWindConsumed = true;
      draft.events.push({ type: 'secondWind', actor: result.ref, health: result.health });
    }

    if (result.defeated) {
      draft.events.push({ type: 'defeat', actor: result.ref });
    }

    if (result.blocked && context.contextFor(character).mastery?.immovableGuard) {
      character.guarded = true;
    }
  }

  for (const counter of counters) {
    if (counter.hit !== undefined) {
      damageEnemy(draft, counter.source, counter.hit);
      // Ein Counter ist ein eigenständiger Angriff — eigene Sunder-Anwendung (SIGNATURES §1.2).
      const counterSource = state.characters[counter.source.index];
      if (counterSource !== undefined) {
        applySunderForAttack(state, draft, counterSource, context, [counter.hit]);
      }
      const countering = draft.characters[counter.source.index];
      if (
        countering !== undefined &&
        context.contextFor(countering).mastery?.escalatingRetaliation
      ) {
        countering.counterStacks = Math.min(
          (countering.counterStacks ?? 0) + 1,
          MASTERY_BALANCE.escalatingRetaliation.maxStacks,
        );
      }
    }
  }
}
