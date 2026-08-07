import { TEAM_ORDER } from '@/game/characters/characters';
import {
  getAct1DungeonEntry,
  getNextAct1DungeonEncounter,
  resolveAct1Encounter,
  type Act1DungeonId,
} from '@/game/encounters/act1';
import { FORMATIONS } from '@/game/encounters/formations';
import type { SaveData } from '@/features/save/saveSchema';
import { neutralProgression } from '@/features/combat/engine/characterStats';
import {
  buildCombatState,
  deriveFloorSeed,
  deriveRunSeed,
  type CombatState,
} from '@/features/combat/engine/combatState';

/** Baut den Floor-1-Einstieg eines ausgewählten Dungeons aus dem persistierten Save-Stand. */
export function createDungeonEntryCombat(save: SaveData, dungeonId: Act1DungeonId): CombatState {
  return createDungeonCombat(save, getAct1DungeonEntry(dungeonId));
}

/**
 * Baut den nächsten Floor desselben Runs mit dem Endzustand des vorherigen Kampfs.
 * Gefallene Charaktere bleiben bei `0`, lebende behalten ihre verbleibende Health.
 */
export function createNextDungeonCombat(save: SaveData, previous: CombatState): CombatState {
  const previousEncounter = resolveAct1Encounter(previous.floorId);
  const encounter = getNextAct1DungeonEncounter(previousEncounter);

  if (encounter === null) {
    throw new Error(`Dungeon ${previousEncounter.dungeonId} hat keinen weiteren Floor.`);
  }

  return createDungeonCombat(
    save,
    encounter,
    previous.characters.map((character) => ({
      id: character.id,
      carriedHealth: character.health,
    })),
  );
}

function createDungeonCombat(
  save: SaveData,
  encounter: ReturnType<typeof getAct1DungeonEntry>,
  carriedTeam: readonly { id: (typeof TEAM_ORDER)[number]; carriedHealth?: number }[] = [],
): CombatState {
  // `FORMATIONS` ist ein totales Record über `FormationId` — der Zugriff ist typsicher.
  const formation = FORMATIONS[encounter.formationId];

  return buildCombatState({
    floorId: encounter.id,
    floorIndex: encounter.floorIndex,
    floorSeed: deriveFloorSeed(
      deriveRunSeed(save.saveSeed, encounter.dungeonId, save.runCounter),
      encounter.floorIndex,
    ),
    formation,
    team: TEAM_ORDER.map((id) => ({
      id,
      progression: {
        ...neutralProgression(save.characters[id].level),
        attributePoints: save.characters[id].attributePoints,
        masteryRanks: save.characters[id].masteryRanks,
      },
      carriedHealth: carriedTeam.find((character) => character.id === id)?.carriedHealth,
    })),
  });
}
