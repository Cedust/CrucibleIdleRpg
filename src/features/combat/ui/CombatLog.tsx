import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/shared/ui/utils/cn';
import { Panel } from '@/shared/ui/layout/Panel';
import { SectionTitle } from '@/shared/ui/layout/SectionTitle';
import { formatNumber } from '@/shared/utils/formatNumber';
import type { CombatEvent } from '@/features/combat/engine/combatEvents';
import type { ActorRef, CombatState } from '@/features/combat/engine/combatState';
import type { TickResult } from '@/features/combat/engine/combatEngine';
import type { HitKind } from '@/features/combat/engine/damage/outgoingDamage';
import { useCombatStore } from '@/features/combat/state/combatStore';
import { CombatPortrait } from './CombatPortrait';

interface CombatLogProps {
  className?: string;
  heading?: ReactNode;
}

function actorName(state: CombatState, actor: ActorRef): string {
  const participant =
    actor.side === 'character' ? state.characters[actor.index] : state.enemies[actor.index];
  return participant?.name ?? 'Unknown actor';
}

// `secondWind` ist der Treffer des Mastery-Nodes `weapon.second-wind` — sichtbar `Twin Echo`
// (docs/spec/WEAPON-MASTERY.md#52-twin-blades--rhaya), damit der Molten-Skill Second Wind
// (docs/spec/SIGNATURES.md#24-second-wind-nach-rally) den Namen allein trägt.
const HIT_LABEL: Record<HitKind, string> = {
  base: 'Hit',
  multiHit: 'Multi Hit',
  splash: 'Splash',
  echo: 'Echo',
  epicenter: 'Epicenter',
  focusedBlast: 'Focused Blast',
  aftershock: 'Aftershock',
  secondWind: 'Twin Echo',
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
    case 'secondWind':
      return `Second Wind: ${actorName(state, event.actor)} survives with ${formatNumber(event.health)} health`;
    case 'roundEnd':
      return `Round ${event.round} ends`;
    case 'combatEnd':
      return event.outcome === 'victory' ? 'Victory' : 'Defeat';
  }
}

function LogActor({ tick }: { tick: TickResult }) {
  if (tick.actor === undefined) {
    return <CombatPortrait size="sm" label="Combat event" />;
  }

  const actor = tick.actor;
  const participant =
    actor.side === 'character'
      ? tick.state.characters[actor.index]
      : tick.state.enemies[actor.index];
  const characterId =
    actor.side === 'character' ? tick.state.characters[actor.index]?.id : undefined;

  return (
    <CombatPortrait
      characterId={characterId}
      size="sm"
      isDefeated={(participant?.health ?? 0) <= 0}
      label={`${participant?.name ?? 'Unknown actor'} portrait`}
    />
  );
}

/** Gedeckeltes Kampf-Log: ein Listeneintrag entspricht genau einem vollständigen Zugblock. */
export function CombatLog({ className = '', heading = 'Combat Log' }: CombatLogProps) {
  const ticks = useCombatStore((state) => state.tickLog);
  const scroller = useRef<HTMLOListElement>(null);
  const followsLatest = useRef(true);

  useEffect(() => {
    const element = scroller.current;
    if (element === null || !followsLatest.current) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }, [ticks.length]);

  const updateFollowLatest = () => {
    const element = scroller.current;
    if (element === null) return;
    followsLatest.current = element.scrollTop + element.clientHeight >= element.scrollHeight - 8;
  };

  return (
    <section aria-label="Combat Log" className={cn('flex min-h-0 flex-col', className)}>
      <SectionTitle className="mb-3">{heading}</SectionTitle>
      <Panel
        variant="plain"
        data-testid="combat-log-panel"
        className="flex min-h-0 flex-1 flex-col"
      >
        {ticks.length === 0 ? (
          <p className="text-sm text-text-muted">No turns resolved yet.</p>
        ) : null}
        <ol
          ref={scroller}
          aria-label="Combat log"
          aria-live="polite"
          onScroll={updateFollowLatest}
          className={
            ticks.length === 0 ? 'sr-only' : 'min-h-0 flex-1 space-y-2 overflow-y-auto pr-2'
          }
        >
          {ticks.map((entry) => (
            <li
              key={entry.id}
              className="flex gap-3 rounded-lg border border-border bg-background/40 p-2.5 text-sm"
            >
              <LogActor tick={entry.tick} />
              <div className="min-w-0 flex-1 space-y-1.5">
                {entry.tick.events.map((event, eventIndex) => (
                  <p key={`${event.type}-${eventIndex}`} data-event-type={event.type}>
                    {eventText(entry.tick.state, event)}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </Panel>
    </section>
  );
}
