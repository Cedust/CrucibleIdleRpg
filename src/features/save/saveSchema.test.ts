import { describe, expect, it } from 'vitest';
import { createDefaultSave, saveSchemaV1 } from './saveSchema';

describe('saveSchemaV1', () => {
  it('erzeugt einen vollständigen M1-Speicherstand ohne Laufzeit-Kampfzustand', () => {
    expect(createDefaultSave(0x12345678)).toEqual({
      version: 1,
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
    });
  });

  it('weist Felder eines laufenden Kampfes auf jeder Save-Ebene zurück', () => {
    const save = createDefaultSave(123);

    for (const forbidden of [
      { health: 10 },
      { pending: [] },
      { combatPrngState: 42 },
      { floorIndex: 0 },
    ]) {
      expect(saveSchemaV1.safeParse({ ...save, ...forbidden }).success).toBe(false);
    }
  });
});
