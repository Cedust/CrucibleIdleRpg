import type { SavePort } from '@/shared/ports/savePort';
import { saveSchema, type SaveData } from './saveSchema';

/**
 * Serialisierungs-/Validierungsschicht über dem SavePort (siehe AGENTS.md).
 *
 * Zuständig für JSON und Zod-Validierung. Im Pre-Release wird ausschließlich das
 * aktuelle Schema geladen; korrupte oder anders versionierte Saves werden kontrolliert
 * auf den Default zurückgesetzt. Migrationen entstehen nur auf explizite Anforderung.
 */
export function createSaveService(port: SavePort, createFallback: () => SaveData) {
  return {
    async load(): Promise<SaveData> {
      const raw = await port.load();
      if (raw === null) {
        return createFallback();
      }

      try {
        return saveSchema.parse(JSON.parse(raw));
      } catch (error) {
        console.warn('Speicherstand ungültig — Zurücksetzen auf Default.', error);
        return createFallback();
      }
    },

    async save(data: SaveData): Promise<void> {
      const validated = saveSchema.parse(data);
      await port.save(JSON.stringify(validated));
    },

    async clear(): Promise<void> {
      await port.clear();
    },
  };
}

export type SaveService = ReturnType<typeof createSaveService>;
