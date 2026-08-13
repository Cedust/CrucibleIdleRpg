import type { CrucibleNode, CrucibleRanks } from '@/game/crucible/crucible';

export interface CrucibleConnection {
  source: CrucibleNode;
  target: CrucibleNode;
  unlocked: boolean;
}

/** Derives visible edges and their state exclusively from catalog prerequisites. */
export function crucibleConnections(
  nodes: readonly CrucibleNode[],
  ranks: CrucibleRanks,
): readonly CrucibleConnection[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  return nodes.flatMap((target) =>
    target.prerequisites.flatMap((prerequisite) => {
      const source = nodesById.get(prerequisite.nodeId);
      if (source === undefined) return [];

      const targetRank = ranks[target.id] ?? 0;
      const requiredRank =
        prerequisite.rank === 'matching'
          ? Math.min(targetRank + 1, target.maxRank)
          : prerequisite.rank;

      return [
        {
          source,
          target,
          unlocked: (ranks[source.id] ?? 0) >= requiredRank,
        },
      ];
    }),
  );
}
