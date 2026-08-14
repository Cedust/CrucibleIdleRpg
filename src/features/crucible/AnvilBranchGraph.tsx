import { useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { CrucibleNode, CrucibleRanks } from '@/game/crucible/crucible';
import { crucibleConnections, type CrucibleConnection } from './crucibleConnections';
import {
  type CrucibleBranchLayout,
  type CrucibleBranchPresentation,
  type CrucibleBranchSlot,
} from './cruciblePresentation';

interface CrucibleBranchGraphProps {
  nodes: readonly CrucibleNode[];
  ranks: CrucibleRanks;
  branches: readonly CrucibleBranchPresentation[];
  renderNode: (node: CrucibleNode, slot: CrucibleBranchSlot) => ReactNode;
}

/**
 * 8rem-Node-Spalten der Branch-Layouts — bewusst ohne `@theme`-Token
 * (FOUNDATION §4: lokale TS-Konstante, ein Konsument).
 */
const NODE_COLUMNS_GRID =
  '@min-[800px]:grid-cols-[8rem_minmax(2rem,1fr)_8rem_minmax(2rem,1fr)_8rem]';

const BRANCH_GRID_CLASS: Record<CrucibleBranchLayout, string> = {
  single: 'grid min-w-0 grid-cols-1',
  chain: `grid min-w-0 grid-cols-1 gap-y-5 ${NODE_COLUMNS_GRID} @min-[800px]:gap-y-0`,
  fork: `grid min-w-0 grid-cols-1 gap-y-5 ${NODE_COLUMNS_GRID} @min-[800px]:gap-y-3`,
  parallel: 'grid min-w-0 grid-cols-1 gap-y-5 @min-[800px]:grid-cols-4 @min-[800px]:gap-y-0',
  paired: `grid min-w-0 grid-cols-1 gap-y-5 ${NODE_COLUMNS_GRID} @min-[800px]:gap-y-5`,
};

const SLOT_CLASS: Record<CrucibleBranchLayout, Partial<Record<CrucibleBranchSlot, string>>> = {
  single: {
    only: 'col-start-1 row-start-1 w-full',
  },
  chain: {
    start: 'col-start-1 row-start-1 w-full',
    middle: 'col-start-1 row-start-2 w-full @min-[800px]:col-start-3 @min-[800px]:row-start-1',
    end: 'col-start-1 row-start-3 w-full @min-[800px]:col-start-5 @min-[800px]:row-start-1',
  },
  fork: {
    start: 'col-start-1 row-start-1 w-full',
    middle:
      'col-start-1 row-start-2 ml-16 w-[calc(100%-4rem)] @min-[800px]:col-start-3 @min-[800px]:row-start-1 @min-[800px]:ml-0 @min-[800px]:w-full',
    end: 'col-start-1 row-start-3 ml-16 w-[calc(100%-4rem)] @min-[800px]:col-start-5 @min-[800px]:row-start-1 @min-[800px]:ml-0 @min-[800px]:w-full',
    'lower-middle':
      'col-start-1 row-start-4 w-full @min-[800px]:col-start-3 @min-[800px]:row-start-2',
  },
  parallel: {
    start: 'col-start-1 row-start-1 w-full @min-[800px]:col-start-1',
    middle: 'col-start-1 row-start-2 w-full @min-[800px]:col-start-2 @min-[800px]:row-start-1',
    end: 'col-start-1 row-start-3 w-full @min-[800px]:col-start-3 @min-[800px]:row-start-1',
    last: 'col-start-1 row-start-4 w-full @min-[800px]:col-start-4 @min-[800px]:row-start-1',
  },
  paired: {
    start: 'col-start-1 row-start-1 w-full @min-[800px]:col-start-1',
    middle: 'col-start-1 row-start-3 w-full @min-[800px]:col-start-1 @min-[800px]:row-start-2',
    end: 'col-start-1 row-start-5 w-full @min-[800px]:col-start-1 @min-[800px]:row-start-3',
    'lower-start':
      'col-start-1 row-start-2 w-full @min-[800px]:col-start-3 @min-[800px]:row-start-1',
    'lower-middle':
      'col-start-1 row-start-4 w-full @min-[800px]:col-start-3 @min-[800px]:row-start-2',
    'lower-end': 'col-start-1 row-start-6 w-full @min-[800px]:col-start-3 @min-[800px]:row-start-3',
  },
};

interface NodeAnchor {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

function rounded(value: number): number {
  return Math.round(value * 10) / 10;
}

function anchorFor(rect: DOMRect, containerRect: DOMRect): NodeAnchor {
  const left = rect.left - containerRect.left;
  const top = rect.top - containerRect.top;

  return {
    left,
    right: left + rect.width,
    top,
    bottom: top + rect.height,
    centerX: left + rect.width / 2,
    centerY: top + rect.height / 2,
  };
}

function connectorPath(source: NodeAnchor, target: NodeAnchor): string {
  const deltaX = target.centerX - source.centerX;
  const deltaY = target.centerY - source.centerY;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    const movesRight = deltaX >= 0;
    const sourceX = movesRight ? source.right : source.left;
    const targetX = movesRight ? target.left : target.right;
    const middleX = (sourceX + targetX) / 2;

    return `M ${rounded(sourceX)} ${rounded(source.centerY)} H ${rounded(middleX)} V ${rounded(
      target.centerY,
    )} H ${rounded(targetX)}`;
  }

  const movesDown = deltaY >= 0;
  const sourceY = movesDown ? source.bottom : source.top;
  const targetY = movesDown ? target.top : target.bottom;
  const middleY = (sourceY + targetY) / 2;

  return `M ${rounded(source.centerX)} ${rounded(sourceY)} V ${rounded(middleY)} H ${rounded(
    target.centerX,
  )} V ${rounded(targetY)}`;
}

function connectionKey(connection: CrucibleConnection): string {
  return `${connection.source.id}->${connection.target.id}`;
}

function useMeasuredConnectionPaths(
  containerRef: RefObject<HTMLDivElement | null>,
  connections: readonly CrucibleConnection[],
): ReadonlyMap<string, string> {
  const [paths, setPaths] = useState<ReadonlyMap<string, string>>(() => new Map());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container === null) return;

    const medallions = Array.from(container.querySelectorAll<HTMLElement>('[data-node-medallion]'));

    const updatePaths = () => {
      const containerRect = container.getBoundingClientRect();
      const anchors = new Map(
        medallions.flatMap((medallion) => {
          const nodeId = medallion.dataset.nodeMedallion;
          return nodeId === undefined
            ? []
            : [[nodeId, anchorFor(medallion.getBoundingClientRect(), containerRect)] as const];
        }),
      );
      const nextPaths = new Map<string, string>();

      for (const connection of connections) {
        const source = anchors.get(connection.source.id);
        const target = anchors.get(connection.target.id);
        if (source !== undefined && target !== undefined) {
          nextPaths.set(connectionKey(connection), connectorPath(source, target));
        }
      }

      setPaths((current) => {
        const isUnchanged =
          current.size === nextPaths.size &&
          Array.from(nextPaths).every(([key, path]) => current.get(key) === path);
        return isUnchanged ? current : nextPaths;
      });
    };

    updatePaths();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updatePaths);
      return () => window.removeEventListener('resize', updatePaths);
    }

    const observer = new ResizeObserver(updatePaths);
    observer.observe(container);
    medallions.forEach((medallion) => observer.observe(medallion));
    return () => observer.disconnect();
  }, [connections, containerRef]);

  return paths;
}

