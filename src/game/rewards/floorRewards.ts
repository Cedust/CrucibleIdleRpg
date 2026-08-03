import type { FloorRewardDefinition } from '@/game/types';

/**
 * PLATZHALTER — XP-Verteilung und Gold-Kurve sind noch offen:
 * docs/backlog/OPEN_ISSUES.md#ökonomie. Der individuelle Rest ist für den M1-Floor null;
 * alle drei Charaktere erhalten denselben Basisanteil.
 */
export const M1_FLOOR_REWARD: FloorRewardDefinition = {
  floorId: 'A1-D1-01',
  gold: 10,
  characterXp: { korvin: 5, rhaya: 5, quinn: 5 },
};
