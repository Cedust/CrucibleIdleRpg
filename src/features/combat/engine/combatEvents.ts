import type { ActorRef } from './combatState';
import type { HitKind } from './damage/outgoingDamage';

/**
 * Kampf-Events — was ein Takt berichtet (docs/spec/DAMAGE-SYSTEM.md#15-feststehende-regeln).
 *
 * Die Engine emittiert sie in **deterministisch fester Reihenfolge**: Sie sind die Grundlage des
 * Playbacks (docs/spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit) und später die
 * Anbindung der Rune-Trigger (docs/spec/RUNES.md). Damit unterliegen sie denselben
 * Determinismus-Regeln wie der übrige Kampf: gleicher Seed ⇒ gleiche Event-Folge.
 *
 * Reine Daten — ein Event trägt bereits alles, was die Anzeige braucht, und zwingt sie nicht,
 * den Kampfzustand vorher und nachher zu vergleichen. Kein Spieltext: Die Formulierung liegt in
 * der UI (Task 008), hier stehen nur Verweise und Zahlen.
 *
 * **Reihenfolge innerhalb eines Takts** (ein Takt = ein Akteur am Zug,
 * docs/spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit):
 *
 * ```
 * [roundStart]  nur im ersten Takt einer Runde
 * turnStart
 *   Charakter:  attack → hit* (Grundtreffer, Multi-Hit-Kette, Splash) → [regeneration]
 *   Gegner:     enemyAttack → damageTaken* (Slot-Reihenfolge) → hit* (Counter, Slot-Reihenfolge)
 * [roundEnd]    wenn die Pending-Queue leer ist und der Kampf weitergeht
 * [combatEnd]   wenn Sieg oder Wipe feststeht
 * ```
 *
 * Ein `defeat` folgt unmittelbar auf das Event, das den Akteur gefällt hat; ein `secondWind`
 * steht an dessen Stelle, wenn der tödliche Treffer verhindert wurde.
 */

/** Rundenbeginn: Barrier neu gesetzt, Pending-Queue gebildet (COMBAT §1.1, Schritt 1). */
export interface RoundStartEvent {
  type: 'roundStart';
  round: number;
}

/** Ein Akteur ist am Zug — der Kopf des Zug-Blocks. */
export interface TurnStartEvent {
  type: 'turnStart';
  round: number;
  actor: ActorRef;
}

/** Ein Charakter greift sein priorisiertes Ziel an (COMBAT §1.2). */
export interface AttackEvent {
  type: 'attack';
  source: ActorRef;
  target: ActorRef;
}

/**
 * Ein einzelner Treffer auf einen Gegner — Grundtreffer, Multi-Hit-Kettenglied, Splash oder
 * Counter (COMBAT §2.1). Charakter → Gegner trifft immer; ein Fehlschlag existiert nicht.
 */
export interface HitEvent {
  type: 'hit';
  source: ActorRef;
  target: ActorRef;
  kind: HitKind;
  /** Endschaden am Ziel, inklusive Crit und Bulwark-Malus. */
  damage: number;
  crit: boolean;
  /** Health des Ziels nach diesem Treffer. */
  targetHealth: number;
  /** Nur bei `multiHit`: Kettenstufe `k` ab `1`. */
  chainIndex?: number;
}

/** Ein Gegner schwingt gegen das **ganze Team** (COMBAT §1.2, §2.3). */
export interface EnemyAttackEvent {
  type: 'enemyAttack';
  source: ActorRef;
  /** Die team-weite Angriffsstärke `S`, vor der Verteilung. */
  attack: number;
}

/** Was die Schadenspipeline einem Charakter angetan hat (COMBAT §2.3). */
export interface DamageTakenEvent {
  type: 'damageTaken';
  source: ActorRef;
  target: ActorRef;
  /** Ausgewichen → `0` Schaden und kein Counter. */
  evaded: boolean;
  /** Geblockt → partielle Minderung; ein geblockter Treffer bleibt ein Treffer. */
  blocked: boolean;
  /** Von der Barrier geschluckter Anteil (Schritt 5). */
  barrierAbsorbed: number;
  /** Tatsächlich von der Health abgezogen (Schritt 6). */
  healthLost: number;
  /** Health nach dem Treffer. */
  health: number;
}

/** Regeneration direkt nach der eigenen Handlung (COMBAT §2.6). */
export interface RegenerationEvent {
  type: 'regeneration';
  actor: ActorRef;
  /** Tatsächlich geheilt — Überheilung verfällt, der Wert ist nie `0`. */
  healed: number;
  health: number;
}

/** Ein Akteur ist gefallen und fällt aus Zugordnung und Verteilung heraus (COMBAT §1.1). */
export interface DefeatEvent {
  type: 'defeat';
  actor: ActorRef;
}

/**
 * Second Wind (docs/spec/SIGNATURES.md#24-second-wind-nach-rally): Der erste tödliche Treffer
 * des Dungeon-Runs wurde verhindert; der Charakter überlebt mit dem Rang-Anteil seiner
 * Max-Health.
 */
export interface SecondWindEvent {
  type: 'secondWind';
  actor: ActorRef;
  /** Health nach der Auslösung. */
  health: number;
}

/** Rundenende — ohne gesonderte Effekte (COMBAT §1.1, Schritt 3). */
export interface RoundEndEvent {
  type: 'roundEnd';
  round: number;
}

/** Sieg oder Wipe (COMBAT §1.1, Abbruch-/Endbedingungen). */
export interface CombatEndEvent {
  type: 'combatEnd';
  outcome: 'victory' | 'wipe';
}

export type CombatEvent =
  | RoundStartEvent
  | TurnStartEvent
  | AttackEvent
  | HitEvent
  | EnemyAttackEvent
  | DamageTakenEvent
  | RegenerationEvent
  | DefeatEvent
  | SecondWindEvent
  | RoundEndEvent
  | CombatEndEvent;

export type CombatEventType = CombatEvent['type'];
