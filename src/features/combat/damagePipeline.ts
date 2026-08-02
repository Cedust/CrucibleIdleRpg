import { BLOCK_DAMAGE_REDUCTION, DEFENSE_CONSTANT_K } from '@/game/curves/combatConstants';
import type { Prng } from '@/shared/utils/prng';
import { isAlive, type ActorRef, type CombatCharacter, type CombatEnemy } from './combatState';

/**
 * Eingehender Schaden — die Schadenspipeline eines Gegner-Zuges
 * (docs/spec/COMBAT.md#23-eingehender-schaden-schadenspipeline).
 *
 * Ein Gegner wählt **kein** Einzelziel (COMBAT §1.2): Seine Attack `S` ist ein **team-weiter,
 * flacher** Schwung, der auf die **lebenden** Charaktere verteilt wird und je Charakter die
 * sechsstufige Pipeline durchläuft:
 *
 * ```
 * 1. Verteilung  →  2. Evasion  →  3. Block  →  4. Defense  →  5. Barrier  →  6. Health
 * ```
 *
 * Weil `S` team-weit ist und nicht pro Charakter gilt, **erhöht** ein gefallener Charakter den
 * Tick der Überlebenden — die Verteilung ist damit summenerhaltend über jede Teamgröße.
 *
 * Der Zufall der eingehenden Seite liegt ausschließlich bei **Evasion** (Schritt 2) und
 * **Block** (Schritt 3); Gegner haben keine Damage-Range.
 *
 * Reine Funktionen ohne Timer, DOM oder Store (AGENTS.md §5). Der Kampfzustand wird **gelesen**,
 * nicht verändert — das Anwenden der Ergebnisse liegt im Schrittwerk (Task 006). Die Counter
 * lösen **nach** Abschluss der Team-Pipeline aus (COMBAT §1.1) und liegen in `counter.ts`.
 */

/* ------------------------------------------------------- Schritt 1: Basis-Verteilung */

/** Der Anteil eines Charakters am team-weiten Schwung `S`. */
export interface DamageShare {
  /** Verweis auf den Charakter in `CombatState.characters`. */
  ref: ActorRef;
  /** Der auf diesen Charakter entfallende Anteil von `S`, vor Evasion. */
  tick: number;
}

/**
 * **Mitigation** (docs/spec/COMBAT.md#31-mitigation-korvin-tank) leitet einen Anteil `m` des
 * DD-Ticks auf den Tank um. Der Skill ist Crucible-gebunden und in M1 nicht freigeschaltet —
 * `m` ist trotzdem **Parameter** der Verteilung und dort konstant `0`
 * (docs/backlog/ROADMAP.md, M1), damit die Summen-Erhaltung von Anfang an testbar ist.
 */
export const NO_MITIGATION = 0;

/**
 * Verteilt den team-weiten Schwung `S` auf die **lebenden** Charaktere (COMBAT §2.3, Schritt 1).
 *
 * ```
 * Tick = S / (#lebende Charaktere)
 *
 * Tank lebt & m > 0:  DD   → Tick × (1 − m)
 *                     Tank → Tick + (#lebende DDs) × Tick × m
 * sonst:              jeder → Tick
 * ```
 *
 * Der Tank-Anteil ist ein **Zuschlag pro lebendem DD**, kein Vielfaches des ganzen Schwungs —
 * die Summe bleibt dadurch exakt `S`. Ohne Tank (gefallen oder nicht im Team) gibt es kein
 * Umleitungsziel und jeder Charakter trägt seinen eigenen `Tick`.
 *
 * Die Rückgabe steht in **Slot-Reihenfolge** (Korvin → Rhaya → Quinn) und enthält nur lebende
 * Charaktere. Verbraucht keinen PRNG-Zug.
 */
