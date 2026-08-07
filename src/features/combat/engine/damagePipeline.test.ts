import { describe, expect, it } from 'vitest';
import { BLOCK_DAMAGE_REDUCTION, DEFENSE_CONSTANT_K } from '@/game/curves/combatConstants';
import type { CombatCharacter } from './combatState';
import {
  defenseDamageFactor,
  distributeTeamDamage,
  hitChance,
  NO_MITIGATION,
  resolveEnemyAttack,
  resolveIncomingDamage,
} from './damagePipeline';
import { characterFixture, scriptedPrng, type CharacterFixture } from './testFixtures';

/**
 * Eigene Eingangswerte statt Platzhalter-Content: geprüft werden **Summen-Erhaltung**,
 * **Reihenfolge** der Pipeline und die **Zugreihenfolge** des PRNG — nicht das Tuning
 * (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten).
 */

/** Profil dieser Datei: rein defensiv, alle Offensiv-Stats neutralisiert. */
function character(setup: CharacterFixture): CombatCharacter {
  return characterFixture({
    ...setup,
    offensive: { critDamage: 1, multiHitDamage: 0, splashDamage: 0, counterDamage: 0 },
    utility: { multiHitChain: 1, multiHitChainFactor: 0.4 },
  });
}

/** Summe der verteilten Anteile — die Größe, die exakt `S` bleiben muss. */
function tickSum(shares: readonly { tick: number }[]): number {
  return shares.reduce((sum, share) => sum + share.tick, 0);
}

describe('Schadenspipeline — Test-Vektor aus COMBAT §2.3', () => {
  /*
   * Gegeben: S = 300, drei lebende Charaktere, Mitigation m = 0.3, Defense-Konstante K = 100,
   *          Block-Reduktion 40 %.
   *
   *   Korvin (Tank): Tick 160, trifft, blockt, Defense 140, Barrier 30 → Health −10
   *   Rhaya  (DD):   weicht aus                                        → Health   0
   *   Quinn  (DD):   Tick  70, trifft, blockt nicht, Defense 25, Barrier 0 → Health −56
   */

  it('nennt die Eingangswerte des Vektors als aktuelle Konstanten', () => {
    // Der Vektor gilt für genau diese beiden globalen Werte. Ändert das Balancing sie, bricht
    // dieser Test sichtbar, statt die Erwartungswerte unten still falsch werden zu lassen
    // (docs/backlog/OPEN_ISSUES.md#1-offene-balancing-fragen--tuning-notizen).
    expect(DEFENSE_CONSTANT_K).toBe(100);
    expect(BLOCK_DAMAGE_REDUCTION).toBe(0.4);
  });

  // Die Block-Chancen sind je Charakter verschieden, damit ihre Würfe im PRNG-Protokoll
  // unterscheidbar bleiben; die Block-**Reduktion** ist die globale Konstante.
  const gestellt = [
    character({
      id: 'korvin',
      role: 'tank',
      slotIndex: 0,
      defense: 140,
      barrier: 30,
      defensive: { blockChance: 0.5 },
    }),
    character({
      id: 'rhaya',
      role: 'melee',
      slotIndex: 1,
      defense: 10,
      defensive: { evasion: 0.4 },
    }),
    character({
      id: 'quinn',
      role: 'ranged',
      slotIndex: 2,
      defense: 25,
      defensive: { blockChance: 0.25 },
    }),
  ];

  /*
   * Accuracy 1 → Trefferchance = 1 − Evasion.
   *   1. Korvin Evasion (Chance 1)    → 0.1  trifft
   *   2. Korvin Block   (Chance 0.5)  → 0.1  blockt
   *   3. Rhaya  Evasion (Chance 0.6)  → 0.9  weicht aus
   *   4. Quinn  Evasion (Chance 1)    → 0.2  trifft
   *   5. Quinn  Block   (Chance 0.25) → 0.9  blockt nicht
   */
  const VEKTOR = [0.1, 0.1, 0.9, 0.2, 0.9];
  const ANGREIFER = { attack: 300, accuracy: 1 };

  it('verteilt 160 / 70 / 70 und die Summe bleibt S', () => {
    const shares = distributeTeamDamage(gestellt, 300, 0.3);

    expect(shares[0]?.tick).toBeCloseTo(160, 10);
    expect(shares[1]?.tick).toBeCloseTo(70, 10);
    expect(shares[2]?.tick).toBeCloseTo(70, 10);
    expect(tickSum(shares)).toBeCloseTo(300, 10);
  });

  it('nimmt Korvin −10, Rhaya 0 und Quinn −56', () => {
    const prng = scriptedPrng(VEKTOR);
    const { results } = resolveEnemyAttack(gestellt, ANGREIFER, prng, 0.3);

    const [korvin, rhaya, quinn] = results;

    expect(korvin?.healthLost).toBeCloseTo(10, 10);
    expect(rhaya?.healthLost).toBe(0);
    expect(quinn?.healthLost).toBeCloseTo(56, 10);
  });

  it('mildert bei Korvin auf dem Wert nach Block, nicht auf dem verteilten Tick', () => {
    const prng = scriptedPrng(VEKTOR);
    const { results } = resolveEnemyAttack(gestellt, ANGREIFER, prng, 0.3);
    const korvin = results[0];

    // 160 × (1 − 0.40) = 96 — die Defense rechnet auf 96, nicht auf 160.
    expect(korvin?.afterBlock).toBeCloseTo(96, 10);
    // 96 × 100 / (100 + 140) = 40
    expect(korvin?.afterDefense).toBeCloseTo(40, 10);
    // Barrier 30 schluckt 30, Health verliert 10.
    expect(korvin?.barrierAbsorbed).toBeCloseTo(30, 10);
    expect(korvin?.barrier).toBe(0);
  });

  it('lässt Rhaya ohne Schaden und ohne Counter-Auslösung ausweichen', () => {
    const prng = scriptedPrng(VEKTOR);
    const { results } = resolveEnemyAttack(gestellt, ANGREIFER, prng, 0.3);
    const rhaya = results[1];

    expect(rhaya?.evaded).toBe(true);
    expect(rhaya?.hit).toBe(false);
    expect(rhaya?.afterDefense).toBe(0);
  });

  it('hält die verbindliche Zugreihenfolge in Zahl und Abfolge ein', () => {
    const prng = scriptedPrng(VEKTOR);

    resolveEnemyAttack(gestellt, ANGREIFER, prng, 0.3);

    expect(prng.draws).toEqual([
      'chance:1', // Korvin Evasion
      'chance:0.5', // Korvin Block
      'chance:0.6', // Rhaya Evasion — weicht aus, kein Block-Wurf
      'chance:1', // Quinn Evasion
      'chance:0.25', // Quinn Block
    ]);
  });
});

