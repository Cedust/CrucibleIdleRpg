/**
 * Seedbarer Pseudozufallsgenerator (mulberry32).
 *
 * Pflicht für allen Zufall in der Spiellogik (siehe AGENTS.md §5): gleicher Seed
 * ⇒ exakt gleiche Sequenz ⇒ reproduzierbare Kämpfe und deterministische Tests.
 * Niemals Math.random() in Spiellogik verwenden.
 */
export interface Prng {
  /** Gleichverteilte Zufallszahl in [0, 1). */
  next(): number;
  /** Ganzzahl in [min, max] (inklusive). */
  nextInt(min: number, max: number): number;
  /** Wahr mit Wahrscheinlichkeit p (0..1). */
  chance(p: number): boolean;
  /** Der ursprüngliche Seed (für Bug-Reports / Replays). */
  readonly seed: number;
}

export function createPrng(seed: number): Prng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    seed,
    next,
    nextInt: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p) => next() < p,
  };
}
