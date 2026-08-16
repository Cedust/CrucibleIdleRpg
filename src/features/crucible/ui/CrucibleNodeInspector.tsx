import { CircleHelp } from 'lucide-react';
import {
  CRUCIBLE_IDS,
  crucibleNodeById,
  formatRelicShards,
  rankCost,
  type CrucibleNode,
} from '@/game/crucible/crucible';
import { cn } from '@/shared/ui/utils/cn';
import { Icon } from '@/shared/ui/icons/Icon';
import { NodeInspectorPanel } from '@/shared/ui/overlay/NodeInspectorPanel';
import { focusRing } from '@/shared/ui/utils/state';
import { Tooltip } from '@/shared/ui/overlay/Tooltip';
import { crucibleNodeIcon } from '../cruciblePresentation';

interface CrucibleNodeInspectorProps {
  node: CrucibleNode;
  rank: number;
  lockReason: string | null;
  onInvest: () => void;
}

/** Voraussetzungs-Text eines Nodes; Waystones verlangen den Abschluss des vorherigen Dungeons. */
function requirementText(node: CrucibleNode): string {
  if (node.id === CRUCIBLE_IDS.waystones) {
    return 'Completing the previous dungeon per rank';
  }
  if (node.prerequisites.length === 0) {
    return 'None';
  }
  return node.prerequisites
    .map(
      ({ nodeId, rank }) =>
        `${crucibleNodeById(nodeId)?.name ?? nodeId} (${rank === 'matching' ? 'matching rank' : `rank ${rank}`})`,
    )
    .join(', ');
}

/** Detailansicht des gewählten Nodes; der Sperrgrund beschreibt den Invest-Button. */
export function CrucibleNodeInspector({
  node,
  rank,
  lockReason,
  onInvest,
}: CrucibleNodeInspectorProps) {
  const atMaxRank = rank >= node.maxRank;
  const icon = crucibleNodeIcon(node.id);

  return (
    <NodeInspectorPanel
      label="Crucible node inspector"
      medallion={icon === undefined ? null : <Icon name={icon} size="xl" className="bg-current" />}
      title={node.name}
      rankCaption={`Rank ${rank} / ${node.maxRank}`}
      rank={rank}
      maxRank={node.maxRank}
      effect={node.effect}
      lockReason={lockReason}
      lockReasonId="crucible-lock-reason"
      onAction={onInvest}
    >
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-accent">Requires</dt>
          <dd className="mt-1 text-text">{requirementText(node)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
            Cost
            <Tooltip content="Each new rank costs its rank number in Relic Shards.">
              {(trigger) => (
                <button
                  {...trigger}
                  type="button"
                  aria-label="How Crucible rank costs work"
                  className={cn('rounded-full text-text-muted', focusRing)}
                >
                  <CircleHelp aria-hidden="true" className="size-3.5" />
                </button>
              )}
            </Tooltip>
          </dt>
          <dd className="mt-1 text-text">
            {atMaxRank ? 'Fully ranked' : formatRelicShards(rankCost(rank + 1))}
          </dd>
        </div>
      </dl>
    </NodeInspectorPanel>
  );
}
