import { type Act1DungeonId } from '@/game/encounters/act1';

/**
 * Semantische Hintergrund-Schlüssel; die UI mappt sie auf statische Asset-Klassen
 * (Prompts: concept/PROMPTS.md §1, §12, §13).
 */
export type DungeonBackgroundId = 'ashen-depths' | 'ember-foundry' | 'forgotten-citadel';

export const ACT_IDS = ['act-1', 'act-2', 'act-3'] as const;
export type ActId = (typeof ACT_IDS)[number];

export interface ActDisplayMeta {
  readonly id: ActId;
  readonly label: string;
  /** Kanon-Name aus DESIGN.md §3. */
  readonly name: string;
  readonly backgroundId: DungeonBackgroundId;
  /** Nur Akt 1 hat spielbaren Content (`ACT_1_ENCOUNTERS`). */
  readonly hasContent: boolean;
}

/** Der einzige Akt mit spielbarem Content; Views zeigen seine Dungeons an. */
export const ACT_1_DISPLAY_META: ActDisplayMeta = {
  id: 'act-1',
  label: 'ACT I',
  name: 'The Ashen Depths',
  backgroundId: 'ashen-depths',
  hasContent: true,
};

export const ACT_DISPLAY_META: readonly ActDisplayMeta[] = [
  ACT_1_DISPLAY_META,
  {
    id: 'act-2',
    label: 'ACT II',
    name: 'The Ember Foundry',
    backgroundId: 'ember-foundry',
    hasContent: false,
  },
  {
    id: 'act-3',
    label: 'ACT III',
    name: 'The Forgotten Citadel',
    backgroundId: 'forgotten-citadel',
    hasContent: false,
  },
];

export interface DungeonDisplayMeta {
  readonly label: string;
  /**
   * PLATZHALTER — Die finale Benennung der Akt-1-Dungeons ist eine offene
   * Design-Entscheidung: docs/backlog/OPEN_ISSUES.md.
   */
  readonly name: string;
  /**
   * PLATZHALTER — Kurz-Lore analog zu `name`; final mit der
   * Content-Überarbeitung: docs/backlog/OPEN_ISSUES.md.
   */
  readonly description: string;
  readonly backgroundId: DungeonBackgroundId;
}

export const ACT_1_DUNGEON_DISPLAY_META: Readonly<Record<Act1DungeonId, DungeonDisplayMeta>> = {
  'A1-D1': {
    label: 'DUNGEON I',
    name: 'Cinder Gate',
    description:
      'The outer gate to the Ashen Depths. Once a grand entrance, now reduced to ember and stone.',
    backgroundId: 'ashen-depths',
  },
  'A1-D2': {
    label: 'DUNGEON II',
    name: 'The Charred Vaults',
    description:
      'Vaults of a burned treasury. The soot on the walls still whispers of the fires that sealed them.',
    backgroundId: 'ashen-depths',
  },
  'A1-D3': {
    label: 'DUNGEON III',
    name: 'Ashfall Causeway',
    description:
      'A causeway buried in ash. Every step raises the dust of the kingdom that marched here last.',
    backgroundId: 'ashen-depths',
  },
  'A1-D4': {
    label: 'DUNGEON IV',
    name: 'The Gilded Ossuary',
    description:
      'Gilded tombs of forgotten nobles. Their gold endured; their guardians never left.',
    backgroundId: 'ashen-depths',
  },
  'A1-D5': {
    label: 'DUNGEON V',
    name: 'Throne of Cinders',
    description:
      'The seat of the fallen throne. Behind this gate, the cinders remember their king.',
    backgroundId: 'ashen-depths',
  },
};
