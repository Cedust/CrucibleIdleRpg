import { MULTI_HIT_CHAIN_FACTOR_CAP } from '@/game/curves/combatConstants';
import type { DamageRange } from '@/game/types';
import type { Prng } from '@/shared/utils/prng';
import { applyBulwark, bulwarkDamageFactor } from './bulwark';
import type { ActorRef, CombatCharacter, CombatState } from './combatState';
import { selectPrimaryTarget, selectSplashTargets, type EnemyTarget } from './targeting';

/**
 * Ausgehender Schaden eines Charakter-Zuges
 * (docs/spec/DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden).
 *
 * Ein Zug erzeugt eine **Trefferliste**: Grundtreffer, Multi-Hit-Kette, Splash. Charakter →
 * Gegner trifft immer und voll (COMBAT §2.2), die Liste ist damit vollständig und braucht keine
 * Treffer-/Miss-Prüfung.
 *
 * **Modifikator vs. Generator.** Crit multipliziert einen Treffer, Multi Hit und Splash erzeugen
 * welche. Daraus die zwei tragenden Regeln:
 *
 * - **Generatoren lösen einander nie aus** — ein Multi-Hit-Treffer splasht nicht, ein
 *   Splash-Treffer kettet nicht. Der Baum hat feste Tiefe, dieses Modul ruft sich nicht selbst.
 * - **Jeder Treffer bemisst sich am rohen Grundschaden** (vor Crit) und würfelt seinen **eigenen**
 *   Crit, sofern der Knoten des Generators freigeschaltet ist
 *   (docs/spec/CHARACTERS.md#4-charakter-skilltree). Es gibt keine Vererbung von Multiplikatoren.
 *
 * Der **Counter** ist rein reaktiv und kein Teil des eigenen Zuges — er hängt am Gegner-Zug
 * (COMBAT §2.1, docs/backlog/tasks/005-eingehender-schaden.md).
 *
 * Reine Funktion: kein Timer, kein DOM, kein Store, kein `Date.now()` (AGENTS.md). Der
 * Kampfzustand wird **gelesen**, nicht verändert — das Anwenden der Trefferliste liegt im
 * Schrittwerk (Task 006).
 */

/** Welcher Erzeuger einen Treffer erzeugt hat — Grundlage der Kampf-Events (COMBAT §2.5). */
export type HitKind = 'base' | 'multiHit' | 'splash' | 'counter';

/** Ein einzelner Treffer der Trefferliste. */
export interface Hit {
  kind: HitKind;
  /** Verweis auf den getroffenen Gegner in `CombatState.enemies`. */
  target: ActorRef;
  /** Schaden vor der Deckung des Ziels — inklusive Crit. */
  rawDamage: number;
  /** Ob dieser Treffer seinen eigenen Crit-Wurf gewonnen hat. */
  crit: boolean;
  /** Anteil, der die Deckung des Ziels passiert (COMBAT §2.4). */
  bulwarkFactor: number;
  /** Endschaden am Ziel: `rawDamage × bulwarkFactor`. */
  damage: number;
  /** Nur bei `multiHit`: Kettenstufe `k` ab `1`. */
  chainIndex?: number;
}

/**
 * Welche Trefferklassen critten dürfen. Standardmäßig crittet **nur der Grundtreffer**; je ein
 * Knoten im Zweig des Generators erweitert den Wurf
 * (docs/spec/CHARACTERS.md#4-charakter-skilltree). Der Skilltree kommt in M2
 * (docs/backlog/ROADMAP.md) — bis dahin steht hier die Struktur.
 */
export interface CritNodes {
  /** Tempest-Knoten: Multi-Hit-Treffer können critten. */
  multiHit: boolean;
  /** Dominance-Knoten: Splash-Treffer können critten. */
  splash: boolean;
  /** Valor-Knoten: Counter-Treffer können critten (Task 005). */
  counter: boolean;
}

/** Kein Generator-Knoten freigeschaltet — der Stand in M1. */
export const NO_CRIT_NODES: CritNodes = { multiHit: false, splash: false, counter: false };

/** Was ein Angriff außerhalb der Charakter-Stats braucht. */
export interface AttackContext {
  /**
   * Damage-Range der Waffe — Faktor auf den Grundschaden, **einmal pro Angriff** gewürfelt.
   * Items kommen in M3; in M1 ist es die Start-Main-Hand
   * (`MAIN_HAND_DAMAGE_RANGE.common`, src/game/curves/weaponCurves.ts).
   */
  damageRange: DamageRange;
  critNodes: CritNodes;
}

/** Das Ergebnis eines Charakter-Zuges. */
export interface AttackResult {
  /** `undefined`, wenn kein Gegner mehr lebt — dann findet kein Angriff statt. */
  primaryTarget: ActorRef | undefined;
  /** Der gewürfelte Faktor im Waffenintervall. */
  damageRangeRoll: number;
  /** Roher Grundschaden `Attack × Damage-Range`, Bezugsgröße **jedes** Treffers dieses Zuges. */
  baseDamage: number;
  /** Grundtreffer, dann Multi-Hit-Kette, dann Splash — in Erzeugungsreihenfolge. */
  hits: readonly Hit[];
}

