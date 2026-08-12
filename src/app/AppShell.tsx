import { ActiveView } from './ui/ActiveView';
import { AppSidebar } from './ui/AppSidebar';
import { DungeonRunScreen } from '@/features/dungeon/ui/DungeonRunScreen';
import { ResourceDock } from './ui/ResourceDock';
import { useAppRuntime } from './useAppRuntime';
import { useDungeonRunStore } from '@/features/dungeon/state/dungeonRunStore';

/** App-Shell mit State-basiertem View-Switch (kein Router, siehe AGENTS.md). */
export function AppShell() {
  useAppRuntime();
  const runMode = useDungeonRunStore((state) => state.mode);

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-text">
      {runMode === 'run' ? (
        <DungeonRunScreen />
      ) : (
        <>
          <AppSidebar />
          <div className="border-image-mainview relative min-w-0 flex-1">
            <ResourceDock />
            <main className="h-full overflow-auto">
              <ActiveView />
            </main>
          </div>
        </>
      )}
    </div>
  );
}
