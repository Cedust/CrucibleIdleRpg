import { describe, expect, it } from 'vitest';
import { ACT_1_DUNGEON_IDS } from './act1';
import { ACT_1_DUNGEON_DISPLAY_META, ACT_DISPLAY_META, ACT_IDS } from './actMeta';

describe('actMeta', () => {
  it('describes every act with a unique label and canon name', () => {
    expect(ACT_DISPLAY_META).toHaveLength(ACT_IDS.length);
    expect(new Set(ACT_DISPLAY_META.map((act) => act.label)).size).toBe(ACT_IDS.length);
    expect(ACT_DISPLAY_META.map((act) => act.name)).toEqual([
      'The Ashen Depths',
      'The Ember Foundry',
      'The Forgotten Citadel',
    ]);
  });

  it('marks only act 1 as having playable content', () => {
    expect(ACT_DISPLAY_META.filter((act) => act.hasContent).map((act) => act.id)).toEqual([
      'act-1',
    ]);
  });

  it('describes every act-1 dungeon with a unique label and name', () => {
    const labels = ACT_1_DUNGEON_IDS.map(
      (dungeonId) => ACT_1_DUNGEON_DISPLAY_META[dungeonId].label,
    );
    const names = ACT_1_DUNGEON_IDS.map((dungeonId) => ACT_1_DUNGEON_DISPLAY_META[dungeonId].name);
    expect(new Set(labels).size).toBe(ACT_1_DUNGEON_IDS.length);
    expect(new Set(names).size).toBe(ACT_1_DUNGEON_IDS.length);
  });
});
