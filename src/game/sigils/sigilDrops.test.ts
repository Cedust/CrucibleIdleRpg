import { describe, expect, it } from 'vitest';
import type { Prng } from '@/shared/utils/prng';
import { applySigilDrop, rollSigilDrop } from './sigilDrops';
import type { SigilCodex } from './types';

function prng({ chance = true, next = 0 }: { chance?: boolean; next?: number } = {}): Prng & {
  chanceCalls: number;
  nextCalls: number;
} {
  let chanceCalls = 0;
  let nextCalls = 0;
  return {
    seed: 0,
    next: () => {
      nextCalls += 1;
      return next;
    },
    nextInt: (min) => min,
    chance: () => {
      chanceCalls += 1;
      return chance;
    },
    get chanceCalls() {
      return chanceCalls;
    },
    get nextCalls() {
      return nextCalls;
    },
  };
}

describe('rollSigilDrop', () => {
  it('writes a first single-source victory at level 1 without an RNG roll', () => {
    const random = prng({ chance: false });

    expect(rollSigilDrop('A1-D1-20', {}, random)).toEqual({
      sigilId: 'sigil.tempered-edge',
      level: 1,
    });
    expect(random.chanceCalls).toBe(0);
  });

  it('uses the flat repeat chance and advances exactly one level on success', () => {
    const codex: SigilCodex = { 'sigil.tempered-edge': 3 };

    expect(rollSigilDrop('A1-D1-20', codex, prng({ chance: false }))).toBeNull();
    expect(rollSigilDrop('A1-D1-20', codex, prng())).toEqual({
      sigilId: 'sigil.tempered-edge',
      level: 4,
    });
  });

  it('exhausts a single source at level 5 without consuming another chance roll', () => {
    const random = prng();
    const fourthLevel: SigilCodex = { 'sigil.tempered-edge': 4 };

    expect(rollSigilDrop('A1-D1-20', fourthLevel, random)).toEqual({
      sigilId: 'sigil.tempered-edge',
      level: 5,
    });
    expect(random.chanceCalls).toBe(1);
    expect(rollSigilDrop('A1-D1-20', { 'sigil.tempered-edge': 5 }, random)).toBeNull();
    expect(random.chanceCalls).toBe(1);
  });

  it("guarantees Empress's Mandate for the first Act-3 boss victory without RNG", () => {
    const random = prng({ chance: false });

    expect(rollSigilDrop('A3-D5-20', {}, random)).toEqual({
      sigilId: 'sigil.empress-mandate',
      level: 1,
    });
    expect(random.chanceCalls).toBe(0);
  });

  it('rolls the Act-3 boss chance before a weighted choice and favors unknown Sigils', () => {
    const codex: SigilCodex = {
      'sigil.empress-mandate': 1,
      'sigil.empress-ferocity': 1,
      'sigil.empress-resilience': 1,
    };
    const random = prng({ next: 0.45 });

    expect(rollSigilDrop('A3-D5-20', codex, random)).toEqual({
      sigilId: 'sigil.empress-vigor',
      level: 1,
    });
    expect(random.chanceCalls).toBe(1);
    expect(random.nextCalls).toBe(1);
  });

  it('removes the Act-3 boss from its own selection once all four Sigils are level 5', () => {
    const random = prng();
    const codex: SigilCodex = {
      'sigil.empress-ferocity': 5,
      'sigil.empress-resilience': 5,
      'sigil.empress-vigor': 5,
      'sigil.empress-mandate': 5,
    };

    expect(rollSigilDrop('A3-D5-20', codex, random)).toBeNull();
    expect(random.chanceCalls).toBe(0);
  });
});

describe('applySigilDrop', () => {
  it('returns an immutable next Codex state and leaves a no-drop untouched', () => {
    const codex: SigilCodex = { 'sigil.tempered-edge': 1 };

    expect(applySigilDrop(codex, null)).toBe(codex);
    expect(applySigilDrop(codex, { sigilId: 'sigil.tempered-edge', level: 2 })).toEqual({
      'sigil.tempered-edge': 2,
    });
    expect(codex).toEqual({ 'sigil.tempered-edge': 1 });
  });
});
