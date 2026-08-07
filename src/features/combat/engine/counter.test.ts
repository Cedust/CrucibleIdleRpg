import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '@/game/characters/characters';
import type {
  CharacterId,
  DamageRange,
  DefensiveStats,
  Lane,
  OffensiveStats,
  Role,
} from '@/game/types';
import { MASTERY_IDS } from '@/game/weaponMastery/mastery';
import type { Prng } from '@/shared/utils/prng';
import type { CombatCharacter, CombatEnemy, CombatState } from './combatState';
import { resolveCounter, resolveCounters } from './counter';
import { NO_MITIGATION, resolveEnemyAttack } from './damagePipeline';
import { masteryContextFor } from './masteryCombat';
import { NO_CRIT_NODES, type AttackContext, type CritNodes } from './outgoingDamage';

/**
 * Eigene Eingangswerte statt Platzhalter-Content: geprüft werden **Auslösung**, **Ziel**,
 * **Zugreihenfolge** und die strukturelle Unmöglichkeit der Rekursion — nicht das Tuning
 * (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten).
 */

/**
 * Ein gestellter PRNG: liefert die Werte in der übergebenen Reihenfolge und **protokolliert
 * jeden Zug**. Das Protokoll ist die Absicherung der verbindlichen Zugreihenfolge — ein
 * zusätzlicher oder entfallener Wurf fällt damit auf (docs/spec/DAMAGE-SYSTEM.md#15-feststehende-regeln).
 */
interface ScriptedPrng extends Prng {
  readonly draws: readonly string[];
}

function scriptedPrng(values: readonly number[]): ScriptedPrng {
  const draws: string[] = [];
  let index = 0;

  const take = (label: string): number => {
    const value = values[index];

    if (value === undefined) {
      throw new Error(`PRNG-Zug ${index + 1} (${label}) ist nicht gestellt`);
    }

    index += 1;
    draws.push(label);

    return value;
  };

  return {
    seed: 0,
    draws,
    next: () => take('damageRange'),
    nextInt: (min, max) => min + Math.floor(take('nextInt') * (max - min + 1)),
    chance: (p) => take(`chance:${p}`) < p,
  };
}

interface CharacterSetup {
  id: CharacterId;
  role: Role;
  slotIndex: number;
  health?: number;
  offensive?: Partial<OffensiveStats>;
  defensive?: Partial<DefensiveStats>;
  masteryRanks?: Readonly<Record<string, number>>;
  counterStacks?: number;
}

function character(setup: CharacterSetup): CombatCharacter {
  return {
    id: setup.id,
    name: setup.id,
    role: setup.role,
    slotIndex: setup.slotIndex,
    stats: {
      core: { might: 0, toughness: 0, vitality: 0 },
      derived: { attack: 100, defense: 0, health: 1000 },
      offensive: {
        critChance: 0.25,
        critDamage: 2,
        multiHitChance: 0.4,
        multiHitDamage: 0.5,
        splashChance: 0.3,
        splashDamage: 0.4,
        counterChance: 0.2,
        counterDamage: 0.6,
        ...setup.offensive,
      },
      defensive: { barrier: 0, blockChance: 0, evasion: 0, regeneration: 0, ...setup.defensive },
      utility: { initiative: 10, multiHitChain: 2, multiHitChainFactor: 0.6, splashRadius: 1 },
    },
    health: setup.health ?? 1000,
    maxHealth: 1000,
    barrier: 0,
    masteryRanks: setup.masteryRanks,
    counterStacks: setup.counterStacks ?? 0,
  };
}

function enemy(formationIndex: number, bulwarkContribution = 0, health = 5000): CombatEnemy {
  const lane: Lane = formationIndex < 3 ? 'frontline' : 'backline';

  return {
    definitionId: 'ashenGhoul',
    name: `Enemy ${formationIndex}`,
    role: lane === 'frontline' ? 'melee' : 'ranged',
    lane,
    formationIndex,
    health,
    maxHealth: 5000,
    attack: 300,
    accuracy: 1,
    initiative: 10 - formationIndex,
    bulwarkContribution,
  };
}

