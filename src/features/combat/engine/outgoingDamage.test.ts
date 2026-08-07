import { describe, expect, it } from 'vitest';
import { MULTI_HIT_CHAIN_FACTOR_CAP } from '@/game/curves/combatConstants';
import type { CharacterId, DamageRange, OffensiveStats, Role, UtilityStats } from '@/game/types';
import type { CombatCharacter, CombatEnemy, CombatState } from './combatState';
import {
  clampChainFactor,
  resolveCharacterAttack,
  NO_CRIT_NODES,
  type AttackContext,
  type CritNodes,
  type Hit,
  type MasteryEffects,
} from './outgoingDamage';
import { characterFixture, combatStateFixture, enemyFixture, scriptedPrng } from './testFixtures';

/**
 * Eigene Eingangswerte statt Platzhalter-Content: geprüft werden **Zugreihenfolge**, der Bezug
 * jedes Treffers auf den rohen Grundschaden und der Crit-Wurf pro Treffer — nicht das Tuning
 * (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten).
 */

/** Profil dieser Datei: Generator-Chancen aktiv, Angreifer mit 100/100 Health in Slot 1. */
function character(
  role: Role = 'melee',
  offensive: Partial<OffensiveStats> = {},
  utility: Partial<UtilityStats> = {},
  id: CharacterId = 'rhaya',
): CombatCharacter {
  return characterFixture({
    id,
    role,
    slotIndex: 1,
    defense: 10,
    health: 100,
    maxHealth: 100,
    offensive: {
      critChance: 0.25,
      multiHitChance: 0.4,
      splashChance: 0.3,
      counterDamage: 0,
      ...offensive,
    },
    utility,
  });
}

function enemy(
  formationIndex: number,
  initiative: number,
  bulwarkContribution = 0,
  health = 5000,
): CombatEnemy {
  return enemyFixture({
    formationIndex,
    initiative,
    bulwarkContribution,
    health,
    maxHealth: 5000,
    attack: 10,
    accuracy: 0.5,
  });
}

function state(enemies: CombatEnemy[]): CombatState {
  return combatStateFixture([], enemies);
}

/** 90 %–110 % wie im Test-Vektor der Spec. */
const DAMAGE_RANGE: DamageRange = { min: 0.9, max: 1.1 };
const ALL_CRIT_NODES: CritNodes = { multiHit: true, splash: true, counter: true };

function context(critNodes: CritNodes, damageRange: DamageRange = DAMAGE_RANGE): AttackContext {
  return { damageRange, critNodes };
}

function mastery(overrides: Partial<MasteryEffects>): MasteryEffects {
  return {
    executioner: false,
    perfectExploit: false,
    surestrike: false,
    overcritical: false,
    relentlessPursuit: false,
    echoedStrike: false,
    stormSurge: false,
    perfectCadence: false,
    epicenter: false,
    focusedBlast: false,
    aftershock: false,
    perfectRiposte: false,
    guardedReprisal: false,
    escalatingRetaliation: false,
    committedImpact: false,
    immovableGuard: false,
    twinMeasure: false,
    secondWind: false,
    zeroingIn: false,
    patientHunter: false,
    guarded: false,
    counterStacks: 0,
    ...overrides,
  };
}

/**
 * Vergleicht die Endschäden einer Trefferliste. `toBeCloseTo` statt `toBe`: Die Damage-Range
 * durchläuft eine Fließkomma-Interpolation, die Erwartungswerte der Spec sind Dezimalzahlen.
 */
function expectDamages(hits: readonly Hit[], expected: readonly number[]): void {
  expect(hits).toHaveLength(expected.length);

  expected.forEach((value, index) => {
    expect(hits[index]?.damage).toBeCloseTo(value, 10);
  });
}

