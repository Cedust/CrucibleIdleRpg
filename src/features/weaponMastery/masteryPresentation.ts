import type { CharacterId } from '@/game/types';
import {
  minimumLevel,
  nodesFor,
  type DisciplineId,
  type MasteryNode,
} from '@/game/weaponMastery/mastery';
import type { NodeAvailability } from '@/shared/ui/controls/NodeButton';

/** UI order only; game rules retain DISCIPLINES' canonical order. */
export const MASTERY_TAB_ORDER = ['weapon', 'finesse', 'tempest', 'dominance', 'valor'] as const;

export const DISCIPLINE_LABEL: Record<DisciplineId, string> = {
  finesse: 'FINESSE',
  tempest: 'TEMPEST',
  dominance: 'DOMINANCE',
  valor: 'VALOR',
  weapon: 'WEAPON',
};

const WEAPON_LABEL: Record<CharacterId, string> = {
  korvin: 'WARHAMMER',
  rhaya: 'TWIN BLADES',
  quinn: 'LONGBOW',
};

export function disciplineLabel(discipline: DisciplineId, characterId: CharacterId): string {
  return discipline === 'weapon' ? WEAPON_LABEL[characterId] : DISCIPLINE_LABEL[discipline];
}

/** A stable vertical lane inside one rank column. Behaviour nodes deliberately lead their lane. */
export function masteryNodeLane(node: MasteryNode, nodes: readonly MasteryNode[]): number {
  const atRank = nodes
    .filter((candidate) => candidate.rank === node.rank)
    .toSorted((left, right) => {
      const leftBehaviour = left.maxRank === 1 ? 0 : 1;
      const rightBehaviour = right.maxRank === 1 ? 0 : 1;
      return leftBehaviour - rightBehaviour || left.label.localeCompare(right.label);
    });
  return Math.max(
    0,
    atRank.findIndex((candidate) => candidate.id === node.id),
  );
}

/**
 * Strukturelle Kauf-Facette eines Nodes nach den `purchaseFailure`-Regeln;
 * die Sperr-Achse gewinnt gegen fehlende Punkte.
 */
export function masteryNodeAvailability(
  characterId: CharacterId,
  node: MasteryNode,
  level: number,
  ranks: Readonly<Record<string, number>>,
  freeMasteryPoints: number,
): NodeAvailability {
  if ((ranks[node.id] ?? 0) >= node.maxRank) return 'max';

  const missingPrerequisite =
    node.prerequisites.length > 0 && !node.prerequisites.some((id) => (ranks[id] ?? 0) > 0);
  const exclusiveTaken = node.exclusiveWith !== undefined && (ranks[node.exclusiveWith] ?? 0) > 0;
  const capstoneTaken =
    node.sharedCapstone === true &&
    Object.entries(ranks).some(
      ([id, rank]) =>
        rank > 0 &&
        id !== node.id &&
        nodesFor(characterId).some((other) => other.id === id && other.sharedCapstone),
    );
  if (level < minimumLevel(node) || missingPrerequisite || exclusiveTaken || capstoneTaken) {
    return 'locked';
  }

  return freeMasteryPoints > 0 ? 'available' : 'insufficient';
}

export const RANK_PRESENTATION = [
  { id: 'initiate', label: 'INITIATE', level: 1 },
  { id: 'adept', label: 'ADEPT', level: 20 },
  { id: 'expert', label: 'EXPERT', level: 40 },
  { id: 'master', label: 'MASTER', level: 60 },
  { id: 'grandmaster', label: 'GRANDMASTER', level: 80 },
] as const;
