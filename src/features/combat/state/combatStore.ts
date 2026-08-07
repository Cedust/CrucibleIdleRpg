import { create } from 'zustand';
import type { RewardSummary } from '@/features/dungeon/rewards';
import {
  combatOutcome,
  DEFAULT_COMBAT_CONTEXT,
  nextTick,
  type CombatContext,
  type CombatOutcome,
  type TickResult,
} from '@/features/combat/engine/combatEngine';
import type { ActorRef, CombatState } from '@/features/combat/engine/combatState';
import { buildPendingQueue } from '@/features/combat/engine/turnOrder';

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
  completionStatus: 'idle' | 'saving' | 'saved' | 'failed';
  lastReward: RewardSummary | null;
  victoryCommit: ((combat: CombatState) => Promise<RewardSummary>) | null;
  startCombat: (
    combat: CombatState,
    context?: CombatContext,
    victoryCommit?: (combat: CombatState) => Promise<RewardSummary>,
  ) => void;
  clearCombat: () => void;
  advanceTick: () => TickResult | undefined;
  retryVictoryCommit: () => void;
  setPaused: (isPaused: boolean) => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
}

/** Das Kampf-Log hält nur die jüngsten Zug-Blöcke und wächst damit nicht unbegrenzt. */
export const COMBAT_LOG_LIMIT = 100;

const INITIAL_PLAYBACK_STATE = {
  combat: null,
  context: DEFAULT_COMBAT_CONTEXT,
  outcome: null,
  lastTick: null,
  tickLog: [] as readonly TickResult[],
  turnOrder: [] as readonly ActorRef[],
  isPaused: true,
  playbackSpeed: 1,
  completionStatus: 'idle' as const,
  lastReward: null,
  victoryCommit: null,
} as const;

/**
 * Laufzeit-Store des Combat-Features (AGENTS.md). Er lebt außerhalb der View-Komponenten,
 * sodass ein Ansichtswechsel weder Kampf noch Pause oder Anzeige-Geschwindigkeit zurücksetzt.
 */
export const useCombatStore = create<CombatStoreState>((set, get) => ({
  ...INITIAL_PLAYBACK_STATE,

  startCombat: (combat, context = DEFAULT_COMBAT_CONTEXT, victoryCommit) =>
    set({
      combat,
      context,
      outcome: combatOutcome(combat),
      lastTick: null,
      tickLog: [],
      turnOrder: buildPendingQueue(combat),
      // Playback startet verbindlich pausiert (SIMULATION §2).
      isPaused: true,
      completionStatus: 'idle',
      lastReward: null,
      victoryCommit: victoryCommit ?? null,
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

    const shouldCommitVictory = tick.outcome === 'victory' && current.victoryCommit !== null;

    set({
      combat: tick.state,
      outcome: tick.outcome,
      lastTick: tick,
      tickLog: [...current.tickLog, tick].slice(-COMBAT_LOG_LIMIT),
      // Ein entschiedener Kampf erzeugt keine weiteren Playback-Frames.
      isPaused: tick.outcome === 'ongoing' ? current.isPaused : true,
      completionStatus: 'idle',
    });

    if (shouldCommitVictory) {
      get().retryVictoryCommit();
    }

    return tick;
  },

  retryVictoryCommit: () => {
    const current = get();
    if (
      current.combat === null ||
      current.outcome !== 'victory' ||
      current.victoryCommit === null ||
      current.completionStatus === 'saving'
    ) {
      return;
    }

    const combat = current.combat;
    const commit = current.victoryCommit;
    set({ completionStatus: 'saving' });

    void Promise.resolve()
      .then(() => commit(combat))
      .then(
        (reward) => {
          const latest = get();
          if (latest.combat === combat && latest.outcome === 'victory') {
            set({ completionStatus: 'saved', lastReward: reward, victoryCommit: null });
          }
        },
        () => {
          const latest = get();
          if (latest.combat === combat && latest.outcome === 'victory') {
            set({ completionStatus: 'failed' });
          }
        },
      );
  },

  setPaused: (isPaused) => set({ isPaused }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
}));