describe('Precision', () => {
  const gestellt = state([enemy(0, 14), enemy(1, 9)]);

  it('resolves a clean hit with precision before range and allows crits', () => {
    const prng = scriptedPrng([0.5, 0.75, 0.1, 0.9, 0.9]);
    const result = resolveCharacterAttack(gestellt, character(), prng, {
      damageRange: DAMAGE_RANGE,
      precision: 0.75,
      critNodes: ALL_CRIT_NODES,
    });

    expect(result.cleanHit).toBe(true);
    expect(result.baseDamage).toBeCloseTo(105, 10);
    expect(result.hits[0]?.crit).toBe(true);
    expect(prng.draws).toEqual([
      'chance:0.75',
      'damageRange',
      'chance:0.25',
      'chance:0.4',
      'chance:0.3',
    ]);
  });

  it('uses MIN RNG for glancing while preserving range and generator draws', () => {
    const prng = scriptedPrng([0.9, 0.75, 0.1, 0.1]);
    const result = resolveCharacterAttack(gestellt, character(), prng, {
      damageRange: DAMAGE_RANGE,
      precision: 0.75,
      critNodes: ALL_CRIT_NODES,
    });

    expect(result.cleanHit).toBe(false);
    expect(result.damageRangeRoll).toBeCloseTo(1.05, 10);
    expect(result.baseDamage).toBeCloseTo(90, 10);
    expect(result.hits.map((hit) => hit.crit)).toEqual([false, false, false, false]);
    expect(result.hits.map((hit) => hit.rawDamage)).toEqual([90, 45, 27, 36]);
    expect(prng.draws).toEqual(['chance:0.75', 'damageRange', 'chance:0.4', 'chance:0.3']);
  });

  it('caps precision at 100 percent', () => {
    const prng = scriptedPrng([0.99, 0.5, 0.9, 0.9, 0.9]);
    const result = resolveCharacterAttack(gestellt, character(), prng, {
      damageRange: DAMAGE_RANGE,
      precision: 2,
      critNodes: NO_CRIT_NODES,
    });

    expect(result.cleanHit).toBe(true);
    expect(prng.draws[0]).toBe('chance:1');
  });
});

describe('Charakter-Zug — Test-Vektor aus COMBAT §2.1', () => {
  /*
   * Gegeben: Attack 100, Damage-Range 90–110 %, Crit Chance 25 %, Crit Damage 200 %,
   *          Multi Hit Chance 40 %, Multi Hit Damage 50 %, Multi Hit Chain 2,
   *          Multi Hit Chain Factor 60 %, Splash Chance 30 %, Splash Damage 40 %,
   *          Splash Radius 1, Multi-Hit- und Splash-Crit-Knoten frei, Bulwark-Malus 0 %.
   *
   * Der erste Wert stellt die Damage-Range: 0.9 + 0.75 × 0.2 = 1.05.
   */
  const VEKTOR = [0.75, 0.1, 0.22, 0.8, 0.15, 0.11, 0.05];
  const gestellt = state([enemy(0, 14), enemy(1, 9)]);

  it('trifft 210 / 52.5 / 63 auf dem Primärziel und 84 auf dem Nebenziel', () => {
    const prng = scriptedPrng(VEKTOR);
    const result = resolveCharacterAttack(gestellt, character(), prng, context(ALL_CRIT_NODES));

    expect(result.damageRangeRoll).toBeCloseTo(1.05, 10);
    expect(result.baseDamage).toBeCloseTo(105, 10);

    const primary = result.hits.filter((hit) => hit.target.index === 0);
    const splash = result.hits.filter((hit) => hit.target.index === 1);

    expectDamages(primary, [210, 52.5, 63]);
    expectDamages(splash, [84]);
    // Primärziel 210 + 52.5 + 63 = 325.5
    expect(primary.reduce((sum, hit) => sum + hit.damage, 0)).toBeCloseTo(325.5, 10);
  });

  it('bemisst Kettentreffer am rohen Grundschaden 105, nicht am gecritteten 210', () => {
    const prng = scriptedPrng(VEKTOR);
    const { hits } = resolveCharacterAttack(gestellt, character(), prng, context(ALL_CRIT_NODES));

    // Treffer B ohne Crit: 105 × 0.5 — nicht 210 × 0.5 = 105.
    expect(hits[1]?.damage).toBeCloseTo(52.5, 10);
    expect(hits[1]?.crit).toBe(false);
    // Treffer C trägt den Chain Factor genau einmal (0.6^1) und crittet selbst.
    expect(hits[2]?.damage).toBeCloseTo(63, 10);
    expect(hits[2]?.crit).toBe(true);
    expect(hits[2]?.chainIndex).toBe(2);
    // Treffer B trägt ihn nicht (0.6^0).
    expect(hits[1]?.chainIndex).toBe(1);
  });

  it('hält die verbindliche Zugreihenfolge in Zahl und Abfolge ein', () => {
    const prng = scriptedPrng(VEKTOR);

    resolveCharacterAttack(gestellt, character(), prng, context(ALL_CRIT_NODES));

    expect(prng.draws).toEqual([
      'damageRange',
      'chance:0.25', // Crit Grundtreffer
      'chance:0.4', // Multi Hit Chance — genau einmal
      'chance:0.25', // Crit Kette 1
      'chance:0.25', // Crit Kette 2
      'chance:0.3', // Splash Chance
      'chance:0.25', // Crit Splash
    ]);
  });

  it('würfelt Zug 7 auch dann, wenn der Grundtreffer schon gecrittet hat', () => {
    const prng = scriptedPrng(VEKTOR);
    const { hits } = resolveCharacterAttack(gestellt, character(), prng, context(ALL_CRIT_NODES));

    expect(hits[0]?.crit).toBe(true);
    expect(hits[3]?.crit).toBe(true);
    expect(prng.draws.filter((draw) => draw === 'chance:0.25')).toHaveLength(4);
  });
});

