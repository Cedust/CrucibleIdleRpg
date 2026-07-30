import type { EnemyDefinition, EnemyId } from '@/game/types';

/**
 * Gegner für Akt 1, Dungeon 1 (SPEC §4.1). Genau vier Stats plus Bulwark-Beitrag (SPEC §1.3).
 *
 * `attack` ist die **team-weite** Angriffsstärke `S` und wird auf die lebenden Charaktere
 * verteilt (SPEC §2.3) — die Werte sind also kein Schaden pro Charakter.
 *
 * Erstwurf; die Gegner-Kurven je Akt/Dungeon/Floor stehen offen in BALANCING.md §5.
 */
export const ENEMIES: Record<EnemyId, EnemyDefinition> = {
  ashenGhoul: {
    id: 'ashenGhoul',
    name: 'Ashen Ghoul',
    role: 'melee',
    health: 60,
    attack: 18,
    accuracy: 0.6,
    initiativeRange: { min: 6, max: 10 },
    bulwarkContribution: 0.1,
  },
  emberHound: {
    id: 'emberHound',
    name: 'Ember Hound',
    role: 'melee',
    health: 50,
    attack: 21,
    accuracy: 0.7,
    initiativeRange: { min: 11, max: 15 },
    bulwarkContribution: 0.1,
  },
  cinderWretch: {
    id: 'cinderWretch',
    name: 'Cinder Wretch',
    role: 'ranged',
    health: 45,
    attack: 24,
    accuracy: 0.65,
    initiativeRange: { min: 10, max: 16 },
    bulwarkContribution: 0,
  },
  slagBulwark: {
    id: 'slagBulwark',
    name: 'Slag Bulwark',
    role: 'tank',
    health: 140,
    attack: 15,
    accuracy: 0.55,
    initiativeRange: { min: 4, max: 7 },
    bulwarkContribution: 0.25,
  },
};
