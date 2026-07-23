import type { EnemyDefinition, EnemyId } from '@/game/types';

/** Beispiel-Gegner. */
export const ENEMIES: Record<EnemyId, EnemyDefinition> = {
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    baseStats: { maxHp: 60, attack: 10, defense: 4, speed: 12 },
    abilities: ['strike'],
  },
};
