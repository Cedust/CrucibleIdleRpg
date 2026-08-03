import { TEAM_ORDER } from '@/game/characters/characters';
import { FLOOR_FORMATIONS, FORMATIONS } from '@/game/encounters/formations';
import type { SaveData } from '@/features/save/saveSchema';
import { neutralProgression } from './characterStats';
import { buildCombatState, deriveFloorSeed, deriveRunSeed, type CombatState } from './combatState';

const M1_FLOOR_ID = 'A1-D1-01';
const M1_DUNGEON_ID = 'A1-D1';

/** Baut den M1-Kampf ausschließlich aus dem zuvor persistierten Save-Stand auf. */
export function createM1Combat(save: SaveData): CombatState {
  const formationId = FLOOR_FORMATIONS[M1_FLOOR_ID];
  const formation = formationId === undefined ? undefined : FORMATIONS[formationId];

  if (formation === undefined) {
    throw new Error(`Keine Formation für ${M1_FLOOR_ID} definiert`);
  }

  return buildCombatState({
    floorId: M1_FLOOR_ID,
    floorIndex: 0,
    floorSeed: deriveFloorSeed(deriveRunSeed(save.saveSeed, M1_DUNGEON_ID, save.runCounter), 0),
    formation,
    team: TEAM_ORDER.map((id) => ({
      id,
      progression: neutralProgression(save.characters[id].level),
    })),
  });
}
