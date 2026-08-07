import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { useCombatStore } from '@/features/combat/state/combatStore';

const LANES = [
  { id: 'backline', label: 'Backline', offset: 3 },
  { id: 'frontline', label: 'Frontline', offset: 0 },
] as const;

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
        : { name: enemy.name, health: enemy.health, maxHealth: enemy.maxHealth };
    }),
  );
  const name = slot?.name ?? null;
  const health = slot?.health ?? 0;
  const maxHealth = slot?.maxHealth ?? 0;

  return (
    <div
      data-testid="formation-slot"
      aria-label={name === null ? `Empty ${lane} slot ${slotIndex + 1}` : undefined}
      className="min-h-28 rounded-lg border border-border bg-surface-raised p-3"
    >
      {name === null ? (
        <div className="flex min-h-20 items-center justify-center text-xs text-text-muted">
          Empty
        </div>
      ) : (
        <article>
          <h5 className="mb-3 min-h-10 text-sm font-semibold leading-tight">{name}</h5>
          <ProgressBar label={name} value={health} max={maxHealth} />
        </article>
      )}
    </div>
  );
}

/** Gegneranzeige als verbindliche 2×3-Formation mit getrennten Lanes. */
export function EnemyFormation() {
  const scroller = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const element = scroller.current;
    if (element === null) {
      return;
    }

    const updateScrollState = () => {
      setCanScrollLeft(element.scrollLeft > 0);
      setCanScrollRight(element.scrollLeft + element.clientWidth < element.scrollWidth - 1);
    };

    updateScrollState();
    element.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);

    return () => {
      element.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  const scrollFormation = (direction: -1 | 1) => {
    scroller.current?.scrollBy({ left: direction * 240 });
  };

  return (
    <section
      aria-labelledby="enemy-formation-heading"
      className="min-w-0 rounded-xl border border-border bg-surface p-4"
    >
      <h3
        id="enemy-formation-heading"
        className="text-sm font-semibold uppercase tracking-wider text-text-muted"
      >
        Enemy Formation
      </h3>

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          aria-label="Scroll formation left"
          aria-controls="enemy-formation-scroll"
          disabled={!canScrollLeft}
          onClick={() => scrollFormation(-1)}
          className="rounded-md border border-border bg-surface-raised px-3 py-1 text-text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Scroll formation right"
          aria-controls="enemy-formation-scroll"
          disabled={!canScrollRight}
          onClick={() => scrollFormation(1)}
          className="rounded-md border border-border bg-surface-raised px-3 py-1 text-text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          →
        </button>
      </div>
      <div
        id="enemy-formation-scroll"
        ref={scroller}
        role="region"
        aria-label="Scrollable enemy formation"
        data-testid="enemy-formation-scroll"
        className="mt-2 overflow-x-auto pb-2"
      >
        <div className="min-w-[30rem] space-y-4">
          {LANES.map((lane) => (
            <section key={lane.id} aria-labelledby={`${lane.id}-heading`}>
              <h4 id={`${lane.id}-heading`} className="mb-2 text-xs font-semibold text-text-muted">
                {lane.label}
              </h4>
              <div className="grid grid-cols-3 gap-2">
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
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
