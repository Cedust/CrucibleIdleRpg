import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TEAM_ORDER } from '@/game/characters/characters';
import { FORMATIONS } from '@/game/encounters/formations';
import { useNavigationStore } from '@/app/navigationStore';
import { neutralProgression } from '@/features/combat/engine/characterStats';
import { DEFAULT_COMBAT_CONTEXT, nextTick } from '@/features/combat/engine/combatEngine';
import {
  buildCombatState,
  deriveFloorSeed,
  deriveRunSeed,
  type CombatState,
} from '@/features/combat/engine/combatState';
import { COMBAT_LOG_LIMIT, useCombatStore } from './combatStore';
import { buildPendingQueue } from '@/features/combat/engine/turnOrder';
import type { RewardSummary } from '@/features/dungeon/rewards';

const SAVED_REWARD: RewardSummary = {
  gold: 10,
  xp: 15,
  relicShards: 1,
  loot: {
    gems: { amber: 1, ruby: 0, sapphire: 0, emerald: 0, diamond: 0 },
    cinder: 0,
    sigil: null,
  },
};

function combat(): CombatState {
  return buildCombatState({
    floorId: 'A1-D1-11',
    floorIndex: 10,
    floorSeed: deriveFloorSeed(deriveRunSeed(4242, 'A1-D1', 1), 10),
    formation: FORMATIONS.rampBothLanesCrowded,
    team: TEAM_ORDER.map((id) => ({ id, progression: neutralProgression(20) })),
  });
}

describe('useCombatStore', () => {
  beforeEach(() => {
    useCombatStore.getState().clearCombat();
    useCombatStore.getState().setPlaybackSpeed(1);
    useNavigationStore.setState({ activeView: 'dungeons' });
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
    const expected = nextTick(start, DEFAULT_COMBAT_CONTEXT);
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

    useNavigationStore.getState().setActiveView('heroes');

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
    expect(state.tickLog.at(-1)?.tick).toBe(state.lastTick);
    expect(
      state.tickLog.every((entry) => entry.tick.events.some((event) => event.type === 'turnStart')),
    ).toBe(true);
    // Die IDs bleiben auch nach dem Deckeln monoton — stabile Anzeige-Keys.
    expect(state.tickLog.map((entry) => entry.id)).toEqual(
      Array.from({ length: COMBAT_LOG_LIMIT }, (_, index) => index + 5),
    );
  });

  it('committet einen Sieg genau einmal und meldet die gespeicherte Belohnung', async () => {
    const start = combat();
    const winning: CombatState = {
      ...start,
      enemies: start.enemies.map((enemy) => ({ ...enemy, health: 0 })),
    };
    const commitVictory = vi.fn<() => Promise<RewardSummary>>().mockResolvedValue(SAVED_REWARD);

    useCombatStore.getState().startCombat(winning, DEFAULT_COMBAT_CONTEXT, commitVictory);
    useCombatStore.setState({ outcome: 'ongoing' });
    useCombatStore.getState().advanceTick();
    await vi.waitFor(() => expect(useCombatStore.getState().completionStatus).toBe('saved'));

    expect(commitVictory).toHaveBeenCalledOnce();
    expect(useCombatStore.getState().lastReward).toEqual(SAVED_REWARD);
    expect(useCombatStore.getState().advanceTick()).toBeUndefined();
    expect(commitVictory).toHaveBeenCalledOnce();
  });

  it('lässt einen fehlgeschlagenen Reward-Commit gezielt erneut versuchen', async () => {
    const start = combat();
    const winning: CombatState = {
      ...start,
      enemies: start.enemies.map((enemy) => ({ ...enemy, health: 0 })),
    };
    const commitVictory = vi
      .fn<() => Promise<RewardSummary>>()
      .mockRejectedValueOnce(new Error('Speichern fehlgeschlagen'))
      .mockResolvedValueOnce(SAVED_REWARD);

    useCombatStore.getState().startCombat(winning, DEFAULT_COMBAT_CONTEXT, commitVictory);
    useCombatStore.setState({ outcome: 'ongoing' });
    useCombatStore.getState().advanceTick();
    await vi.waitFor(() => expect(useCombatStore.getState().completionStatus).toBe('failed'));

    useCombatStore.getState().retryVictoryCommit();
    await vi.waitFor(() => expect(useCombatStore.getState().completionStatus).toBe('saved'));

    expect(commitVictory).toHaveBeenCalledTimes(2);
    expect(useCombatStore.getState().lastReward).toEqual(SAVED_REWARD);
  });
});
