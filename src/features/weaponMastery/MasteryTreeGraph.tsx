import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { MasteryNode } from '@/game/weaponMastery/mastery';
import { Panel } from '@/shared/ui/Panel';
import { MasteryNodeButton, type MasteryNodeVisualState } from './MasteryNodeButton';
import { masteryNodeLane, RANK_PRESENTATION } from './masteryPresentation';

export interface TreeConnection {
  source: MasteryNode;
  target: MasteryNode;
  unlocked: boolean;
}

function connectionKey(connection: TreeConnection): string {
  return `${connection.source.id}->${connection.target.id}`;
}

function treeConnections(
  nodes: readonly MasteryNode[],
  ranks: Readonly<Record<string, number>>,
): readonly TreeConnection[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return nodes.flatMap((target) =>
    target.prerequisites.flatMap((id) => {
      const source = byId.get(id);
      return source === undefined
        ? []
        : [{ source, target, unlocked: (ranks[source.id] ?? 0) > 0 }];
    }),
  );
}

function useConnectionPaths(
  ref: RefObject<HTMLDivElement | null>,
  connections: readonly TreeConnection[],
) {
  const [paths, setPaths] = useState<ReadonlyMap<string, string>>(() => new Map());
  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;
    const update = () => {
      const root = container.getBoundingClientRect();
      const anchors = new Map(
        Array.from(container.querySelectorAll<HTMLElement>('[data-node-medallion]')).flatMap(
          (element) => {
            const id = element.dataset.nodeMedallion;
            const rect = element.getBoundingClientRect();
            return id === undefined
              ? []
              : [
                  [
                    id,
                    {
                      left: rect.left - root.left,
                      right: rect.right - root.left,
                      top: rect.top - root.top,
                      bottom: rect.bottom - root.top,
                      x: rect.left - root.left + rect.width / 2,
                      y: rect.top - root.top + rect.height / 2,
                    },
                  ] as const,
                ];
          },
        ),
      );
      const next = new Map<string, string>();
      connections.forEach((connection) => {
        const source = anchors.get(connection.source.id);
        const target = anchors.get(connection.target.id);
        if (!source || !target) return;
        const middle = (source.right + target.left) / 2;
        next.set(
          connectionKey(connection),
          `M ${source.right} ${source.y} H ${middle} V ${target.y} H ${target.left}`,
        );
      });
      setPaths(next);
    };
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(container);
    Array.from(container.querySelectorAll<HTMLElement>('[data-node-medallion]')).forEach((node) =>
      observer.observe(node),
    );
    return () => observer.disconnect();
  }, [connections, ref]);
  return paths;
}

function nodeState(
  node: MasteryNode,
  rank: number,
  failure: string | null,
): MasteryNodeVisualState {
  if (rank >= node.maxRank) return 'max';
  if (failure === null) return 'available';
  return failure === 'No Mastery Points available.' ? 'insufficient' : 'locked';
}

export function MasteryTreeGraph({
  nodes,
  ranks,
  selectedId,
  purchaseFailure,
  onSelect,
  label,
}: {
  nodes: readonly MasteryNode[];
  ranks: Readonly<Record<string, number>>;
  selectedId: string | null;
  purchaseFailure: (node: MasteryNode) => string | null;
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
      className="flex min-w-0 flex-col @min-[1200px]:h-full @min-[1200px]:min-h-0"
    >
      <div className="flex min-h-0 flex-1 overflow-auto p-4 pb-5">
        {/* min-w-225 ist der Lesbarkeits-Floor des Canvas (FOUNDATION §10);
            m-auto zentriert ihn im Scroll-Panel, schmalere Container scrollen. */}
        <div ref={ref} className="relative m-auto w-full min-w-225">
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 size-full">
            {connections.map((connection) => (
              <path
                key={connectionKey(connection)}
                data-connection={connectionKey(connection)}
                data-state={connection.unlocked ? 'unlocked' : 'locked'}
                d={paths.get(connectionKey(connection)) ?? ''}
                fill="none"
                stroke="currentColor"
                strokeWidth={connection.unlocked ? 2 : 1.5}
                strokeDasharray={connection.unlocked ? undefined : '3 5'}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className={connection.unlocked ? 'text-accent' : 'text-border'}
              />
            ))}
          </svg>
          <div className="relative z-10 grid grid-cols-5 gap-4">
            {RANK_PRESENTATION.map((rank) => (
              <section key={rank.id} aria-label={rank.label}>
                <header className="mb-5 text-center">
                  <h3 className="font-display text-xs tracking-wide text-accent-strong">
                    {rank.label}
                  </h3>
                  <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wide text-text-muted">
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
                          <MasteryNodeButton
                            node={node}
                            rank={currentRank}
                            state={nodeState(node, currentRank, purchaseFailure(node))}
                            selected={selectedId === node.id}
                            onSelect={() => onSelect(node.id)}
                          />
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
