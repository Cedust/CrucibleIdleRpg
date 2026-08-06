import { describe, expect, it } from 'vitest';
import { createDefaultSave } from '@/features/save/saveSchema';
import { commitFloorVictory, crystalRewardForFirstVictory } from './rewards';

const M1_REWARD = {
  floorId: 'A1-D1-01',
  gold: 10,
  characterXp: { korvin: 5, rhaya: 5, quinn: 5 },
} as const;

describe('commitFloorVictory', () => {
  it('committet Gold, Charakter-XP und Crystals des Erstsiegs atomar', () => {
    const before = createDefaultSave(1);

    const result = commitFloorVictory(before, M1_REWARD);

    expect(result.reward).toEqual({ gold: 10, xp: 15, crystals: 1 });
    expect(result.save.currencies).toEqual({ gold: 10, crystals: 1 });
    expect(result.save.characters.korvin).toMatchObject({
      level: 1,
      xp: 5,
      freeAttributePoints: 1,
      freeSkillPoints: 1,
    });
    expect(result.save.firstVictories).toEqual(['A1-D1-01']);
    expect(before).toEqual(createDefaultSave(1));
  });

  it('vergibt beim Farmen weiter XP und Gold, aber keine zweiten Crystals', () => {
    const first = commitFloorVictory(createDefaultSave(1), M1_REWARD);
    const second = commitFloorVictory(first.save, M1_REWARD);

    expect(second.reward).toEqual({ gold: 10, xp: 15, crystals: 0 });
    expect(second.save.currencies).toEqual({ gold: 20, crystals: 1 });
    expect(second.save.characters.korvin.xp).toBe(10);
    expect(second.save.firstVictories).toEqual(['A1-D1-01']);
  });
});

describe('crystalRewardForFirstVictory', () => {
  it('unterscheidet normale, Elite- und Boss-Floors strukturell', () => {
    expect(crystalRewardForFirstVictory('A1-D1-19')).toBe(1);
    expect(crystalRewardForFirstVictory('A1-D1-20')).toBe(3);
    expect(crystalRewardForFirstVictory('A1-D5-20')).toBe(10);
  });
});
