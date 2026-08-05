import { create } from 'zustand';
import { useCombatStore } from '@/features/combat/combatStore';
import { createDungeonEntryCombat } from '@/features/combat/dungeonCombat';
import { createPlaceholderFloorReward } from '@/game/rewards/floorRewards';
import type { Act1DungeonId } from '@/game/encounters/act1';
import { saveStore } from '@/features/save/saveStore';
import { useNavigationStore } from '@/features/shell/navigationStore';

export type DungeonRunMode = 'selection' | 'starting' | 'run';

interface DungeonRunState {
  mode: DungeonRunMode;
  activeDungeonId: Act1DungeonId | null;
  startError: string | null;
  startRun: (dungeonId: Act1DungeonId) => Promise<boolean>;
  leaveRun: () => void;
  completeRun: () => void;
  resetForReload: () => void;
}

/** Runtime lifecycle for the isolated dungeon screen; it is deliberately never saved. */
export const useDungeonRunStore = create<DungeonRunState>((set, get) => ({
  mode: 'selection',
  activeDungeonId: null,
  startError: null,

  startRun: async (dungeonId) => {
    if (get().mode !== 'selection') {
      return false;
    }

    const currentSave = saveStore.getState().data;
    if (currentSave === null || !currentSave.unlockedDungeonIds.includes(dungeonId)) {
      set({ startError: 'This dungeon is not available.' });
      return false;
    }

    set({ mode: 'starting', startError: null });
    try {
      const save = await saveStore.getState().beginRun();
      const combat = createDungeonEntryCombat(save, dungeonId);
      useCombatStore.getState().startCombat(combat, undefined, async () => {
        const commit = await saveStore
          .getState()
          .commitVictory(createPlaceholderFloorReward(combat.floorId));
        return commit.reward;
      });
      set({ mode: 'run', activeDungeonId: dungeonId });
      return true;
    } catch {
      set({ mode: 'selection', activeDungeonId: null, startError: 'Unable to start dungeon run.' });
      return false;
    }
  },

  leaveRun: () => {
    useCombatStore.getState().clearCombat();
    useNavigationStore.getState().setActiveView('dungeons');
    set({ mode: 'selection', activeDungeonId: null, startError: null });
  },

  completeRun: () => {
    useCombatStore.getState().clearCombat();
    useNavigationStore.getState().setActiveView('dungeons');
    set({ mode: 'selection', activeDungeonId: null, startError: null });
  },

  resetForReload: () => {
    set({ mode: 'selection', activeDungeonId: null, startError: null });
  },
}));
