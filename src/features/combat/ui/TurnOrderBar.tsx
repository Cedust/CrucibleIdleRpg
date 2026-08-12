import type { ActorRef } from '@/features/combat/engine/combatState';
import { sameActor } from '@/features/combat/engine/turnOrder';
import { useCombatStore } from '@/features/combat/state/combatStore';
import { useShallow } from 'zustand/react/shallow';
import { CombatPortrait } from './CombatPortrait';

function TurnOrderItem({ actor, isActive }: { actor: ActorRef; isActive: boolean }) {
  const participant = useCombatStore(
    useShallow((state) => {
      const value =
        actor.side === 'character'
          ? state.combat?.characters[actor.index]
          : state.combat?.enemies[actor.index];
      if (value === undefined) return null;

      return {
        id: actor.side === 'character' ? state.combat?.characters[actor.index]?.id : undefined,
        name: value.name,
        isDefeated: value.health <= 0,
      };
    }),
  );

  if (participant === null) {
    return null;
  }

  return (
    <li
      aria-current={isActive ? 'step' : undefined}
      aria-label={`${participant.name}${isActive ? ', active' : ''}`}
      className={`relative flex shrink-0 items-center rounded-lg p-1 transition-colors after:absolute after:left-full after:top-1/2 after:h-px after:w-3 after:bg-border last:after:hidden ${
        isActive ? 'bg-accent/15 ring-1 ring-accent shadow-glow-accent' : ''
      }`}
    >
      <CombatPortrait
        characterId={participant.id}
        size="sm"
        isDefeated={participant.isDefeated}
        label={`${participant.name} portrait`}
      />
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
    <section aria-label="Turn order" className="text-center">
      {turnOrder.length === 0 ? (
        <p className="text-sm text-text-muted">No turn order yet.</p>
      ) : (
        <ol
          aria-label="Combat turn order"
          className="mx-auto flex max-w-full justify-center gap-3 overflow-x-auto p-1"
        >
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
