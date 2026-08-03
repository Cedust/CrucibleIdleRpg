import type { ActorRef } from './combatState';
import { useCombatStore } from './combatStore';
import { sameActor } from './turnOrder';

const EMPTY_QUEUE: readonly ActorRef[] = [];

function actorName(actor: ActorRef): string {
  const combat = useCombatStore.getState().combat;
  const participant =
    actor.side === 'character' ? combat?.characters[actor.index] : combat?.enemies[actor.index];
  return participant?.name ?? 'Unknown actor';
}

/** Stabile Kampf-Reihenfolge; pro Takt wandert ausschließlich die aktive Markierung. */
export function TurnOrderBar() {
  const turnOrder = useCombatStore((state) => state.turnOrder ?? EMPTY_QUEUE);
  const active = useCombatStore((state) => {
    if (state.outcome !== 'ongoing' || state.combat === null) {
      return null;
    }

    return (
      state.combat.pending[0] ??
      state.turnOrder.find((actor) => {
        const participant =
          actor.side === 'character'
            ? state.combat?.characters[actor.index]
            : state.combat?.enemies[actor.index];
        return participant !== undefined && participant.health > 0;
      }) ??
      null
    );
  });

  return (
    <section
      aria-labelledby="turn-order-heading"
      className="rounded-xl border border-border bg-surface p-4"
    >
      <h3
        id="turn-order-heading"
        className="text-sm font-semibold uppercase tracking-wider text-text-muted"
      >
        Turn Order
      </h3>
      {turnOrder.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">No turn order yet.</p>
      ) : (
        <ol aria-label="Combat turn order" className="mt-3 flex flex-wrap gap-2">
          {turnOrder.map((actor) => {
            const isActive = active !== null && sameActor(actor, active);

            return (
              <li
                key={`${actor.side}-${actor.index}`}
                aria-current={isActive ? 'step' : undefined}
                className={
                  isActive
                    ? 'rounded-full border border-accent bg-accent/15 px-3 py-1.5 text-sm font-semibold text-accent'
                    : 'rounded-full border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-muted'
                }
              >
                {isActive && <span className="sr-only">Active: </span>}
                {actorName(actor)}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
