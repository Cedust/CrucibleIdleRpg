import { CombatPortrait } from './CombatPortrait';
import { cn } from '@/shared/ui/utils/cn';
import { Panel } from '@/shared/ui/layout/Panel';
import { ProgressBar } from '@/shared/ui/feedback/ProgressBar';
import { SectionTitle } from '@/shared/ui/layout/SectionTitle';
import { stateAttrs } from '@/shared/ui/utils/state';
import { bulwarkDamageFactor } from '@/features/combat/engine/damage/bulwark';
import { useCombatStore } from '@/features/combat/state/combatStore';
import { useShallow } from 'zustand/react/shallow';

const LANES = [
  { id: 'frontline', label: 'Frontline', offset: 0 },
  { id: 'backline', label: 'Backline', offset: 3 },
] as const;

const PERCENT_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 2,
});

interface EnemyFormationProps {
  className?: string;
}

interface EnemySlotProps {
  formationIndex: number;
  lane: (typeof LANES)[number]['id'];
  slotIndex: number;
}

function EnemySlot({ formationIndex, lane, slotIndex }: EnemySlotProps) {
  // Ein Scan je Slot; die Shallow-Gleichheit hält unveränderte Slots ohne Re-Render.
  const slot = useCombatStore(
    useShallow((state) => {
      const enemy = state.combat?.enemies.find(
        (candidate) => candidate.formationIndex === formationIndex,
      );
      return enemy === undefined
        ? null
        : {
            name: enemy.name,
            health: enemy.health,
            maxHealth: enemy.maxHealth,
            bulwarkValue:
              lane === 'frontline'
                ? enemy.bulwarkContribution
                : 1 - bulwarkDamageFactor(state.combat?.enemies ?? [], enemy),
          };
    }),
  );
  const isDefeated = (slot?.health ?? 0) <= 0;

  if (slot === null) {
    return (
      <article
        data-testid="formation-slot"
        aria-label={`Empty ${lane} slot ${slotIndex + 1}`}
        {...stateAttrs({ semantic: 'empty' })}
        className="flex min-h-44 min-w-0 flex-col gap-2 rounded-lg border border-dashed border-state-empty-border bg-surface/40 p-2 shadow-panel @min-[36rem]:p-3"
      >
        <div className="flex flex-1 items-center justify-center gap-3">
          <span className="text-xs text-text-muted">Empty</span>
        </div>
      </article>
    );
  }

  return (
    <Panel
      as="article"
      variant="thin"
      padding="none"
      data-testid="formation-slot"
      aria-label={`${slot.name} ${lane} slot ${slotIndex + 1}`}
      className="flex min-h-44 min-w-0 flex-col gap-2 p-2 @min-[36rem]:p-3"
    >
      <h4 className="w-full text-left text-sm font-semibold leading-tight text-text">
        {slot.name}
      </h4>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <CombatPortrait size="lg" isDefeated={isDefeated} label={`${slot.name} portrait`} />
        <dl className="min-w-0 flex-1 text-xs">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-text-muted">{lane === 'frontline' ? 'Bulwark' : 'Bulwark DR'}</dt>
            <dd
              aria-label={
                lane === 'frontline'
                  ? `${slot.name} Bulwark`
                  : `${slot.name} Bulwark damage reduction`
              }
              className="font-semibold tabular-nums text-text"
            >
              {PERCENT_FORMAT.format(slot.bulwarkValue)}
            </dd>
          </div>
        </dl>
      </div>
      <div data-testid="enemy-health" className="w-full">
        <ProgressBar
          label="Health"
          ariaLabel={`${slot.name} health`}
          value={slot.health}
          max={slot.maxHealth}
          valueText={isDefeated ? 'FALLEN' : undefined}
          hideLabel
          tone="health"
          size="sm"
        />
      </div>
    </Panel>
  );
}

/** Gegneranzeige als verbindliche, ohne horizontalen Scrollbereich schrumpfende 2×3-Formation. */
export function EnemyFormation({ className = '' }: EnemyFormationProps) {
  return (
    <section aria-label="Enemy Formation" className={cn('min-h-0 min-w-0', className)}>
      <h2 className="sr-only">Enemies</h2>
      <div
        data-testid="enemy-formation-grid"
        className="grid min-w-0 grid-cols-2 gap-2 @min-[36rem]:gap-3"
      >
        {LANES.map((lane) => (
          <section
            key={lane.id}
            aria-labelledby={`${lane.id}-heading`}
            className="min-w-0 space-y-3"
          >
            <SectionTitle as="h3" id={`${lane.id}-heading`}>
              {lane.label}
            </SectionTitle>
            {[0, 1, 2].map((slotIndex) => {
              const formationIndex = lane.offset + slotIndex;

              return (
                <EnemySlot
                  key={formationIndex}
                  formationIndex={formationIndex}
                  lane={lane.id}
                  slotIndex={slotIndex}
                />
              );
            })}
          </section>
        ))}
      </div>
    </section>
  );
}