describe('Crit-Erweiterungen — ohne Knoten crittet nur der Grundtreffer', () => {
  const gestellt = state([enemy(0, 14), enemy(1, 9)]);

  it('lässt die Crit-Würfe der Generatoren aus, statt sie zu verwerfen', () => {
    // Ohne Knoten fehlen die drei Generator-Crit-Würfe: 7 Züge werden 4.
    const prng = scriptedPrng([0.75, 0.1, 0.22, 0.11]);
    const { hits } = resolveCharacterAttack(gestellt, character(), prng, context(NO_CRIT_NODES));

    expect(prng.draws).toEqual(['damageRange', 'chance:0.25', 'chance:0.4', 'chance:0.3']);
    expect(hits.map((hit) => hit.crit)).toEqual([true, false, false, false]);
    expectDamages(hits, [210, 52.5, 31.5, 42]);
  });
});

describe('Generatoren lösen einander nicht aus', () => {
  const gestellt = state([enemy(0, 14), enemy(1, 12), enemy(2, 9)]);

  it('splasht nicht aus Multi-Hit-Treffern und kettet nicht aus Splash-Treffern', () => {
    // Multi Hit und Splash treffen beide zu; Radius 2 → zwei Nebenziele.
    const prng = scriptedPrng([0.5, 0.9, 0.1, 0.1]);
    const { hits } = resolveCharacterAttack(
      gestellt,
      character('melee', {}, { multiHitChain: 3, splashRadius: 2 }),
      prng,
      context(NO_CRIT_NODES),
    );

    // Genau ein Multi-Hit-Chance-Wurf und ein Splash-Chance-Wurf im ganzen Zug.
    expect(prng.draws.filter((draw) => draw === 'chance:0.4')).toHaveLength(1);
    expect(prng.draws.filter((draw) => draw === 'chance:0.3')).toHaveLength(1);

    expect(hits.map((hit) => hit.kind)).toEqual([
      'base',
      'multiHit',
      'multiHit',
      'multiHit',
      'splash',
      'splash',
    ]);
    // Die Multi-Hit-Kette liegt vollständig auf dem Primärziel, der Splash nur auf Nebenzielen.
    expect(
      hits.filter((hit) => hit.kind === 'multiHit').every((hit) => hit.target.index === 0),
    ).toBe(true);
    expect(hits.filter((hit) => hit.kind === 'splash').map((hit) => hit.target.index)).toEqual([
      1, 2,
    ]);
  });

  it('legt die Kettenlänge mit dem einen Chance-Wurf fest', () => {
    const prng = scriptedPrng([0.5, 0.9, 0.1, 0.9]);
    const { hits } = resolveCharacterAttack(
      gestellt,
      character('melee', {}, { multiHitChain: 4 }),
      prng,
      context(NO_CRIT_NODES),
    );

    expect(hits.filter((hit) => hit.kind === 'multiHit')).toHaveLength(4);
    expect(prng.draws.filter((draw) => draw === 'chance:0.4')).toHaveLength(1);
  });

  it('erzeugt bei verlorenem Chance-Wurf keinen Treffer und keinen Crit-Wurf', () => {
    const prng = scriptedPrng([0.5, 0.9, 0.9, 0.9]);
    const { hits } = resolveCharacterAttack(gestellt, character(), prng, context(ALL_CRIT_NODES));

    expect(hits.map((hit) => hit.kind)).toEqual(['base']);
    expect(prng.draws).toEqual(['damageRange', 'chance:0.25', 'chance:0.4', 'chance:0.3']);
  });

  it('würfelt Multi Hit und Splash auch bei Chance 0 — die Sequenz hängt nicht an den Stats', () => {
    const prng = scriptedPrng([0.5, 0.9, 0, 0]);

    resolveCharacterAttack(
      gestellt,
      character('melee', { multiHitChance: 0, splashChance: 0 }),
      prng,
      context(ALL_CRIT_NODES),
    );

    expect(prng.draws).toEqual(['damageRange', 'chance:0.25', 'chance:0', 'chance:0']);
  });
});