function state(characters: CombatCharacter[], enemies: CombatEnemy[]): CombatState {
  return {
    floorId: 'A1-D1-01',
    floorIndex: 0,
    floorSeed: 1,
    combatPrngState: 1,
    characters,
    effectiveDamage: { korvin: 0, rhaya: 0, quinn: 0 },
    enemies,
    round: 1,
    pending: [],
  };
}

/** 90 %–110 % wie im Test-Vektor der Spec. */
const DAMAGE_RANGE: DamageRange = { min: 0.9, max: 1.1 };
const VALOR: CritNodes = { multiHit: false, splash: false, counter: true };

const contextFor = (critNodes: CritNodes) => (): AttackContext => ({
  damageRange: DAMAGE_RANGE,
  critNodes,
});

const TEAM = [
  character({ id: 'korvin', role: 'tank', slotIndex: 0 }),
  character({ id: 'rhaya', role: 'melee', slotIndex: 1 }),
  character({ id: 'quinn', role: 'ranged', slotIndex: 2 }),
];

const ANGREIFER = { side: 'enemy', index: 0 } as const;

describe('Counter Precision', () => {
  const gestellt = state(TEAM, [enemy(0)]);
  const korvin = TEAM[0] as CombatCharacter;
  const target = { ref: ANGREIFER, enemy: gestellt.enemies[0] as CombatEnemy };

  it('rolls counter chance, precision, range and crit for a clean counter', () => {
    const prng = scriptedPrng([0.1, 0.5, 0.75, 0.1]);
    const result = resolveCounter(gestellt, { side: 'character', index: 0 }, korvin, target, prng, {
      damageRange: DAMAGE_RANGE,
      precision: 0.75,
      critNodes: VALOR,
    });

    expect(result.cleanHit).toBe(true);
    expect(result.baseDamage).toBeCloseTo(105, 10);
    expect(result.hit?.crit).toBe(true);
    expect(prng.draws).toEqual(['chance:0.2', 'chance:0.75', 'damageRange', 'chance:0.25']);
  });

  it('uses MIN RNG and skips crit for a glancing counter after still drawing range', () => {
    const prng = scriptedPrng([0.1, 0.9, 0.75]);
    const result = resolveCounter(gestellt, { side: 'character', index: 0 }, korvin, target, prng, {
      damageRange: DAMAGE_RANGE,
      precision: 0.75,
      critNodes: VALOR,
    });

    expect(result.cleanHit).toBe(false);
    expect(result.damageRangeRoll).toBeCloseTo(1.05, 10);
    expect(result.baseDamage).toBeCloseTo(90, 10);
    expect(result.hit?.crit).toBe(false);
    expect(prng.draws).toEqual(['chance:0.2', 'chance:0.75', 'damageRange']);
  });
});

