import { formatNumber } from '@/shared/utils/formatNumber';
import type { CombatEvent } from '@/features/combat/engine/combatEvents';
import type { ActorRef, CombatState } from '@/features/combat/engine/combatState';
import { useCombatStore } from '@/features/combat/state/combatStore';
import type { HitKind } from '@/features/combat/engine/outgoingDamage';

const EMPTY_LOG = [] as const;

function actorName(state: CombatState, actor: ActorRef): string {
  const participant =
    actor.side === 'character' ? state.characters[actor.index] : state.enemies[actor.index];
  return participant?.name ?? 'Unknown actor';
}

const HIT_LABEL: Record<HitKind, string> = {
  base: 'Hit',
  multiHit: 'Multi Hit',
  splash: 'Splash',
  echo: 'Echo',
  epicenter: 'Epicenter',
  focusedBlast: 'Focused Blast',
  aftershock: 'Aftershock',
  secondWind: 'Second Wind',
  counter: 'Counter',
};

function eventText(state: CombatState, event: CombatEvent): string {
  switch (event.type) {
    case 'roundStart':
      return `Round ${event.round} begins`;
    case 'turnStart':
      return `${actorName(state, event.actor)} takes a turn`;
    case 'attack':
      return `${actorName(state, event.source)} attacks ${actorName(state, event.target)}`;
    case 'hit': {
      const critical = event.crit ? 'Critical ' : '';
      const chain = event.kind === 'multiHit' ? ` #${event.chainIndex ?? 1}` : '';
      return `${critical}${HIT_LABEL[event.kind]}${chain}: ${formatNumber(event.damage)} damage to ${actorName(state, event.target)}`;
    }
    case 'enemyAttack':
      return `${actorName(state, event.source)} attacks the team`;
    case 'damageTaken':
      if (event.evaded) {
        return `${actorName(state, event.target)} Evaded`;
      }
      return `${actorName(state, event.target)}${event.blocked ? ' Blocked' : ''}: ${formatNumber(event.healthLost)} health damage${event.barrierAbsorbed > 0 ? `, ${formatNumber(event.barrierAbsorbed)} absorbed by Barrier` : ''}`;
    case 'regeneration':
      return `${actorName(state, event.actor)} regenerates ${formatNumber(event.healed)} health`;
    case 'defeat':
      return `${actorName(state, event.actor)} is defeated`;
    case 'roundEnd':
      return `Round ${event.round} ends`;
    case 'combatEnd':
      return event.outcome === 'victory' ? 'Victory' : 'Defeat';
  }
}

/** Gedeckeltes Kampf-Log: ein Listeneintrag entspricht genau einem vollständigen Zugblock. */
export function CombatLog() {
  const ticks = useCombatStore((state) => state.tickLog ?? EMPTY_LOG);

  return (
    <section
      aria-labelledby="combat-log-heading"
      className="rounded-xl border border-border bg-surface p-4"
    >
      <h3
        id="combat-log-heading"
        className="text-sm font-semibold uppercase tracking-wider text-text-muted"
      >
        Combat Log
      </h3>
      {ticks.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">No turns resolved yet.</p>
      ) : null}
      <ol
        aria-label="Combat log"
        aria-live="polite"
        className={ticks.length === 0 ? 'sr-only' : 'mt-3 max-h-80 space-y-2 overflow-y-auto'}
      >
        {[...ticks].reverse().map((tick, tickIndex) => (
          <li
            key={`${tick.state.round}-${tick.actor?.side ?? 'none'}-${tick.actor?.index ?? tickIndex}`}
            className="rounded-lg border border-border bg-background/40 px-3 py-2 text-sm"
          >
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              {tick.events.map((event, eventIndex) => (
                <span
                  key={`${event.type}-${eventIndex}`}
                  data-event-type={event.type}
                  className="after:ml-2 after:text-border after:content-['•'] last:after:content-none"
                >
                  {eventText(tick.state, event)}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
