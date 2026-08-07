import { useState } from 'react';
import { type Act1DungeonId } from '@/game/encounters/act1';
import { createFloorReward } from '@/game/rewards/floorRewards';
import { DungeonSelector } from '@/features/dungeon/ui/DungeonSelector';
import { useSaveStore } from '@/features/save/saveStore';
import { Button } from '@/shared/ui/Button';
import { CombatLog } from './CombatLog';
import { useCombatStore } from '@/features/combat/state/combatStore';
import { EnemyFormation } from './EnemyFormation';
import { createDungeonEntryCombat } from '@/features/dungeon/dungeonCombat';
import { TeamPanel } from './TeamPanel';
import { TurnOrderBar } from './TurnOrderBar';

/** Steuerung mit selektiven Subscriptions; unveränderte Takte rendern sie nicht neu. */
export function CombatControls() {
  const [requestedDungeonId, setRequestedDungeonId] = useState<Act1DungeonId>('A1-D1');
  const floorId = useCombatStore((state) => state.combat?.floorId ?? null);
  const outcome = useCombatStore((state) => state.outcome);
  const isPaused = useCombatStore((state) => state.isPaused);
  const completionStatus = useCombatStore((state) => state.completionStatus);
  const lastReward = useCombatStore((state) => state.lastReward);
  const startCombat = useCombatStore((state) => state.startCombat);
  const setPaused = useCombatStore((state) => state.setPaused);
  const retryVictoryCommit = useCombatStore((state) => state.retryVictoryCommit);
  const saveStatus = useSaveStore((state) => state.status);
  const beginRun = useSaveStore((state) => state.beginRun);
  const commitVictory = useSaveStore((state) => state.commitVictory);
  const save = useSaveStore((state) => state.data);
  const selectedDungeonId =
    save !== null && save.unlockedDungeonIds.includes(requestedDungeonId)
      ? requestedDungeonId
      : (save?.unlockedDungeonIds[0] ?? 'A1-D1');

  const start = async () => {
    try {
      const runSave = await beginRun();
      const combat = createDungeonEntryCombat(runSave, selectedDungeonId);
      startCombat(combat, undefined, async (result) => {
        const commit = await commitVictory(
          createFloorReward(
            result.floorId,
            result.floorIndex,
            result.enemies.length,
            result.effectiveDamage,
          ),
        );
        return commit.reward;
      });
    } catch {
      // Der Save-Store stellt den Fehlerzustand dar; ohne persistierten Counter startet kein Run.
    }
  };

  if (floorId === null) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {save !== null && (
          <DungeonSelector
            save={save}
            selectedDungeonId={selectedDungeonId}
            onSelect={setRequestedDungeonId}
          />
        )}
        <Button disabled={saveStatus !== 'ready'} onClick={() => void start()}>
          {saveStatus === 'loading' || saveStatus === 'idle'
            ? 'Loading Save…'
            : saveStatus === 'error'
              ? 'Save Unavailable'
              : 'Start Combat'}
        </Button>
      </div>
    );
  }

  if (outcome !== 'ongoing') {
    return (
      <div className="flex items-center gap-3">
        <p
          aria-live="polite"
          className={
            outcome === 'victory' ? 'font-semibold text-success' : 'font-semibold text-danger'
          }
        >
          {outcome === 'victory' ? 'Victory' : 'Defeat'}
        </p>
        {outcome === 'victory' && completionStatus === 'saving' && (
          <p aria-live="polite" className="text-sm text-text-muted">
            Saving reward…
          </p>
        )}
        {outcome === 'victory' && completionStatus === 'saved' && lastReward !== null && (
          <p aria-live="polite" className="text-sm text-text-muted">
            Reward saved: +{lastReward.gold} Gold · +{lastReward.xp} XP · +{lastReward.crystals}{' '}
            {lastReward.crystals === 1 ? 'Crystal' : 'Crystals'}
          </p>
        )}
        {outcome === 'victory' && completionStatus === 'failed' && (
          <>
            <p role="alert" className="text-sm text-danger">
              Reward save failed.
            </p>
            <Button variant="ghost" onClick={retryVictoryCommit}>
              Retry Save
            </Button>
          </>
        )}
        <Button
          disabled={
            saveStatus !== 'ready' || completionStatus === 'saving' || completionStatus === 'failed'
          }
          onClick={() => void start()}
        >
          Start Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="rounded-full border border-border bg-surface-raised px-3 py-1 text-sm text-text-muted">
        {floorId}
      </span>
      <Button variant={isPaused ? 'primary' : 'ghost'} onClick={() => setPaused(!isPaused)}>
        {isPaused ? 'Resume Combat' : 'Pause Combat'}
      </Button>
    </div>
  );
}

/** Kampfbildschirm-Rahmen ohne Store-Subscription; die Teilbereiche aktualisieren sich selektiv. */
export function CombatScreen() {
  return (
    <section className="mx-auto max-w-7xl space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Combat</h2>
          <p className="mt-1 text-sm text-text-muted">Watch every turn unfold in the Crucible.</p>
        </div>
        <CombatControls />
      </header>

      <ProgressSummary />

      <TurnOrderBar />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(16rem,0.8fr)_minmax(32rem,1.6fr)]">
        <TeamPanel />
        <EnemyFormation />
      </div>

      <CombatLog />
    </section>
  );
}

function ProgressSummary() {
  const data = useSaveStore((state) => state.data);
  const status = useSaveStore((state) => state.status);

  if (data === null) {
    return (
      <section
        aria-label="Saved progress"
        aria-busy={status !== 'error'}
        aria-live="polite"
        className="text-sm text-text-muted"
      >
        {status === 'error' ? 'Saved progress unavailable.' : 'Loading saved progress…'}
      </section>
    );
  }

  const totalXp = data.characters.korvin.xp + data.characters.rhaya.xp + data.characters.quinn.xp;

  return (
    <section
      aria-label="Saved progress"
      aria-live="polite"
      className="flex flex-wrap gap-4 text-sm text-text-muted"
    >
      <p aria-label="Gold balance">
        Gold <strong className="text-text">{data?.currencies.gold ?? 0}</strong>
      </p>
      <p aria-label="Crystal balance">
        Crystals <strong className="text-text">{data?.currencies.crystals ?? 0}</strong>
      </p>
      <p aria-label="Team XP balance">
        Team XP <strong className="text-text">{totalXp}</strong>
      </p>
    </section>
  );
}
