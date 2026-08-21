import { z } from 'zod';
import { crucibleNodeById, meetsPrerequisites } from '@/game/crucible/crucible';
import type { Act1DungeonId } from '@/game/encounters/act1';
import { createTeamArmor, hasArmorForUnlockedSlots } from '@/game/items/armor';
import { isValidArmorItemState, MAX_ITEM_LEVEL } from '@/game/items/itemLayers';
import { createEmptyGemStock } from '@/game/rewards/lootRewards';
import { createEmptySigilCodex, sigilById } from '@/game/sigils/sigils';
import {
  AMBER_AFFIXES,
  EMERALD_AFFIXES,
  RUBY_AFFIXES,
  SAPPHIRE_AFFIXES,
  type ArmorItem,
  type CharacterProgressionState,
} from '@/game/types';
import { minimumLevel, nodesFor } from '@/game/weaponMastery/mastery';

/**
 * Zod-Schema des Speicherstands (siehe AGENTS.md).
 * Im Pre-Release existiert genau ein aktuelles Schema; Schemaänderungen ersetzen
 * Basissave, Schema und Tests atomar. Beim Laden wird gegen dieses Schema validiert,
 * bevor Daten in den Store gelangen; jedes andere Format fällt auf den Default zurück.
 *
 * Das aktuelle Schema ist die Crucible-Save-Version
 * (docs/spec/PERSISTENCE.md#23-crucible-save-version): Die Node-Ränge sind die alleinige
 * Wahrheit, die freigeschalteten Dungeon-Einstiege werden aus `anvil.waystones` abgeleitet
 * statt gespeichert. Das Versionsfeld bleibt im Pre-Release konstant `1`; es wird erst mit
 * einem Release relevant.
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
      context.addIssue({ code: 'custom', message: 'Ungültige Attributpunkte.' });
    }
    const spentMastery = Object.values(character.masteryRanks).reduce(
      (total, rank) => total + rank,
      0,
    );
    if (character.freeMasteryPoints + spentMastery !== character.level) {
      context.addIssue({ code: 'custom', message: 'Ungültige Mastery-Punkte.' });
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

/** Gem-Werte je Sockel: gerollter Affix strikt aus dem Farb-Pool (ITEMS §8). */
const gemLevelSchema = z.number().int().min(1);
const gemValueSchema = z.number().nonnegative();
const socketedGemSchema = z.discriminatedUnion('color', [
  z
    .object({
      color: z.literal('amber'),
      affix: z.enum(AMBER_AFFIXES),
      gemLevel: gemLevelSchema,
      value: gemValueSchema,
    })
    .strict(),
  z
    .object({
      color: z.literal('ruby'),
      affix: z.enum(RUBY_AFFIXES),
      gemLevel: gemLevelSchema,
      value: gemValueSchema,
    })
    .strict(),
  z
    .object({
      color: z.literal('sapphire'),
      affix: z.enum(SAPPHIRE_AFFIXES),
      gemLevel: gemLevelSchema,
      value: gemValueSchema,
    })
    .strict(),
  z
    .object({
      color: z.literal('emerald'),
      affix: z.enum(EMERALD_AFFIXES),
      gemLevel: gemLevelSchema,
      value: gemValueSchema,
    })
    .strict(),
]);

/** Brand-Referenz auf ein Sigil; die Katalog-Prüfung folgt mit dem Sigil Codex (030/031). */
const armorImprintSchema = z.object({ sigilId: z.string().min(1) }).strict();

/** Persistierter Wissensstand des Sigil Codex, keine Sigil-Gegenstände (ITEMS §5). */
const sigilCodexSchema = z
  .record(z.string(), z.number().int().min(1).max(5))
  .readonly()
  .superRefine((sigils, context) => {
    if (Object.keys(sigils).some((id) => sigilById(id) === undefined)) {
      context.addIssue({ code: 'custom', message: 'Unbekanntes Sigil im Codex.' });
    }
  });

/**
 * Ein Armor-Item mit allen fünf Schichten (ITEMS §2). Die seltenheits-abgeleiteten
 * Invarianten — Item-Level ≤ Cap, Sockelzahl nach Tabelle, Prismatic-Formel, Imprint ab
 * Magic — prüft `isValidArmorItemState`. Prismatic-Sockel bleiben leer, bis die
 * Diamond-Effekte entschieden sind (OPEN_ISSUES §2, Drops ab Akt 2 → M6).
 */
const armorItemSchema = z
  .object({
    slot: z.enum(['chest', 'legs', 'head', 'feet']),
    itemType: z.enum(['armor', 'legguards', 'helmet', 'boots']),
    rarity: z.enum(['common', 'magic', 'rare', 'epic', 'legendary']),
    itemLevel: z.number().int().min(1).max(MAX_ITEM_LEVEL),
    innate: z.enum(['toughness', 'vitality', 'initiative']),
    sockets: z.array(socketedGemSchema.nullable()).readonly(),
    prismaticSockets: z.array(z.null()).readonly(),
    imprint: armorImprintSchema.optional(),
  })
  .strict()
  .superRefine((item, context) => {
    if (!isValidArmorItemState(item)) {
      context.addIssue({ code: 'custom', message: 'Ungültige Item-Schichten.' });
    }
  });

