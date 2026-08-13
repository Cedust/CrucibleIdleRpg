import { Check, LockKeyhole, Plus, Stone } from 'lucide-react';
import type { MasteryNode } from '@/game/weaponMastery/mastery';
import { Tooltip } from '@/shared/ui/Tooltip';
import { MasteryNodeIcon } from './MasteryNodeIcon';

export type MasteryNodeVisualState = 'available' | 'insufficient' | 'locked' | 'max';

const STATE_CLASS: Record<MasteryNodeVisualState, string> = {
  available: 'border-accent-strong text-accent-strong shadow-glow-accent',
  insufficient: 'border-border text-text',
  locked: 'border-border text-text-muted opacity-65 grayscale',
  max: 'border-accent text-accent-strong shadow-glow-accent',
};

export function MasteryRankPips({ rank, maxRank }: { rank: number; maxRank: number }) {
  return (
    <span aria-hidden="true" className="flex justify-center gap-1">
      {Array.from({ length: maxRank }, (_, index) => (
        <span
          key={index}
          className={`size-2 rotate-45 border ${index < rank ? 'border-accent-strong bg-accent-strong shadow-[0_0_5px_var(--color-accent)]' : 'border-border bg-background'}`}
        />
      ))}
    </span>
  );
}

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
          onClick={onSelect}
          className="group flex w-28 flex-col items-center text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span
            data-node-medallion={node.id}
            className={`relative flex size-16 items-center justify-center rounded-full border-2 bg-surface-raised/90 transition-[border-color,box-shadow,background-color] motion-reduce:transition-none ${STATE_CLASS[state]} ${rank > 0 ? 'bg-ember/15' : ''} ${selected ? 'ring-2 ring-accent ring-offset-3 ring-offset-surface' : 'group-hover:border-ornament'}`}
          >
            <span
              aria-hidden="true"
              className="absolute inset-1 rounded-full border border-ornament/40"
            />
            <MasteryNodeIcon node={node} />
            <span
              aria-hidden="true"
              className={`absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border bg-background ${state === 'available' || state === 'max' ? 'border-accent text-accent-strong' : 'border-border text-text-muted'}`}
            >
              <Badge className="size-3" />
            </span>
          </span>
          <span className="mt-2 min-h-8 text-xs font-semibold leading-4 text-text">
            {node.label}
          </span>
          <MasteryRankPips rank={rank} maxRank={node.maxRank} />
        </button>
      )}
    </Tooltip>
  );
}
