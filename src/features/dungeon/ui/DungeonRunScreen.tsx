import { useState } from 'react';
import { Coins, ScrollText, Stone } from 'lucide-react';
import { useDungeonRunStore } from '@/features/dungeon/state/dungeonRunStore';
import { isFinalAct1Floor, resolveAct1Encounter } from '@/game/encounters/act1';
import { ACT_1_DISPLAY_META, ACT_1_DUNGEON_DISPLAY_META } from '@/game/encounters/actMeta';
import { useSaveStore } from '@/features/save/saveStore';
import { Button } from '@/shared/ui/controls/Button';
import { Panel } from '@/shared/ui/layout/Panel';
import { ScreenHeader } from '@/shared/ui/layout/ScreenHeader';
import { ScreenLayout } from '@/shared/ui/layout/ScreenLayout';
import { formatNumber } from '@/shared/utils/formatNumber';
import { CombatLog } from '@/features/combat/ui/CombatLog';
import { useCombatStore } from '@/features/combat/state/combatStore';
import { EnemyFormation } from '@/features/combat/ui/EnemyFormation';
import { TeamPanel } from '@/features/combat/ui/TeamPanel';
import { TurnOrderBar } from '@/features/combat/ui/TurnOrderBar';
import { formatRelicShards } from '@/game/crucible/crucible';

/** Im Run können keine Ausgaben erfolgen; die Differenz seit Mount entspricht den Run-Rewards. */
function RunRewardSummary() {
  const currencies = useSaveStore((state) => state.data?.currencies ?? null);
  const [startingCurrencies] = useState(() => currencies ?? { gold: 0, relicShards: 0 });
  const gold = Math.max((currencies?.gold ?? 0) - startingCurrencies.gold, 0);
  const relicShards = Math.max((currencies?.relicShards ?? 0) - startingCurrencies.relicShards, 0);

  return (
    <dl aria-label="Run rewards" className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm">
      <div className="flex items-center gap-1.5">
        <Coins aria-hidden="true" className="size-4 text-accent" />
        <dt className="sr-only">Gold</dt>
        <dd aria-label="Gold amount" className="font-semibold text-text">
          {formatNumber(gold)}
        </dd>
      </div>
      <div className="flex items-center gap-1.5">
        <Stone aria-hidden="true" className="size-4 text-info" />
        <dt className="sr-only">Relic Shards</dt>
        <dd aria-label="Relic Shards amount" className="font-semibold text-text">
          {formatNumber(relicShards)}
        </dd>
      </div>
      <div className="flex items-center gap-1.5">
        <ScrollText aria-hidden="true" className="size-4 text-text-muted" />
        <dt className="sr-only">Runedust</dt>
        <dd aria-label="Runedust amount" className="font-semibold text-text-muted">
          —
        </dd>
      </div>
    </dl>
  );
}

interface RunStatusBarProps {
  isPaused: boolean;
  isOngoing: boolean;
  playbackSpeed: 1 | 2;
  doubleSpeedUnlocked: boolean;
  confirmingLeave: boolean;
  onTogglePause: () => void;
  onSetPlaybackSpeed: (speed: 1 | 2) => void;
  onStartLeave: () => void;
  onCancelLeave: () => void;
  onConfirmLeave: () => void;
}

function RunProgress({ floorNumber }: { floorNumber: number }) {
  const round = useCombatStore((state) => state.combat?.round ?? 0);

  return (
    <span aria-label={`Floor ${floorNumber}, Round ${Math.max(round, 1)}`}>
      Floor {floorNumber} <span aria-hidden="true">·</span> Round {Math.max(round, 1)}
    </span>
  );
}

