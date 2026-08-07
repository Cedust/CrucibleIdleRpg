import { z } from 'zod';
import { ACT_1_DUNGEON_IDS, type Act1DungeonId } from '@/game/encounters/act1';
import type { CharacterProgressionState } from '@/game/types';
import { minimumLevel, nodesFor } from '@/game/weaponMastery/mastery';

/**
 * Zod-Schema des Speicherstands (siehe AGENTS.md).
 * Im Pre-Release existiert genau ein aktuelles Schema; Schemaänderungen ersetzen
 * Basissave, Schema und Tests atomar. Beim Laden wird gegen dieses Schema validiert,
 * bevor Daten in den Store gelangen; jedes andere Format fällt auf den Default zurück.
 */
export const SAVE_VERSION = 1;

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

/** Mastery-Ränge sind die alleinige Wahrheit über investierte Mastery-Punkte. */
const characterProgressionSchema = progressionSchema
  .extend({
    freeAttributePoints: z.number().int().nonnegative(),
    attributePoints: attributePointsSchema,
    freeMasteryPoints: z.number().int().nonnegative(),
    masteryRanks: z.record(z.string(), z.number().int().min(1).max(5)).readonly(),
  })
  .superRefine((character, context) => {
    const spentAttributes = Object.values(character.attributePoints).reduce(
      (total, points) => total + points,
      0,
    );
    if (character.freeAttributePoints + spentAttributes !== character.level) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Ungültige Attributpunkte.' });
    }
    const spentMastery = Object.values(character.masteryRanks).reduce(
      (total, rank) => total + rank,
      0,
    );
    if (character.freeMasteryPoints + spentMastery !== character.level) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Ungültige Mastery-Punkte.' });
    }
  });

const completedDungeonsSchema = z
  .object({
    'A1-D1': z.boolean(),
    'A1-D2': z.boolean(),
    'A1-D3': z.boolean(),
    'A1-D4': z.boolean(),
    'A1-D5': z.boolean(),
  })
  .strict();

export const saveSchema = z
  .object({
    version: z.literal(SAVE_VERSION),
    saveSeed: uint32Schema,
    runCounter: z.number().int().nonnegative(),
    playbackSpeed: z.union([z.literal(1), z.literal(2)]),
    characters: z
      .object({
        korvin: characterProgressionSchema,
        rhaya: characterProgressionSchema,
        quinn: characterProgressionSchema,
      })
      .strict(),
    currencies: z
      .object({
        gold: z.number().int().nonnegative(),
        crystals: z.number().int().nonnegative(),
      })
      .strict(),
    firstVictories: z
      .array(z.string().regex(/^A\d+-D\d+-\d{2}$/))
      .refine((ids) => new Set(ids).size === ids.length, 'Doppelte Erstsiege.')
      .readonly(),
    unlockedDungeonIds: z
      .array(z.enum(ACT_1_DUNGEON_IDS))
      .refine((ids) => new Set(ids).size === ids.length, 'Doppelte Dungeon-Freischaltungen.')
      .readonly(),
    completedDungeons: completedDungeonsSchema,
  })
  .strict()
  .superRefine((save, context) => {
    for (const [characterId, progression] of Object.entries(save.characters) as [
      keyof typeof save.characters,
      (typeof save.characters)[keyof typeof save.characters],
    ][]) {
      const nodes = nodesFor(characterId);
      for (const [id, rank] of Object.entries(progression.masteryRanks)) {
        const node = nodes.find((candidate) => candidate.id === id);
        if (!node || rank > node.maxRank || progression.level < minimumLevel(node)) {
          context.addIssue({ code: z.ZodIssueCode.custom, message: 'Ungültiger Mastery-Node.' });
          continue;
        }
        if (
          node.prerequisites.length > 0 &&
          !node.prerequisites.some(
            (prerequisite) => (progression.masteryRanks[prerequisite] ?? 0) > 0,
          )
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Mastery-Voraussetzung fehlt.',
          });
        }
        if (node.exclusiveWith && (progression.masteryRanks[node.exclusiveWith] ?? 0) > 0) {
          context.addIssue({ code: z.ZodIssueCode.custom, message: 'Exklusive Mastery-Wahl.' });
        }
      }
      const sharedCapstones = nodes.filter(
        (node) => node.sharedCapstone && (progression.masteryRanks[node.id] ?? 0) > 0,
      );
      if (sharedCapstones.length > 1) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'Mehrere gemeinsame Capstones.' });
      }
    }
  });

export type SaveData = z.infer<typeof saveSchema>;

/** Kompiliert nur, wenn `A` `B` erfüllt — Baustein der Schema-Typ-Abgleiche darunter. */
type AssertExtends<A extends B, B> = A;
type SchemaCharacterProgression = z.infer<typeof characterProgressionSchema>;

/** Das Schema produziert vollständige `CharacterProgressionState`-Werte … */
export type CharacterProgressionSchemaProducesState = AssertExtends<
  SchemaCharacterProgression,
  CharacterProgressionState
>;
/** … und jedes Feld des Typs ist schema-validiert — ein neues Feld fiele hier auf. */
export type CharacterProgressionStateMatchesSchema = AssertExtends<
  CharacterProgressionState,
  SchemaCharacterProgression
>;

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
    masteryRanks: {},
  };
}

/** Erzeugt den einmaligen Save-Seed über die Browser-Kryptografie, nicht über Spiellogik. */
export function createSaveSeed(): number {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0] ?? 0;
}
