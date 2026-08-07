/**
 * Seedbarer Pseudozufallsgenerator (mulberry32).
 *
 * Pflicht für allen Zufall in der Spiellogik (siehe AGENTS.md): gleicher Seed
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

/**
 * Ein PRNG, dessen Sequenz sich exakt fortsetzen lässt: `resumePrng(prng.state())` liefert
 * einen Generator, der genau dort weiterzieht.
 *
 * Grundlage der reinen Takt-Funktion der Kampf-Engine (AGENTS.md): Der Fortschritt im
 * `combat`-Strom liegt als Zahl im Kampfzustand, statt als mitgeschleppte Instanz. Damit hängt
 * ein Takt ausschließlich an seinem Eingangszustand.
 */
export interface ResumablePrng extends Prng {
  /** Der interne Zustand **vor** dem nächsten Zug. */
  state(): number;
}

/**
 * Namen der Zufalls-Ströme (siehe docs/spec/SIMULATION.md#4-seeds-und-zufalls-ströme). Der Determinismus hängt daran, dass diese
 * Label stabil bleiben — deshalb liegen sie hier als Konstanten und nicht als Literale
 * in den Aufrufern.
 */
export const PRNG_STREAM = {
  /** Kampfverlauf: Damage-Range, Crit, Multi Hit, Splash, Counter, Evasion, Block. */
  combat: 'combat',
  /** Einmaliges Auswürfeln der Gegner-Initiative zu Kampfbeginn. */
  init: 'init',
  /** Drops eines Floors. */
  loot: 'loot',
} as const;

export type PrngStream = (typeof PRNG_STREAM)[keyof typeof PRNG_STREAM];

/**
 * Mischt Strings und Zahlen zu einem uint32-Seed (xmur3).
 * Basis der Seed-Hierarchie saveSeed → runSeed → floorSeed → Strom (docs/spec/SIMULATION.md#4-seeds-und-zufalls-ströme).
 */
export function deriveSeed(parentSeed: number, ...parts: (string | number)[]): number {
  let h = parentSeed >>> 0;

  for (const part of parts) {
    const text = String(part);
    for (let i = 0; i < text.length; i += 1) {
      h = Math.imul(h ^ text.charCodeAt(i), 0x5bd1e995);
      h = (h << 13) | (h >>> 19);
    }
    // Trennzeichen, damit ('ab', 'c') und ('a', 'bc') verschiedene Seeds ergeben.
    h = Math.imul(h ^ 0x1f, 0x5bd1e995);
  }

  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return h >>> 0;
}

/** Erzeugt einen abgeleiteten PRNG für einen benannten Strom (docs/spec/SIMULATION.md#4-seeds-und-zufalls-ströme). */
export function derivePrng(parentSeed: number, ...parts: (string | number)[]): ResumablePrng {
  return createPrng(deriveSeed(parentSeed, ...parts));
}

export function createPrng(seed: number): ResumablePrng {
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
    state: () => state >>> 0,
  };
}

/**
 * Nimmt eine Sequenz an einem festgehaltenen Zustand wieder auf. Mulberry32 trägt seinen
 * gesamten Zustand in einer uint32-Zahl — `createPrng` startet damit an genau dieser Stelle,
 * unabhängig davon, wie viele Züge davor lagen.
 *
 * Das gelieferte `seed` ist der **Fortsetzungspunkt**, nicht der ursprüngliche Strom-Seed; für
 * Bug-Reports zählt der Floor-Seed (docs/spec/SIMULATION.md#4-seeds-und-zufalls-ströme).
 */
export function resumePrng(state: number): ResumablePrng {
  return createPrng(state);
}