describe('Counter — Zugreihenfolge je Charakter (COMBAT §2.1)', () => {
  const gestellt = state(TEAM, [enemy(0)]);
  const korvin = TEAM[0] as CombatCharacter;
  const target = { ref: ANGREIFER, enemy: gestellt.enemies[0] as CombatEnemy };

  it('würfelt Counter Chance → Damage-Range → Counter Crit', () => {
    const prng = scriptedPrng([0.1, 0.75, 0.1]);
    const result = resolveCounter(gestellt, { side: 'character', index: 0 }, korvin, target, prng, {
      damageRange: DAMAGE_RANGE,
      critNodes: VALOR,
    });

    expect(prng.draws).toEqual(['chance:0.2', 'damageRange', 'chance:0.25']);
    // 0.9 + 0.75 × 0.2 = 1.05 ⇒ Grundschaden 105, davon 60 % Counter Damage, davon × 2 Crit.
    expect(result.damageRangeRoll).toBeCloseTo(1.05, 10);
    expect(result.baseDamage).toBeCloseTo(105, 10);
    expect(result.hit?.crit).toBe(true);
    expect(result.hit?.damage).toBeCloseTo(105 * 0.6 * 2, 10);
  });

  it('lässt den Crit-Wurf ohne Valor-Knoten aus, statt ihn zu verwerfen', () => {
    const prng = scriptedPrng([0.1, 0.75]);
    const result = resolveCounter(gestellt, { side: 'character', index: 0 }, korvin, target, prng, {
      damageRange: DAMAGE_RANGE,
      critNodes: NO_CRIT_NODES,
    });

    expect(prng.draws).toEqual(['chance:0.2', 'damageRange']);
    expect(result.hit?.crit).toBe(false);
    expect(result.hit?.damage).toBeCloseTo(105 * 0.6, 10);
  });

  it('beendet die Sequenz nach dem verlorenen Chance-Wurf', () => {
    const prng = scriptedPrng([0.9]);
    const result = resolveCounter(gestellt, { side: 'character', index: 0 }, korvin, target, prng, {
      damageRange: DAMAGE_RANGE,
      critNodes: VALOR,
    });

    expect(prng.draws).toEqual(['chance:0.2']);
    expect(result.hit).toBeUndefined();
    expect(result.baseDamage).toBe(0);
  });

  it('würfelt seinen eigenen Grundschaden, nicht den des eigenen Zuges', () => {
    const ersterWurf = resolveCounter(
      gestellt,
      { side: 'character', index: 0 },
      korvin,
      target,
      scriptedPrng([0.1, 0]),
      { damageRange: DAMAGE_RANGE, critNodes: NO_CRIT_NODES },
    );
    const zweiterWurf = resolveCounter(
      gestellt,
      { side: 'character', index: 0 },
      korvin,
      target,
      scriptedPrng([0.1, 1]),
      { damageRange: DAMAGE_RANGE, critNodes: NO_CRIT_NODES },
    );

    // Untere und obere Grenze des Waffenintervalls — der Wurf ist frei, nicht übernommen.
    expect(ersterWurf.damageRangeRoll).toBeCloseTo(0.9, 10);
    expect(zweiterWurf.damageRangeRoll).toBeCloseTo(1.1, 10);
  });
});

describe('Counter — Ziel und Deckung', () => {
  it('trifft den auslösenden Gegner, auch wenn der Frontline-Lock ihn sperrt', () => {
    // Korvin (Tank) könnte im eigenen Zug nur die Frontline angreifen; der auslösende Gegner
    // steht in der Backline.
    const gestellt = state(TEAM, [enemy(0, 0.3), enemy(3)]);
    const backline = { side: 'enemy', index: 1 } as const;
    const result = resolveCounter(
      gestellt,
      { side: 'character', index: 0 },
      TEAM[0] as CombatCharacter,
      { ref: backline, enemy: gestellt.enemies[1] as CombatEnemy },
      scriptedPrng([0.1, 0.75]),
      { damageRange: DAMAGE_RANGE, critNodes: NO_CRIT_NODES },
    );

    expect(result.hit?.target).toEqual(backline);
    // Bulwark gilt — der lebende Frontline-Gegner deckt mit b = 0.3.
    expect(result.hit?.bulwarkFactor).toBeCloseTo(0.7, 10);
    expect(result.hit?.damage).toBeCloseTo(105 * 0.6 * 0.7, 10);
  });

  it('countert nicht gegen einen bereits gefallenen Gegner und verbraucht keinen Zug', () => {
    const gestellt = state(TEAM, [enemy(0, 0, 0)]);
    const prng = scriptedPrng([0.1, 0.75]);

    const counters = resolveCounters(
      gestellt,
      ANGREIFER,
      [
        {
          ref: { side: 'character', index: 0 },
          tick: 100,
          hitChance: 1,
          evaded: false,
          blocked: false,
          afterBlock: 100,
          afterDefense: 100,
          barrierAbsorbed: 0,
          barrier: 0,
          healthLost: 100,
          health: 900,
          defeated: false,
          hit: true,
        },
      ],
      prng,
      contextFor(VALOR),
    );

    expect(counters).toEqual([]);
    expect(prng.draws).toEqual([]);
  });
});

