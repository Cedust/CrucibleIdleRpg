import { describe, expect, it } from 'vitest';
import { createDefaultSave } from '@/features/save/saveSchema';
import { commitFloorVictory, formatLootGains, relicShardRewardForFirstVictory } from './rewards';

const M1_REWARD = {
  floorId: 'A1-D1-01',
  gold: 10,
  characterXp: { korvin: 5, rhaya: 5, quinn: 5 },
  loot: {
    gems: { amber: 2, ruby: 0, sapphire: 1, emerald: 0, diamond: 0 },
    cinder: 1,
    sigil: null,
  },
} as const;

describe('commitFloorVictory', () => {
  it('committet Gold, Charakter-XP, Relic Shards und Loot des Erstsiegs atomar', () => {
    const before = createDefaultSave(1);

    const result = commitFloorVictory(before, M1_REWARD);

    expect(result.reward).toEqual({
      gold: 10,
      xp: 15,
      relicShards: 1,
      loot: M1_REWARD.loot,
    });
    expect(result.save.currencies).toEqual({ gold: 10, relicShards: 1, cinder: 1, runewords: 0 });
    expect(result.save.gems).toEqual({ amber: 2, ruby: 0, sapphire: 1, emerald: 0, diamond: 0 });
    expect(result.save.characters.korvin).toMatchObject({
      level: 1,
      xp: 5,
      freeAttributePoints: 1,
      freeMasteryPoints: 1,
    });
    expect(result.save.firstVictories).toEqual(['A1-D1-01']);
    expect(before).toEqual(createDefaultSave(1));
  });

  it('vergibt beim Farmen weiter XP, Gold und Loot, aber keine zweiten Relic Shards', () => {
    const first = commitFloorVictory(createDefaultSave(1), M1_REWARD);
    const second = commitFloorVictory(first.save, M1_REWARD);

    expect(second.reward).toEqual({
      gold: 10,
      xp: 15,
      relicShards: 0,
      loot: M1_REWARD.loot,
    });
    expect(second.save.currencies).toEqual({ gold: 20, relicShards: 1, cinder: 2, runewords: 0 });
    expect(second.save.gems).toEqual({ amber: 4, ruby: 0, sapphire: 2, emerald: 0, diamond: 0 });
    expect(second.save.characters.korvin.xp).toBe(10);
    expect(second.save.firstVictories).toEqual(['A1-D1-01']);
  });

  it('committet einen Sigil-Drop atomar in den Codex und nennt ihn in der Belohnung', () => {
    const reward = {
      ...M1_REWARD,
      floorId: 'A1-D1-20',
      loot: { ...M1_REWARD.loot, sigil: { sigilId: 'sigil.tempered-edge', level: 1 } },
    } as const;

    const result = commitFloorVictory(createDefaultSave(1), reward);

    expect(result.save.sigils).toEqual({ 'sigil.tempered-edge': 1 });
    expect(formatLootGains(result.reward.loot)).toContain('Sigil of Tempered Edge — Level 1');
  });
});

describe('relicShardRewardForFirstVictory', () => {
  it('unterscheidet normale, Elite- und Boss-Floors strukturell', () => {
    expect(relicShardRewardForFirstVictory('A1-D1-19')).toBe(1);
    expect(relicShardRewardForFirstVictory('A1-D1-20')).toBe(3);
    expect(relicShardRewardForFirstVictory('A1-D5-20')).toBe(10);
  });
});
