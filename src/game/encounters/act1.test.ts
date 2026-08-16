import { describe, expect, it } from 'vitest';
import { FORMATIONS } from '@/game/encounters/formations';
import {
  ACT_1_DUNGEON_IDS,
  ACT_1_ENCOUNTERS,
  act1FinalFloorClass,
  getAct1DungeonEntry,
  resolveAct1Encounter,
  validateAct1Encounters,
} from './act1';

describe('ACT_1_ENCOUNTERS', () => {
  it('resolves all 100 unique floor IDs to known formations', () => {
    expect(ACT_1_ENCOUNTERS).toHaveLength(100);
    expect(new Set(ACT_1_ENCOUNTERS.map((encounter) => encounter.id))).toHaveLength(100);
    expect(validateAct1Encounters(ACT_1_ENCOUNTERS)).toBeNull();

    for (const encounter of ACT_1_ENCOUNTERS) {
      expect(resolveAct1Encounter(encounter.id)).toBe(encounter);
      expect(FORMATIONS[encounter.formationId]).toBeDefined();
    }
  });

  it('introduces Dungeon 1 ramp-up in four groups of five floors', () => {
    expect(getAct1DungeonEntry('A1-D1').formationId).toBe('rampSingleLanePair');
    expect(resolveAct1Encounter('A1-D1-06').formationId).toBe('rampBothLanes');
    expect(resolveAct1Encounter('A1-D1-11').formationId).toBe('rampBothLanesCrowded');
    expect(resolveAct1Encounter('A1-D1-16').formationId).toBe('rampWithTank');
  });

  it('classifies exactly four elite floors and the Act boss', () => {
    expect(
      ACT_1_ENCOUNTERS.filter((encounter) => encounter.classification === 'normal'),
    ).toHaveLength(95);
    expect(
      ACT_1_ENCOUNTERS.filter((encounter) => encounter.classification === 'elite'),
    ).toHaveLength(4);
    expect(resolveAct1Encounter('A1-D5-20').classification).toBe('boss');
  });

  it('reports the final-floor class per dungeon: boss only for A1-D5', () => {
    expect(ACT_1_DUNGEON_IDS.map((dungeonId) => act1FinalFloorClass(dungeonId))).toEqual([
      'elite',
      'elite',
      'elite',
      'elite',
      'boss',
    ]);
  });
});