export function distributeTeamDamage(
  characters: readonly CombatCharacter[],
  attack: number,
  mitigation: number,
): DamageShare[] {
  const living: { ref: ActorRef; character: CombatCharacter }[] = [];

  characters.forEach((character, index) => {
    if (isAlive(character)) {
      living.push({ ref: { side: 'character', index }, character });
    }
  });

  if (living.length === 0) {
    return [];
  }

  const tick = attack / living.length;
  const tank = living.find((entry) => entry.character.role === 'tank');
  const clampedMitigation = Math.min(Math.max(mitigation, 0), 1);
  const redirecting = tank !== undefined && clampedMitigation > 0;

  if (!redirecting) {
    return living.map((entry) => ({ ref: entry.ref, tick }));
  }

  const livingDds = living.length - 1;

  return living.map((entry) =>
    entry.character.role === 'tank'
      ? { ref: entry.ref, tick: tick + livingDds * tick * clampedMitigation }
      : { ref: entry.ref, tick: tick * (1 - clampedMitigation) },
  );
}

/* --------------------------------------------- Schritte 2–6: Pipeline je Charakter */

/** Was die Pipeline einem einzelnen Charakter angetan hat. */
export interface IncomingDamageResult {
  ref: ActorRef;
  /** Anteil aus Schritt 1, vor jeder Minderung. */
  tick: number;
  /** Die gewürfelte Trefferchance `Accuracy × (1 − Evasion)` (COMBAT §2.2). */
  hitChance: number;
  /** Ausgewichen → `0` Schaden und **kein** Counter (COMBAT §2.3, Schritt 2). */
  evaded: boolean;
  /** Geblockt → partielle Minderung; ein geblockter Treffer bleibt ein **Treffer**. */
  blocked: boolean;
  /** Schaden nach Schritt 3. */
  afterBlock: number;
  /** Schaden nach Schritt 4 — strukturell nie `0` bei positivem Eingang. */
  afterDefense: number;
  /** Von der Barrier geschluckter Anteil (Schritt 5). */
  barrierAbsorbed: number;
  /** Barrier-Rest nach Schritt 5. */
  barrier: number;
  /** Tatsächlich von der Health abgezogen (Schritt 6). */
  healthLost: number;
  /** Health nach Schritt 6. */
  health: number;
  /** Ob dieser Charakter durch diesen Treffer gefallen ist. */
  defeated: boolean;
  /**
   * Ob der Charakter **getroffen** wurde — die Auslösebedingung des Counters (COMBAT §2.1).
   * Geblockt ist getroffen, ausgewichen nicht.
   */
  hit: boolean;
}

/**
 * Trefferchance eines Gegner-Angriffs gegen einen Charakter (COMBAT §2.2):
 * `Accuracy × (1 − Evasion)`. Evasion wirkt als **Faktor** und behält damit auf jeder Floor-Tiefe
 * ihren relativen Wert. Das Ergebnis wird auf `[0, 1]` geklemmt.
 */
export function hitChance(accuracy: number, evasion: number): number {
  return Math.min(Math.max(accuracy * (1 - evasion), 0), 1);
}

/**
 * **Proportionale Mitigation** über die globale Defense-Konstante `K` (COMBAT §2.3, Schritt 4):
 *
 * ```
 * nachDefense = nachBlock × K / (K + Defense)
 * ```
 *
 * Der Faktor ist für jedes `Defense ≥ 0` echt größer als `0` — Defense drückt den Schaden **nie
 * auf 0**, und jeder Defense-Punkt hebt die effektive Health um denselben Betrag
 * (docs/adr/0008-defense-ratio-mitigation.md). Die Minderung ist unabhängig von Trefferhöhe und
 * Gegnerzahl.
 */
export function defenseDamageFactor(defense: number): number {
  const k = DEFENSE_CONSTANT_K;

  return k / (k + Math.max(defense, 0));
}

/**
 * Die Pipeline-Schritte 2–6 für **einen** Charakter.
 *
 * **PRNG-Zugreihenfolge (verbindlich, COMBAT §2.3/§2.5):** `Evasion` → bei Treffer `Block`.
 * Ein ausgewichener Treffer beendet die Pipeline sofort — der Block-Wurf entfällt, weil es
 * nichts zu blocken gibt.
 *
 * Die Schritte 4–6 verbrauchen **keinen** Zufall.
 */
