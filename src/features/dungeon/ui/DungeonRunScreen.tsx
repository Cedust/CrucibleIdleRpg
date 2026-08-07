import { useState } from 'react';
import { useDungeonRunStore } from '@/features/dungeon/state/dungeonRunStore';
import { isFinalAct1Floor, resolveAct1Encounter } from '@/game/encounters/act1';
import { useSaveStore } from '@/features/save/saveStore';
import { Button } from '@/shared/ui/Button';
import { CombatLog } from '@/features/combat/ui/CombatLog';
import { useCombatStore } from '@/features/combat/state/combatStore';
import { EnemyFormation } from '@/features/combat/ui/EnemyFormation';
import { TeamPanel } from '@/features/combat/ui/TeamPanel';
import { TurnOrderBar } from '@/features/combat/ui/TurnOrderBar';

/** Fullscreen arena with lifecycle actions only; it intentionally has no app navigation. */
export function DungeonRunScreen() {
  const combat = useCombatStore((state) => state.combat);
  const floorId = combat?.floorId ?? null;
  const outcome = useCombatStore((state) => state.outcome);
  const isPaused = useCombatStore((state) => state.isPaused);
  const completionStatus = useCombatStore((state) => state.completionStatus);
  const lastReward = useCombatStore((state) => state.lastReward);
  const playbackSpeed = useCombatStore((state) => state.playbackSpeed);
  const setPaused = useCombatStore((state) => state.setPaused);
  const retryVictoryCommit = useCombatStore((state) => state.retryVictoryCommit);
  const leaveRun = useDungeonRunStore((state) => state.leaveRun);
  const setRunPlaybackSpeed = useDungeonRunStore((state) => state.setRunPlaybackSpeed);
  const completeRun = useDungeonRunStore((state) => state.completeRun);
  const completionError = useDungeonRunStore((state) => state.completionError);
  const activeDungeonId = useDungeonRunStore((state) => state.activeDungeonId);
  const completedDungeons = useSaveStore((state) => state.data?.completedDungeons ?? null);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const doubleSpeedUnlocked =
    activeDungeonId !== null && completedDungeons?.[activeDungeonId] === true;

  if (floorId === null) {
    return (
      <main className="min-h-0 flex-1 bg-background p-6 text-text">Preparing dungeon run...</main>
    );
  }

  const isFinalFloor = isFinalAct1Floor(resolveAct1Encounter(floorId));

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-background p-4 text-text sm:p-6">
      <section className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-sm text-text-muted">Dungeon run</p>
            <h1 className="text-2xl font-bold">{floorId}</h1>
          </div>
          {outcome === 'ongoing' && (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant={isPaused ? 'primary' : 'ghost'} onClick={() => setPaused(!isPaused)}>
                {isPaused ? 'Resume Combat' : 'Pause Combat'}
              </Button>
              <div className="flex items-center gap-1" aria-label="Playback speed">
                <Button
                  aria-pressed={playbackSpeed === 1}
                  variant={playbackSpeed === 1 ? 'primary' : 'ghost'}
                  onClick={() => void setRunPlaybackSpeed(1)}
                >
                  1× Playback
                </Button>
                <Button
                  aria-pressed={playbackSpeed === 2}
                  disabled={!doubleSpeedUnlocked}
                  variant={playbackSpeed === 2 ? 'primary' : 'ghost'}
                  onClick={() => void setRunPlaybackSpeed(2)}
                >
                  2× Playback
                </Button>
              </div>
              {!doubleSpeedUnlocked && (
                <p className="basis-full text-sm text-text-muted">
                  Complete this dungeon once to unlock 2× playback.
                </p>
              )}
              {confirmingLeave ? (
                <>
                  <Button variant="ghost" onClick={() => setConfirmingLeave(false)}>
                    Keep Fighting
                  </Button>
                  <Button onClick={leaveRun}>Confirm Leave Dungeon</Button>
                </>
              ) : (
                <Button variant="ghost" onClick={() => setConfirmingLeave(true)}>
                  Leave Dungeon
                </Button>
              )}
            </div>
          )}
        </header>

        {outcome === 'victory' && (
          <section aria-live="polite" className="rounded-md border border-border bg-surface p-4">
            <h2 className="font-semibold text-success">Floor complete</h2>
            {completionStatus === 'saving' && (
              <p className="text-sm text-text-muted">Saving reward...</p>
            )}
            {completionStatus === 'saved' && lastReward !== null && (
              <div className="space-y-3">
                <p className="text-sm text-text-muted">
                  Reward saved: +{lastReward.gold} Gold / +{lastReward.xp} XP / +
                  {lastReward.crystals} {lastReward.crystals === 1 ? 'Crystal' : 'Crystals'}
                </p>
                {isFinalFloor ? (
                  <>
                    {completionError !== null && <p role="alert">{completionError}</p>}
                    <Button onClick={() => void completeRun()}>Complete Dungeon</Button>
                  </>
                ) : null}
              </div>
            )}
            {completionStatus === 'failed' && (
              <>
                <p role="alert" className="text-sm text-danger">
                  Reward save failed.
                </p>
                <Button variant="ghost" onClick={retryVictoryCommit}>
                  Retry Save
                </Button>
              </>
            )}
          </section>
        )}

        <TurnOrderBar />
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(16rem,0.8fr)_minmax(32rem,1.6fr)]">
          <TeamPanel />
          <EnemyFormation />
        </div>
        <CombatLog />
      </section>
    </main>
  );
}
