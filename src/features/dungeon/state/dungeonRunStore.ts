import { create } from 'zustand';
import type { CombatState } from '@/features/combat/engine/combatState';
import { crucibleCombatContext } from '@/features/combat/engine/crucibleCombat';
import { useCombatStore, type PlaybackSpeed } from '@/features/combat/state/combatStore';
import {
  createDungeonEntryCombat,
  createNextDungeonCombat,
} from '@/features/dungeon/dungeonCombat';
import type { RewardSummary } from '@/features/dungeon/rewards';
import { deriveUnlockedDungeonIds } from '@/game/crucible/crucible';
import { isRuneGrimoireUnlocked } from '@/game/runes/runes';
import { createFloorReward } from '@/game/rewards/floorRewards';
import { isFinalAct1Floor, resolveAct1Encounter, type Act1DungeonId } from '@/game/encounters/act1';
import { registerOptimizationGuard, saveStore } from '@/features/save/saveStore';
import { useNavigationStore } from '@/app/navigationStore';

export type DungeonRunMode = 'selection' | 'starting' | 'run';

/** Gemeinsamer Sieg-Commit jedes Floors: Reward erzeugen, persistieren, Summary melden. */
async function commitFloorReward(result: CombatState): Promise<RewardSummary> {
  const save = saveStore.getState().data;
  const commit = await saveStore.getState().commitVictory(
    createFloorReward({
      floorId: result.floorId,
      floorIndex: result.floorIndex,
      floorSeed: result.floorSeed,
      classification: resolveAct1Encounter(result.floorId).classification,
      enemyCount: result.enemies.length,
      sigils: save?.sigils ?? {},
      runeGrimoireUnlocked: save !== null && isRuneGrimoireUnlocked(save.crucible),
      effectiveDamage: result.effectiveDamage,
    }),
  );
  return commit.reward;
}

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

    // Die freigeschalteten Einstiege sind aus den Waystone-Rängen abgeleitet (PERSISTENCE §2.3).
    const currentSave = saveStore.getState().data;
    if (
      currentSave === null ||
      !deriveUnlockedDungeonIds(currentSave.crucible).includes(dungeonId)
    ) {
      set({ startError: 'This dungeon is not available.' });
      return false;
    }

    set({ mode: 'starting', startError: null, completionError: null });

    // Das `catch` deckt nur den Save-Schritt; ein Fehler im Kampfaufbau bliebe sichtbar.
    let save;
    try {
      save = await saveStore.getState().beginRun();
    } catch {
      set({ mode: 'selection', activeDungeonId: null, startError: 'Unable to start dungeon run.' });
      return false;
    }

    const combat = createDungeonEntryCombat(save, dungeonId);
    useCombatStore
      .getState()
      .setPlaybackSpeed(save.completedDungeons[dungeonId] ? save.playbackSpeed : 1);
    useCombatStore
      .getState()
      .startCombat(combat, crucibleCombatContext(save.crucible), commitFloorReward);
    set({ mode: 'run', activeDungeonId: dungeonId, completionError: null });
    return true;
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
    if (encounter.dungeonId !== run.activeDungeonId || isFinalAct1Floor(encounter)) {
      return false;
    }

    const nextCombat = createNextDungeonCombat(save, combat.combat);
    useCombatStore
      .getState()
      .startCombat(nextCombat, crucibleCombatContext(save.crucible), commitFloorReward);
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

    // Das `catch` deckt nur den Save-Schritt; die Laufzeit-Umschaltung wirft nicht.
    try {
      await saveStore.getState().setPlaybackSpeed(speed);
    } catch {
      return false;
    }

    useCombatStore.getState().setPlaybackSpeed(speed);
    return true;
  },

  leaveRun: () => {
    useCombatStore.getState().clearCombat();
    useNavigationStore.getState().setActiveView('dungeons');
    set({ mode: 'selection', activeDungeonId: null, startError: null, completionError: null });
  },

  completeRun: async () => {
    const run = get();
    const combat = useCombatStore.getState();
    if (
      run.mode !== 'run' ||
      run.activeDungeonId === null ||
      combat.combat === null ||
      combat.outcome !== 'victory' ||
      combat.completionStatus !== 'saved'
    ) {
      return false;
    }

    const encounter = resolveAct1Encounter(combat.combat.floorId);
    if (encounter.dungeonId !== run.activeDungeonId || !isFinalAct1Floor(encounter)) {
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

// Während eines laufenden Runs sind Respecs und der Crucible gesperrt (PROGRESSION §4); die
// Regel gehört zum Dungeon-Lifecycle und wird deshalb hier am Save-Store registriert.
registerOptimizationGuard(() => useDungeonRunStore.getState().mode !== 'run');

/**
 * Lifecycle-Reaktionen des Runs, als Store-Subscription statt View-Effekt (COMBAT-RUN):
 * Ein Wipe beendet den Run terminal; ein gespeicherter Floor-Sieg startet automatisch den
 * nächsten Floor — außer auf dem letzten Floor, dessen Abschluss manuell bleibt.
 */
useCombatStore.subscribe((combatState) => {
  const run = useDungeonRunStore.getState();
  if (run.mode !== 'run') {
    return;
  }

  if (combatState.outcome === 'wipe') {
    run.leaveRun();
    return;
  }

  if (
    combatState.outcome === 'victory' &&
    combatState.completionStatus === 'saved' &&
    combatState.combat !== null &&
    !isFinalAct1Floor(resolveAct1Encounter(combatState.combat.floorId))
  ) {
    run.startNextFloor();
  }
});
