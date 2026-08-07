import { FORMATIONS } from '@/game/encounters/formations';
import type {
  DungeonId,
  EncounterClass,
  FloorEncounterDefinition,
  FloorId,
  FormationId,
} from '@/game/types';

/** Die fünf persistierbaren Dungeon-Checkpoints von Akt 1. */
export const ACT_1_DUNGEON_IDS = ['A1-D1', 'A1-D2', 'A1-D3', 'A1-D4', 'A1-D5'] as const;
export type Act1DungeonId = (typeof ACT_1_DUNGEON_IDS)[number];

export type Act1FloorNumber =
  1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;

export interface Act1EncounterDefinition extends FloorEncounterDefinition {
  id: `A1-D${1 | 2 | 3 | 4 | 5}-${string}`;
  dungeonId: Act1DungeonId;
  floorNumber: Act1FloorNumber;
}

const FLOORS_PER_DUNGEON = 20;

/**
 * PLATZHALTER — Die Besetzung und Werte bleiben bis zum Balancing-Pass offen:
 * docs/backlog/OPEN_ISSUES.md#1-offene-balancing-fragen--tuning-notizen.
 * Die Vorlagen machen die fünf Dungeon-Einstiege dennoch als deklarativen, typisierten Content
 * verwendbar.
 */
const DUNGEON_FORMATIONS: Readonly<Record<Act1DungeonId, readonly FormationId[]>> = {
  'A1-D1': ['rampSingleLanePair', 'rampBothLanes', 'rampBothLanesCrowded', 'rampWithTank'],
  'A1-D2': ['dungeonSkirmish'],
  'A1-D3': ['dungeonPursuit'],
  'A1-D4': ['rampWithTank'],
  'A1-D5': ['dungeonStronghold'],
};

const FLOOR_NUMBERS = Array.from({ length: FLOORS_PER_DUNGEON }, (_, index) => index + 1);

export const ACT_1_ENCOUNTERS: readonly Act1EncounterDefinition[] = ACT_1_DUNGEON_IDS.flatMap(
  (dungeonId, dungeonIndex) =>
    FLOOR_NUMBERS.map((floorNumber) => ({
      id: floorId(dungeonId, floorNumber),
      dungeonId,
      floorNumber: floorNumber as Act1FloorNumber,
      floorIndex: dungeonIndex * FLOORS_PER_DUNGEON + floorNumber - 1,
      classification: encounterClass(dungeonId, floorNumber),
      formationId: formationFor(dungeonId, floorNumber),
    })),
);

const encountersById = new Map<FloorId, Act1EncounterDefinition>(
  ACT_1_ENCOUNTERS.map((encounter) => [encounter.id, encounter]),
);

const contentError = validateAct1Encounters(ACT_1_ENCOUNTERS);
if (contentError !== null) {
  throw new Error(`Ungültiger Akt-1-Encounter-Content: ${contentError}`);
}

/** Liefert den Floor-1-Einstieg eines freigeschalteten Akt-1-Dungeons. */
export function getAct1DungeonEntry(dungeonId: Act1DungeonId): Act1EncounterDefinition {
  return resolveAct1Encounter(floorId(dungeonId, 1));
}

/** Löst eine bekannte Akt-1-Floor-ID deterministisch auf. */
export function resolveAct1Encounter(floorId: FloorId): Act1EncounterDefinition {
  const encounter = encountersById.get(floorId);
  if (encounter === undefined) {
    throw new Error(`Unbekannter Akt-1-Floor: ${floorId}`);
  }
  return encounter;
}

/** Letzter Floor eines Dungeons: Dort endet der Auto-Advance, der Abschluss ist manuell. */
export function isFinalAct1Floor(encounter: Act1EncounterDefinition): boolean {
  return encounter.floorNumber === FLOORS_PER_DUNGEON;
}

/** Liefert den Folgekampf desselben Dungeons oder `null` nach dessen letzten Floor. */
export function getNextAct1DungeonEncounter(
  encounter: Act1EncounterDefinition,
): Act1EncounterDefinition | null {
  if (isFinalAct1Floor(encounter)) {
    return null;
  }

  return resolveAct1Encounter(floorId(encounter.dungeonId, encounter.floorNumber + 1));
}

/** Prüft Vollständigkeit, IDs, Klassifikation und referenzierte Formationen des Contents. */
export function validateAct1Encounters(
  encounters: readonly Act1EncounterDefinition[],
): string | null {
  if (encounters.length !== ACT_1_DUNGEON_IDS.length * FLOORS_PER_DUNGEON) {
    return `erwartet ${ACT_1_DUNGEON_IDS.length * FLOORS_PER_DUNGEON} Floors`;
  }

  const ids = new Set<FloorId>();
  for (const encounter of encounters) {
    const expectedId = floorId(encounter.dungeonId, encounter.floorNumber);
    if (encounter.id !== expectedId || ids.has(encounter.id)) {
      return `ungültige oder doppelte ID ${encounter.id}`;
    }
    if (FORMATIONS[encounter.formationId] === undefined) {
      return `unbekannte Formation ${encounter.formationId}`;
    }
    if (encounter.classification !== encounterClass(encounter.dungeonId, encounter.floorNumber)) {
      return `falsche Klassifikation für ${encounter.id}`;
    }
    ids.add(encounter.id);
  }

  return null;
}

function floorId(dungeonId: Act1DungeonId, floorNumber: number): Act1EncounterDefinition['id'] {
  return `${dungeonId}-${String(floorNumber).padStart(2, '0')}`;
}

function encounterClass(dungeonId: DungeonId, floorNumber: number): EncounterClass {
  if (floorNumber !== FLOORS_PER_DUNGEON) return 'normal';
  return dungeonId === 'A1-D5' ? 'boss' : 'elite';
}

function formationFor(dungeonId: Act1DungeonId, floorNumber: number): FormationId {
  const formations = DUNGEON_FORMATIONS[dungeonId];
  const formationId = formations[dungeonId === 'A1-D1' ? Math.floor((floorNumber - 1) / 5) : 0];
  if (formationId === undefined) {
    throw new Error(`Keine Formation für ${dungeonId} auf Floor ${floorNumber} definiert`);
  }
  return formationId;
}
