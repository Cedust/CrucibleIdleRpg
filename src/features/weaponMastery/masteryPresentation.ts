import type { CharacterId } from '@/game/types';
import { type DisciplineId, type MasteryNode } from '@/game/weaponMastery/mastery';

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

export const RANK_PRESENTATION = [
  { id: 'initiate', label: 'INITIATE', level: 1 },
  { id: 'adept', label: 'ADEPT', level: 20 },
  { id: 'expert', label: 'EXPERT', level: 40 },
  { id: 'master', label: 'MASTER', level: 60 },
  { id: 'grandmaster', label: 'GRANDMASTER', level: 80 },
] as const;
