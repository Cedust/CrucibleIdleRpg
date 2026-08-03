import { z } from 'zod';

/**
 * Zod-Schema des Speicherstands (siehe AGENTS.md §7).
 * Pro Save-Version ein Schema; die Versionsnummer steuert die Migration.
 * Beim Laden wird gegen dieses Schema validiert, bevor Daten in den Store gelangen.
 */
export const SAVE_VERSION = 1;

const uint32Schema = z.number().int().min(0).max(0xffffffff);
const progressionSchema = z
  .object({
    level: z.number().int().min(1).max(100),
    xp: z.number().int().nonnegative(),
  })
  .strict();

export const saveSchemaV1 = z
  .object({
    version: z.literal(1),
    saveSeed: uint32Schema,
    runCounter: z.number().int().nonnegative(),
    playbackSpeed: z.union([z.literal(1), z.literal(2)]),
    characters: z
      .object({
        korvin: progressionSchema,
        rhaya: progressionSchema,
        quinn: progressionSchema,
      })
      .strict(),
    currencies: z
      .object({
        gold: z.number().int().nonnegative(),
        crystals: z.number().int().nonnegative(),
      })
      .strict(),
    firstVictories: z.array(z.string()).readonly(),
  })
  .strict();

export type SaveDataV1 = z.infer<typeof saveSchemaV1>;

/** Aktuelles Save-Format (Alias auf die neueste Version). */
export type SaveData = SaveDataV1;
export const currentSaveSchema = saveSchemaV1;

export function createDefaultSave(saveSeed: number): SaveData {
  return {
    version: SAVE_VERSION,
    saveSeed,
    runCounter: 0,
    playbackSpeed: 1,
    characters: {
      korvin: { level: 1, xp: 0 },
      rhaya: { level: 1, xp: 0 },
      quinn: { level: 1, xp: 0 },
    },
    currencies: { gold: 0, crystals: 0 },
    firstVictories: [],
  };
}

/** Erzeugt den einmaligen Save-Seed über die Browser-Kryptografie, nicht über Spiellogik. */
export function createSaveSeed(): number {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0] ?? 0;
}
