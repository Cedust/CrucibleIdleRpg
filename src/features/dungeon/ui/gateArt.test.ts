import { describe, expect, it } from 'vitest';
import { ACT_1_DUNGEON_IDS } from '@/game/encounters/act1';
import { GATE_ART_SRC, gateVariantFor } from './gateArt';

describe('gateArt', () => {
  it('maps only A1-D5 to the boss gate', () => {
    expect(ACT_1_DUNGEON_IDS.map((dungeonId) => gateVariantFor(dungeonId))).toEqual([
      'normal',
      'normal',
      'normal',
      'normal',
      'boss',
    ]);
  });

  it('points every gate variant and state to a distinct asset', () => {
    const sources = [
      GATE_ART_SRC.normal.open,
      GATE_ART_SRC.normal.locked,
      GATE_ART_SRC.boss.open,
      GATE_ART_SRC.boss.locked,
    ];
    expect(new Set(sources).size).toBe(sources.length);
    for (const source of sources) {
      expect(source).toMatch(/^\/assets\/gates\/gate-[a-z-]+\.png$/);
    }
  });
});
