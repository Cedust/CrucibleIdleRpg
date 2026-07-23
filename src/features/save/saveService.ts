import type { SavePort } from '@/shared/ports/savePort';
import { createDefaultSave, currentSaveSchema, type SaveData } from './saveSchema';

/**
 * Serialisierungs-/Validierungsschicht über dem SavePort (siehe AGENTS.md §7).
 *
 * Zuständig für JSON, Versionierung/Migration und Zod-Validierung. Bei korruptem
 * oder inkompatiblem Save wird kontrolliert auf den Default zurückgesetzt statt
 * mit fehlerhaftem Zustand abzustürzen.
 */
export function createSaveService(port: SavePort) {
  return {
    async load(now: number): Promise<SaveData> {
      const raw = await port.load();
      if (raw === null) {
        return createDefaultSave(now);
      }

      try {
        const parsed: unknown = JSON.parse(raw);
        const migrated = migrate(parsed);
        return currentSaveSchema.parse(migrated);
      } catch (error) {
        console.warn('Speicherstand ungültig — Zurücksetzen auf Default.', error);
        return createDefaultSave(now);
      }
    },

    async save(data: SaveData): Promise<void> {
      await port.save(JSON.stringify(data));
    },

    async clear(): Promise<void> {
      await port.clear();
    },
  };
}

/**
 * Hebt ältere Save-Versionen schrittweise auf das aktuelle Format an.
 * Noch keine Alt-Versionen vorhanden — Gerüst für spätere Migrationen.
 */
function migrate(data: unknown): unknown {
  return data;
}

export type SaveService = ReturnType<typeof createSaveService>;