const armorLoadoutSchema = z
  .object({
    chest: armorItemSchema.optional(),
    legs: armorItemSchema.optional(),
    head: armorItemSchema.optional(),
    feet: armorItemSchema.optional(),
  })
  .strict();

const teamArmorSchema = z
  .object({
    korvin: armorLoadoutSchema,
    rhaya: armorLoadoutSchema,
    quinn: armorLoadoutSchema,
  })
  .strict();

export const saveSchema = z
  .object({
    version: z.literal(SAVE_VERSION),
    saveSeed: uint32Schema,
    runCounter: z.number().int().nonnegative(),
    /**
     * Monoton steigender Zähler der Handwerks-Rolls (Jeweler): pro Roll um 1 erhöht und
     * atomar mit dem Ergebnis persistiert — ein Reload liefert denselben Zähler und damit
     * denselben Roll (docs/spec/SIMULATION.md#4-seeds-und-zufalls-ströme, analog `runCounter`).
     */
    craftCounter: z.number().int().nonnegative(),
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
        relicShards: z.number().int().nonnegative(),
        cinder: z.number().int().nonnegative(),
      })
      .strict(),
    /** Globale Gem-Bestände als Zähler, kein Inventar (PERSISTENCE §2). */
    gems: z
      .object({
        amber: z.number().int().nonnegative(),
        ruby: z.number().int().nonnegative(),
        sapphire: z.number().int().nonnegative(),
        emerald: z.number().int().nonnegative(),
        diamond: z.number().int().nonnegative(),
      })
      .strict(),
    sigils: sigilCodexSchema,
    firstVictories: z
      .array(z.string().regex(/^A\d+-D\d+-\d{2}$/))
      .refine((ids) => new Set(ids).size === ids.length, 'Doppelte Erstsiege.')
      .readonly(),
    /** Crucible-Node-Ränge über alle drei Trees — die alleinige Wahrheit (PERSISTENCE §2.3). */
    crucible: z.record(z.string(), z.number().int().min(1).max(5)).readonly(),
    armor: teamArmorSchema,
    completedDungeons: completedDungeonsSchema,
  })
  .strict()
  .superRefine((save, context) => {
    for (const [id, rank] of Object.entries(save.crucible)) {
      const node = crucibleNodeById(id);
      if (node === undefined || rank > node.maxRank || node.lockedUntil !== undefined) {
        context.addIssue({ code: 'custom', message: 'Ungültiger Crucible-Node.' });
        continue;
      }
      if (!meetsPrerequisites(save.crucible, save.completedDungeons, node, rank)) {
        context.addIssue({ code: 'custom', message: 'Crucible-Voraussetzung verletzt.' });
      }
    }
    if (!hasArmorForUnlockedSlots(save.armor, save.crucible)) {
      context.addIssue({ code: 'custom', message: 'Ungültige Armory-Items.' });
    }
    for (const [characterId, progression] of Object.entries(save.characters) as [
      keyof typeof save.characters,
      (typeof save.characters)[keyof typeof save.characters],
    ][]) {
      const nodes = nodesFor(characterId);
      for (const [id, rank] of Object.entries(progression.masteryRanks)) {
        const node = nodes.find((candidate) => candidate.id === id);
        if (!node || rank > node.maxRank || progression.level < minimumLevel(node)) {
          context.addIssue({ code: 'custom', message: 'Ungültiger Mastery-Node.' });
          continue;
        }
        if (
          node.prerequisites.length > 0 &&
          !node.prerequisites.some(
            (prerequisite) => (progression.masteryRanks[prerequisite] ?? 0) > 0,
          )
        ) {
          context.addIssue({
            code: 'custom',
            message: 'Mastery-Voraussetzung fehlt.',
          });
        }
        if (node.exclusiveWith && (progression.masteryRanks[node.exclusiveWith] ?? 0) > 0) {
          context.addIssue({ code: 'custom', message: 'Exklusive Mastery-Wahl.' });
        }
      }
      const sharedCapstones = nodes.filter(
        (node) => node.sharedCapstone && (progression.masteryRanks[node.id] ?? 0) > 0,
      );
      if (sharedCapstones.length > 1) {
        context.addIssue({ code: 'custom', message: 'Mehrere gemeinsame Capstones.' });
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

type SchemaArmorItem = z.infer<typeof armorItemSchema>;

/** Dieselbe Drift-Sicherung für die fünf Item-Schichten des Armor-Items. */
export type ArmorItemSchemaProducesState = AssertExtends<SchemaArmorItem, ArmorItem>;
export type ArmorItemMatchesSchema = AssertExtends<ArmorItem, SchemaArmorItem>;

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
    craftCounter: 0,
    playbackSpeed: 1,
    characters: {
      korvin: createLevelOneProgression(),
      rhaya: createLevelOneProgression(),
      quinn: createLevelOneProgression(),
    },
    currencies: { gold: 0, relicShards: 0, cinder: 0 },
    gems: createEmptyGemStock(),
    sigils: createEmptySigilCodex(),
    firstVictories: [],
    crucible: {},
    armor: createTeamArmor({}),
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
