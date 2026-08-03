import { beforeEach, describe, expect, it } from 'vitest';
import { TEAM_ORDER } from '@/game/characters/characters';
import { FORMATIONS } from '@/game/encounters/formations';
import type { FormationDefinition } from '@/game/types';
import { useNavigationStore } from '@/features/shell/navigationStore';
import { neutralProgression } from './characterStats';
import { M1_COMBAT_CONTEXT, nextTick } from './combatEngine';
import { buildCombatState, deriveFloorSeed, deriveRunSeed, type CombatState } from './combatState';
import { COMBAT_LOG_LIMIT, useCombatStore } from './combatStore';
import { buildPendingQueue } from './turnOrder';

function combat(): CombatState {
  return buildCombatState({
    floorId: 'A1-D1-11',
    floorIndex: 10,
    floorSeed: deriveFloorSeed(deriveRunSeed(4242, 'A1-D1', 1), 10),
    formation: FORMATIONS.rampBothLanesCrowded as FormationDefinition,
    team: TEAM_ORDER.map((id) => ({ id, progression: neutralProgression(20) })),
  });
}

describe('useCombatStore', () => {
  beforeEach(() => {
    useCombatStore.getState().clearCombat();
    useCombatStore.getState().setPlaybackSpeed(1);
    useNavigationStore.setState({ activeView: 'combat' });
  });

  it('hält einen neu gestarteten Kampf zunächst pausiert', () => {
    const start = combat();

    useCombatStore.getState().startCombat(start);

    const state = useCombatStore.getState();
    expect(state.combat).toBe(start);
    expect(state.outcome).toBe('ongoing');
    expect(state.isPaused).toBe(true);
    expect(state.playbackSpeed).toBe(1);
    expect(state.lastTick).toBeNull();
    expect(state.turnOrder).toEqual(buildPendingQueue(start));
  });

  it('rechnet über die Store-Aktion exakt denselben nächsten Takt wie die reine Engine', () => {
    const start = combat();
    const expected = nextTick(start, M1_COMBAT_CONTEXT);
    useCombatStore.getState().startCombat(start);

    const actual = useCombatStore.getState().advanceTick();

    expect(actual).toEqual(expected);
    expect(useCombatStore.getState().combat).toEqual(expected.state);
    expect(useCombatStore.getState().lastTick).toEqual(expected);
  });

  it('behält den laufenden Kampf und Playback-Zustand bei einem Ansichtswechsel', () => {
    const start = combat();
    useCombatStore.getState().startCombat(start);
    useCombatStore.getState().setPaused(false);
    useCombatStore.getState().setPlaybackSpeed(2);
    useCombatStore.getState().advanceTick();
    const beforeNavigation = useCombatStore.getState();

    useNavigationStore.getState().setActiveView('team');

    const afterNavigation = useCombatStore.getState();
    expect(afterNavigation.combat).toBe(beforeNavigation.combat);
    expect(afterNavigation.lastTick).toBe(beforeNavigation.lastTick);
    expect(afterNavigation.isPaused).toBe(false);
    expect(afterNavigation.playbackSpeed).toBe(2);
  });

  it('hält genau einen gedeckelten Log-Eintrag je Takt', () => {
    const start = combat();
    const longCombat: CombatState = {
      ...start,
      enemies: start.enemies.map((enemy) => ({
        ...enemy,
        attack: 0,
        health: 1_000_000_000_000,
        maxHealth: 1_000_000_000_000,
      })),
    };
    useCombatStore.getState().startCombat(longCombat);

    for (let index = 0; index < COMBAT_LOG_LIMIT + 5; index += 1) {
      useCombatStore.getState().advanceTick();
    }

    const state = useCombatStore.getState();
    expect(state.tickLog).toHaveLength(COMBAT_LOG_LIMIT);
    expect(state.tickLog.at(-1)).toBe(state.lastTick);
    expect(
      state.tickLog.every((tick) => tick.events.some((event) => event.type === 'turnStart')),
    ).toBe(true);
  });
});
