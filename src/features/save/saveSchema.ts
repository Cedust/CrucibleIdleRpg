import { z } from 'zod';
import { ACT_1_DUNGEON_IDS, type Act1DungeonId } from '@/game/encounters/act1';
import type { CharacterProgressionState } from '@/game/types';

/**
 * Zod-Schema des Speicherstands (siehe AGENTS.md).
 * Pro Save-Version ein Schema; die Versionsnummer steuert die Migration.
 * Beim Laden wird gegen dieses Schema validiert, bevor Daten in den Store gelangen.
 */
export const SAVE_VERSION = 3;

const uint32Schema = z.number().int().min(0).max(0xffffffff);
const progressionSchema = z
  .object({
    level: z.number().int().min(1).max(100),
    xp: z.number().int().nonnegative(),
  })
  .strict();

const attributePointsSchema = z
  .object({
    ferocity: z.number().int().nonnegative(),
    resilience: z.number().int().nonnegative(),
    vigor: z.number().int().nonnegative(),
  })
  .strict();

const characterProgressionSchema = progressionSchema
  .extend({
    freeAttributePoints: z.number().int().nonnegative(),
    attributePoints: attributePointsSchema,
    freeMasteryPoints: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((character, context) => {
    const spentAttributes = Object.values(character.attributePoints).reduce(
      (total, points) => total + points,
      0,
    );
    if (character.freeAttributePoints + spentAttributes !== character.level) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Ungültige Attributpunkte.' });
    }
    if (character.freeMasteryPoints !== character.level) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Ungültige Mastery-Punkte.' });
    }
  });

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

const completedDungeonsSchema = z
  .object({
    'A1-D1': z.boolean(),
    'A1-D2': z.boolean(),
    'A1-D3': z.boolean(),
    'A1-D4': z.boolean(),
    'A1-D5': z.boolean(),
  })
  .strict();

/**
 * Save v2 ergänzt die M1-Daten um die Dungeon-Granularität aus PROGRESSION §4.
 * `unlockedDungeonIds` ist die Menge der Checkpoints; die Vollendet-Flags liegen explizit
 * je Akt-1-Dungeon vor und werden erst in Task 011 fortgeschrieben.
 */
export const saveSchemaV2 = saveSchemaV1
  .omit({ version: true })
  .extend({
    version: z.literal(2),
    unlockedDungeonIds: z.array(z.enum(ACT_1_DUNGEON_IDS)).readonly(),
    completedDungeons: completedDungeonsSchema,
  })
  .strict();

export type SaveDataV2 = z.infer<typeof saveSchemaV2>;

/** Aktuelles Pre-Release-Schema mit Attribut- und freien Mastery-Punkten. */
export const saveSchemaV3 = saveSchemaV2
  .omit({ version: true, characters: true })
  .extend({
    version: z.literal(3),
    characters: z
      .object({
        korvin: characterProgressionSchema,
        rhaya: characterProgressionSchema,
        quinn: characterProgressionSchema,
      })
      .strict(),
  })
  .strict();

export type SaveDataV3 = Omit<z.infer<typeof saveSchemaV3>, 'characters'> & {
  characters: Record<'korvin' | 'rhaya' | 'quinn', CharacterProgressionState>;
};

/** Aktuelles Save-Format (Alias auf die neueste Version). */
export type SaveData = SaveDataV3;
export const currentSaveSchema = saveSchemaV3;

export function createDefaultCompletedDungeons(): Readonly<Record<Act1DungeonId, boolean>> {
  return {
    'A1-D1': false,
    'A1-D2': false,
    'A1-D3': false,
    'A1-D4': false,
    'A1-D5': false,
  };
}

export function createDefaultSave(saveSeed: number): SaveData {
  return {
    version: SAVE_VERSION,
    saveSeed,
    runCounter: 0,
    playbackSpeed: 1,
    characters: {
      korvin: createLevelOneProgression(),
      rhaya: createLevelOneProgression(),
      quinn: createLevelOneProgression(),
    },
    currencies: { gold: 0, crystals: 0 },
    firstVictories: [],
    unlockedDungeonIds: ['A1-D1'],
    completedDungeons: createDefaultCompletedDungeons(),
  };
}

export function createLevelOneProgression(): CharacterProgressionState {
  return {
    level: 1,
    xp: 0,
    freeAttributePoints: 1,
    attributePoints: { ferocity: 0, resilience: 0, vigor: 0 },
    freeMasteryPoints: 1,
  };
}

/** Erzeugt den einmaligen Save-Seed über die Browser-Kryptografie, nicht über Spiellogik. */
export function createSaveSeed(): number {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0] ?? 0;
}
