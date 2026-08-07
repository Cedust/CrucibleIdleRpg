// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { TEAM_ORDER } from '@/game/characters/characters';
import { FORMATIONS } from '@/game/encounters/formations';
import { neutralProgression } from '@/features/combat/engine/characterStats';
import { DEFAULT_COMBAT_CONTEXT, nextTick, runCombat } from '@/features/combat/engine/combatEngine';
import {
  buildCombatState,
  deriveFloorSeed,
  deriveRunSeed,
  type CombatState,
} from '@/features/combat/engine/combatState';
import { useCombatStore, type PlaybackSpeed } from './combatStore';
import type { CombatEvent } from '@/features/combat/engine/combatEvents';
import {
  BASE_TICK_MS,
  MAX_CATCH_UP_MS,
  createCombatPlaybackController,
  useCombatPlayback,
  type PlaybackClock,
  type PlaybackFrameScheduler,
  type PlaybackVisibilitySource,
} from './useCombatPlayback';

class ManualClock implements PlaybackClock {
  private timestamp = 0;

  readonly now = () => this.timestamp;

  advance(milliseconds: number): void {
    this.timestamp += milliseconds;
  }
}

class ManualFrameScheduler implements PlaybackFrameScheduler {
  private nextHandle = 1;
  private readonly callbacks = new Map<number, () => void>();

  requests = 0;
  cancellations = 0;

  readonly request = (callback: () => void): number => {
    const handle = this.nextHandle;
    this.nextHandle += 1;
    this.requests += 1;
    this.callbacks.set(handle, callback);
    return handle;
  };

  readonly cancel = (handle: number): void => {
    if (this.callbacks.delete(handle)) {
      this.cancellations += 1;
    }
  };

  runNext(): void {
    const next = this.callbacks.entries().next().value;

    if (next === undefined) {
      throw new Error('Kein geplanter Frame vorhanden');
    }

    const [handle, callback] = next;
    this.callbacks.delete(handle);
    callback();
  }

  pending(): number {
    return this.callbacks.size;
  }
}

class ManualVisibility implements PlaybackVisibilitySource {
  private readonly listeners = new Set<() => void>();

