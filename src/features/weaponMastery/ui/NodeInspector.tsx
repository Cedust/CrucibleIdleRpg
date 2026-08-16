import { minimumLevel, nodeById, type MasteryNode } from '@/game/weaponMastery/mastery';
import { NodeInspectorPanel } from '@/shared/ui/overlay/NodeInspectorPanel';
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
  const nextRank = rank < node.maxRank ? ` · Next rank ${rank + 1}` : '';

  return (
    <NodeInspectorPanel
      label="Mastery node inspector"
      medallion={<MasteryNodeIcon node={node} size="lg" />}
      title={node.name}
      rankCaption={`Rank ${rank} / ${node.maxRank}${nextRank}`}
      rank={rank}
      maxRank={node.maxRank}
      effect={node.effect}
      lockReason={lockReason}
      lockReasonId="mastery-lock-reason"
      onAction={onInvest}
    >
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-accent">Requires</dt>
          <dd className="mt-1 text-text">
            Level {minimumLevel(node)}; {prerequisiteText}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-accent">Cost</dt>
          <dd className="mt-1 text-text">1 Mastery Point</dd>
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
    </NodeInspectorPanel>
  );
}
