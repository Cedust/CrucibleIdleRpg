import { minimumLevel, type MasteryNode } from '@/game/weaponMastery/mastery';
import { Button } from '@/shared/ui/Button';

interface NodeInspectorProps {
  node: MasteryNode;
  rank: number;
  lockReason: string | null;
  onInvest: () => void;
}

/** Detailansicht des gewählten Nodes; der Sperrgrund beschreibt den Invest-Button. */
export function NodeInspector({ node, rank, lockReason, onInvest }: NodeInspectorProps) {
  return (
    <aside
      className="rounded-md border border-border bg-surface p-4"
      aria-label="Mastery node inspector"
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
          <dd className="inline">
            Level {minimumLevel(node)}
            {node.prerequisites.length ? `; ${node.prerequisites.join(' or ')}` : ''}
          </dd>
        </div>
        <div>
          <dt className="inline text-text-muted">Cost: </dt>
          <dd className="inline">1 Mastery Point</dd>
        </div>
      </dl>
      {lockReason !== null && (
        <p id="mastery-lock-reason" className="mt-3 text-sm text-warning">
          {lockReason}
        </p>
      )}
      <Button
        className="mt-4 w-full"
        disabled={lockReason !== null}
        aria-describedby={lockReason !== null ? 'mastery-lock-reason' : undefined}
        onClick={onInvest}
      >
        Invest
      </Button>
    </aside>
  );
}
