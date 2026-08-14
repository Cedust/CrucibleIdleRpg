import { RotateCcw } from 'lucide-react';
import {
  formatRelicShards,
  meetsPrerequisites,
  rankCost,
  type CompletedDungeons,
  type CrucibleNode,
  type CrucibleRanks,
  type CrucibleTreeId,
} from '@/game/crucible/crucible';
import { Button } from '@/shared/ui/controls/Button';
import { Icon } from '@/shared/ui/icons/Icon';
import { NodeButton, type NodeAvailability } from '@/shared/ui/controls/NodeButton';
import { Panel } from '@/shared/ui/layout/Panel';
import { CrucibleBranchGraph } from './AnvilBranchGraph';
import {
  ANVIL_BRANCH_PRESENTATION,
  CRUCIBLE_TREE_PRESENTATION,
  crucibleNodeIcon,
  MOLTEN_BRANCH_PRESENTATION,
  SMELTING_BRANCH_PRESENTATION,
} from '../cruciblePresentation';

interface CrucibleTreeGraphProps {
  tree: CrucibleTreeId;
  nodes: readonly CrucibleNode[];
  ranks: CrucibleRanks;
  relicShards: number;
  completedDungeons: CompletedDungeons;
  selectedId: string | null;
  respecDisabled?: boolean;
  onRequestRespec?: () => void;
  onSelect: (nodeId: string) => void;
}

function purchaseState(
  node: CrucibleNode,
  rank: number,
  ranks: CrucibleRanks,
  relicShards: number,
  completedDungeons: CompletedDungeons,
): NodeAvailability {
  if (rank >= node.maxRank) return 'max';
  if (
    node.lockedUntil !== undefined ||
    !meetsPrerequisites(ranks, completedDungeons, node, rank + 1)
  ) {
    return 'locked';
  }
  return relicShards >= rankCost(rank + 1) ? 'available' : 'insufficient';
}

function GraphNode({
  node,
  ranks,
  relicShards,
  completedDungeons,
  selectedId,
  layout = 'standard',
  tooltipAlign = 'center',
  onSelect,
}: {
  node: CrucibleNode;
  ranks: CrucibleRanks;
  relicShards: number;
  completedDungeons: CompletedDungeons;
  selectedId: string | null;
  layout?: 'standard' | 'branch';
  tooltipAlign?: 'start' | 'center' | 'end';
  onSelect: (nodeId: string) => void;
}) {
  const rank = ranks[node.id] ?? 0;
  const state = purchaseState(node, rank, ranks, relicShards, completedDungeons);
  const icon = crucibleNodeIcon(node.id);

  return (
    <NodeButton
      nodeId={node.id}
      name={node.name}
      effect={node.effect}
      rank={rank}
      maxRank={node.maxRank}
      availability={state}
      insufficientStatus={`Needs ${formatRelicShards(rankCost(rank + 1))}`}
      selected={selectedId === node.id}
      layout={layout}
      tooltipAlign={tooltipAlign}
      onSelect={() => onSelect(node.id)}
    >
      {icon === undefined ? null : <Icon name={icon} size="xl" className="bg-current" />}
    </NodeButton>
  );
}

/** Top-down graph derived from the catalog's prerequisite relationships. */
export function CrucibleTreeGraph({
  tree,
  nodes,
  ranks,
  relicShards,
  completedDungeons,
  selectedId,
  respecDisabled = false,
  onRequestRespec,
  onSelect,
}: CrucibleTreeGraphProps) {
  const presentation = CRUCIBLE_TREE_PRESENTATION[tree];

  return (
    <Panel
      as="section"
      variant="thin"
      padding="none"
      id={`crucible-tree-panel-${tree}`}
      role="tabpanel"
      aria-labelledby={`crucible-tree-tab-${tree}`}
      data-testid="crucible-tree-graph"
      className="flex min-w-0 flex-col @tree-cols:h-full @tree-cols:min-h-0"
    >
      <div className="relative min-h-112 flex-1 overflow-auto bg-[radial-gradient(circle_at_50%_35%,color-mix(in_srgb,var(--color-ember)_10%,transparent),transparent_58%)] p-4 @tree-cols:min-h-0">
        <h3 className="sr-only">{presentation.label}</h3>
        {onRequestRespec !== undefined ? (
          <div className="mb-3 flex justify-end">
            <Button
              variant="ghost"
              className="flex shrink-0 items-center justify-center gap-2 text-sm"
              disabled={respecDisabled}
              onClick={onRequestRespec}
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              RESPEC
            </Button>
          </div>
        ) : null}

        <div aria-label={`${presentation.label} tree`}>
          <CrucibleBranchGraph
            nodes={nodes}
            ranks={ranks}
            branches={
              tree === 'anvil'
                ? ANVIL_BRANCH_PRESENTATION
                : tree === 'smelting'
                  ? SMELTING_BRANCH_PRESENTATION
                  : MOLTEN_BRANCH_PRESENTATION
            }
            renderNode={(node, slot) => (
              <GraphNode
                node={node}
                ranks={ranks}
                relicShards={relicShards}
                completedDungeons={completedDungeons}
                selectedId={selectedId}
                layout="branch"
                tooltipAlign={
                  slot === 'end' || slot === 'last' || slot === 'lower-end'
                    ? 'end'
                    : slot === 'start' || slot === 'lower-start'
                      ? 'start'
                      : 'center'
                }
                onSelect={onSelect}
              />
            )}
          />
        </div>
      </div>
    </Panel>
  );
}