describe('Schritt 1 — Verteilung und Summen-Erhaltung', () => {
  const team = [
    character({ id: 'korvin', role: 'tank', slotIndex: 0 }),
    character({ id: 'rhaya', role: 'melee', slotIndex: 1 }),
    character({ id: 'quinn', role: 'ranged', slotIndex: 2 }),
  ];

  it('erhält die Summe für jedes m — auch bei m > 0', () => {
    for (const m of [0, 0.1, 0.3, 0.5, 1]) {
      expect(tickSum(distributeTeamDamage(team, 300, m))).toBeCloseTo(300, 10);
    }
  });

  it('leitet den Tank-Anteil als Zuschlag pro lebendem DD um, nicht als Vielfaches von S', () => {
    const shares = distributeTeamDamage(team, 300, 0.3);

    // 100 + 2 × 100 × 0.3 = 160 — nicht 100 × 3 × 0.3.
    expect(shares[0]?.tick).toBeCloseTo(160, 10);
    expect(shares[1]?.tick).toBeCloseTo(70, 10);
    expect(shares[2]?.tick).toBeCloseTo(70, 10);
  });

  /** Dasselbe Team, aber die genannten Slots sind besiegt. */
  function teamOhne(...tote: number[]): CombatCharacter[] {
    return team.map((member, index) =>
      tote.includes(index)
        ? character({ id: member.id, role: member.role, slotIndex: index, health: 0 })
        : member,
    );
  }

  it('erhöht den Tick der Überlebenden, wenn Charaktere fallen', () => {
    const drei = distributeTeamDamage(team, 300, NO_MITIGATION);
    const zwei = distributeTeamDamage(teamOhne(2), 300, NO_MITIGATION);
    const einer = distributeTeamDamage(teamOhne(1, 2), 300, NO_MITIGATION);

    expect(drei.map((share) => share.tick)).toEqual([100, 100, 100]);
    expect(zwei.map((share) => share.tick)).toEqual([150, 150]);
    // Zwei Tote: derselbe Schwung `S` trifft Korvin vollständig.
    expect(einer.map((share) => share.tick)).toEqual([300]);
    expect(einer.map((share) => share.ref.index)).toEqual([0]);
    expect(tickSum(einer)).toBe(300);
  });

  it('trägt ohne Umleitungsziel jeden eigenen Tick — Tank tot', () => {
    const shares = distributeTeamDamage(teamOhne(0), 300, 0.3);

    expect(shares.map((share) => share.tick)).toEqual([150, 150]);
    expect(tickSum(shares)).toBe(300);
  });

  it('verteilt ohne lebende Charaktere nichts', () => {
    const wipe = [character({ id: 'korvin', role: 'tank', slotIndex: 0, health: 0 })];

    expect(distributeTeamDamage(wipe, 300, 0.3)).toEqual([]);
  });

  it('hält die Verteilung eines Angriffs fest, auch wenn ein Charakter dabei fällt', () => {
    const sterbend = [
      character({ id: 'korvin', role: 'tank', slotIndex: 0 }),
      character({ id: 'rhaya', role: 'melee', slotIndex: 1, health: 1, maxHealth: 1000 }),
      character({ id: 'quinn', role: 'ranged', slotIndex: 2 }),
    ];
    const prng = scriptedPrng([0.1, 0.9, 0.1, 0.9, 0.1, 0.9]);
    const { shares, results } = resolveEnemyAttack(
      sterbend,
      { attack: 300, accuracy: 1 },
      prng,
      NO_MITIGATION,
    );

    expect(results[1]?.defeated).toBe(true);
    // Rhayas Tod hebt Quinns Anteil erst beim **nächsten** Angriff.
    expect(shares.map((share) => share.tick)).toEqual([100, 100, 100]);
  });
});

