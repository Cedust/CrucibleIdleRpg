import { z } from 'zod';
import type { SavePort } from '@/shared/ports/savePort';
import {
  createDefaultCompletedDungeons,
  createLevelOneProgression,
  currentSaveSchema,
  saveSchemaV1,
  saveSchemaV2,
  saveSchemaV3,
  type SaveData,
} from './saveSchema';

/**
 * Serialisierungs-/Validierungsschicht über dem SavePort (siehe AGENTS.md).
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
      return migrate({
        ...saveSchemaV1.parse(versioned),
        version: 2,
        unlockedDungeonIds: ['A1-D1'],
        completedDungeons: createDefaultCompletedDungeons(),
      });
    case 2:
      return migrate({
        ...saveSchemaV2.parse(versioned),
        version: 3,
        characters: {
          korvin: progressionWithoutMastery(),
          rhaya: progressionWithoutMastery(),
          quinn: progressionWithoutMastery(),
        },
      });
    case 3: {
      const previous = saveSchemaV3.parse(versioned);
      return currentSaveSchema.parse({
        ...previous,
        version: 4,
        characters: {
          korvin: { ...previous.characters.korvin, masteryRanks: {} },
          rhaya: { ...previous.characters.rhaya, masteryRanks: {} },
          quinn: { ...previous.characters.quinn, masteryRanks: {} },
        },
      });
    }
    case 4:
      return currentSaveSchema.parse(versioned);
    default:
      throw new Error(`Unbekannte Save-Version: ${versioned.version}`);
  }
}

function progressionWithoutMastery() {
  const progression = createLevelOneProgression();
  return {
    level: progression.level,
    xp: progression.xp,
    freeAttributePoints: progression.freeAttributePoints,
    attributePoints: progression.attributePoints,
    freeMasteryPoints: progression.freeMasteryPoints,
  };
}

export type SaveService = ReturnType<typeof createSaveService>;
