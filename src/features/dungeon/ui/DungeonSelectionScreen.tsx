import { useState } from 'react';
import { deriveUnlockedDungeonIds } from '@/game/crucible/crucible';
import { ACT_1_ENCOUNTERS, type Act1DungeonId } from '@/game/encounters/act1';
import {
  ACT_1_DISPLAY_META,
  ACT_1_DUNGEON_DISPLAY_META,
  ACT_DISPLAY_META,
} from '@/game/encounters/actMeta';
import { useSaveStore } from '@/features/save/saveStore';
import { ScreenHeader } from '@/shared/ui/layout/ScreenHeader';
import { ScreenLayout } from '@/shared/ui/layout/ScreenLayout';
import { ActPanel } from './ActPanel';
import { DungeonSelector } from './DungeonSelector';
import { SelectedDungeonPanel } from './SelectedDungeonPanel';
import { useDungeonRunStore } from '@/features/dungeon/state/dungeonRunStore';

function dungeonProgress(dungeonId: Act1DungeonId, firstVictories: readonly string[]) {
  const masteredFloors = new Set(firstVictories);
  let masteredFloorCount = 0;
  let totalFloorCount = 0;

  for (const encounter of ACT_1_ENCOUNTERS) {
    if (encounter.dungeonId !== dungeonId) continue;
    totalFloorCount += 1;
    if (masteredFloors.has(encounter.id)) masteredFloorCount += 1;
  }

  return { masteredFloorCount, totalFloorCount };
}

/** Normal shell view for inspecting dungeons and starting an unlocked entrance. */
export function DungeonSelectionScreen() {
  // Die Einstiege folgen aus den Waystone-Rängen; gespeichert sind nur die Node-Ränge.
  const crucible = useSaveStore((state) => state.data?.crucible ?? null);
  const unlockedDungeonIds = crucible === null ? null : deriveUnlockedDungeonIds(crucible);
  const firstVictories = useSaveStore((state) => state.data?.firstVictories ?? null);
  const completedDungeons = useSaveStore((state) => state.data?.completedDungeons ?? null);
  const saveStatus = useSaveStore((state) => state.status);
  const mode = useDungeonRunStore((state) => state.mode);
  const startError = useDungeonRunStore((state) => state.startError);
  const startRun = useDungeonRunStore((state) => state.startRun);
  const [requestedDungeonId, setRequestedDungeonId] = useState<Act1DungeonId>('A1-D1');
  const selectedDungeonId = requestedDungeonId;
  const selectedDungeonUnlocked = unlockedDungeonIds?.includes(selectedDungeonId) ?? false;
  const selectedProgress =
    firstVictories === null ? null : dungeonProgress(selectedDungeonId, firstVictories);

  return (
    <ScreenLayout background="ashen-depths">
      <section className="mx-auto w-full max-w-page-narrow space-y-6">
        <ScreenHeader
          title="Dungeons"
          intro="Descend into the ancient depths, where the ashes of a fallen kingdom conceal a forgotten world."
        />

        {unlockedDungeonIds === null || completedDungeons === null || selectedProgress === null ? (
          <p aria-live="polite" className="text-text-muted">
            {saveStatus === 'error' ? 'Saved progress unavailable.' : 'Loading saved progress...'}
          </p>
        ) : (
          <div className="flex flex-col gap-6 @min-[42rem]:flex-row">
            <ul
              aria-label="Acts"
              className="flex w-full flex-col gap-3 @min-[42rem]:w-64 @min-[42rem]:shrink-0 @min-[42rem]:justify-center"
            >
              {ACT_DISPLAY_META.map((act) => (
                <ActPanel key={act.id} act={act} />
              ))}
            </ul>
            <section aria-label={`${ACT_1_DISPLAY_META.label} dungeons`} className="min-w-0 flex-1">
              <div className="space-y-5">
                <DungeonSelector
                  unlockedDungeonIds={unlockedDungeonIds}
                  completedDungeons={completedDungeons}
                  selectedDungeonId={selectedDungeonId}
                  onSelect={setRequestedDungeonId}
                />
                <SelectedDungeonPanel
                  actLabel={ACT_1_DISPLAY_META.label}
                  actName={ACT_1_DISPLAY_META.name}
                  dungeonLabel={ACT_1_DUNGEON_DISPLAY_META[selectedDungeonId].label}
                  dungeonName={ACT_1_DUNGEON_DISPLAY_META[selectedDungeonId].name}
                  description={ACT_1_DUNGEON_DISPLAY_META[selectedDungeonId].description}
                  locked={!selectedDungeonUnlocked}
                  masteredFloorCount={selectedProgress.masteredFloorCount}
                  totalFloorCount={selectedProgress.totalFloorCount}
                  disabled={
                    !selectedDungeonUnlocked || mode === 'starting' || saveStatus !== 'ready'
                  }
                  isStarting={mode === 'starting'}
                  startError={startError}
                  onEnter={() => void startRun(selectedDungeonId)}
                />
              </div>
            </section>
          </div>
        )}
      </section>
    </ScreenLayout>
  );
}
