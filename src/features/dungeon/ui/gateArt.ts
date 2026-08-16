import { act1FinalFloorClass, type Act1DungeonId } from '@/game/encounters/act1';

export type GateVariant = 'normal' | 'boss';
export type GateState = 'open' | 'locked';

/**
 * Vier wiederverwendete Tor-Illustrationen (concept/PROMPTS.md §27), gerendert
 * als `<img src>`. Noch nicht generierte Assets rendern unsichtbar; die Kachel
 * behält Label und States.
 */
export const GATE_ART_SRC: Record<GateVariant, Record<GateState, string>> = {
  normal: {
    open: '/assets/gates/gate-open.png',
    locked: '/assets/gates/gate-locked.png',
  },
  boss: {
    open: '/assets/gates/gate-boss-open.png',
    locked: '/assets/gates/gate-boss-locked.png',
  },
};

/** Boss-Tor für den Dungeon mit Boss-Abschlussfloor; die Regel liegt im Game-Layer. */
export function gateVariantFor(dungeonId: Act1DungeonId): GateVariant {
  return act1FinalFloorClass(dungeonId) === 'boss' ? 'boss' : 'normal';
}
