import type { SaveData } from '@/features/save/saveSchema';
import type { FloorId, FloorRewardDefinition } from '@/game/types';

export interface RewardSummary {
  gold: number;
  xp: number;
  crystals: number;
}

export interface RewardCommit {
  save: SaveData;
  reward: RewardSummary;
}

/** Crystal-Wert eines Erstsiegs: normal 1, Elite 3, Akt-Boss 10 (PROGRESSION §2). */
export function crystalRewardForFirstVictory(floorId: FloorId): number {
  const match = /^A\d+-D(\d+)-(\d{2})$/.exec(floorId);
  const dungeon = match?.[1];
  const floor = match?.[2];

  if (dungeon === undefined || floor === undefined) {
    throw new Error(`Ungültige Floor-ID: ${floorId}`);
  }

  if (floor !== '20') {
    return 1;
  }

  return dungeon === '5' ? 10 : 3;
}

/** Committet die Belohnung eines Floor-Siegs unveränderlich in Save v1. */
export function commitFloorVictory(save: SaveData, input: FloorRewardDefinition): RewardCommit {
  const isFirstVictory = !save.firstVictories.includes(input.floorId);
  const crystals = isFirstVictory ? crystalRewardForFirstVictory(input.floorId) : 0;
  const xp = Object.values(input.characterXp).reduce((total, value) => total + value, 0);

  return {
    reward: { gold: input.gold, xp, crystals },
    save: {
      ...save,
      characters: {
        korvin: {
          ...save.characters.korvin,
          xp: save.characters.korvin.xp + input.characterXp.korvin,
        },
        rhaya: {
          ...save.characters.rhaya,
          xp: save.characters.rhaya.xp + input.characterXp.rhaya,
        },
        quinn: {
          ...save.characters.quinn,
          xp: save.characters.quinn.xp + input.characterXp.quinn,
        },
      },
      currencies: {
        gold: save.currencies.gold + input.gold,
        crystals: save.currencies.crystals + crystals,
      },
      firstVictories: isFirstVictory
        ? [...save.firstVictories, input.floorId]
        : save.firstVictories,
    },
  };
}
