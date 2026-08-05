import { TEAM_ORDER } from '@/game/characters/characters';
import { getAct1DungeonEntry, type Act1DungeonId } from '@/game/encounters/act1';
import { FORMATIONS } from '@/game/encounters/formations';
import type { SaveData } from '@/features/save/saveSchema';
import { neutralProgression } from './characterStats';
import { buildCombatState, deriveFloorSeed, deriveRunSeed, type CombatState } from './combatState';

/** Baut den Floor-1-Einstieg eines ausgewählten Dungeons aus dem persistierten Save-Stand. */
export function createDungeonEntryCombat(save: SaveData, dungeonId: Act1DungeonId): CombatState {
  const encounter = getAct1DungeonEntry(dungeonId);
  const formation = FORMATIONS[encounter.formationId];

  if (formation === undefined) {
    throw new Error(`Keine Formation für ${encounter.id} definiert`);
  }

  return buildCombatState({
    floorId: encounter.id,
    floorIndex: encounter.floorIndex,
    floorSeed: deriveFloorSeed(
      deriveRunSeed(save.saveSeed, dungeonId, save.runCounter),
      encounter.floorIndex,
    ),
    formation,
    team: TEAM_ORDER.map((id) => ({
      id,
      progression: neutralProgression(save.characters[id].level),
    })),
  });
}