describe('Multi Hit Chain Factor — Klemmung unter 100 %', () => {
  it('klemmt oberhalb der Obergrenze und unterhalb von 0', () => {
    expect(clampChainFactor(1.5)).toBe(MULTI_HIT_CHAIN_FACTOR_CAP);
    expect(clampChainFactor(1)).toBe(MULTI_HIT_CHAIN_FACTOR_CAP);
    expect(clampChainFactor(-0.2)).toBe(0);
    expect(clampChainFactor(0.6)).toBe(0.6);
    expect(MULTI_HIT_CHAIN_FACTOR_CAP).toBeLessThan(1);
  });

  it('rechnet die Kette mit dem geklemmten Faktor — sie klingt damit immer ab', () => {
    // Vier Werte: Der Splash-Chance-Wurf findet auch bei Chance 0 statt.
    const prng = scriptedPrng([0.5, 0.9, 0.1, 0]);
    const { hits, baseDamage } = resolveCharacterAttack(
      state([enemy(0, 14)]),
      character('melee', { splashChance: 0 }, { multiHitChain: 2, multiHitChainFactor: 5 }),
      prng,
      context(NO_CRIT_NODES),
    );

    const chain = hits.filter((hit) => hit.kind === 'multiHit');

    expect(chain).toHaveLength(2);
    expect(chain[0]?.damage).toBeCloseTo(baseDamage * 0.5, 10);
    expect(chain[1]?.damage).toBeCloseTo(baseDamage * 0.5 * MULTI_HIT_CHAIN_FACTOR_CAP, 10);
    expect(chain[1]?.damage).toBeLessThan(chain[0]?.damage as number);
  });
});

describe('Bulwark pro Treffer und Ziel', () => {
  it('legt den Malus des jeweiligen Ziels auf jeden Treffer — Frontline voll, Backline gemindert', () => {
    // Quinn (Ranged) trifft die Backline; der Splash läuft in die Frontline.
    const gestellt = state([enemy(0, 9, 0.3), enemy(3, 20), enemy(4, 18)]);
    const prng = scriptedPrng([0.5, 0.9, 0.9, 0.1]);
    const { hits, baseDamage } = resolveCharacterAttack(
      gestellt,
      character('ranged', {}, { splashRadius: 2 }, 'quinn'),
      prng,
      context(NO_CRIT_NODES),
    );

    const [grund, splashBackline, splashFrontline] = hits;

    // Primärziel und erstes Nebenziel stehen in der Backline → Faktor 0.7.
    expect(grund?.target.index).toBe(1);
    expect(grund?.bulwarkFactor).toBeCloseTo(0.7, 10);
    expect(grund?.damage).toBeCloseTo(baseDamage * 0.7, 10);
    expect(splashBackline?.bulwarkFactor).toBeCloseTo(0.7, 10);
    // Das Nebenziel in der Frontline nimmt vollen Schaden.
    expect(splashFrontline?.target.index).toBe(0);
    expect(splashFrontline?.bulwarkFactor).toBe(1);
    expect(splashFrontline?.damage).toBeCloseTo(baseDamage * 0.4, 10);
  });
});

describe('Kein Ziel — kein Angriff', () => {
  it('verbraucht keinen PRNG-Zug, wenn kein Gegner mehr lebt', () => {
    const prng = scriptedPrng([0.5]);
    const result = resolveCharacterAttack(
      state([enemy(0, 14, 0, 0)]),
      character(),
      prng,
      context(ALL_CRIT_NODES),
    );

    expect(result.primaryTarget).toBeUndefined();
    expect(result.hits).toEqual([]);
    expect(prng.draws).toEqual([]);
  });
});

