import { Check, LockKeyhole, Plus, Stone } from 'lucide-react';
import { formatRelicShards, type CrucibleNode } from '@/game/crucible/crucible';
import { Icon } from '@/shared/ui/Icon';
import { Tooltip } from '@/shared/ui/Tooltip';
import { crucibleNodeIcon } from './cruciblePresentation';

export type CrucibleNodePurchaseState = 'available' | 'insufficient' | 'locked' | 'max';

interface CrucibleNodeButtonProps {
  node: CrucibleNode;
  rank: number;
  state: CrucibleNodePurchaseState;
  isSelected: boolean;
  nextRankCost: number | null;
  layout?: 'standard' | 'branch';
  tooltipAlign?: 'start' | 'center' | 'end';
  onSelect: () => void;
}

const MEDALLION_STATE_CLASS: Record<CrucibleNodePurchaseState, string> = {
  available: 'border-accent-strong text-accent-strong shadow-glow-accent',
  insufficient: 'border-border text-text',
  locked: 'border-border text-text-muted opacity-65 grayscale',
  max: 'border-accent text-accent-strong shadow-glow-accent',
};

function accessibleStatus(
  state: CrucibleNodePurchaseState,
  rank: number,
  nextRankCost: number | null,
): string {
  if (state === 'max') return 'Max';
  if (state === 'locked') return 'Locked';
  if (state === 'insufficient') return `Needs ${formatRelicShards(nextRankCost ?? 0)}`;
  return rank > 0 ? 'Next rank available' : 'Available';
}

function StatusBadge({ state }: { state: CrucibleNodePurchaseState }) {
  const BadgeIcon =
    state === 'locked'
      ? LockKeyhole
      : state === 'max'
        ? Check
        : state === 'available'
          ? Plus
          : Stone;

  return (
    <span
      aria-hidden="true"
      className={`absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full border bg-background ${
        state === 'available' || state === 'max'
          ? 'border-accent text-accent-strong'
          : 'border-border text-text-muted'
      }`}
    >
      <BadgeIcon className="size-3.5" />
    </span>
  );
}

export function CrucibleRankPips({ rank, maxRank }: { rank: number; maxRank: number }) {
  return (
    <span aria-hidden="true" className="flex items-center justify-center gap-1">
      {Array.from({ length: maxRank }, (_, index) => (
        <span
          key={index}
          className={`size-2 rotate-45 border ${
            index < rank
              ? 'border-accent-strong bg-accent-strong shadow-[0_0_5px_var(--color-accent)]'
              : 'border-border bg-background'
          }`}
        />
      ))}
    </span>
  );
}

/** Selectable medallion; purchase remains an explicit inspector action. */
export function CrucibleNodeButton({
  node,
  rank,
  state,
  isSelected,
  nextRankCost,
  layout = 'standard',
  tooltipAlign = 'center',
  onSelect,
}: CrucibleNodeButtonProps) {
  const icon = crucibleNodeIcon(node.id);
  const status = accessibleStatus(state, rank, nextRankCost);
  const accessibleLabel = `${node.name}, rank ${rank} of ${node.maxRank}, ${status}`;
  const isBranch = layout === 'branch';

  return (
    <Tooltip
      content={node.effect}
      align={tooltipAlign}
      className={
        isBranch
          ? 'flex min-w-0 w-full justify-start @min-[800px]:justify-center'
          : 'flex min-w-0 justify-center'
      }
    >
      {(trigger) => (
        <button
          {...trigger}
          type="button"
          aria-label={accessibleLabel}
          aria-pressed={isSelected}
          onClick={onSelect}
          className={`group flex min-w-0 items-center rounded-md px-1 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            isBranch
              ? 'w-full max-w-none flex-row gap-3 py-0 text-left @min-[800px]:max-w-32 @min-[800px]:flex-col @min-[800px]:gap-0 @min-[800px]:text-center'
              : 'max-w-32 flex-col py-2'
          }`}
        >
          <span
            data-node-medallion={node.id}
            className={`relative flex items-center justify-center rounded-full border-2 bg-surface-raised/90 transition-[border-color,box-shadow,background-color] motion-reduce:transition-none ${
              MEDALLION_STATE_CLASS[state]
            } shrink-0 ${isBranch ? 'size-16' : 'size-20'} ${rank > 0 ? 'bg-ember/15' : ''} ${
              isSelected
                ? 'ring-2 ring-accent ring-offset-3 ring-offset-surface'
                : 'group-hover:border-ornament'
            }`}
          >
            <span
              aria-hidden="true"
              className="absolute inset-1 rounded-full border border-ornament/40"
            />
            {icon === undefined ? null : <Icon name={icon} size="xl" className="bg-current" />}
            <StatusBadge state={state} />
          </span>
          <span
            className={`flex min-w-0 flex-col ${
              isBranch ? 'items-start @min-[800px]:items-center' : 'mt-3 min-h-8 items-center'
            }`}
          >
            <span
              className={`text-xs font-semibold leading-4 text-text ${
                isBranch ? '@min-[800px]:mt-2' : ''
              }`}
            >
              {node.name}
            </span>
            <CrucibleRankPips rank={rank} maxRank={node.maxRank} />
          </span>
        </button>
      )}
    </Tooltip>
  );
}
