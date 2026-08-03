import { useEffect } from 'react';
import type { StoreApi } from 'zustand';
import { useCombatStore, type CombatStoreState } from './combatStore';

/** Grundtakt: ein Akteur handelt pro 1000 ms (SIMULATION §2). */
export const BASE_TICK_MS = 1_000;
/** Höchstens fünf Minuten real vergangener Zeit werden nachgeholt (SIMULATION §3). */
export const MAX_CATCH_UP_MS = 5 * 60 * 1_000;
/** Kurzes Arbeitsbudget pro Frame; danach erhält der Browser wieder Kontrolle. */
export const DEFAULT_FRAME_BUDGET_MS = 8;

export interface PlaybackClock {
  now: () => number;
}

export interface PlaybackFrameScheduler {
  request: (callback: () => void) => number;
  cancel: (handle: number) => void;
}

export interface PlaybackVisibilitySource {
  subscribeVisible: (listener: () => void) => () => void;
}

export interface CombatPlaybackOptions {
  /** In Tests eine manuell steuerbare Uhr; im Browser `performance.now()`. */
  clock?: PlaybackClock;
  scheduler?: PlaybackFrameScheduler;
  visibility?: PlaybackVisibilitySource;
  frameBudgetMs?: number;
  store?: Pick<StoreApi<CombatStoreState>, 'getState' | 'subscribe'>;
}

export interface CombatPlaybackController {
  start: () => void;
  stop: () => void;
  /** Beschleuniger beim Sichtbarwerden; die Zeitrechnung bleibt im Akkumulator. */
  wake: () => void;
}

const browserClock: PlaybackClock = {
  now: () => performance.now(),
};

const browserFrameScheduler: PlaybackFrameScheduler = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (handle) => cancelAnimationFrame(handle),
};

const browserVisibility: PlaybackVisibilitySource = {
  subscribeVisible: (listener) => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        listener();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  },
};

function elapsedSince(now: number, previous: number): number {
  const elapsed = now - previous;
  return Number.isFinite(elapsed) ? Math.max(elapsed, 0) : 0;
}

/**
 * Imperativer Kern des Hooks. Die Engine bleibt zeitfrei: Der Controller leitet aus Echtzeit
 * fällige Takte ab und ruft für jeden davon dieselbe Store-Aktion und damit dasselbe `nextTick`
 * wie das normale Playback auf.
 */
export function createCombatPlaybackController(
  options: CombatPlaybackOptions = {},
): CombatPlaybackController {
  const clock = options.clock ?? browserClock;
  const scheduler = options.scheduler ?? browserFrameScheduler;
  const visibility = options.visibility ?? browserVisibility;
  const frameBudgetMs = options.frameBudgetMs ?? DEFAULT_FRAME_BUDGET_MS;
  const store = options.store ?? useCombatStore;

  let accumulatorMs = 0;
  let lastTimestamp: number | undefined;
  let frameHandle: number | undefined;
  let unsubscribeStore: (() => void) | undefined;
  let unsubscribeVisibility: (() => void) | undefined;
  let started = false;

  const canPlay = (): boolean => {
    const state = store.getState();
    return state.combat !== null && state.outcome === 'ongoing' && !state.isPaused;
  };

  const cancelFrame = () => {
    if (frameHandle !== undefined) {
      scheduler.cancel(frameHandle);
      frameHandle = undefined;
    }
  };

  const runFrame = () => {
    frameHandle = undefined;

    if (!canPlay()) {
      lastTimestamp = undefined;
      return;
    }

    const frameStartedAt = clock.now();
    const previousTimestamp = lastTimestamp ?? frameStartedAt;
    lastTimestamp = frameStartedAt;
    accumulatorMs = Math.min(
      accumulatorMs + elapsedSince(frameStartedAt, previousTimestamp),
      MAX_CATCH_UP_MS,
    );

    const tickDurationMs = BASE_TICK_MS / store.getState().playbackSpeed;

    while (accumulatorMs >= tickDurationMs && canPlay()) {
      const tick = store.getState().advanceTick();

      if (tick === undefined) {
        break;
      }

      accumulatorMs -= tickDurationMs;

      // Erst einen fälligen Takt rechnen, dann das Budget prüfen. So macht auch ein Budget von
      // 0 ms Fortschritt und gibt nach genau einem Takt an den Browser ab.
      if (elapsedSince(clock.now(), frameStartedAt) >= frameBudgetMs) {
        break;
      }
    }

    if (canPlay()) {
      scheduleFrame();
    } else {
      lastTimestamp = undefined;
      accumulatorMs = 0;
    }
  };

  function scheduleFrame(): void {
    if (started && frameHandle === undefined && canPlay()) {
      frameHandle = scheduler.request(runFrame);
    }
  }

  const reconcile = () => {
    if (!canPlay()) {
      cancelFrame();
      lastTimestamp = undefined;

      const state = store.getState();
      if (state.combat === null || state.outcome !== 'ongoing') {
        accumulatorMs = 0;
      }

      return;
    }

    lastTimestamp ??= clock.now();
    scheduleFrame();
  };

  const wake = () => {
    if (!started || !canPlay()) {
      return;
    }

    // Ein in einem gedrosselten Tab wartender Frame wird ersetzt; der nächste Frame rechnet
    // weiterhin ausschließlich aus der seit `lastTimestamp` verstrichenen Zeit.
    cancelFrame();
    scheduleFrame();
  };

  const start = () => {
    if (started) {
      return;
    }

    started = true;
    unsubscribeStore = store.subscribe(reconcile);
    unsubscribeVisibility = visibility.subscribeVisible(wake);
    reconcile();
  };

  const stop = () => {
    if (!started) {
      return;
    }

    started = false;
    cancelFrame();
    unsubscribeStore?.();
    unsubscribeVisibility?.();
    unsubscribeStore = undefined;
    unsubscribeVisibility = undefined;
    lastTimestamp = undefined;
  };

  return { start, stop, wake };
}

/** Startet genau einen Playback-Controller für die Lebensdauer der aufrufenden Komponente. */
export function useCombatPlayback(options: CombatPlaybackOptions = {}): void {
  const { clock, scheduler, visibility, frameBudgetMs, store } = options;

  useEffect(() => {
    const controller = createCombatPlaybackController({
      ...(clock === undefined ? {} : { clock }),
      ...(scheduler === undefined ? {} : { scheduler }),
      ...(visibility === undefined ? {} : { visibility }),
      ...(frameBudgetMs === undefined ? {} : { frameBudgetMs }),
      ...(store === undefined ? {} : { store }),
    });

    controller.start();
    return controller.stop;
  }, [clock, frameBudgetMs, scheduler, store, visibility]);
}