export function resolveIncomingDamage(
  ref: ActorRef,
  character: CombatCharacter,
  tick: number,
  accuracy: number,
  prng: Prng,
): IncomingDamageResult {
  const { defensive } = character.stats;
  const chance = hitChance(accuracy, defensive.evasion);

  // 2. Evasion — der einzige Wurf, der immer stattfindet.
  if (!prng.chance(chance)) {
    return {
      ref,
      tick,
      hitChance: chance,
      evaded: true,
      blocked: false,
      afterBlock: 0,
      afterDefense: 0,
      barrierAbsorbed: 0,
      barrier: character.barrier,
      healthLost: 0,
      health: character.health,
      defeated: false,
      hit: false,
    };
  }

  // 3. Block — partielle Reduktion um einen festen %-Wert, nicht all-or-nothing.
  const blocked = prng.chance(defensive.blockChance);
  const afterBlock = blocked ? tick * (1 - BLOCK_DAMAGE_REDUCTION) : tick;

  // 4. Defense — proportionale Mitigation, strukturell unter 100 %.
  const afterDefense = afterBlock * defenseDamageFactor(character.stats.derived.defense);

  // 5. Barrier — absorbiert den bereits abgemilderten Schaden vor der Health.
  const barrierAbsorbed = Math.min(character.barrier, afterDefense);

  // 6. Health — der Rest.
  const healthLost = afterDefense - barrierAbsorbed;
  const health = Math.max(character.health - healthLost, 0);

  return {
    ref,
    tick,
    hitChance: chance,
    evaded: false,
    blocked,
    afterBlock,
    afterDefense,
    barrierAbsorbed,
    barrier: character.barrier - barrierAbsorbed,
    healthLost,
    health,
    defeated: health === 0,
    hit: true,
  };
}

/* ------------------------------------------------------------------ Ganzer Gegner-Zug */

/** Das Ergebnis eines vollständigen Gegner-Zuges gegen das Team. */
export interface EnemyAttackResult {
  /** Die team-weite Angriffsstärke `S` — flat, ohne Streuung. */
  attack: number;
  /** Schritt 1, nur lebende Charaktere, in Slot-Reihenfolge. */
  shares: readonly DamageShare[];
  /** Schritte 2–6 je verteiltem Anteil, in derselben Reihenfolge. */
  results: readonly IncomingDamageResult[];
}

/**
 * Löst einen vollständigen Gegner-Zug auf: Verteilung, dann die Pipeline je Charakter in
 * **Slot-Reihenfolge** (Korvin → Rhaya → Quinn). Die Reihenfolge legt die PRNG-Sequenz fest.
 *
 * Die Verteilung steht **vor** der ersten Pipeline fest: Stirbt ein Charakter an seinem Anteil,
 * ändert das die Anteile der übrigen **innerhalb desselben Angriffs** nicht mehr — erst der
 * nächste Gegner-Zug verteilt auf die verbliebenen Lebenden.
 *
 * Die **Counter** sind nicht Teil dieser Funktion: Sie lösen gesammelt **nach** Abschluss der
 * Team-Pipeline aus (COMBAT §1.1) und liegen in `counter.ts`, damit ein Counter die noch
 * laufende Schadensverteilung nicht beeinflusst.
 */
export function resolveEnemyAttack(
  characters: readonly CombatCharacter[],
  attacker: Pick<CombatEnemy, 'attack' | 'accuracy'>,
  prng: Prng,
  mitigation: number = NO_MITIGATION,
): EnemyAttackResult {
  const shares = distributeTeamDamage(characters, attacker.attack, mitigation);

  const results = shares.map((share) => {
    const character = characters[share.ref.index];

    if (character === undefined) {
      throw new Error(`Verteilter Anteil zeigt auf keinen Charakter: Slot ${share.ref.index}`);
    }

    return resolveIncomingDamage(share.ref, character, share.tick, attacker.accuracy, prng);
  });

  return { attack: attacker.attack, shares, results };
}
