import { describe, expect, it } from 'vitest';
import { createDefaultSave, saveSchemaV1, saveSchemaV2 } from './saveSchema';

describe('saveSchemaV2', () => {
  it('creates a complete save with dungeon checkpoints and no runtime combat state', () => {
    expect(createDefaultSave(0x12345678)).toEqual({
      version: 2,
      saveSeed: 0x12345678,
      runCounter: 0,
      playbackSpeed: 1,
      characters: {
        korvin: { level: 1, xp: 0 },
        rhaya: { level: 1, xp: 0 },
        quinn: { level: 1, xp: 0 },
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
      expect(saveSchemaV2.safeParse({ ...save, ...forbidden }).success).toBe(false);
    }
  });

  it('keeps v1 valid for explicit migration without dungeon fields', () => {
    const saveV1 = Object.fromEntries(
      Object.entries(createDefaultSave(123)).filter(
        ([key]) => key !== 'unlockedDungeonIds' && key !== 'completedDungeons',
      ),
    );

    expect(saveSchemaV1.safeParse({ ...saveV1, version: 1 }).success).toBe(true);
  });
});
