import { create } from 'zustand';
import {
  combatOutcome,
  M1_COMBAT_CONTEXT,
  nextTick,
  type CombatContext,
  type CombatOutcome,
  type TickResult,
} from './combatEngine';
import type { ActorRef, CombatState } from './combatState';
import { buildPendingQueue } from './turnOrder';

/** Verfügbare Anzeige-Geschwindigkeiten; 2× wird erst in M2 freigeschaltet. */
export type PlaybackSpeed = 1 | 2;

export interface CombatStoreState {
  /** Laufzeit-Zustand des aktuellen Kampfes; wird nie in den Save geschrieben. */
  combat: CombatState | null;
  context: CombatContext;
  outcome: CombatOutcome | null;
  /** Vollständiger Zug-Block des zuletzt gerechneten Takts für Anzeige und Kampf-Log. */
  lastTick: TickResult | null;
  /** Gedeckelte Zug-Blöcke für die Anzeige; genau ein Eintrag je gerechneten Takt. */
  tickLog: readonly TickResult[];
  /** Stabile Anzeige-Reihenfolge aller Akteure des Kampfes. */
  turnOrder: readonly ActorRef[];
  isPaused: boolean;
  playbackSpeed: PlaybackSpeed;
  startCombat: (combat: CombatState, context?: CombatContext) => void;
  clearCombat: () => void;
  advanceTick: () => TickResult | undefined;
  setPaused: (isPaused: boolean) => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
}

/** Das Kampf-Log hält nur die jüngsten Zug-Blöcke und wächst damit nicht unbegrenzt. */
export const COMBAT_LOG_LIMIT = 100;

const INITIAL_PLAYBACK_STATE = {
  combat: null,
  context: M1_COMBAT_CONTEXT,
  outcome: null,
  lastTick: null,
  tickLog: [] as readonly TickResult[],
  turnOrder: [] as readonly ActorRef[],
  isPaused: true,
  playbackSpeed: 1,
} as const;

/**
 * Laufzeit-Store des Combat-Features (AGENTS.md §6). Er lebt außerhalb der View-Komponenten,
 * sodass ein Ansichtswechsel weder Kampf noch Pause oder Anzeige-Geschwindigkeit zurücksetzt.
 */
export const useCombatStore = create<CombatStoreState>((set, get) => ({
  ...INITIAL_PLAYBACK_STATE,

  startCombat: (combat, context = M1_COMBAT_CONTEXT) =>
    set({
      combat,
      context,
      outcome: combatOutcome(combat),
      lastTick: null,
      tickLog: [],
      turnOrder: buildPendingQueue(combat),
      // Playback startet verbindlich pausiert (SIMULATION §2).
      isPaused: true,
    }),

  clearCombat: () =>
    set(({ playbackSpeed }) => ({
      ...INITIAL_PLAYBACK_STATE,
      // Anzeige-Präferenz gehört nicht zum laufenden Kampf und bleibt beim Verlassen erhalten.
      playbackSpeed,
    })),

  advanceTick: () => {
    const current = get();

    if (current.combat === null || current.outcome !== 'ongoing') {
      return undefined;
    }

    const tick = nextTick(current.combat, current.context);

    set({
      combat: tick.state,
      outcome: tick.outcome,
      lastTick: tick,
      tickLog: [...current.tickLog, tick].slice(-COMBAT_LOG_LIMIT),
      // Ein entschiedener Kampf erzeugt keine weiteren Playback-Frames.
      isPaused: tick.outcome === 'ongoing' ? current.isPaused : true,
    });

    return tick;
  },

  setPaused: (isPaused) => set({ isPaused }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
}));
