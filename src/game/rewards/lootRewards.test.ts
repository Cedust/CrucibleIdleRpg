import { describe, expect, it } from 'vitest';
import { createPrng, derivePrng, PRNG_STREAM, type Prng } from '@/shared/utils/prng';
import {
  actForFloorIndex,
  eliteCinderChance,
  gemDropChance,
  lootStreamPrng,
  rollFloorLoot,
  rollRunewords,
  runewordClassificationBonus,
} from './lootRewards';
import type { FloorLootInput } from './lootRewards';

/** Stellt Chance- und Farbwürfe fest — die Tests prüfen Struktur, nicht Platzhalter-Tuning. */
function stubPrng(chanceResult: boolean, colorIndex = 0): Prng {
  return {
    seed: 0,
    next: () => 0,
    nextInt: (min) => min + colorIndex,
    chance: () => chanceResult,
  };
}

function rollTestLoot(input: Omit<FloorLootInput, 'floorId'>, prng: Prng) {
  return rollFloorLoot({ floorId: 'A1-D1-01', ...input }, {}, prng);
}

const maxRollPrng: Prng = {
  seed: 0,
  next: () => 0,
  nextInt: (_min, max) => max,
  chance: () => true,
};

describe('rollFloorLoot', () => {
  it('vergibt Boss-Cinder garantiert, auch wenn jeder Chance-Wurf fehlschlägt', () => {
    const loot = rollTestLoot(
      { classification: 'boss', floorIndex: 99, enemyCount: 4 },
      stubPrng(false),
    );

    expect(loot.cinder).toBe(1);
    expect(Object.values(loot.gems).every((count) => count === 0)).toBe(true);
  });

  it('vergibt Elite-Cinder nur über den Chance-Wurf und normalen Floors nie Cinder', () => {
    const elite = { classification: 'elite', floorIndex: 19, enemyCount: 4 } as const;

    expect(rollTestLoot(elite, stubPrng(true)).cinder).toBe(1);
    expect(rollTestLoot(elite, stubPrng(false)).cinder).toBe(0);
    expect(rollTestLoot({ ...elite, classification: 'normal' }, stubPrng(true)).cinder).toBe(0);
  });

  it('zählt je besiegtem Gegner höchstens einen regulären Gem der gewürfelten Farbe', () => {
    const input = { classification: 'normal', floorIndex: 0, enemyCount: 5 } as const;

    expect(rollTestLoot(input, stubPrng(true, 0)).gems).toEqual({
      amber: 5,
      ruby: 0,
      sapphire: 0,
      emerald: 0,
      diamond: 0,
    });
    expect(rollTestLoot(input, stubPrng(true, 3)).gems.emerald).toBe(5);
  });

  it('hält Diamond bis Akt 2 bei 0 und öffnet ihn dort nur für Elite und Boss', () => {
    const lastAct1Floor = 99;
    const firstAct2Floor = 100;

    expect(
      rollTestLoot(
        { classification: 'elite', floorIndex: lastAct1Floor, enemyCount: 0 },
        stubPrng(true),
      ).gems.diamond,
    ).toBe(0);
    expect(
      rollTestLoot(
        { classification: 'elite', floorIndex: firstAct2Floor, enemyCount: 0 },
        stubPrng(true),
      ).gems.diamond,
    ).toBe(1);
    expect(
      rollTestLoot({ classification: 'boss', floorIndex: 199, enemyCount: 0 }, stubPrng(true)).gems
        .diamond,
    ).toBe(1);
    expect(
      rollTestLoot(
        { classification: 'normal', floorIndex: firstAct2Floor, enemyCount: 0 },
        stubPrng(true),
      ).gems.diamond,
    ).toBe(0);
  });

  it('liefert für denselben Floor-Seed exakt denselben Loot', () => {
    const input = { classification: 'elite', floorIndex: 19, enemyCount: 6 } as const;

    const first = rollTestLoot(input, lootStreamPrng(0xc0ffee));
    const second = rollTestLoot(input, lootStreamPrng(0xc0ffee));

    expect(second).toEqual(first);
  });

  it('liefert nichtnegative Ganzzahlen in Gegnerzahl-Grenzen über viele Seeds', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const loot = rollTestLoot(
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

    rollTestLoot(
      { classification: 'elite', floorIndex: 19, enemyCount: 6, runeGrimoireUnlocked: true },
      lootStreamPrng(floorSeed),
    );

    const after = derivePrng(floorSeed, PRNG_STREAM.combat);
    expect([after.next(), after.next(), after.next()]).toEqual(reference);
  });
});

describe('Runewords', () => {
  const normalInput = {
    floorId: 'A1-D1-01',
    classification: 'normal',
    floorIndex: 0,
    enemyCount: 3,
  } as const;

  it('gates every enemy reward behind Rune Grimoire and grants all enemies afterwards', () => {
    expect(rollRunewords({ ...normalInput, runeGrimoireUnlocked: false }, maxRollPrng)).toBe(0);
    expect(rollRunewords({ ...normalInput, runeGrimoireUnlocked: true }, maxRollPrng)).toBe(3);
  });

  it('adds an increasing depth range and structural Elite/Boss bonuses', () => {
    const shallow = rollRunewords({ ...normalInput, runeGrimoireUnlocked: true }, maxRollPrng);
    const deep = rollRunewords(
      { ...normalInput, floorIndex: 25, runeGrimoireUnlocked: true },
      maxRollPrng,
    );
    const elite = rollRunewords(
      { ...normalInput, classification: 'elite', runeGrimoireUnlocked: true },
      maxRollPrng,
    );
    const boss = rollRunewords(
      { ...normalInput, classification: 'boss', runeGrimoireUnlocked: true },
      maxRollPrng,
    );

    expect(deep).toBeGreaterThan(shallow);
    expect(elite - shallow).toBe(runewordClassificationBonus('elite'));
    expect(boss - shallow).toBe(runewordClassificationBonus('boss'));
  });

  it('is deterministic through the floor loot stream', () => {
    const input = { ...normalInput, floorIndex: 52, runeGrimoireUnlocked: true };
    expect(rollFloorLoot(input, {}, lootStreamPrng(77))).toEqual(
      rollFloorLoot(input, {}, lootStreamPrng(77)),
    );
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
