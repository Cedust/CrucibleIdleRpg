import { z } from 'zod';
import type { SavePort } from '@/shared/ports/savePort';
import { currentSaveSchema, saveSchemaV1, type SaveData } from './saveSchema';

/**
 * Serialisierungs-/Validierungsschicht über dem SavePort (siehe AGENTS.md §7).
 *
 * Zuständig für JSON, Versionierung/Migration und Zod-Validierung. Bei korruptem
 * oder inkompatiblem Save wird kontrolliert auf den Default zurückgesetzt statt
 * mit fehlerhaftem Zustand abzustürzen.
 */
export function createSaveService(port: SavePort, createFallback: () => SaveData) {
  return {
    async load(): Promise<SaveData> {
      const raw = await port.load();
      if (raw === null) {
        return createFallback();
      }

      try {
        const parsed: unknown = JSON.parse(raw);
        return migrate(parsed);
      } catch (error) {
        console.warn('Speicherstand ungültig — Zurücksetzen auf Default.', error);
        return createFallback();
      }
    },

    async save(data: SaveData): Promise<void> {
      const validated = currentSaveSchema.parse(data);
      await port.save(JSON.stringify(validated));
    },

    async clear(): Promise<void> {
      await port.clear();
    },
  };
}

const versionSchema = z.object({ version: z.number().int() }).passthrough();

/** Hebt jede bekannte Save-Version explizit auf das aktuelle Format an. */
function migrate(data: unknown): SaveData {
  const versioned = versionSchema.parse(data);

  switch (versioned.version) {
    case 1:
      return saveSchemaV1.parse(versioned);
    default:
      throw new Error(`Unbekannte Save-Version: ${versioned.version}`);
  }
}

export type SaveService = ReturnType<typeof createSaveService>;
