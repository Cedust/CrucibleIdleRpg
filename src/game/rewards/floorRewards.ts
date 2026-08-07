import type { CharacterId, FloorRewardDefinition } from '@/game/types';
import { distributeFloorXp } from './xpRewards';

/**
 * PLATZHALTER — Gold je Floor-Sieg, bis zum Economy-Pass bewusst konstant
 * (docs/backlog/OPEN_ISSUES.md#1-offene-balancing-fragen--tuning-notizen).
 */
export const FLOOR_GOLD_REWARD = 10;

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
    gold: FLOOR_GOLD_REWARD,
    characterXp: distributeFloorXp({ floorIndex, enemyCount, effectiveDamage }),
  };
}
