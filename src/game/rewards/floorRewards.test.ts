import { describe, expect, it } from 'vitest';
import { createFloorReward, FLOOR_GOLD_REWARD } from './floorRewards';
import { distributeFloorXp } from './xpRewards';

describe('createFloorReward', () => {
  it('verdrahtet floorId, Gold-Platzhalter und XP-Verteilung', () => {
    const effectiveDamage = { korvin: 20, rhaya: 10, quinn: 0 } as const;

    const reward = createFloorReward('A1-D1-03', 2, 4, effectiveDamage);

    expect(reward.floorId).toBe('A1-D1-03');
    expect(reward.gold).toBe(FLOOR_GOLD_REWARD);
    expect(reward.characterXp).toEqual(
      distributeFloorXp({ floorIndex: 2, enemyCount: 4, effectiveDamage }),
    );
  });
});
