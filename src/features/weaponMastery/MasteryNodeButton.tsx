import { Check, LockKeyhole, Plus, Stone } from 'lucide-react';
import type { MasteryNode } from '@/game/weaponMastery/mastery';
import { cn } from '@/shared/ui/cn';
import { NodeMedallion, RankPips } from '@/shared/ui/NodeMedallion';
import { focusRing, stateAttrs } from '@/shared/ui/state';
import { Tooltip } from '@/shared/ui/Tooltip';
import { MasteryNodeIcon } from './MasteryNodeIcon';

export type MasteryNodeVisualState = 'available' | 'insufficient' | 'locked' | 'max';

function statusText(state: MasteryNodeVisualState): string {
  return state === 'max'
    ? 'Max'
    : state === 'locked'
      ? 'Locked'
      : state === 'insufficient'
        ? 'No Mastery Points'
        : 'Available';
}

export function MasteryNodeButton({
  node,
  rank,
  state,
  selected,
  onSelect,
}: {
  node: MasteryNode;
  rank: number;
  state: MasteryNodeVisualState;
  selected: boolean;
  onSelect: () => void;
}) {
  const Badge =
    state === 'max'
      ? Check
      : state === 'available'
        ? Plus
        : state === 'locked'
          ? LockKeyhole
          : Stone;
  return (
    <Tooltip content={node.effect}>
      {(trigger) => (
        <button
          {...trigger}
          type="button"
          aria-label={`${node.name}, rank ${rank} of ${node.maxRank}, ${statusText(state)}`}
          aria-pressed={selected}
          {...stateAttrs({ selected, semantic: state === 'locked' ? 'locked' : 'normal' })}
          data-availability={state === 'locked' ? undefined : state}
          onClick={onSelect}
          className={cn(
            'group flex w-28 cursor-pointer flex-col items-center text-center',
            focusRing,
          )}
        >
          <NodeMedallion size="md" invested={rank > 0} nodeId={node.id}>
            <MasteryNodeIcon node={node} />
            <span
              aria-hidden="true"
              className={cn(
                'absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border border-border bg-background text-text-muted',
                'group-data-[availability=available]:border-accent group-data-[availability=available]:text-accent-strong',
                'group-data-[availability=max]:border-accent group-data-[availability=max]:text-accent-strong',
              )}
            >
              <Badge className="size-3" />
            </span>
          </NodeMedallion>
          <span className="mt-2 min-h-8 text-xs font-semibold leading-4 text-text">
            {node.label}
          </span>
          <RankPips rank={rank} maxRank={node.maxRank} />
        </button>
      )}
    </Tooltip>
  );
}
