import { CRUCIBLE_IDS, rankCost, type CrucibleNode } from '@/game/crucible/crucible';
import { Button } from '@/shared/ui/Button';

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
      ({ nodeId, rank }) => `${nodeId} (${rank === 'matching' ? 'matching rank' : `rank ${rank}`})`,
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
    <aside
      className="rounded-md border border-border bg-surface p-4"
      aria-label="Crucible node inspector"
    >
      <h3 className="font-semibold">{node.name}</h3>
      <p className="mt-2 text-sm text-text-muted">{node.effect}</p>
      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="inline text-text-muted">Rank: </dt>
          <dd className="inline">
            {rank}/{node.maxRank}
          </dd>
        </div>
        <div>
          <dt className="inline text-text-muted">Requires: </dt>
          <dd className="inline">{requirementText(node)}</dd>
        </div>
        <div>
          <dt className="inline text-text-muted">Cost: </dt>
          <dd className="inline">
            {atMaxRank ? 'Fully ranked' : `${rankCost(rank + 1)} Crystals`}
          </dd>
        </div>
      </dl>
      {lockReason !== null && (
        <p id="crucible-lock-reason" className="mt-3 text-sm text-warning">
          {lockReason}
        </p>
      )}
      <Button
        className="mt-4 w-full"
        disabled={lockReason !== null}
        aria-describedby={lockReason !== null ? 'crucible-lock-reason' : undefined}
        onClick={onInvest}
      >
        Invest
      </Button>
    </aside>
  );
}
