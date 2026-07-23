import { describe, expect, it } from 'vitest';
import { createPrng } from './prng';

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
