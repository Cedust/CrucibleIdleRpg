import { describe, expect, it } from 'vitest';
import { createDefaultSave, saveSchema } from './saveSchema';

describe('saveSchema', () => {
  it('creates a complete save with dungeon checkpoints and no runtime combat state', () => {
    expect(createDefaultSave(0x12345678)).toEqual({
      version: 1,
      saveSeed: 0x12345678,
      runCounter: 0,
      playbackSpeed: 1,
      characters: {
        korvin: {
          level: 1,
          xp: 0,
          freeAttributePoints: 1,
          attributePoints: { ferocity: 0, resilience: 0, vigor: 0 },
          freeMasteryPoints: 1,
          masteryRanks: {},
        },
        rhaya: {
          level: 1,
          xp: 0,
          freeAttributePoints: 1,
          attributePoints: { ferocity: 0, resilience: 0, vigor: 0 },
          freeMasteryPoints: 1,
          masteryRanks: {},
        },
        quinn: {
          level: 1,
          xp: 0,
          freeAttributePoints: 1,
          attributePoints: { ferocity: 0, resilience: 0, vigor: 0 },
          freeMasteryPoints: 1,
          masteryRanks: {},
        },
      },
      currencies: { gold: 0, crystals: 0 },
      firstVictories: [],
      unlockedDungeonIds: ['A1-D1'],
      completedDungeons: {
        'A1-D1': false,
        'A1-D2': false,
        'A1-D3': false,
        'A1-D4': false,
        'A1-D5': false,
      },
    });
  });

  it('rejects runtime combat fields at every save level', () => {
    const save = createDefaultSave(123);

    for (const forbidden of [
      { health: 10 },
      { pending: [] },
      { combatPrngState: 42 },
      { floorIndex: 0 },
    ]) {
      expect(saveSchema.safeParse({ ...save, ...forbidden }).success).toBe(false);
    }
  });

  it('rejects saves with a foreign version number', () => {
    const save = createDefaultSave(123);

    expect(saveSchema.safeParse({ ...save, version: 2 }).success).toBe(false);
  });

  it('uses free mastery points directly and rejects the removed skill-point sums', () => {
    const save = createDefaultSave(123);

    expect(save.characters.korvin.freeMasteryPoints).toBe(1);
    expect(
      saveSchema.safeParse({
        ...save,
        characters: {
          ...save.characters,
          korvin: { ...save.characters.korvin, freeSkillPoints: 1, spentSkillPoints: 0 },
        },
      }).success,
    ).toBe(false);
  });

  it('requires free plus invested mastery points to match character level', () => {
    const save = createDefaultSave(123);
    const valid = {
      ...save,
      characters: {
        ...save.characters,
        korvin: {
          ...save.characters.korvin,
          level: 2,
          freeAttributePoints: 2,
          freeMasteryPoints: 1,
          masteryRanks: { 'finesse.chc-i': 1 },
        },
      },
    };
    expect(saveSchema.safeParse(valid).success).toBe(true);
    expect(
      saveSchema.safeParse({
        ...valid,
        characters: {
          ...valid.characters,
          korvin: { ...valid.characters.korvin, masteryRanks: {} },
        },
      }).success,
    ).toBe(false);
  });

  it('rejects mastery saves with unknown nodes or missing prerequisites', () => {
    const save = createDefaultSave(123);
    const invalid = {
      ...save,
      characters: {
        ...save.characters,
        korvin: {
          ...save.characters.korvin,
          level: 20,
          freeAttributePoints: 20,
          freeMasteryPoints: 19,
          masteryRanks: { 'finesse.chc-ii': 1 },
        },
      },
    };
    expect(saveSchema.safeParse(invalid).success).toBe(false);
  });
});
