import { describe, expect, it } from 'vitest';
import { createDefaultSave } from '@/features/save/saveSchema';
import { deriveFloorSeed, deriveRunSeed } from './combatState';
import { createDungeonEntryCombat, createNextDungeonCombat } from './dungeonCombat';

describe('createDungeonEntryCombat', () => {
  it('starts the selected dungeon at its persisted floor-1 checkpoint', () => {
    const save = { ...createDefaultSave(4242), runCounter: 1 };
    const combat = createDungeonEntryCombat(save, 'A1-D3');

    expect(combat.floorId).toBe('A1-D3-01');
    expect(combat.floorIndex).toBe(40);
    expect(combat.enemies).toHaveLength(5);
  });

  it('chains floors with carried health and deterministic seeds from one run', () => {
    const save = { ...createDefaultSave(4242), runCounter: 3 };
    const first = createDungeonEntryCombat(save, 'A1-D1');
    const afterFirst = {
      ...first,
      characters: first.characters.map((character, index) => ({
        ...character,
        health: index === 1 ? 0 : character.maxHealth - (index + 1) * 10,
      })),
    };
    const second = createNextDungeonCombat(save, afterFirst);
    const third = createNextDungeonCombat(save, second);
    const runSeed = deriveRunSeed(save.saveSeed, 'A1-D1', save.runCounter);

    expect(second.floorId).toBe('A1-D1-02');
    expect(second.floorSeed).toBe(deriveFloorSeed(runSeed, 1));
    expect(second.characters.map((character) => character.health)).toEqual(
      afterFirst.characters.map((character) => character.health),
    );
    expect(third.floorId).toBe('A1-D1-03');
    expect(third.floorSeed).toBe(deriveFloorSeed(runSeed, 2));
  });
});
