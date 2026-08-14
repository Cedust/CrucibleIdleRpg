import { MASTERY_BALANCE } from '@/game/weaponMastery/mastery';
import type { Prng } from '@/shared/utils/prng';
import { applyBulwark, bulwarkDamageFactor } from './bulwark';
import {
  isAlive,
  type ActorRef,
  type CombatCharacter,
  type CombatEnemy,
  type CombatState,
} from '../combatState';
import type { IncomingDamageResult } from './damagePipeline';
import { clampChance, type AttackContext, type Hit } from './outgoingDamage';

/**
 * Counter — der reaktive Gegenangriff eines getroffenen Charakters
 * (docs/spec/DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden, Abschnitt „Counter im Detail").
 *
 * Der Counter ist **kein Teil des eigenen Zuges**, sondern hängt am Gegner-Zug: Er löst
 * gesammelt **nach** Abschluss der Team-Pipeline aus (COMBAT §1.1), in **Slot-Reihenfolge**
 * (Korvin → Rhaya → Quinn) und **nicht verschachtelt** in die Schadensverteilung — sonst
 * beeinflusste ein Counter die noch laufende Verteilung.
 *
 * **Was ihn von einem regulären Zug unterscheidet:**
 *
 * - **Ziel** ist der **auslösende Gegner** — unabhängig von Frontline-Lock und Taunt
 *   (COMBAT §1.2). Der Counter ist damit der einzige Weg für Tank und Melee, die Backline zu
 *   erreichen.
 * - **Eigener Grundschaden:** `Attack × Waffen-Damage-Range`, **neu** gewürfelt, nicht der Wurf
 *   des eigenen Zuges.
 * - **Kein Multi Hit, kein Splash** — Generatoren lösen einander nie aus (COMBAT §2.1). Der
 *   Counter erzeugt also genau einen Treffer.
 * - **Crit** ist per Valor-Knoten möglich (docs/spec/CHARACTERS.md#4-charakter-skilltree).
 * - **Bulwark gilt** — der Counter ignoriert die Deckung nicht (COMBAT §2.4).
 *
 * **Auslösung:** Ein **geblockter** Treffer ist ein Treffer und löst Counter aus, ein
 * **ausgewichener** nicht (COMBAT §2.3, Schritt 2).
 *
 * **Rekursion ist strukturell ausgeschlossen:** Nur Charaktere countern, und nur Gegner
 * verursachen Schaden an Charakteren. Dieses Modul kennt keinen Weg, aus einem Counter-Treffer
 * einen weiteren Counter zu erzeugen — es ruft sich nicht selbst und erzeugt keinen
 * eingehenden Schaden.
 *
 * Reine Funktionen ohne Timer, DOM oder Store (AGENTS.md). Der Kampfzustand wird **gelesen**,
 * nicht verändert — das Anwenden der Treffer liegt im Schrittwerk (Task 006).
 */

/** Der Counter eines einzelnen Charakters — auch der verlorene Wurf wird berichtet. */
export interface CounterResult {
  /** Verweis auf den counternden Charakter in `CombatState.characters`. */
  source: ActorRef;
  /** `undefined`, wenn der `Counter Chance`-Wurf verloren ging. */
  hit: Hit | undefined;
  /** `false`, wenn der erfolgreiche Counter als Glancing Blow aufgelöst wurde. */
  cleanHit: boolean;
  /** Der eigens gewürfelte Faktor im Waffenintervall; `0` ohne Counter. */
  damageRangeRoll: number;
  /** Der eigens gewürfelte rohe Grundschaden `Attack × Damage-Range`; `0` ohne Counter. */
  baseDamage: number;
}

/**
 * Der Counter **eines** Charakters gegen den auslösenden Gegner.
 *
 * **PRNG-Zugreihenfolge (verbindlich, COMBAT §2.1/§2.5):**
 *
 * ```
 * Counter Chance → bei Erfolg Precision → Damage-Range → bei Clean und freigeschaltetem
 * Valor-Knoten Counter Crit
 * ```
 *
 * Ein Charakter countert pro Gegner-Angriff **höchstens einmal**; die Sequenz enthält je
 * Charakter also höchstens diese drei Züge. Der verlorene Chance-Wurf beendet sie nach dem
 * ersten. Ohne Valor-Knoten entfällt der Crit-Wurf ganz, statt verworfen zu werden — sonst
 * verschöbe ein gesperrter Knoten die Folgesequenz.
 */
