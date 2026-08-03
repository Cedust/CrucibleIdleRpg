import { TEAM_ORDER } from '@/game/characters/characters';
import { FLOOR_FORMATIONS, FORMATIONS } from '@/game/encounters/formations';
import { Button } from '@/shared/ui/Button';
import { neutralProgression } from './characterStats';
import { CombatLog } from './CombatLog';
import { buildCombatState, deriveFloorSeed, deriveRunSeed, type CombatState } from './combatState';
import { useCombatStore } from './combatStore';
import { EnemyFormation } from './EnemyFormation';
import { TeamPanel } from './TeamPanel';
import { TurnOrderBar } from './TurnOrderBar';

const M1_FLOOR_ID = 'A1-D1-01';
const M1_DUNGEON_ID = 'A1-D1';
const M1_DEMO_SAVE_SEED = 0x43525543;

/** Temporärer M1-Einstieg; Save-Seed und Run-Counter werden in Task 009 angebunden. */
function createM1Combat(): CombatState {
  const formationId = FLOOR_FORMATIONS[M1_FLOOR_ID];
  const formation = formationId === undefined ? undefined : FORMATIONS[formationId];

  if (formation === undefined) {
    throw new Error(`Keine Formation für ${M1_FLOOR_ID} definiert`);
  }

  return buildCombatState({
    floorId: M1_FLOOR_ID,
    floorIndex: 0,
    floorSeed: deriveFloorSeed(deriveRunSeed(M1_DEMO_SAVE_SEED, M1_DUNGEON_ID, 1), 0),
    formation,
    team: TEAM_ORDER.map((id) => ({ id, progression: neutralProgression(1) })),
  });
}

/** Steuerung mit selektiven Subscriptions; unveränderte Takte rendern sie nicht neu. */
export function CombatControls() {
  const floorId = useCombatStore((state) => state.combat?.floorId ?? null);
  const outcome = useCombatStore((state) => state.outcome);
  const isPaused = useCombatStore((state) => state.isPaused);
  const startCombat = useCombatStore((state) => state.startCombat);
  const setPaused = useCombatStore((state) => state.setPaused);

  const start = () => startCombat(createM1Combat());

  if (floorId === null) {
    return <Button onClick={start}>Start Combat</Button>;
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
        <Button onClick={start}>Start Again</Button>
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

      <TurnOrderBar />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(16rem,0.8fr)_minmax(32rem,1.6fr)]">
        <TeamPanel />
        <EnemyFormation />
      </div>

      <CombatLog />
    </section>
  );
}
