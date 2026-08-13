import { CircleHelp } from 'lucide-react';
import {
  CRUCIBLE_IDS,
  crucibleNodeById,
  formatRelicShards,
  rankCost,
  type CrucibleNode,
} from '@/game/crucible/crucible';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
import { Panel } from '@/shared/ui/Panel';
import { Tooltip } from '@/shared/ui/Tooltip';
import { CrucibleRankPips } from './CrucibleNodeButton';
import { crucibleNodeIcon } from './cruciblePresentation';

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

  return (
    <Panel
      as="aside"
      variant="thin"
      padding="none"
      className="min-w-0"
      aria-label="Crucible node inspector"
    >
      <div className="relative p-5">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-24 items-center justify-center rounded-full border-2 border-ornament bg-ember/10 text-ember-bright shadow-glow-accent">
            <Icon name={crucibleNodeIcon(node.id)} size="xl" className="bg-current" />
          </span>
          <h3 className="mt-4 font-display text-display text-accent-strong">{node.name}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Rank {rank} / {node.maxRank}
          </p>
          <div className="mt-2">
            <CrucibleRankPips rank={rank} maxRank={node.maxRank} />
          </div>
        </div>

        <p className="mt-5 border-y border-border/70 py-4 text-sm leading-6 text-text-muted">
          {node.effect}
        </p>
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
                    className="rounded-full text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
        {lockReason !== null ? (
          <p id="crucible-lock-reason" className="mt-4 text-sm text-warning">
            {lockReason}
          </p>
        ) : null}
        <Button
          className="mt-5 w-full"
          disabled={lockReason !== null}
          aria-describedby={lockReason !== null ? 'crucible-lock-reason' : undefined}
          onClick={onInvest}
        >
          Invest
        </Button>
      </div>
    </Panel>
  );
}
