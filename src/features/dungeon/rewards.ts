import type { SaveData } from '@/features/save/saveSchema';
import { resolveAct1Encounter } from '@/game/encounters/act1';
import { gainExperience } from '@/game/rewards/xpRewards';
import type { EncounterClass, FloorId, FloorRewardDefinition } from '@/game/types';

export interface RewardSummary {
  gold: number;
  xp: number;
  crystals: number;
}

export interface RewardCommit {
  save: SaveData;
  reward: RewardSummary;
}

/** Crystal-Wert eines Erstsiegs je Encounter-Klasse (PROGRESSION §2). */
const FIRST_VICTORY_CRYSTALS: Readonly<Record<EncounterClass, number>> = {
  normal: 1,
  elite: 3,
  boss: 10,
};

/** Crystal-Wert eines Erstsiegs über die strukturierte Encounter-Klassifikation. */
export function crystalRewardForFirstVictory(floorId: FloorId): number {
  return FIRST_VICTORY_CRYSTALS[resolveAct1Encounter(floorId).classification];
}

/** Committet die Belohnung eines Floor-Siegs einschließlich aller daraus folgenden Level-Ups. */
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
          ...gainExperience(save.characters.korvin, input.characterXp.korvin),
        },
        rhaya: {
          ...gainExperience(save.characters.rhaya, input.characterXp.rhaya),
        },
        quinn: {
          ...gainExperience(save.characters.quinn, input.characterXp.quinn),
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
