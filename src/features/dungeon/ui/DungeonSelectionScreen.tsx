import { useState } from 'react';
import { deriveUnlockedDungeonIds } from '@/game/crucible/crucible';
import { type Act1DungeonId } from '@/game/encounters/act1';
import { useSaveStore } from '@/features/save/saveStore';
import { Button } from '@/shared/ui/Button';
import { Panel } from '@/shared/ui/Panel';
import { ScreenLayout } from '@/shared/ui/ScreenLayout';
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
      <section className="mx-auto max-w-5xl space-y-6">
        <header>
          <h2 className="font-display text-display-lg text-accent-strong">Dungeons</h2>
          <p className="mt-1 text-sm text-text-muted">Choose an unlocked dungeon entrance.</p>
        </header>

        {unlockedDungeonIds === null ? (
          <p aria-live="polite" className="text-text-muted">
            {saveStatus === 'error' ? 'Saved progress unavailable.' : 'Loading saved progress...'}
          </p>
        ) : (
          <Panel as="section" aria-labelledby="act-1-heading" className="space-y-4">
            <div>
              <h3 id="act-1-heading" className="font-display text-display">
                Act 1
              </h3>
              <p className="text-sm text-text-muted">Choose a dungeon checkpoint.</p>
            </div>
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
            <Button
              disabled={mode === 'starting' || saveStatus !== 'ready'}
              onClick={() => void startRun(selectedDungeonId)}
            >
              {mode === 'starting' ? 'Entering Dungeon...' : 'Enter Dungeon'}
            </Button>
          </Panel>
        )}
      </section>
    </ScreenLayout>
  );
}
