import { z } from 'zod';

/**
 * Zod-Schema des Speicherstands (siehe AGENTS.md §7).
 * Pro Save-Version ein Schema; die Versionsnummer steuert die Migration.
 * Beim Laden wird gegen dieses Schema validiert, bevor Daten in den Store gelangen.
 */
export const SAVE_VERSION = 1;

export const saveSchemaV1 = z.object({
  version: z.literal(1),
  // Platzhalter-Felder — werden mit dem echten Spielzustand gefüllt.
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type SaveDataV1 = z.infer<typeof saveSchemaV1>;

/** Aktuelles Save-Format (Alias auf die neueste Version). */
export type SaveData = SaveDataV1;
export const currentSaveSchema = saveSchemaV1;

export function createDefaultSave(now: number): SaveData {
  return {
    version: SAVE_VERSION,
    createdAt: now,
    updatedAt: now,
  };
}