describe('Schritt 2 — Treffermodell', () => {
  it('rechnet die Trefferchance als Accuracy × (1 − Evasion)', () => {
    expect(hitChance(0.8, 0.25)).toBeCloseTo(0.6, 10);
    expect(hitChance(0.5, 0)).toBeCloseTo(0.5, 10);
    // Evasion wirkt als Faktor: derselbe Wert mindert auf jeder Accuracy denselben Anteil.
    expect(hitChance(0.4, 0.25) / 0.4).toBeCloseTo(hitChance(0.8, 0.25) / 0.8, 10);
  });

  it('klemmt die Trefferchance auf [0, 1]', () => {
    expect(hitChance(1.5, 0)).toBe(1);
    expect(hitChance(0.5, 1.2)).toBe(0);
  });

  it('verbraucht bei einem ausgewichenen Treffer keinen Block-Wurf', () => {
    const prng = scriptedPrng([0.9]);
    const result = resolveIncomingDamage(
      { side: 'character', index: 0 },
      character({ id: 'rhaya', role: 'melee', slotIndex: 1, defensive: { blockChance: 0.5 } }),
      100,
      0.5,
      prng,
    );

    expect(result.evaded).toBe(true);
    expect(prng.draws).toEqual(['chance:0.5']);
  });
});

describe('Schritt 3 — Block ist partiell', () => {
  const geblockt = (blockChance: number, wurf: number, tick = 100) =>
    resolveIncomingDamage(
      { side: 'character', index: 0 },
      character({ id: 'korvin', role: 'tank', slotIndex: 0, defensive: { blockChance } }),
      tick,
      1,
      scriptedPrng([0.1, wurf]),
    );

  it('mindert um einen festen Anteil, statt den Treffer ganz zu verschlucken', () => {
    const result = geblockt(0.5, 0.1);

    expect(result.blocked).toBe(true);
    expect(result.afterBlock).toBeCloseTo(100 * (1 - BLOCK_DAMAGE_REDUCTION), 10);
    // Partiell heißt: es kommt etwas durch.
    expect(result.afterBlock).toBeGreaterThan(0);
    expect(result.afterBlock).toBeLessThan(100);
  });

  it('lässt einen geblockten Treffer ein Treffer bleiben — Counter löst aus', () => {
    const result = geblockt(0.5, 0.1);

    expect(result.hit).toBe(true);
    expect(result.evaded).toBe(false);
  });

  it('lässt bei verlorenem Block-Wurf den vollen Tick durch', () => {
    const result = geblockt(0.5, 0.9);

    expect(result.blocked).toBe(false);
    expect(result.afterBlock).toBe(100);
  });
});

