import { TEAM_ORDER } from '@/game/characters/characters';
import { rallyShare, smeltingEffects } from '@/game/crucible/crucible';
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
 *
 * **Rally** (docs/spec/PROGRESSION.md#4-checkpoints-wipe--abbruch) wirkt genau hier — am
 * erfolgreichen Floor-Übergang: Alle Gefallenen betreten den Folgefloor mit dem Rang-Anteil
 * ihrer Max-Health. Wipe, Verlassen und Dungeon-Ende laufen nicht über diese Funktion.
 */
export function createNextDungeonCombat(save: SaveData, previous: CombatState): CombatState {
  const previousEncounter = resolveAct1Encounter(previous.floorId);
  const encounter = getNextAct1DungeonEncounter(previousEncounter);

  if (encounter === null) {
    throw new Error(`Dungeon ${previousEncounter.dungeonId} hat keinen weiteren Floor.`);
  }

  const rally = rallyShare(save.crucible);

  return createDungeonCombat(
    save,
    encounter,
    previous.characters.map((character) => ({
      id: character.id,
      carriedHealth: character.health > 0 ? character.health : rally * character.maxHealth,
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
  const smelting = smeltingEffects(save.crucible);

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
        crucibleBonus: smelting.crucibleBonus,
        crucibleInitiative: smelting.initiative,
      },
      carriedHealth: carriedTeam.find((character) => character.id === id)?.carriedHealth,
    })),
  });
}
