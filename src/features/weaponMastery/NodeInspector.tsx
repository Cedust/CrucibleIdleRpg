import { minimumLevel, nodeById, type MasteryNode } from '@/game/weaponMastery/mastery';
import { Button } from '@/shared/ui/Button';
import { Panel } from '@/shared/ui/Panel';
import { RankPips } from '@/shared/ui/NodeMedallion';
import { MasteryNodeIcon } from './MasteryNodeIcon';

interface NodeInspectorProps {
  characterId: 'korvin' | 'rhaya' | 'quinn';
  node: MasteryNode;
  rank: number;
  lockReason: string | null;
  onInvest: () => void;
}

/** Detailansicht des gewählten Nodes; der Sperrgrund beschreibt den Invest-Button. */
export function NodeInspector({
  characterId,
  node,
  rank,
  lockReason,
  onInvest,
}: NodeInspectorProps) {
  const prerequisiteText = node.prerequisites.length
    ? node.prerequisites.map((id) => nodeById(characterId, id)?.name ?? id).join(' or ')
    : 'None';
  return (
    <Panel
      as="aside"
      variant="thin"
      padding="none"
      className="min-w-0"
      aria-label="Mastery node inspector"
    >
      <div className="p-5">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-20 items-center justify-center rounded-full border-2 border-ornament bg-ember/10 text-ember-bright shadow-glow-accent">
            <MasteryNodeIcon node={node} className="size-11" />
          </span>
          <h3 className="mt-3 font-display text-display text-accent-strong">{node.name}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Rank {rank} / {node.maxRank}
            {rank < node.maxRank ? ` · Next rank ${rank + 1}` : ''}
          </p>
          <div className="mt-2">
            <RankPips rank={rank} maxRank={node.maxRank} />
          </div>
        </div>
        <p className="mt-5 border-y border-border/70 py-4 text-sm leading-6 text-text-muted">
          {node.effect}
        </p>
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
              Level {minimumLevel(node)}; {prerequisiteText}
            </dd>
          </div>
          <div>
            <dt className="inline text-text-muted">Cost: </dt>
            <dd className="inline">1 Mastery Point</dd>
          </div>
        </dl>
        {node.exclusiveWith ? (
          <p className="mt-3 text-sm text-text-muted">Choose one Master path.</p>
        ) : null}
        {node.sharedCapstone ? (
          <p className="mt-3 text-sm text-text-muted">
            Only one shared Discipline Capstone may be active.
          </p>
        ) : null}
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
      </div>
    </Panel>
  );
}