describe('Counter — Auslösung nach einem vollständigen Gegner-Zug (COMBAT §1.1)', () => {
  /*
   * Rhaya weicht aus (Evasion 0.4 ⇒ Trefferchance 0.6), Korvin blockt, Quinn wird voll
   * getroffen. Danach countern in Slot-Reihenfolge nur Korvin und Quinn.
   */
  const team = [
    character({ id: 'korvin', role: 'tank', slotIndex: 0, defensive: { blockChance: 0.5 } }),
    character({ id: 'rhaya', role: 'melee', slotIndex: 1, defensive: { evasion: 0.4 } }),
    character({ id: 'quinn', role: 'ranged', slotIndex: 2, offensive: { counterChance: 0.8 } }),
  ];
  const gestellt = state(team, [enemy(0)]);

  /*
   *  1. Korvin Evasion (Chance 1)   → 0.1  trifft
   *  2. Korvin Block   (Chance 0.5) → 0.1  blockt   ⇒ getroffen, countert später
   *  3. Rhaya  Evasion (Chance 0.6) → 0.9  weicht aus ⇒ kein Counter
   *  4. Quinn  Evasion (Chance 1)   → 0.2  trifft
   *  5. Quinn  Block   (Chance 0)   → 0.9  blockt nicht
   *  ── Team-Pipeline abgeschlossen, erst jetzt die Counter ──
   *  6. Korvin Counter Chance (0.2) → 0.1  countert
   *  7. Korvin Damage-Range         → 0.75
   *  8. Korvin Counter Crit  (0.25) → 0.9  kein Crit
   *  9. Quinn  Counter Chance (0.8) → 0.9  countert nicht
   */
  const VEKTOR = [0.1, 0.1, 0.9, 0.2, 0.9, 0.1, 0.75, 0.9, 0.9];

  function gegnerZug(prng: ScriptedPrng) {
    const { results } = resolveEnemyAttack(team, { attack: 300, accuracy: 1 }, prng, NO_MITIGATION);

    return {
      results,
      counters: resolveCounters(gestellt, ANGREIFER, results, prng, contextFor(VALOR)),
    };
  }

  it('zählt Zahl und Reihenfolge der PRNG-Züge über den ganzen Gegner-Zug', () => {
    const prng = scriptedPrng(VEKTOR);

    gegnerZug(prng);

    expect(prng.draws).toEqual([
      'chance:1', // Korvin Evasion
      'chance:0.5', // Korvin Block
      'chance:0.6', // Rhaya Evasion — weicht aus, kein Block-Wurf
      'chance:1', // Quinn Evasion
      'chance:0', // Quinn Block
      'chance:0.2', // Korvin Counter Chance
      'damageRange', // Korvin Damage-Range
      'chance:0.25', // Korvin Counter Crit (Valor-Knoten)
      'chance:0.8', // Quinn Counter Chance — verloren, keine Folgezüge
    ]);
  });

  it('löst den Counter eines geblockten Treffers aus, den eines ausgewichenen nicht', () => {
    const prng = scriptedPrng(VEKTOR);
    const { results, counters } = gegnerZug(prng);

    expect(results[0]?.blocked).toBe(true);
    expect(results[1]?.evaded).toBe(true);
    // Rhaya taucht in der Counter-Auflösung gar nicht erst auf.
    expect(counters.map((counter) => counter.source.index)).toEqual([0, 2]);
    expect(counters[0]?.hit).toBeDefined();
    expect(counters[1]?.hit).toBeUndefined();
  });

  it('sammelt die Counter erst nach Abschluss der Team-Pipeline, in Slot-Reihenfolge', () => {
    const prng = scriptedPrng(VEKTOR);

    gegnerZug(prng);

    const pipeline = prng.draws.slice(0, 5);
    const counter = prng.draws.slice(5);

    // Kein Counter-Wurf ist in die Verteilung verschachtelt.
    expect(pipeline.every((draw) => draw.startsWith('chance:'))).toBe(true);
    expect(counter[0]).toBe('chance:0.2'); // Korvin (Slot 0) vor Quinn (Slot 2)
    expect(counter.at(-1)).toBe('chance:0.8');
  });
});

