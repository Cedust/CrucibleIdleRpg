import { useMemo, useRef } from 'react';
import type { MasteryNode } from '@/game/weaponMastery/mastery';
import { ConnectionLayer } from '@/shared/ui/tree/ConnectionLayer';
import { NodeButton, type NodeAvailability } from '@/shared/ui/controls/NodeButton';
import { Panel } from '@/shared/ui/layout/Panel';
import { useConnectionPaths, type NodeConnection } from '@/shared/ui/tree/useConnectionPaths';
import { MasteryNodeIcon } from './MasteryNodeIcon';
import { masteryNodeLane, RANK_PRESENTATION } from '../masteryPresentation';

function treeConnections(
  nodes: readonly MasteryNode[],
  ranks: Readonly<Record<string, number>>,
): readonly NodeConnection[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return nodes.flatMap((target) =>
    target.prerequisites.flatMap((id) => {
      const source = byId.get(id);
      return source === undefined
        ? []
        : [{ sourceId: source.id, targetId: target.id, unlocked: (ranks[source.id] ?? 0) > 0 }];
    }),
  );
}

export function MasteryTreeGraph({
  nodes,
  ranks,
  selectedId,
  availabilityFor,
  onSelect,
  label,
}: {
  nodes: readonly MasteryNode[];
  ranks: Readonly<Record<string, number>>;
  selectedId: string | null;
  availabilityFor: (node: MasteryNode) => NodeAvailability;
  onSelect: (id: string) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const connections = useMemo(() => treeConnections(nodes, ranks), [nodes, ranks]);
  const paths = useConnectionPaths(ref, connections);
  return (
    <Panel
      as="section"
      variant="thin"
      padding="none"
      role="tabpanel"
      id={`mastery-tree-panel-${nodes[0]?.discipline ?? 'unknown'}`}
      aria-labelledby={`mastery-tab-${nodes[0]?.discipline ?? 'unknown'}`}
      aria-label={`${label} mastery tree`}
      className="flex min-w-0 flex-col @tree-cols:h-full @tree-cols:min-h-0"
    >
      <div className="min-h-0 flex-1 overflow-auto p-4 pb-5">
        {/* min-w-225 ist der Lesbarkeits-Floor des Canvas. Der Canvas
            bleibt Block-Element: Seine Höhe folgt dem Inhalt, damit das Connector-SVG
            (absolute inset-0) auch beim internen Scrollen alle Pfade abdeckt. */}
        <div ref={ref} className="relative min-w-225">
          <ConnectionLayer connections={connections} paths={paths} />
          <div className="relative z-10 grid grid-cols-5 gap-4">
            {RANK_PRESENTATION.map((rank) => (
              <section key={rank.id} aria-label={rank.label}>
                <header className="mb-5 text-center">
                  <h3 className="font-display text-xs tracking-wide text-accent-strong">
                    {rank.label}
                  </h3>
                  <p className="mt-1 text-2xs font-semibold uppercase tracking-wide text-text-muted">
                    Level {rank.level}
                  </p>
                </header>
                <div className="grid gap-5">
                  {nodes
                    .filter((node) => node.rank === rank.id)
                    .toSorted((a, b) => masteryNodeLane(a, nodes) - masteryNodeLane(b, nodes))
                    .map((node) => {
                      const currentRank = ranks[node.id] ?? 0;
                      return (
                        <div key={node.id} className="flex justify-center">
                          <NodeButton
                            nodeId={node.id}
                            name={node.name}
                            visibleLabel={node.label}
                            effect={node.effect}
                            rank={currentRank}
                            maxRank={node.maxRank}
                            availability={availabilityFor(node)}
                            insufficientStatus="No Mastery Points"
                            selected={selectedId === node.id}
                            medallionSize="md"
                            onSelect={() => onSelect(node.id)}
                          >
                            <MasteryNodeIcon node={node} />
                          </NodeButton>
                        </div>
                      );
                    })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