  readonly subscribeVisible = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  emitVisible(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  subscriptions(): number {
    return this.listeners.size;
  }
}

const noVisibility: PlaybackVisibilitySource = {
  subscribeVisible: () => () => undefined,
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

function longCombat(): CombatState {
  const start = combat();

  return {
    ...start,
    enemies: start.enemies.map((enemy) => ({
      ...enemy,
      attack: 0,
      health: 1_000_000_000_000,
      maxHealth: 1_000_000_000_000,
    })),
  };
}

function countStoreTicks(): { count: () => number; unsubscribe: () => void } {
  let ticks = 0;
  const unsubscribe = useCombatStore.subscribe((state, previous) => {
    if (state.lastTick !== null && state.lastTick !== previous.lastTick) {
      ticks += 1;
    }
  });

  return { count: () => ticks, unsubscribe };
}

interface PlaybackRun {
  state: CombatState;
  events: readonly CombatEvent[];
  outcome: 'victory' | 'wipe';
}

function runViaPlayback(start: CombatState, speed: PlaybackSpeed, batchSize: number): PlaybackRun {
  const clock = new ManualClock();
  const scheduler = new ManualFrameScheduler();
  const events: CombatEvent[] = [];
  const unsubscribe = useCombatStore.subscribe((state, previous) => {
    if (state.lastTick !== null && state.lastTick !== previous.lastTick) {
      events.push(...state.lastTick.events);
    }
  });
  const controller = createCombatPlaybackController({
    clock,
    scheduler,
    visibility: noVisibility,
    store: useCombatStore,
  });

  useCombatStore.getState().startCombat(start);
  useCombatStore.getState().setPlaybackSpeed(speed);
  controller.start();
  useCombatStore.getState().setPaused(false);

  let frames = 0;
  while (useCombatStore.getState().outcome === 'ongoing') {
    clock.advance((BASE_TICK_MS / speed) * batchSize);
    scheduler.runNext();
    frames += 1;

    if (frames > 10_000) {
      throw new Error('Playback-Test hat sein Frame-Limit überschritten');
    }
  }

  const result = useCombatStore.getState();
  controller.stop();
  unsubscribe();

  if (result.combat === null || result.outcome === null || result.outcome === 'ongoing') {
    throw new Error('Playback endete ohne entschiedenen Kampf');
  }

  return { state: result.combat, events, outcome: result.outcome };
}

describe('Combat-Playback', () => {
  beforeEach(() => {
    useCombatStore.getState().clearCombat();
    useCombatStore.getState().setPlaybackSpeed(1);
  });

  it.each([
    { speed: 1 as const, batchSize: 1 },
    { speed: 1 as const, batchSize: 17 },
    { speed: 2 as const, batchSize: 7 },
  ])(
    'liefert bei $speed× und Batch-Größe $batchSize denselben Verlauf wie der Referenzlauf',
    ({ speed, batchSize }) => {
      const start = combat();
      const reference = runCombat(start, DEFAULT_COMBAT_CONTEXT);

      const playback = runViaPlayback(start, speed, batchSize);

      expect(playback.outcome).toBe(reference.outcome);
      expect(playback.state).toEqual(reference.state);
      expect(playback.events).toEqual(reference.events);
    },
  );

  it('leitet alle fälligen Takte aus der verstrichenen Zeit ab', () => {
    const start = longCombat();
    const clock = new ManualClock();
    const scheduler = new ManualFrameScheduler();
    const controller = createCombatPlaybackController({
      clock,
      scheduler,
      visibility: noVisibility,
      store: useCombatStore,
    });
    useCombatStore.getState().startCombat(start);
    controller.start();
    useCombatStore.getState().setPaused(false);

    clock.advance(3_500);
    scheduler.runNext();

    let expected = start;
    for (let tick = 0; tick < 3; tick += 1) {
      expected = nextTick(expected, DEFAULT_COMBAT_CONTEXT).state;
    }

    expect(useCombatStore.getState().combat).toEqual(expected);
    controller.stop();
  });

  it('verwirft Zeit über dem Fünf-Minuten-Deckel und läuft danach normal weiter', () => {
    const clock = new ManualClock();
    const scheduler = new ManualFrameScheduler();
    const counted = countStoreTicks();
    const controller = createCombatPlaybackController({
      clock,
      scheduler,
      visibility: noVisibility,
      store: useCombatStore,
    });
    useCombatStore.getState().startCombat(longCombat());
    controller.start();
    useCombatStore.getState().setPaused(false);

    clock.advance(MAX_CATCH_UP_MS + 60_000);
    scheduler.runNext();
    expect(counted.count()).toBe(MAX_CATCH_UP_MS / BASE_TICK_MS);

    clock.advance(BASE_TICK_MS - 1);
    scheduler.runNext();
    expect(counted.count()).toBe(MAX_CATCH_UP_MS / BASE_TICK_MS);

    clock.advance(1);
    scheduler.runNext();
    expect(counted.count()).toBe(MAX_CATCH_UP_MS / BASE_TICK_MS + 1);

    controller.stop();
    counted.unsubscribe();
  });

  it('gibt einen Catch-up-Batch nach Ablauf des Frame-Budgets an den Browser ab', () => {
    const clock = new ManualClock();
    const scheduler = new ManualFrameScheduler();
    const counted = countStoreTicks();
    const controller = createCombatPlaybackController({
      clock,
      scheduler,
      visibility: noVisibility,
      frameBudgetMs: 0,
      store: useCombatStore,
    });
    useCombatStore.getState().startCombat(longCombat());
    controller.start();
    useCombatStore.getState().setPaused(false);
    clock.advance(3 * BASE_TICK_MS);

    scheduler.runNext();
    expect(counted.count()).toBe(1);
    expect(scheduler.pending()).toBe(1);

    scheduler.runNext();
    expect(counted.count()).toBe(2);
    expect(scheduler.pending()).toBe(1);

    scheduler.runNext();
    expect(counted.count()).toBe(3);

    controller.stop();
    counted.unsubscribe();
  });

  it('akkumuliert während einer Pause keine Zeit', () => {
    const clock = new ManualClock();
    const scheduler = new ManualFrameScheduler();
    const counted = countStoreTicks();
    const controller = createCombatPlaybackController({
      clock,
      scheduler,
      visibility: noVisibility,
      store: useCombatStore,
    });
    useCombatStore.getState().startCombat(longCombat());
    controller.start();
    useCombatStore.getState().setPaused(false);

    clock.advance(600);
    scheduler.runNext();
    useCombatStore.getState().setPaused(true);
    clock.advance(60_000);
    useCombatStore.getState().setPaused(false);
    clock.advance(399);
    scheduler.runNext();
    expect(counted.count()).toBe(0);

    clock.advance(1);
    scheduler.runNext();
    expect(counted.count()).toBe(1);

    controller.stop();
    counted.unsubscribe();
  });

  it('bindet Scheduler und Visibility-Beschleuniger an die Lebensdauer des Hooks', () => {
    const clock = new ManualClock();
    const scheduler = new ManualFrameScheduler();
    const visibility = new ManualVisibility();
    useCombatStore.getState().startCombat(longCombat());

    const { unmount } = renderHook(() =>
      useCombatPlayback({ clock, scheduler, visibility, store: useCombatStore }),
    );

    expect(visibility.subscriptions()).toBe(1);
    act(() => useCombatStore.getState().setPaused(false));
    expect(scheduler.pending()).toBe(1);

    act(() => visibility.emitVisible());
    expect(scheduler.cancellations).toBe(1);
    expect(scheduler.pending()).toBe(1);

    unmount();
    expect(scheduler.pending()).toBe(0);
    expect(visibility.subscriptions()).toBe(0);
  });
});
