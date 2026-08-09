import { useState } from 'react';
import { deriveUnlockedDungeonIds } from '@/game/crucible/crucible';
import { type Act1DungeonId } from '@/game/encounters/act1';
import { ACT_1_DISPLAY_META, ACT_DISPLAY_META } from '@/game/encounters/actMeta';
import { useSaveStore } from '@/features/save/saveStore';
import { Button } from '@/shared/ui/Button';
import { Panel } from '@/shared/ui/Panel';
import { ScreenLayout } from '@/shared/ui/ScreenLayout';
import { ActPanel } from './ActPanel';
import { DungeonSelector } from './DungeonSelector';
import { useDungeonRunStore } from '@/features/dungeon/state/dungeonRunStore';

/** Normal shell view for selecting an unlocked dungeon entrance. */
export function DungeonSelectionScreen() {
  // Die Einstiege folgen aus den Waystone-Rängen; gespeichert sind nur die Node-Ränge.
  const crucible = useSaveStore((state) => state.data?.crucible ?? null);
  const unlockedDungeonIds = crucible === null ? null : deriveUnlockedDungeonIds(crucible);
  const saveStatus = useSaveStore((state) => state.status);
  const mode = useDungeonRunStore((state) => state.mode);
  const startError = useDungeonRunStore((state) => state.startError);
  const startRun = useDungeonRunStore((state) => state.startRun);
  const [requestedDungeonId, setRequestedDungeonId] = useState<Act1DungeonId>('A1-D1');
  const selectedDungeonId = unlockedDungeonIds?.includes(requestedDungeonId)
    ? requestedDungeonId
    : (unlockedDungeonIds?.[0] ?? 'A1-D1');

  return (
    <ScreenLayout background="ashen-depths" className="min-h-full">
      <section className="mx-auto max-w-7xl space-y-6">
        <header>
          <h2 className="font-display text-display-lg text-accent-strong">Dungeons</h2>
          <p className="mt-1 text-sm text-text-muted">Choose a dungeon entrance.</p>
        </header>

        {unlockedDungeonIds === null ? (
          <p aria-live="polite" className="text-text-muted">
            {saveStatus === 'error' ? 'Saved progress unavailable.' : 'Loading saved progress...'}
          </p>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row">
            <ul
              aria-label="Acts"
              className="flex w-full flex-col gap-3 lg:w-64 lg:shrink-0 lg:justify-center"
            >
              {ACT_DISPLAY_META.map((act) => (
                <ActPanel key={act.id} act={act} />
              ))}
            </ul>
            <Panel
              as="section"
              aria-label={`${ACT_1_DISPLAY_META.label} dungeons`}
              className="min-w-0 flex-1 space-y-5"
            >
              <p className="text-center font-display text-display-sm tracking-widest text-accent">
                {ACT_1_DISPLAY_META.label} - {ACT_1_DISPLAY_META.name.toUpperCase()}
              </p>
              <DungeonSelector
                unlockedDungeonIds={unlockedDungeonIds}
                selectedDungeonId={selectedDungeonId}
                onSelect={setRequestedDungeonId}
              />
              {startError !== null && (
                <p role="alert" className="text-sm text-danger">
                  {startError}
                </p>
              )}
              <div className="flex justify-center">
                <Button
                  disabled={mode === 'starting' || saveStatus !== 'ready'}
                  onClick={() => void startRun(selectedDungeonId)}
                >
                  {mode === 'starting' ? 'Entering Dungeon...' : 'Enter Dungeon'}
                </Button>
              </div>
            </Panel>
          </div>
        )}
      </section>
    </ScreenLayout>
  );
}
