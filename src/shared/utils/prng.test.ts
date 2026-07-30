import { describe, expect, it } from 'vitest';
import { createPrng, derivePrng, deriveSeed, PRNG_STREAM } from './prng';

describe('createPrng', () => {
  it('erzeugt bei gleichem Seed eine identische Sequenz (reproduzierbar)', () => {
    const a = createPrng(12345);
    const b = createPrng(12345);
    const seqA = Array.from({ length: 5 }, () => a.next());
    const seqB = Array.from({ length: 5 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('erzeugt bei unterschiedlichem Seed unterschiedliche Sequenzen', () => {
    const a = createPrng(1);
    const b = createPrng(2);
    expect(a.next()).not.toBe(b.next());
  });

  it('liefert Werte im Bereich [0, 1)', () => {
    const rng = createPrng(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('nextInt bleibt innerhalb der inklusiven Grenzen', () => {
    const rng = createPrng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng.nextInt(1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe('deriveSeed', () => {
  it('ist bei gleichen Eingaben stabil', () => {
    expect(deriveSeed(999, 'A1-D1', 4)).toBe(deriveSeed(999, 'A1-D1', 4));
  });

  it('liefert einen uint32', () => {
    const seed = deriveSeed(1, 'combat');
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(0xffffffff);
  });

  it('trennt die Bestandteile eindeutig', () => {
    // Ohne Trennzeichen würden diese beiden Aufrufe kollidieren.
    expect(deriveSeed(1, 'ab', 'c')).not.toBe(deriveSeed(1, 'a', 'bc'));
  });

  it('unterscheidet Eltern-Seed, Dungeon und Floor', () => {
    const base = deriveSeed(1, 'A1-D1', 1);
    expect(deriveSeed(2, 'A1-D1', 1)).not.toBe(base);
    expect(deriveSeed(1, 'A1-D2', 1)).not.toBe(base);
    expect(deriveSeed(1, 'A1-D1', 2)).not.toBe(base);
  });
});

describe('derivePrng — Strom-Trennung (SPEC §5.3)', () => {
  it('liefert je Strom eine eigene Sequenz aus demselben Floor-Seed', () => {
    const floorSeed = deriveSeed(4711, 'A1-D1', 7);
    const combat = derivePrng(floorSeed, PRNG_STREAM.combat);
    const loot = derivePrng(floorSeed, PRNG_STREAM.loot);
    const init = derivePrng(floorSeed, PRNG_STREAM.init);

    expect(combat.next()).not.toBe(loot.next());
    expect(combat.seed).not.toBe(init.seed);
  });

  it('ist pro Strom reproduzierbar', () => {
    const floorSeed = deriveSeed(4711, 'A1-D1', 7);
    const a = derivePrng(floorSeed, PRNG_STREAM.loot);
    const b = derivePrng(floorSeed, PRNG_STREAM.loot);
    expect(Array.from({ length: 5 }, () => a.next())).toEqual(
      Array.from({ length: 5 }, () => b.next()),
    );
  });

  it('lässt den Loot-Strom unberührt, wenn der Kampf-Strom weiterzieht', () => {
    const floorSeed = deriveSeed(4711, 'A1-D1', 7);
    const combat = derivePrng(floorSeed, PRNG_STREAM.combat);
    for (let i = 0; i < 50; i++) combat.next();

    const loot = derivePrng(floorSeed, PRNG_STREAM.loot);
    const reference = derivePrng(floorSeed, PRNG_STREAM.loot);
    expect(loot.next()).toBe(reference.next());
  });
});
