import type { FloorId, FormationDefinition, FormationId } from '@/game/types';

/**
 * Formations-Vorlagen der 2×3-Aufstellung (SPEC §1.3). Ein Floor verweist auf eine Vorlage,
 * die Floor-Kurve skaliert die Gegner-Stats — 300 Floors ohne 300 Einzeleinträge.
 *
 * Die Vorlagen folgen dem Ramp-Up in vier Phasen (SPEC §4.1): eine Lane mit wenigen Gegnern →
 * beide Lanes mit wenigen → beide Lanes mit mehreren → beide Lanes inklusive Tank-Gegner.
 */
export const FORMATIONS: Record<FormationId, FormationDefinition> = {
  rampSingleLanePair: {
    id: 'rampSingleLanePair',
    slots: {
      frontline: ['ashenGhoul', 'emberHound', null],
      backline: [null, null, null],
    },
  },
};

/** Zuordnung Floor → Formations-Vorlage. */
export const FLOOR_FORMATIONS: Record<FloorId, FormationId> = {
  'A1-D1-01': 'rampSingleLanePair',
};