function RunStatusBar({
  isPaused,
  isOngoing,
  playbackSpeed,
  doubleSpeedUnlocked,
  confirmingLeave,
  onTogglePause,
  onSetPlaybackSpeed,
  onStartLeave,
  onCancelLeave,
  onConfirmLeave,
}: RunStatusBarProps) {
  return (
    <Panel
      as="footer"
      variant="thin"
      padding="none"
      data-testid="run-status-bar"
      className="grid items-center gap-3 px-4 py-3 @min-[60rem]:grid-cols-[1fr_auto_1fr]"
    >
      <div
        role="group"
        aria-label="Combat playback"
        className="flex flex-wrap gap-2 @min-[60rem]:justify-self-start"
      >
        <Button variant="ghost" selected={isPaused} disabled={!isOngoing} onClick={onTogglePause}>
          {isPaused ? 'Resume' : 'Pause'}
        </Button>
        <Button
          aria-pressed={playbackSpeed === 1}
          variant="ghost"
          selected={playbackSpeed === 1}
          disabled={!isOngoing}
          onClick={() => onSetPlaybackSpeed(1)}
        >
          1×
        </Button>
        <Button
          aria-pressed={playbackSpeed === 2}
          variant="ghost"
          selected={playbackSpeed === 2}
          disabled={!isOngoing || !doubleSpeedUnlocked}
          onClick={() => onSetPlaybackSpeed(2)}
        >
          2×
        </Button>
      </div>

      <RunRewardSummary />

      <div className="flex flex-wrap justify-start gap-2 @min-[60rem]:justify-self-end">
        {confirmingLeave ? (
          <>
            <Button variant="ghost" onClick={onCancelLeave}>
              Keep Fighting
            </Button>
            <Button variant="danger" onClick={onConfirmLeave}>
              Confirm Leave Dungeon
            </Button>
          </>
        ) : (
          <Button variant="danger" onClick={onStartLeave}>
            LEAVE DUNGEON
          </Button>
        )}
      </div>
    </Panel>
  );
}

/** Fullscreen arena with lifecycle actions only; it intentionally has no app navigation. */
export function DungeonRunScreen() {
  const floorId = useCombatStore((state) => state.combat?.floorId ?? null);
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
  const dungeonMeta = activeDungeonId === null ? null : ACT_1_DUNGEON_DISPLAY_META[activeDungeonId];
  const doubleSpeedUnlocked =
    activeDungeonId !== null && completedDungeons?.[activeDungeonId] === true;

  if (floorId === null) {
    return (
      <ScreenLayout as="main" scroll={false} className="min-h-0 flex-1 text-text">
        <p aria-live="polite" className="text-text-muted">
          Preparing dungeon run…
        </p>
      </ScreenLayout>
    );
  }

  const encounter = resolveAct1Encounter(floorId);
  const isFinalFloor = isFinalAct1Floor(encounter);

  return (
    <ScreenLayout
      as="main"
      background={dungeonMeta?.backgroundId ?? 'ashen-depths'}
      scroll={false}
      contentClassName="h-full min-h-0 overflow-hidden"
      className="min-h-0 flex-1 overflow-hidden text-text"
    >
      <section className="mx-auto grid h-full min-h-0 w-full max-w-run grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-4">
        <ScreenHeader
          headingLevel="h1"
          title={`${ACT_1_DISPLAY_META.name} — ${dungeonMeta?.name ?? 'Dungeon Run'}`}
          className="text-center"
        />

        <TurnOrderBar />

        <div
          data-testid="combat-main-area"
          className="-mx-2 grid min-h-0 gap-4 overflow-y-auto px-2 py-2 @min-[85rem]:grid-cols-[minmax(0,1fr)_minmax(22rem,0.95fr)_minmax(0,1fr)]"
        >
          <TeamPanel />
          <div className="flex min-h-0 flex-col gap-4">
            {outcome === 'victory' && (
              <Panel as="section" aria-live="polite" className="shrink-0">
                <h2 className="font-display text-display text-success">Floor complete</h2>
                {completionStatus === 'saving' && (
                  <p className="text-sm text-text-muted">Saving reward…</p>
                )}
                {completionStatus === 'saved' && lastReward !== null && (
                  <div className="space-y-3">
                    <p className="text-sm text-text-muted">
                      Reward saved: +{lastReward.gold} Gold / +{lastReward.xp} XP / +
                      {formatRelicShards(lastReward.relicShards)}
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
              </Panel>
            )}
            <CombatLog
              className="flex-1"
              heading={<RunProgress floorNumber={encounter.floorNumber} />}
            />
          </div>
          <EnemyFormation />
        </div>

        <RunStatusBar
          isPaused={isPaused}
          isOngoing={outcome === 'ongoing'}
          playbackSpeed={playbackSpeed}
          doubleSpeedUnlocked={doubleSpeedUnlocked}
          confirmingLeave={confirmingLeave}
          onTogglePause={() => setPaused(!isPaused)}
          onSetPlaybackSpeed={(speed) => void setRunPlaybackSpeed(speed)}
          onStartLeave={() => setConfirmingLeave(true)}
          onCancelLeave={() => setConfirmingLeave(false)}
          onConfirmLeave={leaveRun}
        />
      </section>
    </ScreenLayout>
  );
}