describe('Schritt 4 — Defense drückt nie auf 0', () => {
  it('bleibt für jede Defense strukturell über 0', () => {
    for (const defense of [0, 10, 1000, 1_000_000]) {
      expect(defenseDamageFactor(defense)).toBeGreaterThan(0);
    }

    expect(defenseDamageFactor(0)).toBe(1);
  });

  it('lässt auch bei extremer Defense Restschaden durch', () => {
    const result = resolveIncomingDamage(
      { side: 'character', index: 0 },
      character({ id: 'korvin', role: 'tank', slotIndex: 0, defense: 1_000_000 }),
      100,
      1,
      scriptedPrng([0.1, 0.9]),
    );

    expect(result.afterDefense).toBeGreaterThan(0);
    expect(result.healthLost).toBeGreaterThan(0);
  });

  it('hebt jeder Defense-Punkt die effektive Health um denselben Betrag', () => {
    // eHP = Health / Faktor — der Zuwachs je Punkt ist konstant (ADR 0008).
    const ehp = (defense: number) => 1000 / defenseDamageFactor(defense);

    expect(ehp(100) - ehp(0)).toBeCloseTo(ehp(200) - ehp(100), 6);
  });

  it('ist unabhängig von Trefferhöhe und Gegnerzahl', () => {
    const faktor = defenseDamageFactor(140);

    for (const tick of [10, 100, 10_000]) {
      const result = resolveIncomingDamage(
        { side: 'character', index: 0 },
        character({ id: 'korvin', role: 'tank', slotIndex: 0, defense: 140 }),
        tick,
        1,
        scriptedPrng([0.1, 0.9]),
      );

      expect(result.afterDefense / tick).toBeCloseTo(faktor, 10);
    }
  });
});

describe('Schritte 5–6 — Barrier vor Health', () => {
  const treffer = (tick: number, barrier: number, health = 1000) =>
    resolveIncomingDamage(
      { side: 'character', index: 0 },
      character({ id: 'korvin', role: 'tank', slotIndex: 0, barrier, health }),
      tick,
      1,
      scriptedPrng([0.1, 0.9]),
    );

  it('absorbiert den bereits abgemilderten Schaden, bevor Health sinkt', () => {
    const result = treffer(100, 30);

    expect(result.barrierAbsorbed).toBe(30);
    expect(result.barrier).toBe(0);
    expect(result.healthLost).toBe(70);
    expect(result.health).toBe(930);
  });

  it('schluckt einen kleinen Treffer ganz und behält den Rest', () => {
    const result = treffer(20, 50);

    expect(result.barrierAbsorbed).toBe(20);
    expect(result.barrier).toBe(30);
    expect(result.healthLost).toBe(0);
    expect(result.health).toBe(1000);
  });

  it('deckelt die Health bei 0 und meldet den Fall', () => {
    const result = treffer(500, 0, 100);

    expect(result.health).toBe(0);
    expect(result.defeated).toBe(true);
  });

  it('lässt den Kampfzustand unberührt — das Anwenden liegt im Schrittwerk', () => {
    const korvin = character({ id: 'korvin', role: 'tank', slotIndex: 0, barrier: 30 });

    resolveIncomingDamage(
      { side: 'character', index: 0 },
      korvin,
      100,
      1,
      scriptedPrng([0.1, 0.9]),
    );

    expect(korvin.health).toBe(1000);
    expect(korvin.barrier).toBe(30);
  });
});

describe('Ganzer Gegner-Zug', () => {
  it('überspringt besiegte Charaktere in Verteilung und Pipeline', () => {
    const team = [
      character({ id: 'korvin', role: 'tank', slotIndex: 0 }),
      character({ id: 'rhaya', role: 'melee', slotIndex: 1, health: 0 }),
      character({ id: 'quinn', role: 'ranged', slotIndex: 2 }),
    ];
    const prng = scriptedPrng([0.1, 0.9, 0.1, 0.9]);
    const { results } = resolveEnemyAttack(team, { attack: 300, accuracy: 1 }, prng, NO_MITIGATION);

    expect(results.map((result) => result.ref.index)).toEqual([0, 2]);
    // Nur zwei Charaktere → zwei Evasion- und zwei Block-Würfe.
    expect(prng.draws).toHaveLength(4);
  });

  it('nutzt ohne Mitigation den Standardwert 0', () => {
    const team = [
      character({ id: 'korvin', role: 'tank', slotIndex: 0 }),
      character({ id: 'rhaya', role: 'melee', slotIndex: 1 }),
      character({ id: 'quinn', role: 'ranged', slotIndex: 2 }),
    ];

    const { shares } = resolveEnemyAttack(
      team,
      { attack: 300, accuracy: 1 },
      scriptedPrng([0.1, 0.9, 0.1, 0.9, 0.1, 0.9]),
    );

    expect(shares.map((share) => share.tick)).toEqual([100, 100, 100]);
  });
});
