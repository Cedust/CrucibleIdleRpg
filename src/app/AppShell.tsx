import { ActiveView } from './ui/ActiveView';
import { AppSidebar } from './ui/AppSidebar';
import { DungeonRunScreen } from '@/features/dungeon/ui/DungeonRunScreen';
import { useAppRuntime } from './useAppRuntime';
import { useDungeonRunStore } from '@/features/dungeon/state/dungeonRunStore';

/** App-Shell mit State-basiertem View-Switch (kein Router, siehe AGENTS.md). */
export function AppShell() {
  useAppRuntime();
  const runMode = useDungeonRunStore((state) => state.mode);

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-text">
      {runMode === 'run' ? (
        <div className="border-image-frame relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <DungeonRunScreen />
        </div>
      ) : (
        <>
          <AppSidebar />
          {/* Clipping übernimmt der Rahmen-Container an seiner Padding-Box, damit
              die Screen-Hintergründe um das Gutter bis unter den Rahmen bluten. */}
          <div className="border-image-frame relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
            <main className="min-h-0 flex-1">
              <ActiveView />
            </main>
          </div>
        </>
      )}
    </div>
  );
}