/**
 * Ein Crit-Wurf, der nur bei freigeschaltetem Knoten stattfindet. Die Kurzschluss-Auswertung
 * ist Teil der Spezifikation: Ohne Knoten wird **kein** PRNG-Zug verbraucht, sonst verschöbe
 * ein gesperrter Knoten die ganze Folgesequenz (COMBAT §2.1).
 */
function rollCrit(prng: Prng, critChance: number, enabled: boolean): boolean {
  return enabled && prng.chance(critChance);
}

/** Der Abklingfaktor ist echt kleiner als 1 und wird auf die Obergrenze geklemmt (COMBAT §2.1). */
export function clampChainFactor(chainFactor: number): number {
  return Math.min(Math.max(chainFactor, 0), MULTI_HIT_CHAIN_FACTOR_CAP);
}

/** Baut einen Treffer und wendet dabei die Deckung **seines** Ziels an (COMBAT §2.4). */
function buildHit(
  kind: HitKind,
  state: CombatState,
  target: EnemyTarget,
  rawDamage: number,
  crit: boolean,
  chainIndex?: number,
): Hit {
  const bulwarkFactor = bulwarkDamageFactor(state.enemies, target.enemy);

  return {
    kind,
    target: target.ref,
    rawDamage,
    crit,
    bulwarkFactor,
    damage: applyBulwark(rawDamage, state.enemies, target.enemy),
    ...(chainIndex === undefined ? {} : { chainIndex }),
  };
}

/**
 * Löst einen Charakter-Zug auf und liefert seine Trefferliste.
 *
 * **PRNG-Zugreihenfolge (verbindlich, COMBAT §2.1/§2.5):**
 *
 * ```
 * Damage-Range → Crit (Grundtreffer) → Multi Hit Chance → je Kettentreffer Crit (Multi Hit)
 *              → Splash Chance → je Nebenziel Crit (Splash)
 * ```
 *
 * `Multi Hit Chance` und `Splash Chance` werden **immer** gewürfelt, auch bei Chance `0` — die
 * Sequenz hängt nicht an den Stat-Werten. Die Kettenlänge steht mit dem **einen**
 * `Multi Hit Chance`-Wurf fest; weitere Chance-Würfe gibt es nicht. Lebt kein Gegner mehr,
 * findet kein Angriff statt und **kein** Zug wird verbraucht.
 */
export function resolveCharacterAttack(
  state: CombatState,
  attacker: CombatCharacter,
  prng: Prng,
  context: AttackContext,
): AttackResult {
  const primary = selectPrimaryTarget(state, attacker);

  if (primary === undefined) {
    return { primaryTarget: undefined, damageRangeRoll: 0, baseDamage: 0, hits: [] };
  }

  const { offensive, utility, derived } = attacker.stats;
  const { damageRange, critNodes } = context;

  // 1. Roher Grundschaden — ein Wurf im Waffenintervall, Bezug jedes Treffers dieses Zuges.
  const damageRangeRoll = damageRange.min + prng.next() * (damageRange.max - damageRange.min);
  const baseDamage = derived.attack * damageRangeRoll;

  const hits: Hit[] = [];

  // 2. Grundtreffer — crittet immer ohne Knoten (COMBAT §2.1, CHARACTERS §4).
  const baseCrit = rollCrit(prng, offensive.critChance, true);
  hits.push(
    buildHit(
      'base',
      state,
      primary,
      baseCrit ? baseDamage * offensive.critDamage : baseDamage,
      baseCrit,
    ),
  );

  // 3. Multi Hit — ein Chance-Wurf, danach steht die Kette in voller Länge fest.
  const chainLength = prng.chance(offensive.multiHitChance)
    ? Math.max(Math.trunc(utility.multiHitChain), 0)
    : 0;
  const chainFactor = clampChainFactor(utility.multiHitChainFactor);

  // `chainFactor^(k−1)` als fortlaufendes Produkt statt als Potenz: `Math.pow` ist zwischen
  // JS-Engines nicht bit-identisch garantiert und würde den Determinismus aufweichen
  // (AGENTS.md).
  let decay = 1;

  for (let k = 1; k <= chainLength; k += 1) {
    const chained = baseDamage * offensive.multiHitDamage * decay;
    const crit = rollCrit(prng, offensive.critChance, critNodes.multiHit);

    hits.push(
      buildHit(
        'multiHit',
        state,
        primary,
        crit ? chained * offensive.critDamage : chained,
        crit,
        k,
      ),
    );

    decay *= chainFactor;
  }

  // 4. Splash — der Chance-Wurf findet unabhängig davon statt, ob Nebenziele existieren.
  const splashTargets = prng.chance(offensive.splashChance)
    ? selectSplashTargets(state, primary, utility.splashRadius)
    : [];

  for (const target of splashTargets) {
    const splashed = baseDamage * offensive.splashDamage;
    const crit = rollCrit(prng, offensive.critChance, critNodes.splash);

    hits.push(
      buildHit('splash', state, target, crit ? splashed * offensive.critDamage : splashed, crit),
    );
  }

  return { primaryTarget: primary.ref, damageRangeRoll, baseDamage, hits };
}
