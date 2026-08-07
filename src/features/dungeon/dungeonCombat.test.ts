import { describe, expect, it } from 'vitest';
import { createDefaultSave } from '@/features/save/saveSchema';
import { DEFAULT_COMBAT_CONTEXT, runCombat } from '@/features/combat/engine/combatEngine';
import { deriveFloorSeed, deriveRunSeed } from '@/features/combat/engine/combatState';
import { createDungeonEntryCombat, createNextDungeonCombat } from './dungeonCombat';

describe('createDungeonEntryCombat', () => {
  it('starts the selected dungeon at its persisted floor-1 checkpoint', () => {
    const save = { ...createDefaultSave(4242), runCounter: 1 };
    const combat = createDungeonEntryCombat(save, 'A1-D3');

    expect(combat.floorId).toBe('A1-D3-01');
    expect(combat.floorIndex).toBe(40);
    expect(combat.enemies).toHaveLength(5);
  });

  it('liefert für zwei Runs verschiedene, je Save-Stand aber exakt reproduzierbare Verläufe', () => {
    const runForCounter = (runCounter: number) =>
      runCombat(
        createDungeonEntryCombat({ ...createDefaultSave(4242), runCounter }, 'A1-D1'),
        DEFAULT_COMBAT_CONTEXT,
      );
    const first = runForCounter(1);
    const second = runForCounter(2);
    const reloadedSecond = runForCounter(2);

    expect(first.outcome).toBe('victory');
    expect(second.events).not.toEqual(first.events);
    expect(reloadedSecond).toEqual(second);
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

  it('hebt Gefallene mit Rally am Floor-Übergang auf den Rang-Anteil ihrer Max-Health (PROGRESSION §4)', () => {
    // Test-Vektor: Rang 3 setzt einen Gefallenen auf 20 % seiner Max-Health (200 → 40).
    const save = { ...createDefaultSave(4242), crucible: { 'molten.rally': 3 } };
    const first = createDungeonEntryCombat(save, 'A1-D1');
    const afterFirst = {
      ...first,
      characters: first.characters.map((character, index) => ({
        ...character,
        health: index === 1 ? 0 : character.health,
      })),
    };

    const second = createNextDungeonCombat(save, afterFirst);

    const fallen = second.characters[1];
    if (fallen === undefined) throw new Error('Charakter fehlt');
    expect(fallen.health).toBeCloseTo(0.2 * fallen.maxHealth, 10);
    expect(second.characters[0]?.health).toBe(second.characters[0]?.maxHealth);
  });

  it('lässt Gefallene ohne Rally besiegt', () => {
    const save = createDefaultSave(4242);
    const first = createDungeonEntryCombat(save, 'A1-D1');
    const afterFirst = {
      ...first,
      characters: first.characters.map((character, index) => ({
        ...character,
        health: index === 1 ? 0 : character.health,
      })),
    };

    expect(createNextDungeonCombat(save, afterFirst).characters[1]?.health).toBe(0);
  });

  it('wendet die Smelting-Nodes multiplikativ auf die Derived Stats und flach auf die Initiative an', () => {
    const base = createDungeonEntryCombat(createDefaultSave(4242), 'A1-D1');
    const boosted = createDungeonEntryCombat(
      {
        ...createDefaultSave(4242),
        crucible: {
          'smelting.overpower': 5,
          'smelting.iron-skin': 2,
          'smelting.unyielding': 1,
          'smelting.quick-step': 4,
        },
      },
      'A1-D1',
    );

    boosted.characters.forEach((character, index) => {
      const reference = base.characters[index];
      if (reference === undefined) throw new Error('Charakter fehlt');
      expect(character.stats.derived.attack).toBeCloseTo(reference.stats.derived.attack * 1.15, 8);
      expect(character.stats.derived.defense).toBeCloseTo(
        reference.stats.derived.defense * 1.06,
        8,
      );
      expect(character.maxHealth).toBeCloseTo(reference.maxHealth * 1.03, 8);
      expect(character.stats.utility.initiative).toBe(reference.stats.utility.initiative + 4);
    });
  });
});
