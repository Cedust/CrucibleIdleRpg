import { createStore, useStore } from 'zustand';
import type { RewardCommit } from '@/features/dungeon/rewards';
import { commitFloorVictory } from '@/features/dungeon/rewards';
import { respecAttributes, spendAttributePoint } from '@/game/rewards/xpRewards';
import type { AttributePoints, CharacterId, FloorRewardDefinition } from '@/game/types';
import {
  purchaseMasteryNode,
  respecMasteryDiscipline,
  type DisciplineId,
} from '@/game/weaponMastery/mastery';
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

export interface SaveStoreOptions {
  /** Erlaubt dem Kompositionspunkt, Mastery-Respec situativ zu sperren (z. B. im Dungeon-Run). */
  canRespecMastery?: () => boolean;
}

/**
 * Der Plan einer schreibenden Action: `next === null` lehnt die Action ab, ohne zu speichern;
 * `result` ist in beiden Fällen ihr Rückgabewert.
 */
interface WritePlan<T> {
  next: SaveData | null;
  result: T;
}

export function createSaveStore(service: SaveService, options: SaveStoreOptions = {}) {
  const canRespecMastery = options.canRespecMastery ?? (() => true);
  let hydration: Promise<SaveData> | null = null;
  let pendingWrite: Promise<unknown> = Promise.resolve();

  return createStore<SaveStoreState>((set, get) => {
    /**
     * Serialisierter Schreibpfad aller Actions: Der Folgezustand wird erst berechnet, wenn
     * jeder vorherige Schreibvorgang abgeschlossen ist — überlappende Actions bauen damit
     * aufeinander auf, statt sich gegenseitig zu überschreiben (Lost Update). Der Helper
     * trägt die Status-Übergänge `saving` → `ready` und den Fehlerpfad.
     */
    const persist = <T>(plan: (current: SaveData) => WritePlan<T>): Promise<T> => {
      const write = async (): Promise<T> => {
        const planned = plan(requiredSave(get().data));
        if (planned.next === null) {
          return planned.result;
        }

        set({ status: 'saving' });
        try {
          await service.save(planned.next);
          set({ data: planned.next, status: 'ready' });
          return planned.result;
        } catch (error) {
          set({ status: 'error' });
          throw error;
        }
      };

      const queued = pendingWrite.then(write, write);
      pendingWrite = queued.then(
        () => undefined,
        () => undefined,
      );
      return queued;
    };

    return {
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

      beginRun: () =>
        persist((current) => {
          const next: SaveData = { ...current, runCounter: current.runCounter + 1 };
          return { next, result: next };
        }),

      commitVictory: (reward) =>
        persist((current) => {
          const commit = commitFloorVictory(current, reward);
          return { next: commit.save, result: commit };
        }),

      spendAttributePoint: (characterId, attribute) =>
        persist((current) => {
          const progression = spendAttributePoint(current.characters[characterId], attribute);
          if (progression === null) {
            return { next: null, result: false };
          }

          return {
            next: {
              ...current,
              characters: { ...current.characters, [characterId]: progression },
            },
            result: true,
          };
        }),

      respecAttributes: (characterId, goldCost) =>
        persist((current) => {
          const respec = respecAttributes(
            current.characters[characterId],
            current.currencies.gold,
            goldCost,
          );
          if (respec === null) {
            return { next: null, result: false };
          }

          return {
            next: {
              ...current,
              characters: { ...current.characters, [characterId]: respec.progression },
              currencies: { ...current.currencies, gold: respec.gold },
            },
            result: true,
          };
        }),

      buyMasteryNode: (characterId, nodeId) =>
        persist((current) => {
          const progression = purchaseMasteryNode(
            characterId,
            current.characters[characterId],
            nodeId,
          );
          if (progression === null) {
            return { next: null, result: false };
          }

          return {
            next: {
              ...current,
              characters: { ...current.characters, [characterId]: progression },
            },
            result: true,
          };
        }),

      respecDiscipline: (characterId, discipline) =>
        persist((current) => {
          if (!canRespecMastery()) {
            return { next: null, result: false };
          }

          const respec = respecMasteryDiscipline(
            current.characters[characterId],
            discipline,
            current.currencies.gold,
          );
          if (respec === null) {
            return { next: null, result: false };
          }

          return {
            next: {
              ...current,
              currencies: { ...current.currencies, gold: respec.gold },
              characters: { ...current.characters, [characterId]: respec.progression },
            },
            result: true,
          };
        }),

      completeDungeon: (dungeonId) =>
        persist((current) => {
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
          return { next, result: next };
        }),

      setPlaybackSpeed: (playbackSpeed) =>
        persist((current) => ({
          next: { ...current, playbackSpeed },
          result: undefined,
        })),
    };
  });
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

/**
 * Situativer Respec-Guard des Browser-Stores. Das Dungeon-Feature registriert beim Laden
 * seine Run-Sperre (dungeonRunStore.ts); ohne geladenes Dungeon-Feature existiert kein Run,
 * der Default erlaubt deshalb.
 */
let masteryRespecGuard: () => boolean = () => true;

export function registerMasteryRespecGuard(guard: () => boolean): void {
  masteryRespecGuard = guard;
}

const browserSaveService = createSaveService(createLocalStorageSavePort(), () =>
  createDefaultSave(createSaveSeed()),
);

export const saveStore = createSaveStore(browserSaveService, {
  canRespecMastery: () => masteryRespecGuard(),
});

export function useSaveStore<T>(selector: (state: SaveStoreState) => T): T {
  return useStore(saveStore, selector);
}
