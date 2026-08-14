import type { ReactNode } from 'react';
import { Check, LockKeyhole, Plus, Stone, type LucideIcon } from 'lucide-react';
import { cn } from './cn';
import { NodeMedallion, RankPips } from './NodeMedallion';
import { focusRing, stateAttrs } from './state';
import { Tooltip } from './Tooltip';

/** Kauf-Facette eines Tree-Nodes (FOUNDATION §5, `data-availability`). */
export type NodeAvailability = 'available' | 'insufficient' | 'locked' | 'max';

type MedallionSize = 'md' | 'lg';

const BADGE_ICON: Record<NodeAvailability, LucideIcon> = {
  available: Plus,
  insufficient: Stone,
  locked: LockKeyhole,
  max: Check,
};

function statusText(
  availability: NodeAvailability,
  rank: number,
  insufficientStatus: string,
): string {
  if (availability === 'max') return 'Max';
  if (availability === 'locked') return 'Locked';
  if (availability === 'insufficient') return insufficientStatus;
  return rank > 0 ? 'Next rank available' : 'Available';
}

/** Statusglyphe am Medaillonrand; skaliert mit der Medaillongröße. */
function StatusBadge({
  availability,
  medallionSize,
}: {
  availability: NodeAvailability;
  medallionSize: MedallionSize;
}) {
  const BadgeIcon = BADGE_ICON[availability];

  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute -right-1 -top-1 flex items-center justify-center rounded-full border border-border bg-background text-text-muted',
        medallionSize === 'lg' ? 'size-6' : 'size-5',
        'group-data-[availability=available]:border-accent group-data-[availability=available]:text-accent-strong',
        'group-data-[availability=max]:border-accent group-data-[availability=max]:text-accent-strong',
      )}
    >
      <BadgeIcon className={medallionSize === 'lg' ? 'size-3.5' : 'size-3'} />
    </span>
  );
}

interface NodeButtonProps {
  /** Anker für `useConnectionPaths` (`data-node-medallion`). */
  nodeId: string;
  /** Zugänglicher Name; `visibleLabel` fällt darauf zurück. */
  name: string;
  visibleLabel?: string;
  /** Tooltip-Inhalt (Node-Effekt). */
  effect: ReactNode;
  rank: number;
  maxRank: number;
  availability: NodeAvailability;
  /** Statustext der insufficient-Facette (z. B. „Needs 3 Relic Shards"). */
  insufficientStatus: string;
  selected: boolean;
  /** `branch` = Crucible-Lane-Layout mit horizontaler Schmalform. */
  layout?: 'standard' | 'branch';
  /** Default: `lg` bei `standard`, `md` bei `branch`. */
  medallionSize?: MedallionSize;
  tooltipAlign?: 'start' | 'center' | 'end';
  onSelect: () => void;
  /** Medaillon-Icon. */
  children: ReactNode;
}

/** Selectable medallion; purchase remains an explicit inspector action. */
export function NodeButton({
  nodeId,
  name,
  visibleLabel,
  effect,
  rank,
  maxRank,
  availability,
  insufficientStatus,
  selected,
  layout = 'standard',
  medallionSize,
  tooltipAlign = 'center',
  onSelect,
  children,
}: NodeButtonProps) {
  const isBranch = layout === 'branch';
  const size = medallionSize ?? (isBranch ? 'md' : 'lg');
  const status = statusText(availability, rank, insufficientStatus);
  const accessibleLabel = `${name}, rank ${rank} of ${maxRank}, ${status}`;

  return (
    <Tooltip
      content={effect}
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
          {...stateAttrs({ selected, semantic: availability === 'locked' ? 'locked' : 'normal' })}
          data-availability={availability === 'locked' ? undefined : availability}
          onClick={onSelect}
          className={cn(
            'group flex min-w-0 cursor-pointer items-center rounded-md px-1 text-center',
            focusRing,
            isBranch
              ? 'w-full max-w-none flex-row gap-3 py-0 text-left @min-[800px]:max-w-32 @min-[800px]:flex-col @min-[800px]:gap-0 @min-[800px]:text-center'
              : 'max-w-32 flex-col py-2',
          )}
        >
          <NodeMedallion size={size} invested={rank > 0} nodeId={nodeId}>
            {children}
            <StatusBadge availability={availability} medallionSize={size} />
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
              {visibleLabel ?? name}
            </span>
            <RankPips rank={rank} maxRank={maxRank} />
          </span>
        </button>
      )}
    </Tooltip>
  );
}
