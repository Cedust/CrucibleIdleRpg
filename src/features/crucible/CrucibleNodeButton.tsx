import { Check, LockKeyhole, Plus, Stone } from 'lucide-react';
import { formatRelicShards, type CrucibleNode } from '@/game/crucible/crucible';
import { cn } from '@/shared/ui/cn';
import { Icon } from '@/shared/ui/Icon';
import { NodeMedallion, RankPips } from '@/shared/ui/NodeMedallion';
import { focusRing, stateAttrs } from '@/shared/ui/state';
import { Tooltip } from '@/shared/ui/Tooltip';
import { crucibleNodeIcon } from './cruciblePresentation';

export type CrucibleNodePurchaseState = 'available' | 'insufficient' | 'locked' | 'max';

interface CrucibleNodeButtonProps {
  node: CrucibleNode;
  rank: number;
  state: CrucibleNodePurchaseState;
  selected: boolean;
  nextRankCost: number | null;
  layout?: 'standard' | 'branch';
  tooltipAlign?: 'start' | 'center' | 'end';
  onSelect: () => void;
}

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
      className={cn(
        'absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full border border-border bg-background text-text-muted',
        'group-data-[availability=available]:border-accent group-data-[availability=available]:text-accent-strong',
        'group-data-[availability=max]:border-accent group-data-[availability=max]:text-accent-strong',
      )}
    >
      <BadgeIcon className="size-3.5" />
    </span>
  );
}

/** Selectable medallion; purchase remains an explicit inspector action. */
export function CrucibleNodeButton({
  node,
  rank,
  state,
  selected,
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
          aria-pressed={selected}
          {...stateAttrs({ selected, semantic: state === 'locked' ? 'locked' : 'normal' })}
          data-availability={state === 'locked' ? undefined : state}
          onClick={onSelect}
          className={cn(
            'group flex min-w-0 cursor-pointer items-center rounded-md px-1 text-center',
            focusRing,
            isBranch
              ? 'w-full max-w-none flex-row gap-3 py-0 text-left @min-[800px]:max-w-32 @min-[800px]:flex-col @min-[800px]:gap-0 @min-[800px]:text-center'
              : 'max-w-32 flex-col py-2',
          )}
        >
          <NodeMedallion size={isBranch ? 'md' : 'lg'} invested={rank > 0} nodeId={node.id}>
            {icon === undefined ? null : <Icon name={icon} size="xl" className="bg-current" />}
            <StatusBadge state={state} />
          </NodeMedallion>
          <span
            className={cn(
              'flex min-w-0 flex-col',
              isBranch ? 'items-start @min-[800px]:items-center' : 'mt-3 min-h-8 items-center',
            )}
          >
            <span
              className={cn(
                'text-xs font-semibold leading-4 text-text',
                isBranch && '@min-[800px]:mt-2',
              )}
            >
              {node.name}
            </span>
            <RankPips rank={rank} maxRank={node.maxRank} />
          </span>
        </button>
      )}
    </Tooltip>
  );
}
