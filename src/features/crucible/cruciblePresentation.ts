import { CRUCIBLE_IDS, type CrucibleTreeId } from '@/game/crucible/crucible';
import type { IconName } from '@/shared/ui/icons/Icon';

export interface CrucibleTreePresentation {
  label: string;
  icon: IconName;
}

export const CRUCIBLE_TREE_PRESENTATION: Record<CrucibleTreeId, CrucibleTreePresentation> = {
  anvil: { label: 'ANVIL SPARKS', icon: 'crucible-tree-anvil' },
  smelting: { label: 'SMELTING FLAMES', icon: 'crucible-tree-smelting' },
  molten: { label: 'MOLTEN CAST', icon: 'crucible-tree-molten' },
};

export type CrucibleNodeId = (typeof CRUCIBLE_IDS)[keyof typeof CRUCIBLE_IDS];

export type CrucibleBranchSlot =
  | 'only'
  | 'start'
  | 'middle'
  | 'end'
  | 'last'
  | 'lower-start'
  | 'lower-middle'
  | 'lower-end'
  | 'lower-last';
export type CrucibleBranchLayout = 'single' | 'chain' | 'fork' | 'parallel' | 'paired';

export interface CrucibleBranchPresentation {
  id: string;
  label: string;
  layout: CrucibleBranchLayout;
  nodes: readonly {
    nodeId: CrucibleNodeId;
    slot: CrucibleBranchSlot;
  }[];
}

/** UI-only placement; prerequisite edges continue to come from the game catalog. */
export const ANVIL_BRANCH_PRESENTATION = [
  {
    id: 'dungeon-access',
    label: 'DUNGEONS',
    layout: 'single',
    nodes: [{ nodeId: CRUCIBLE_IDS.waystones, slot: 'only' }],
  },
  {
    id: 'crafting',
    label: 'CRAFTING',
    layout: 'chain',
    nodes: [
      { nodeId: CRUCIBLE_IDS.armory, slot: 'start' },
      { nodeId: CRUCIBLE_IDS.blacksmith, slot: 'middle' },
      { nodeId: CRUCIBLE_IDS.jeweler, slot: 'end' },
    ],
  },
  {
    id: 'runes',
    label: 'RUNES',
    layout: 'fork',
    nodes: [
      { nodeId: CRUCIBLE_IDS.runeGrimoire, slot: 'start' },
      { nodeId: CRUCIBLE_IDS.talisman, slot: 'middle' },
      { nodeId: CRUCIBLE_IDS.runicFocus, slot: 'end' },
      { nodeId: CRUCIBLE_IDS.runeMastery, slot: 'lower-middle' },
    ],
  },
] as const satisfies readonly CrucibleBranchPresentation[];

export const SMELTING_BRANCH_PRESENTATION = [
  {
    id: 'attributes',
    label: 'ATTRIBUTES',
    layout: 'parallel',
    nodes: [
      { nodeId: CRUCIBLE_IDS.overpower, slot: 'start' },
      { nodeId: CRUCIBLE_IDS.ironSkin, slot: 'middle' },
      { nodeId: CRUCIBLE_IDS.unyielding, slot: 'end' },
      { nodeId: CRUCIBLE_IDS.quickStep, slot: 'last' },
    ],
  },
] as const satisfies readonly CrucibleBranchPresentation[];

export const MOLTEN_BRANCH_PRESENTATION = [
  {
    id: 'combat-arts',
    label: 'COMBAT ARTS',
    layout: 'paired',
    nodes: [
      { nodeId: CRUCIBLE_IDS.mitigation, slot: 'start' },
      { nodeId: CRUCIBLE_IDS.sunder, slot: 'middle' },
      { nodeId: CRUCIBLE_IDS.suppression, slot: 'end' },
      { nodeId: CRUCIBLE_IDS.menace, slot: 'lower-start' },
      { nodeId: CRUCIBLE_IDS.ambush, slot: 'lower-middle' },
      { nodeId: CRUCIBLE_IDS.momentum, slot: 'lower-end' },
    ],
  },
  {
    id: 'survival',
    label: 'SURVIVAL',
    layout: 'chain',
    nodes: [
      { nodeId: CRUCIBLE_IDS.rally, slot: 'start' },
      { nodeId: CRUCIBLE_IDS.secondWind, slot: 'middle' },
    ],
  },
] as const satisfies readonly CrucibleBranchPresentation[];

export const CRUCIBLE_NODE_ICON: Record<CrucibleNodeId, IconName> = {
  [CRUCIBLE_IDS.waystones]: 'crucible-waystones',
  [CRUCIBLE_IDS.armory]: 'crucible-armory',
  [CRUCIBLE_IDS.blacksmith]: 'crucible-blacksmith',
  [CRUCIBLE_IDS.jeweler]: 'crucible-jeweler',
  [CRUCIBLE_IDS.overpower]: 'crucible-overpower',
  [CRUCIBLE_IDS.ironSkin]: 'crucible-iron-skin',
  [CRUCIBLE_IDS.unyielding]: 'crucible-unyielding',
  [CRUCIBLE_IDS.quickStep]: 'crucible-quick-step',
  [CRUCIBLE_IDS.mitigation]: 'crucible-mitigation',
  [CRUCIBLE_IDS.sunder]: 'crucible-sunder',
  [CRUCIBLE_IDS.suppression]: 'crucible-suppression',
  [CRUCIBLE_IDS.rally]: 'crucible-rally',
  [CRUCIBLE_IDS.ambush]: 'crucible-ambush',
  [CRUCIBLE_IDS.menace]: 'crucible-menace',
  [CRUCIBLE_IDS.momentum]: 'crucible-momentum',
  [CRUCIBLE_IDS.secondWind]: 'crucible-second-wind',
  [CRUCIBLE_IDS.runeGrimoire]: 'crucible-rune-grimoire',
  [CRUCIBLE_IDS.talisman]: 'crucible-talisman',
  [CRUCIBLE_IDS.runicFocus]: 'crucible-runic-focus',
  [CRUCIBLE_IDS.runeMastery]: 'crucible-rune-mastery',
};

const CRUCIBLE_NODE_ICON_BY_ID: Readonly<Record<string, IconName | undefined>> = CRUCIBLE_NODE_ICON;

export function crucibleNodeIcon(nodeId: string): IconName | undefined {
  return CRUCIBLE_NODE_ICON_BY_ID[nodeId];
}
