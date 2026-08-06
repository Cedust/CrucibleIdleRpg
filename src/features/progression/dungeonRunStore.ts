import { create } from 'zustand';
import { useCombatStore, type PlaybackSpeed } from '@/features/combat/combatStore';
import { createDungeonEntryCombat, createNextDungeonCombat } from '@/features/combat/dungeonCombat';
import { createPlaceholderFloorReward } from '@/game/rewards/floorRewards';
import { resolveAct1Encounter, type Act1DungeonId } from '@/game/encounters/act1';
import { saveStore } from '@/features/save/saveStore';
import { useNavigationStore } from '@/features/shell/navigationStore';

export type DungeonRunMode = 'selection' | 'starting' | 'run';

interface DungeonRunState {
  mode: DungeonRunMode;
  activeDungeonId: Act1DungeonId | null;
  startError: string | null;
  completionError: string | null;
  startRun: (dungeonId: Act1DungeonId) => Promise<boolean>;
  startNextFloor: () => boolean;
  setRunPlaybackSpeed: (speed: PlaybackSpeed) => Promise<boolean>;
  leaveRun: () => void;
  completeRun: () => Promise<boolean>;
  resetForReload: () => void;
}

/** Runtime lifecycle for the isolated dungeon screen; it is deliberately never saved. */
export const useDungeonRunStore = create<DungeonRunState>((set, get) => ({
  mode: 'selection',
  activeDungeonId: null,
  startError: null,
  completionError: null,

  startRun: async (dungeonId) => {
    if (get().mode !== 'selection') {
      return false;
    }

    const currentSave = saveStore.getState().data;
    if (currentSave === null || !currentSave.unlockedDungeonIds.includes(dungeonId)) {
      set({ startError: 'This dungeon is not available.' });
      return false;
    }

    set({ mode: 'starting', startError: null, completionError: null });
    try {
      const save = await saveStore.getState().beginRun();
      const combat = createDungeonEntryCombat(save, dungeonId);
      useCombatStore
        .getState()
        .setPlaybackSpeed(save.completedDungeons[dungeonId] ? save.playbackSpeed : 1);
      useCombatStore.getState().startCombat(combat, undefined, async () => {
        const commit = await saveStore
          .getState()
          .commitVictory(createPlaceholderFloorReward(combat.floorId));
        return commit.reward;
      });
      set({ mode: 'run', activeDungeonId: dungeonId, completionError: null });
      return true;
    } catch {
      set({ mode: 'selection', activeDungeonId: null, startError: 'Unable to start dungeon run.' });
      return false;
    }
  },

  startNextFloor: () => {
    const run = get();
    const combat = useCombatStore.getState();
    const save = saveStore.getState().data;
    if (
      run.mode !== 'run' ||
      run.activeDungeonId === null ||
      combat.combat === null ||
      combat.outcome !== 'victory' ||
      combat.completionStatus !== 'saved' ||
      save === null
    ) {
      return false;
    }

    const encounter = resolveAct1Encounter(combat.combat.floorId);
    if (encounter.dungeonId !== run.activeDungeonId || encounter.floorNumber === 20) {
      return false;
    }

    const nextCombat = createNextDungeonCombat(save, combat.combat);
    useCombatStore.getState().startCombat(nextCombat, undefined, async () => {
      const commit = await saveStore
        .getState()
        .commitVictory(createPlaceholderFloorReward(nextCombat.floorId));
      return commit.reward;
    });
    return true;
  },

  setRunPlaybackSpeed: async (speed) => {
    const run = get();
    const save = saveStore.getState().data;
    if (
      run.mode !== 'run' ||
      run.activeDungeonId === null ||
      save === null ||
      (speed === 2 && !save.completedDungeons[run.activeDungeonId])
    ) {
      return false;
    }

    try {
      await saveStore.getState().setPlaybackSpeed(speed);
      useCombatStore.getState().setPlaybackSpeed(speed);
      return true;
    } catch {
      return false;
    }
  },

  leaveRun: () => {
    useCombatStore.getState().clearCombat();
    useNavigationStore.getState().setActiveView('dungeons');
    set({ mode: 'selection', activeDungeonId: null, startError: null, completionError: null });
  },

  completeRun: async () => {
    const run = get();
    const combat = useCombatStore.getState();
    const encounter = combat.combat === null ? null : resolveAct1Encounter(combat.combat.floorId);
    if (
      run.mode !== 'run' ||
      run.activeDungeonId === null ||
      combat.combat === null ||
      combat.outcome !== 'victory' ||
      combat.completionStatus !== 'saved' ||
      encounter === null ||
      encounter.dungeonId !== run.activeDungeonId ||
      encounter.floorNumber !== 20
    ) {
      return false;
    }

    try {
      await saveStore.getState().completeDungeon(run.activeDungeonId);
      useCombatStore.getState().clearCombat();
      useNavigationStore.getState().setActiveView('dungeons');
      set({ mode: 'selection', activeDungeonId: null, startError: null, completionError: null });
      return true;
    } catch {
      set({ completionError: 'Unable to complete dungeon. Retry to save completion.' });
      return false;
    }
  },

  resetForReload: () => {
    set({ mode: 'selection', activeDungeonId: null, startError: null, completionError: null });
  },
}));