function BranchConnections({
  connections,
  paths,
}: {
  connections: readonly CrucibleConnection[];
  paths: ReadonlyMap<string, string>;
}) {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 size-full">
      {connections.map((connection) => {
        const key = connectionKey(connection);
        return (
          <path
            key={key}
            d={paths.get(key) ?? ''}
            data-connection={key}
            data-state={connection.unlocked ? 'unlocked' : 'locked'}
            fill="none"
            stroke="currentColor"
            strokeWidth={connection.unlocked ? 2 : 1.5}
            strokeDasharray={connection.unlocked ? undefined : '3 5'}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={connection.unlocked ? 'text-accent' : 'text-border'}
          />
        );
      })}
    </svg>
  );
}

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
  const paths = useMeasuredConnectionPaths(graphRef, connections);
  const headingId = `crucible-branch-${branch.id}`;

  return (
    <section
      data-crucible-branch={branch.id}
      aria-labelledby={headingId}
      className="grid min-w-0 gap-2 border-t border-border/50 py-2.5 first:border-t-0 @min-[800px]:grid-cols-[7rem_minmax(0,1fr)] @min-[800px]:gap-4"
    >
      <h4
        id={headingId}
        className="text-[0.65rem] font-semibold tracking-[0.16em] text-text-muted @min-[800px]:pt-7"
      >
        {branch.label}
      </h4>
      <div ref={graphRef} className="relative min-w-0">
        <BranchConnections connections={connections} paths={paths} />
        <div className={`relative z-10 ${BRANCH_GRID_CLASS[branch.layout]}`}>
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
