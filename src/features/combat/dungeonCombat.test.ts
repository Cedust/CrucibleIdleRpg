import { describe, expect, it } from 'vitest';
import { createDefaultSave } from '@/features/save/saveSchema';
import { createDungeonEntryCombat } from './dungeonCombat';

describe('createDungeonEntryCombat', () => {
  it('starts the selected dungeon at its persisted floor-1 checkpoint', () => {
    const save = { ...createDefaultSave(4242), runCounter: 1 };
    const combat = createDungeonEntryCombat(save, 'A1-D3');

    expect(combat.floorId).toBe('A1-D3-01');
    expect(combat.floorIndex).toBe(40);
    expect(combat.enemies).toHaveLength(5);
  });
});
