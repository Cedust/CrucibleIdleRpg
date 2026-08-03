import { createStore, useStore } from 'zustand';
import type { RewardCommit } from '@/features/progression/rewards';
import { commitFloorVictory } from '@/features/progression/rewards';
import type { FloorRewardDefinition } from '@/game/types';
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

const browserSaveService = createSaveService(createLocalStorageSavePort(), () =>
  createDefaultSave(createSaveSeed()),
);

export const saveStore = createSaveStore(browserSaveService);

export function useSaveStore<T>(selector: (state: SaveStoreState) => T): T {
  return useStore(saveStore, selector);
}