describe('Counter — kein Generator kettet weiter', () => {
  it('erzeugt genau einen Treffer: kein Multi Hit, kein Splash', () => {
    const gestellt = state(TEAM, [enemy(0), enemy(1), enemy(2)]);
    const prng = scriptedPrng([0.1, 0.75, 0.9]);
    const result = resolveCounter(
      gestellt,
      { side: 'character', index: 0 },
      TEAM[0] as CombatCharacter,
      { ref: ANGREIFER, enemy: gestellt.enemies[0] as CombatEnemy },
      prng,
      { damageRange: DAMAGE_RANGE, critNodes: VALOR },
    );

    expect(result.hit?.kind).toBe('counter');
    // Kein Multi-Hit-Chance- und kein Splash-Chance-Wurf in der Sequenz.
    expect(prng.draws).not.toContain('chance:0.4');
    expect(prng.draws).not.toContain('chance:0.3');
  });

  it('schließt Rekursion strukturell aus — ein Counter erzeugt keinen Counter', () => {
    const gestellt = state(TEAM, [enemy(0)]);
    const results = TEAM.map((_, index) => ({
      ref: { side: 'character', index } as const,
      tick: 100,
      hitChance: 1,
      evaded: false,
      blocked: false,
      afterBlock: 100,
      afterDefense: 100,
      barrierAbsorbed: 0,
      barrier: 0,
      healthLost: 100,
      health: 900,
      defeated: false,
      hit: true,
    }));
    // Drei Charaktere countern erfolgreich: je Counter Chance, Damage-Range, Counter Crit.
    const prng = scriptedPrng([0.1, 0.5, 0.9, 0.1, 0.5, 0.9, 0.1, 0.5, 0.9]);

    const counters = resolveCounters(gestellt, ANGREIFER, results, prng, contextFor(VALOR));

    // Höchstens ein Counter je Charakter — genau drei Ergebnisse, keine vierte Welle.
    expect(counters).toHaveLength(3);
    expect(counters.filter((counter) => counter.hit !== undefined)).toHaveLength(3);
    // Jeder Counter-Treffer richtet sich gegen einen **Gegner**; es gibt keinen Weg zurück.
    expect(counters.every((counter) => counter.hit?.target.side === 'enemy')).toBe(true);
    expect(prng.draws).toHaveLength(9);
  });
});

