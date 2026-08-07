import { useState } from 'react';
import { type Act1DungeonId } from '@/game/encounters/act1';
import { useSaveStore } from '@/features/save/saveStore';
import { Button } from '@/shared/ui/Button';
import { DungeonSelector } from './DungeonSelector';
import { useDungeonRunStore } from '@/features/dungeon/state/dungeonRunStore';

/** Normal shell view for selecting an unlocked dungeon entrance. */
export function DungeonSelectionScreen() {
  const unlockedDungeonIds = useSaveStore((state) => state.data?.unlockedDungeonIds ?? null);
  const saveStatus = useSaveStore((state) => state.status);
  const mode = useDungeonRunStore((state) => state.mode);
  const startError = useDungeonRunStore((state) => state.startError);
  const startRun = useDungeonRunStore((state) => state.startRun);
  const [requestedDungeonId, setRequestedDungeonId] = useState<Act1DungeonId>('A1-D1');
  const selectedDungeonId =
    unlockedDungeonIds !== null && unlockedDungeonIds.includes(requestedDungeonId)
      ? requestedDungeonId
      : (unlockedDungeonIds?.[0] ?? 'A1-D1');

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Dungeons</h2>
        <p className="mt-1 text-sm text-text-muted">Choose an unlocked dungeon entrance.</p>
      </header>

      {unlockedDungeonIds === null ? (
        <p aria-live="polite" className="text-text-muted">
          {saveStatus === 'error' ? 'Saved progress unavailable.' : 'Loading saved progress...'}
        </p>
      ) : (
        <section
          aria-labelledby="act-1-heading"
          className="space-y-4 rounded-lg border border-border bg-surface p-4"
        >
          <div>
            <h3 id="act-1-heading" className="text-lg font-semibold">
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
        </section>
      )}
    </section>
  );
}
