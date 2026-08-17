import { describe, expect, it } from 'vitest';
import { createPrng, derivePrng, PRNG_STREAM, type Prng } from '@/shared/utils/prng';
import {
  actForFloorIndex,
  eliteCinderChance,
  gemDropChance,
  lootStreamPrng,
  rollFloorLoot,
} from './lootRewards';

/** Stellt Chance- und Farbwürfe fest — die Tests prüfen Struktur, nicht Platzhalter-Tuning. */
function stubPrng(chanceResult: boolean, colorIndex = 0): Prng {
  return {
    seed: 0,
    next: () => 0,
    nextInt: (min) => min + colorIndex,
    chance: () => chanceResult,
  };
}

describe('rollFloorLoot', () => {
  it('vergibt Boss-Cinder garantiert, auch wenn jeder Chance-Wurf fehlschlägt', () => {
    const loot = rollFloorLoot(
      { classification: 'boss', floorIndex: 99, enemyCount: 4 },
      stubPrng(false),
    );

    expect(loot.cinder).toBe(1);
    expect(Object.values(loot.gems).every((count) => count === 0)).toBe(true);
  });

  it('vergibt Elite-Cinder nur über den Chance-Wurf und normalen Floors nie Cinder', () => {
    const elite = { classification: 'elite', floorIndex: 19, enemyCount: 4 } as const;

    expect(rollFloorLoot(elite, stubPrng(true)).cinder).toBe(1);
    expect(rollFloorLoot(elite, stubPrng(false)).cinder).toBe(0);
    expect(rollFloorLoot({ ...elite, classification: 'normal' }, stubPrng(true)).cinder).toBe(0);
  });

  it('zählt je besiegtem Gegner höchstens einen regulären Gem der gewürfelten Farbe', () => {
    const input = { classification: 'normal', floorIndex: 0, enemyCount: 5 } as const;

    expect(rollFloorLoot(input, stubPrng(true, 0)).gems).toEqual({
      amber: 5,
      ruby: 0,
      sapphire: 0,
      emerald: 0,
      diamond: 0,
    });
    expect(rollFloorLoot(input, stubPrng(true, 3)).gems.emerald).toBe(5);
  });

  it('hält Diamond bis Akt 2 bei 0 und öffnet ihn dort nur für Elite und Boss', () => {
    const lastAct1Floor = 99;
    const firstAct2Floor = 100;

    expect(
      rollFloorLoot(
        { classification: 'elite', floorIndex: lastAct1Floor, enemyCount: 0 },
        stubPrng(true),
      ).gems.diamond,
    ).toBe(0);
    expect(
      rollFloorLoot(
        { classification: 'elite', floorIndex: firstAct2Floor, enemyCount: 0 },
        stubPrng(true),
      ).gems.diamond,
    ).toBe(1);
    expect(
      rollFloorLoot({ classification: 'boss', floorIndex: 199, enemyCount: 0 }, stubPrng(true)).gems
        .diamond,
    ).toBe(1);
    expect(
      rollFloorLoot(
        { classification: 'normal', floorIndex: firstAct2Floor, enemyCount: 0 },
        stubPrng(true),
      ).gems.diamond,
    ).toBe(0);
  });

  it('liefert für denselben Floor-Seed exakt denselben Loot', () => {
    const input = { classification: 'elite', floorIndex: 19, enemyCount: 6 } as const;

    const first = rollFloorLoot(input, lootStreamPrng(0xc0ffee));
    const second = rollFloorLoot(input, lootStreamPrng(0xc0ffee));

    expect(second).toEqual(first);
  });

  it('liefert nichtnegative Ganzzahlen in Gegnerzahl-Grenzen über viele Seeds', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const loot = rollFloorLoot(
        { classification: 'normal', floorIndex: 42, enemyCount: 6 },
        createPrng(seed),
      );
      const counts = [...Object.values(loot.gems), loot.cinder];

      expect(counts.every((count) => Number.isInteger(count) && count >= 0)).toBe(true);
      expect(
        Object.values(loot.gems).reduce((total, count) => total + count, 0),
      ).toBeLessThanOrEqual(6);
    }
  });

  it('lässt den Kampf-Strom desselben Floor-Seeds unberührt', () => {
    const floorSeed = 0xbeef;
    const before = derivePrng(floorSeed, PRNG_STREAM.combat);
    const reference = [before.next(), before.next(), before.next()];

    rollFloorLoot(
      { classification: 'elite', floorIndex: 19, enemyCount: 6 },
      lootStreamPrng(floorSeed),
    );

    const after = derivePrng(floorSeed, PRNG_STREAM.combat);
    expect([after.next(), after.next(), after.next()]).toEqual(reference);
  });
});

describe('eliteCinderChance', () => {
  it('steigt monoton mit dem globalen Floor-Index und kennt keinen Akt-Reset', () => {
    for (let floorIndex = 1; floorIndex < 300; floorIndex += 1) {
      expect(eliteCinderChance(floorIndex)).toBeGreaterThanOrEqual(
        eliteCinderChance(floorIndex - 1),
      );
    }
    // Aktwechsel A1→A2 und A2→A3: die Chance fällt nicht zurück.
    expect(eliteCinderChance(100)).toBeGreaterThanOrEqual(eliteCinderChance(99));
    expect(eliteCinderChance(200)).toBeGreaterThanOrEqual(eliteCinderChance(199));
  });
});

describe('actForFloorIndex', () => {
  it('teilt die 300 globalen Floors in drei Akte zu je 100', () => {
    expect(actForFloorIndex(0)).toBe(1);
    expect(actForFloorIndex(99)).toBe(1);
    expect(actForFloorIndex(100)).toBe(2);
    expect(actForFloorIndex(299)).toBe(3);
  });
});

describe('gemDropChance', () => {
  it('staffelt die Gem-Chance monoton nach Floor-Tiefe und bleibt gedeckelt', () => {
    expect(gemDropChance(10)).toBeGreaterThanOrEqual(gemDropChance(0));
    expect(gemDropChance(299)).toBeLessThanOrEqual(1);
  });
});
