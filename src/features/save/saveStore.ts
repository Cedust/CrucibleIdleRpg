import { createStore, useStore } from 'zustand';
import type { RewardCommit } from '@/features/dungeon/rewards';
import { commitFloorVictory } from '@/features/dungeon/rewards';
import { respecAttributes, spendAttributePoint } from '@/game/rewards/xpRewards';
import type { AttributePoints, CharacterId, FloorRewardDefinition } from '@/game/types';
import {
  investedPoints,
  nodeById,
  purchaseFailure,
  respecCost,
  type DisciplineId,
} from '@/game/weaponMastery/mastery';
import { useDungeonRunStore } from '@/features/dungeon/state/dungeonRunStore';
import { ACT_1_DUNGEON_IDS, type Act1DungeonId } from '@/game/encounters/act1';
import { createLocalStorageSavePort } from '@/shared/ports/savePort';
import { createDefaultSave, createSaveSeed, type SaveData } from './saveSchema';
import { createSaveService, type SaveService } from './saveService';

export type SaveStatus = 'idle' | 'loading' | 'ready' | 'saving' | 'error';

export interface SaveStoreState {
  data: SaveData | null;
  status: SaveStatus;
  hydrate: () => Promise<SaveData>;
  beginRun: () => Promise<SaveData>;
  commitVictory: (reward: FloorRewardDefinition) => Promise<RewardCommit>;
  spendAttributePoint: (
    characterId: CharacterId,
    attribute: keyof AttributePoints,
  ) => Promise<boolean>;
  respecAttributes: (characterId: CharacterId, goldCost: number) => Promise<boolean>;
  buyMasteryNode: (characterId: CharacterId, nodeId: string) => Promise<boolean>;
  respecDiscipline: (characterId: CharacterId, discipline: DisciplineId) => Promise<boolean>;
  completeDungeon: (dungeonId: Act1DungeonId) => Promise<SaveData>;
  setPlaybackSpeed: (speed: SaveData['playbackSpeed']) => Promise<void>;
}

