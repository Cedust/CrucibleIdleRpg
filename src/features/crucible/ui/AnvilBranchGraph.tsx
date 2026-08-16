import { useMemo, useRef, type ReactNode } from 'react';
import type { CrucibleNode, CrucibleRanks } from '@/game/crucible/crucible';
import { cn } from '@/shared/ui/utils/cn';
import { ConnectionLayer } from '@/shared/ui/tree/ConnectionLayer';
import { useConnectionPaths } from '@/shared/ui/tree/useConnectionPaths';
import { crucibleConnections } from '../crucibleConnections';
import {
  type CrucibleBranchLayout,
  type CrucibleBranchPresentation,
  type CrucibleBranchSlot,
} from '../cruciblePresentation';

interface CrucibleBranchGraphProps {
  nodes: readonly CrucibleNode[];
  ranks: CrucibleRanks;
  branches: readonly CrucibleBranchPresentation[];
  renderNode: (node: CrucibleNode, slot: CrucibleBranchSlot) => ReactNode;
}

/**
 * 8rem-Node-Spalten der Branch-Layouts — bewusst ohne `@theme`-Token:
 * lokale TS-Konstante, ein Konsument.
 */
const NODE_COLUMNS_GRID =
  '@branch-cols:grid-cols-[8rem_minmax(2rem,1fr)_8rem_minmax(2rem,1fr)_8rem]';

const BRANCH_GRID_CLASS: Record<CrucibleBranchLayout, string> = {
  single: 'grid min-w-0 grid-cols-1',
  chain: `grid min-w-0 grid-cols-1 gap-y-5 ${NODE_COLUMNS_GRID} @branch-cols:gap-y-0`,
  fork: `grid min-w-0 grid-cols-1 gap-y-5 ${NODE_COLUMNS_GRID} @branch-cols:gap-y-3`,
  parallel: 'grid min-w-0 grid-cols-1 gap-y-5 @branch-cols:grid-cols-4 @branch-cols:gap-y-0',
  paired: `grid min-w-0 grid-cols-1 gap-y-5 ${NODE_COLUMNS_GRID} @branch-cols:gap-y-5`,
};

const SLOT_CLASS: Record<CrucibleBranchLayout, Partial<Record<CrucibleBranchSlot, string>>> = {
  single: {
    only: 'col-start-1 row-start-1 w-full',
  },
  chain: {
    start: 'col-start-1 row-start-1 w-full',
    middle: 'col-start-1 row-start-2 w-full @branch-cols:col-start-3 @branch-cols:row-start-1',
    end: 'col-start-1 row-start-3 w-full @branch-cols:col-start-5 @branch-cols:row-start-1',
  },
  fork: {
    start: 'col-start-1 row-start-1 w-full',
    middle:
      'col-start-1 row-start-2 ml-16 w-[calc(100%-4rem)] @branch-cols:col-start-3 @branch-cols:row-start-1 @branch-cols:ml-0 @branch-cols:w-full',
    end: 'col-start-1 row-start-3 ml-16 w-[calc(100%-4rem)] @branch-cols:col-start-5 @branch-cols:row-start-1 @branch-cols:ml-0 @branch-cols:w-full',
    'lower-middle':
      'col-start-1 row-start-4 w-full @branch-cols:col-start-3 @branch-cols:row-start-2',
  },
  parallel: {
    start: 'col-start-1 row-start-1 w-full @branch-cols:col-start-1',
    middle: 'col-start-1 row-start-2 w-full @branch-cols:col-start-2 @branch-cols:row-start-1',
    end: 'col-start-1 row-start-3 w-full @branch-cols:col-start-3 @branch-cols:row-start-1',
    last: 'col-start-1 row-start-4 w-full @branch-cols:col-start-4 @branch-cols:row-start-1',
  },
  paired: {
    start: 'col-start-1 row-start-1 w-full @branch-cols:col-start-1',
    middle: 'col-start-1 row-start-3 w-full @branch-cols:col-start-1 @branch-cols:row-start-2',
    end: 'col-start-1 row-start-5 w-full @branch-cols:col-start-1 @branch-cols:row-start-3',
    'lower-start':
      'col-start-1 row-start-2 w-full @branch-cols:col-start-3 @branch-cols:row-start-1',
    'lower-middle':
      'col-start-1 row-start-4 w-full @branch-cols:col-start-3 @branch-cols:row-start-2',
    'lower-end': 'col-start-1 row-start-6 w-full @branch-cols:col-start-3 @branch-cols:row-start-3',
  },
};

function CrucibleBranch({
  branch,
  nodesById,
  ranks,
  renderNode,
}: {
  branch: CrucibleBranchPresentation;
  nodesById: ReadonlyMap<string, CrucibleNode>;
  ranks: CrucibleRanks;
  renderNode: (node: CrucibleNode, slot: CrucibleBranchSlot) => ReactNode;
}) {
  const graphRef = useRef<HTMLDivElement>(null);
  const branchNodes = useMemo(
    () =>
      branch.nodes.flatMap(({ nodeId }) => {
        const node = nodesById.get(nodeId);
        return node === undefined ? [] : [node];
      }),
    [branch.nodes, nodesById],
  );
  const connections = useMemo(() => crucibleConnections(branchNodes, ranks), [branchNodes, ranks]);
  const paths = useConnectionPaths(graphRef, connections);
  const headingId = `crucible-branch-${branch.id}`;

  return (
    <section
      data-crucible-branch={branch.id}
      aria-labelledby={headingId}
      className="grid min-w-0 gap-2 border-t border-border/50 py-2.5 first:border-t-0 @branch-cols:grid-cols-[7rem_minmax(0,1fr)] @branch-cols:gap-4"
    >
      <h4
        id={headingId}
        className="text-2xs font-semibold tracking-[0.16em] text-text-muted @branch-cols:pt-7"
      >
        {branch.label}
      </h4>
      <div ref={graphRef} className="relative min-w-0">
        <ConnectionLayer connections={connections} paths={paths} />
        <div className={cn('relative z-10', BRANCH_GRID_CLASS[branch.layout])}>
          {branch.nodes.map(({ nodeId, slot }) => {
            const node = nodesById.get(nodeId);
            if (node === undefined) return null;

            return (
              <div key={nodeId} className={SLOT_CLASS[branch.layout][slot]}>
                {renderNode(node, slot)}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Compact branch lanes for a Crucible tree's independent upgrade paths. */
export function CrucibleBranchGraph({
  nodes,
  ranks,
  branches,
  renderNode,
}: CrucibleBranchGraphProps) {
  const nodesById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  return (
    <div data-testid="crucible-branch-graph" className="@container mx-auto w-full max-w-5xl">
      {branches.map((branch) => (
        <CrucibleBranch
          key={branch.id}
          branch={branch}
          nodesById={nodesById}
          ranks={ranks}
          renderNode={renderNode}
        />
      ))}
    </div>
  );
}