describe('Mastery Combat Arts', () => {
  it('applies Finesse once, including Surestrike and the non-recursive Overcritical bonus', () => {
    const prng = scriptedPrng([0.5, 0.1, 0.1, 0.9, 0.9]);
    const result = resolveCharacterAttack(
      state([enemy(0, 14, 0, 100)]),
      character('melee', { critChance: 1 }),
      prng,
      {
        ...context(NO_CRIT_NODES),
        mastery: mastery({ executioner: true, surestrike: true, overcritical: true }),
      },
    );

    expect(result.hits[0]?.damage).toBeCloseTo(450, 10);
    expect(result.hits[0]?.crit).toBe(true);
  });

  it('retargets sequential chain hits and continues their index for Storm Surge', () => {
    const prng = scriptedPrng([0.5, 0.9, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9]);
    const result = resolveCharacterAttack(
      state([enemy(0, 14, 0, 120), enemy(1, 9)]),
      character('melee', { critChance: 0.8, multiHitChance: 1 }, { multiHitChain: 2 }),
      prng,
      {
        ...context({ ...ALL_CRIT_NODES, splash: false }),
        mastery: mastery({ relentlessPursuit: true, stormSurge: true, perfectCadence: true }),
      },
    );

    const chain = result.hits.filter((hit) => hit.kind === 'multiHit');
    expect(chain.map((hit) => hit.chainIndex)).toEqual([1, 2, 3, 4]);
    expect(chain.map((hit) => hit.target.index)).toEqual([0, 1, 1, 1]);
  });

  it('creates exactly the non-recursive Dominance follow-up hits after a successful splash', () => {
    const prng = scriptedPrng([0.5, 0.9, 0.9, 0.1, 0.9]);
    const result = resolveCharacterAttack(
      state([enemy(0, 14), enemy(1, 9)]),
      character('melee', { splashChance: 1 }, { splashRadius: 2 }),
      prng,
      { ...context(NO_CRIT_NODES), mastery: mastery({ epicenter: true, aftershock: true }) },
    );

    expect(result.hits.map((hit) => hit.kind)).toEqual([
      'base',
      'splash',
      'epicenter',
      'aftershock',
    ]);
  });

  it('keeps Glancing generator draws but suppresses every crit path', () => {
    const prng = scriptedPrng([0.9, 0.5, 0.1, 0.1]);
    const result = resolveCharacterAttack(
      state([enemy(0, 14), enemy(1, 9)]),
      character('melee', { critChance: 1, multiHitChance: 1, splashChance: 1 }),
      prng,
      {
        ...context(ALL_CRIT_NODES),
        precision: 0.5,
        mastery: mastery({ surestrike: true, overcritical: true }),
      },
    );

    expect(result.cleanHit).toBe(false);
    expect(result.hits.every((hit) => !hit.crit)).toBe(true);
    expect(prng.draws).toEqual(['chance:0.5', 'damageRange', 'chance:1', 'chance:1']);
  });

  it('uses weapon-only follow-ups without letting them generate further hits', () => {
    const prng = scriptedPrng([0.1, 0.9, 0.9, 0.9, 0.9, 0.9]);
    const result = resolveCharacterAttack(state([enemy(0, 14), enemy(1, 9)]), character(), prng, {
      ...context(NO_CRIT_NODES),
      mastery: mastery({
        echoedStrike: true,
        twinMeasure: true,
        secondWind: true,
        zeroingIn: true,
        patientHunter: true,
        zeroing: { target: 0, stacks: 4 },
      }),
    });

    expect(result.damageRangeRoll).toBeCloseTo(1.3, 10);
    expect(result.hits.map((hit) => hit.kind)).toEqual(['base', 'echo', 'secondWind']);
    expect(result.nextZeroing).toEqual({ target: 0, stacks: 5 });
  });
});

describe('Perfect Exploit', () => {
  it('rechnet über den Crit-Multiplikator — Grundschaden 0 bleibt 0 statt NaN', () => {
    const attacker = characterFixture({ id: 'rhaya', slotIndex: 1, attack: 0 });
    const prng = scriptedPrng([0.5, 0.9, 0.9]);

    const result = resolveCharacterAttack(state([enemy(0, 5)]), attacker, prng, {
      damageRange: DAMAGE_RANGE,
      critNodes: NO_CRIT_NODES,
      mastery: mastery({ surestrike: true, perfectExploit: true }),
    });

    expect(result.hits[0]?.crit).toBe(true);
    expect(result.hits[0]?.damage).toBe(0);
  });
});