export function createSaveStore(service: SaveService) {
  let hydration: Promise<SaveData> | null = null;

  return createStore<SaveStoreState>((set, get) => ({
    data: null,
    status: 'idle',

    hydrate: () => {
      const loaded = get().data;
      if (loaded !== null) {
        return Promise.resolve(loaded);
      }

      if (hydration !== null) {
        return hydration;
      }

      set({ status: 'loading' });
      hydration = service
        .load()
        .then((data) => {
          set({ data, status: 'ready' });
          return data;
        })
        .catch((error: unknown) => {
          set({ status: 'error' });
          throw error;
        })
        .finally(() => {
          hydration = null;
        });

      return hydration;
    },

    beginRun: async () => {
      const current = requiredSave(get().data);
      const next: SaveData = { ...current, runCounter: current.runCounter + 1 };
      set({ status: 'saving' });

      try {
        await service.save(next);
        set({ data: next, status: 'ready' });
        return next;
      } catch (error) {
        set({ status: 'error' });
        throw error;
      }
    },

    commitVictory: async (reward) => {
      const current = requiredSave(get().data);
      const commit = commitFloorVictory(current, reward);
      set({ status: 'saving' });

      try {
        await service.save(commit.save);
        set({ data: commit.save, status: 'ready' });
        return commit;
      } catch (error) {
        set({ status: 'error' });
        throw error;
      }
    },

    spendAttributePoint: async (characterId, attribute) => {
      const current = requiredSave(get().data);
      const progression = spendAttributePoint(current.characters[characterId], attribute);
      if (progression === null) {
        return false;
      }
      const next: SaveData = {
        ...current,
        characters: { ...current.characters, [characterId]: progression },
      };
      set({ status: 'saving' });

      try {
        await service.save(next);
        set({ data: next, status: 'ready' });
        return true;
      } catch (error) {
        set({ status: 'error' });
        throw error;
      }
    },

    respecAttributes: async (characterId, goldCost) => {
      const current = requiredSave(get().data);
      const respec = respecAttributes(
        current.characters[characterId],
        current.currencies.gold,
        goldCost,
      );
      if (respec === null) {
        return false;
      }
      const next: SaveData = {
        ...current,
        characters: { ...current.characters, [characterId]: respec.progression },
        currencies: { ...current.currencies, gold: respec.gold },
      };
      set({ status: 'saving' });

      try {
        await service.save(next);
        set({ data: next, status: 'ready' });
        return true;
      } catch (error) {
        set({ status: 'error' });
        throw error;
      }
    },

    buyMasteryNode: async (characterId, nodeId) => {
      const current = requiredSave(get().data);
      const progression = current.characters[characterId];
      if (
        purchaseFailure(
          characterId,
          progression.level,
          progression.masteryRanks,
          progression.freeMasteryPoints,
          nodeId,
        ) !== null
      )
        return false;
      const node = nodeById(characterId, nodeId);
      if (node === undefined) return false;
      const next: SaveData = {
        ...current,
        characters: {
          ...current.characters,
          [characterId]: {
            ...progression,
            freeMasteryPoints: progression.freeMasteryPoints - 1,
            masteryRanks: {
              ...progression.masteryRanks,
              [nodeId]: (progression.masteryRanks[nodeId] ?? 0) + 1,
            },
          },
        },
      };
      set({ status: 'saving' });
      try {
        await service.save(next);
        set({ data: next, status: 'ready' });
        return true;
      } catch (error) {
        set({ status: 'error' });
        throw error;
      }
    },

    respecDiscipline: async (characterId, discipline) => {
      const current = requiredSave(get().data);
      if (useDungeonRunStore.getState().mode === 'run') return false;
      const progression = current.characters[characterId];
      const refunded = investedPoints(progression.masteryRanks, discipline);
      const cost = respecCost(refunded);
      if (refunded === 0 || current.currencies.gold < cost) return false;
      const masteryRanks = Object.fromEntries(
        Object.entries(progression.masteryRanks).filter(([id]) => !id.startsWith(`${discipline}.`)),
      );
      const next: SaveData = {
        ...current,
        currencies: { ...current.currencies, gold: current.currencies.gold - cost },
        characters: {
          ...current.characters,
          [characterId]: {
            ...progression,
            freeMasteryPoints: progression.freeMasteryPoints + refunded,
            masteryRanks,
          },
        },
      };
      set({ status: 'saving' });
      try {
        await service.save(next);
        set({ data: next, status: 'ready' });
        return true;
      } catch (error) {
        set({ status: 'error' });
        throw error;
      }
    },

    completeDungeon: async (dungeonId) => {
      const current = requiredSave(get().data);
      const nextDungeonId = nextDungeonIdAfter(dungeonId);
      const unlockedDungeonIds =
        nextDungeonId !== null && !current.unlockedDungeonIds.includes(nextDungeonId)
          ? [...current.unlockedDungeonIds, nextDungeonId]
          : current.unlockedDungeonIds;
      const next: SaveData = {
        ...current,
        unlockedDungeonIds,
        completedDungeons: { ...current.completedDungeons, [dungeonId]: true },
      };
      set({ status: 'saving' });

      try {
        await service.save(next);
        set({ data: next, status: 'ready' });
        return next;
      } catch (error) {
        set({ status: 'error' });
        throw error;
      }
    },

    setPlaybackSpeed: async (playbackSpeed) => {
      const current = requiredSave(get().data);
      const next: SaveData = { ...current, playbackSpeed };
      set({ status: 'saving' });

      try {
        await service.save(next);
        set({ data: next, status: 'ready' });
      } catch (error) {
        set({ status: 'error' });
        throw error;
      }
    },
  }));
}

function requiredSave(data: SaveData | null): SaveData {
  if (data === null) {
    throw new Error('Speicherstand wurde noch nicht geladen.');
  }

  return data;
}

function nextDungeonIdAfter(dungeonId: Act1DungeonId): Act1DungeonId | null {
  const index = ACT_1_DUNGEON_IDS.indexOf(dungeonId);
  return ACT_1_DUNGEON_IDS[index + 1] ?? null;
}

const browserSaveService = createSaveService(createLocalStorageSavePort(), () =>
  createDefaultSave(createSaveSeed()),
);

export const saveStore = createSaveStore(browserSaveService);

export function useSaveStore<T>(selector: (state: SaveStoreState) => T): T {
  return useStore(saveStore, selector);
}
