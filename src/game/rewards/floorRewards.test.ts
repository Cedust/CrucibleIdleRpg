import { describe, expect, it } from 'vitest';
import { createFloorReward, FLOOR_GOLD_REWARD } from './floorRewards';
import { lootStreamPrng, rollFloorLoot } from './lootRewards';
import { distributeFloorXp } from './xpRewards';

describe('createFloorReward', () => {
  it('verdrahtet floorId, Gold-Platzhalter, XP-Verteilung und Loot-Strom', () => {
    const effectiveDamage = { korvin: 20, rhaya: 10, quinn: 0 } as const;
    const input = {
      floorId: 'A1-D1-03',
      floorIndex: 2,
      floorSeed: 0xc0ffee,
      classification: 'normal',
      enemyCount: 4,
      effectiveDamage,
    } as const;

    const reward = createFloorReward(input);

    expect(reward.floorId).toBe('A1-D1-03');
    expect(reward.gold).toBe(FLOOR_GOLD_REWARD);
    expect(reward.characterXp).toEqual(
      distributeFloorXp({ floorIndex: 2, enemyCount: 4, effectiveDamage }),
    );
    expect(reward.loot).toEqual(
      rollFloorLoot(
        { classification: 'normal', floorIndex: 2, enemyCount: 4 },
        lootStreamPrng(0xc0ffee),
      ),
    );
  });

  it('wiederholt denselben Loot für denselben Floor-Seed', () => {
    const input = {
      floorId: 'A1-D1-20',
      floorIndex: 19,
      floorSeed: 42,
      classification: 'elite',
      enemyCount: 6,
      effectiveDamage: { korvin: 1, rhaya: 1, quinn: 1 },
    } as const;

    expect(createFloorReward(input)).toEqual(createFloorReward(input));
  });
});
