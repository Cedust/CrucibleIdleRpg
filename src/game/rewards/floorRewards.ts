import type { CharacterId, FloorRewardDefinition } from '@/game/types';
import { distributeFloorXp } from './xpRewards';

/**
 * Die Gold-Kurve bleibt bis zum Economy-Pass bewusst konstant. XP stammen aus dem deklarativen
 * Progression-Content und dem Ergebnis des gerade gewonnenen Kampfs.
 */
export function createFloorReward(
  floorId: FloorRewardDefinition['floorId'],
  floorIndex: number,
  enemyCount: number,
  effectiveDamage: Readonly<Record<CharacterId, number>>,
): FloorRewardDefinition {
  return {
    floorId,
    gold: 10,
    characterXp: distributeFloorXp({ floorIndex, enemyCount, effectiveDamage }),
  };
}