export function resolveCounter(
  state: CombatState,
  source: ActorRef,
  character: CombatCharacter,
  target: { ref: ActorRef; enemy: CombatEnemy; blocked?: boolean },
  prng: Prng,
  context: AttackContext,
): CounterResult {
  const { offensive } = character.stats;
  const { damageRange, critNodes } = context;

  const mastery = context.mastery;
  const guaranteed = mastery?.guardedReprisal === true && target.blocked === true;
  if (!guaranteed && !prng.chance(clampChance(offensive.counterChance))) {
    return { source, hit: undefined, cleanHit: false, damageRangeRoll: 0, baseDamage: 0 };
  }

  // 2. Precision vor Range; Glancing zieht Range trotzdem und verwendet danach MIN RNG.
  const cleanHit = context.precision === undefined || prng.chance(clampChance(context.precision));
  const damageRangeRoll = damageRange.min + prng.next() * (damageRange.max - damageRange.min);
  const baseDamage =
    character.stats.derived.attack * (cleanHit ? damageRangeRoll : damageRange.min);

  // 3. Counter Crit — nur bei Clean und freigeschaltetem Valor-Knoten.
  const crit = cleanHit && critNodes.counter && prng.chance(clampChance(offensive.critChance));
  const counterDamage =
    offensive.counterDamage +
    (mastery?.escalatingRetaliation
      ? mastery.counterStacks * MASTERY_BALANCE.escalatingRetaliation.counterDamagePerStack
      : 0);
  const rawDamage = crit
    ? baseDamage * counterDamage * offensive.critDamage
    : baseDamage * counterDamage;

  return {
    source,
    cleanHit,
    hit: {
      kind: 'counter',
      target: target.ref,
      rawDamage,
      crit,
      bulwarkFactor: bulwarkDamageFactor(state.enemies, target.enemy),
      damage: applyBulwark(rawDamage, state.enemies, target.enemy),
    },
    damageRangeRoll,
    baseDamage,
  };
}

/**
 * Alle Counter eines Gegner-Zuges, gesammelt **nach** Abschluss der Team-Pipeline und in
 * **Slot-Reihenfolge** (COMBAT §1.1).
 *
 * **Wer countert:** jeder Charakter, den dieser Angriff **getroffen** hat (`hit === true`,
 * geblockt zählt mit) und der **noch lebt**. Ein durch diesen Angriff gefallener Charakter
 * handelt nicht mehr — dieselbe Regel, nach der ein sterbender Akteur aus der Pending-Queue
 * fällt (COMBAT §1.1). Die Ergebnisse der Pipeline liefern beide Angaben, der Kampfzustand
 * bleibt also unangetastet lesbar.
 *
 * `contextFor` liefert je Charakter seine Waffen-Damage-Range und die freigeschalteten
 * Crit-Knoten — beide sind pro Charakter verschieden, sobald Items (M3) und Skilltree (M2)
 * existieren.
 *
 * Lebt der auslösende Gegner nicht mehr, findet **kein** Counter statt und **kein** PRNG-Zug
 * wird verbraucht.
 */
export function resolveCounters(
  state: CombatState,
  attacker: ActorRef,
  results: readonly IncomingDamageResult[],
  prng: Prng,
  contextFor: (character: CombatCharacter) => AttackContext,
): CounterResult[] {
  const enemy = state.enemies[attacker.index];

  if (enemy === undefined || !isAlive(enemy)) {
    return [];
  }

  const target = { ref: attacker, enemy };
  const counters: CounterResult[] = [];

  // Die Pipeline-Ergebnisse stehen bereits in Slot-Reihenfolge (damagePipeline.ts).
  for (const result of results) {
    const character = state.characters[result.ref.index];

    // Health aus dem Pipeline-Ergebnis, nicht aus dem Zustand: Das Anwenden liegt im
    // Schrittwerk, der Zustand trägt hier noch die Health **vor** dem Angriff.
    if (character === undefined || result.health <= 0) {
      continue;
    }

    const context = contextFor(character);
    if (!result.hit && !context.mastery?.perfectRiposte) {
      continue;
    }

    counters.push(
      resolveCounter(
        state,
        result.ref,
        character,
        { ...target, blocked: result.blocked },
        prng,
        context,
      ),
    );
  }

  return counters;
}
