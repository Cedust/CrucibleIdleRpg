import type { ActorRef } from '@/features/combat/engine/combatState';
import { useCombatStore } from '@/features/combat/state/combatStore';
import { sameActor } from '@/features/combat/engine/turnOrder';

/** Ein Eintrag löst seinen Namen reaktiv über die eigene Subscription auf. */
function TurnOrderItem({ actor, isActive }: { actor: ActorRef; isActive: boolean }) {
  const name = useCombatStore((state) => {
    const participant =
      actor.side === 'character'
        ? state.combat?.characters[actor.index]
        : state.combat?.enemies[actor.index];
    return participant?.name ?? 'Unknown actor';
  });

  return (
    <li
      aria-current={isActive ? 'step' : undefined}
      className={
        isActive
          ? 'rounded-full border border-accent bg-accent/15 px-3 py-1.5 text-sm font-semibold text-accent'
          : 'rounded-full border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-muted'
      }
    >
      {isActive && <span className="sr-only">Active: </span>}
      {name}
    </li>
  );
}

/** Stabile Kampf-Reihenfolge; pro Takt wandert ausschließlich die aktive Markierung. */
export function TurnOrderBar() {
  const turnOrder = useCombatStore((state) => state.turnOrder);
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
          {turnOrder.map((actor) => (
            <TurnOrderItem
              key={`${actor.side}-${actor.index}`}
              actor={actor}
              isActive={active !== null && sameActor(actor, active)}
            />
          ))}
        </ol>
      )}
    </section>
  );
}