describe('Counter — Mastery-Pfade mit echten masteryRanks (M2)', () => {
  const gestellt = state(TEAM, [enemy(0)]);
  const target = { ref: ANGREIFER, enemy: gestellt.enemies[0] as CombatEnemy };
  const WAFFE = CHARACTERS.korvin.weapon;

  it('überspringt mit Guarded Reprisal nach einem Block den Chance-Wurf — die Sequenz beginnt bei Precision', () => {
    const korvin = character({
      id: 'korvin',
      role: 'tank',
      slotIndex: 0,
      masteryRanks: { [MASTERY_IDS.guardedReprisal]: 1 },
    });
    const prng = scriptedPrng([0.5, 0.75]);

    const result = resolveCounter(
      gestellt,
      { side: 'character', index: 0 },
      korvin,
      { ...target, blocked: true },
      prng,
      masteryContextFor(korvin),
    );

    // Kein `chance:0.2` am Anfang: Der garantierte Counter zieht die Chance nicht.
    expect(prng.draws).toEqual([`chance:${WAFFE.precision}`, 'damageRange']);
    expect(result.hit).toBeDefined();
  });

  it('würfelt mit Guarded Reprisal ohne Block die normale Counter Chance', () => {
    const korvin = character({
      id: 'korvin',
      role: 'tank',
      slotIndex: 0,
      masteryRanks: { [MASTERY_IDS.guardedReprisal]: 1 },
    });
    const prng = scriptedPrng([0.9]);

    const result = resolveCounter(
      gestellt,
      { side: 'character', index: 0 },
      korvin,
      { ...target, blocked: false },
      prng,
      masteryContextFor(korvin),
    );

    expect(prng.draws).toEqual(['chance:0.2']);
    expect(result.hit).toBeUndefined();
  });

  it('erhöht Escalating Retaliation den Counter Damage um 25 pp je Stack', () => {
    const korvin = character({
      id: 'korvin',
      role: 'tank',
      slotIndex: 0,
      masteryRanks: { [MASTERY_IDS.escalatingRetaliation]: 1 },
      counterStacks: 2,
    });
    const prng = scriptedPrng([0.1, 0.5, 0.5]);

    const result = resolveCounter(
      gestellt,
      { side: 'character', index: 0 },
      korvin,
      target,
      prng,
      masteryContextFor(korvin),
    );

    // Range-Wurf 0.5 im Korvin-Intervall 0.7–1.3 ⇒ Faktor 1.0, Grundschaden 100.
    expect(prng.draws).toEqual(['chance:0.2', `chance:${WAFFE.precision}`, 'damageRange']);
    expect(result.baseDamage).toBeCloseTo(100, 10);
    expect(result.hit?.damage).toBeCloseTo(100 * (0.6 + 2 * 0.25), 10);
  });

  it('lässt Perfect Riposte nach einer Evasion countern; ohne Knoten entfällt der Wurf', () => {
    const ausgewichen = {
      ref: { side: 'character', index: 0 } as const,
      tick: 100,
      hitChance: 1,
      evaded: true,
      blocked: false,
      afterBlock: 0,
      afterDefense: 0,
      barrierAbsorbed: 0,
      barrier: 0,
      healthLost: 0,
      health: 1000,
      defeated: false,
      hit: false,
    };

    const mitKnoten = state(
      [
        character({
          id: 'korvin',
          role: 'tank',
          slotIndex: 0,
          masteryRanks: { [MASTERY_IDS.perfectRiposte]: 1 },
        }),
      ],
      [enemy(0)],
    );
    const prng = scriptedPrng([0.1, 0.5, 0.5]);
    const counters = resolveCounters(mitKnoten, ANGREIFER, [ausgewichen], prng, masteryContextFor);

    expect(counters).toHaveLength(1);
    expect(counters[0]?.hit).toBeDefined();
    expect(prng.draws[0]).toBe('chance:0.2');

    const ohneKnoten = state([character({ id: 'korvin', role: 'tank', slotIndex: 0 })], [enemy(0)]);
    const leer = scriptedPrng([]);

    expect(resolveCounters(ohneKnoten, ANGREIFER, [ausgewichen], leer, masteryContextFor)).toEqual(
      [],
    );
    expect(leer.draws).toEqual([]);
  });
});

describe('Counter — wer countert', () => {
  const gestellt = state(TEAM, [enemy(0)]);

  function ergebnis(index: number, hit: boolean, health: number) {
    return {
      ref: { side: 'character', index } as const,
      tick: 100,
      hitChance: 1,
      evaded: !hit,
      blocked: false,
      afterBlock: hit ? 100 : 0,
      afterDefense: hit ? 100 : 0,
      barrierAbsorbed: 0,
      barrier: 0,
      healthLost: hit ? 100 : 0,
      health,
      defeated: health === 0,
      hit,
    };
  }

  it('lässt einen an diesem Angriff gefallenen Charakter nicht countern', () => {
    const prng = scriptedPrng([0.1, 0.5, 0.9]);
    const counters = resolveCounters(
      gestellt,
      ANGREIFER,
      [ergebnis(0, true, 0), ergebnis(1, true, 900)],
      prng,
      contextFor(VALOR),
    );

    expect(counters.map((counter) => counter.source.index)).toEqual([1]);
    expect(prng.draws).toEqual(['chance:0.2', 'damageRange', 'chance:0.25']);
  });

  it('countert ohne getroffene Charaktere gar nicht', () => {
    const prng = scriptedPrng([0.1]);

    expect(
      resolveCounters(gestellt, ANGREIFER, [ergebnis(0, false, 1000)], prng, contextFor(VALOR)),
    ).toEqual([]);
    expect(prng.draws).toEqual([]);
  });
});
