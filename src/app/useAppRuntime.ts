import { useEffect } from 'react';
import { useCombatPlayback } from '@/features/combat/state/useCombatPlayback';
import { useCombatStore } from '@/features/combat/state/combatStore';
import { useDungeonRunStore } from '@/features/dungeon/state/dungeonRunStore';
import { useSaveStore } from '@/features/save/saveStore';

/** Initializes runtime-only app state when the top-level shell mounts. */
export function useAppRuntime() {
  // Der Controller lebt oberhalb des View-Switches: Navigation unterbricht den Kampf nicht.
  useCombatPlayback();
  const hydrateSave = useSaveStore((state) => state.hydrate);

  useEffect(() => {
    // Top-Level-Mount entspricht einem Reload: Laufzeitkampf verwerfen, Save neu laden.
    useCombatStore.getState().clearCombat();
    useDungeonRunStore.getState().resetForReload();
    void hydrateSave()
      .then((save) => {
        useCombatStore.getState().setPlaybackSpeed(save.playbackSpeed);
      })
      .catch(() => undefined);
  }, [hydrateSave]);
}
