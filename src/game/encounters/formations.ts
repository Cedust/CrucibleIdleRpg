import type { FloorId, FormationDefinition, FormationId } from '@/game/types';

/**
 * Formations-Vorlagen der 2×3-Aufstellung (docs/spec/COMBAT-RUN.md#13-gegnerformation). Ein Floor
 * verweist auf eine Vorlage, die Floor-Kurve (curves/enemyCurves.ts) skaliert die Gegner-Stats —
 * 300 Floors ohne 300 Einzeleinträge.
 *
 * Die vier Vorlagen bilden den Ramp-Up des ersten Dungeons eines Akts
 * (docs/spec/PROGRESSION.md#1-struktur-akte-dungeons-floors): (1) nur eine Lane, wenige Gegner →
 * (2) beide Lanes, wenige → (3) beide Lanes, mehrere → (4) beide Lanes, mehrere inkl.
 * Tank-Gegner. Höchstens ein Tank-Gegner pro Kampf.
 *
 * PLATZHALTER — Besetzung und Phasenzuschnitt offen:
 * docs/backlog/OPEN_ISSUES.md#charakter--und-gegner-kurven (Formations-Besetzung je Floor).
 * Ab Phase 2 trägt jede Vorlage mindestens zwei Gegner-Aktionen pro Runde
 * (docs/spec/BALANCE.md#1-wachstum-und-zahlenraum).
 */
export const FORMATIONS: Record<FormationId, FormationDefinition> = {
  /** Phase 1 — eine Lane, zwei Melee. Kein Backline-Ziel, Bulwark bleibt wirkungslos. */
  rampSingleLanePair: {
    id: 'rampSingleLanePair',
    slots: {
      frontline: ['ashenGhoul', 'emberHound', null],
      backline: [null, null, null],
    },
  },
  /** Phase 2 — beide Lanes: erstes Backline-Ziel, damit greift der Bulwark-Malus. */
  rampBothLanes: {
    id: 'rampBothLanes',
    slots: {
      frontline: ['ashenGhoul', 'emberHound', null],
      backline: ['cinderWretch', null, null],
    },
  },
  /** Phase 3 — beide Lanes voller besetzt: volle Frontline, zwei Ranged dahinter. */
  rampBothLanesCrowded: {
    id: 'rampBothLanesCrowded',
    slots: {
      frontline: ['ashenGhoul', 'emberHound', 'ashenGhoul'],
      backline: ['cinderWretch', 'cinderWretch', null],
    },
  },
  /** Phase 4 — mit Tank-Gegner: Taunt für Tank und Melee, höchster Bulwark-Malus. */
  rampWithTank: {
    id: 'rampWithTank',
    slots: {
      frontline: ['slagBulwark', 'ashenGhoul', 'emberHound'],
      backline: ['cinderWretch', 'cinderWretch', null],
    },
  },
  /** Platzhalter für Dungeon 2: kompakte Formation mit einem Backline-Ziel. */
  dungeonSkirmish: {
    id: 'dungeonSkirmish',
    slots: {
      frontline: ['ashenGhoul', 'emberHound', null],
      backline: ['cinderWretch', null, null],
    },
  },
  /** Platzhalter für Dungeon 3: dichte Formation ohne Tank. */
  dungeonPursuit: {
    id: 'dungeonPursuit',
    slots: {
      frontline: ['ashenGhoul', 'emberHound', 'ashenGhoul'],
      backline: ['cinderWretch', 'cinderWretch', null],
    },
  },
  /** Platzhalter für Dungeon 5: volle Formation mit einem Tank. */
  dungeonStronghold: {
    id: 'dungeonStronghold',
    slots: {
      frontline: ['slagBulwark', 'ashenGhoul', 'emberHound'],
      backline: ['cinderWretch', 'cinderWretch', 'cinderWretch'],
    },
  },
};

/**
 * Zuordnung Floor → Formations-Vorlage für Akt 1, Dungeon 1: die 20 Floors zu je fünf auf die
 * vier Ramp-Up-Phasen. Floor 20 ist ein Elite-Floor — dieselbe Vorlage, der
 * Elite-Multiplikator liegt in curves/enemyCurves.ts.
 *
 * PLATZHALTER — Aufteilung offen, gleicher Eintrag wie oben. Die übrigen 280 Floors kommen mit
 * ihrem Content-Task dazu.
 */
export const FLOOR_FORMATIONS: Record<FloorId, FormationId> = {
  'A1-D1-01': 'rampSingleLanePair',
  'A1-D1-02': 'rampSingleLanePair',
  'A1-D1-03': 'rampSingleLanePair',
  'A1-D1-04': 'rampSingleLanePair',
  'A1-D1-05': 'rampSingleLanePair',
  'A1-D1-06': 'rampBothLanes',
  'A1-D1-07': 'rampBothLanes',
  'A1-D1-08': 'rampBothLanes',
  'A1-D1-09': 'rampBothLanes',
  'A1-D1-10': 'rampBothLanes',
  'A1-D1-11': 'rampBothLanesCrowded',
  'A1-D1-12': 'rampBothLanesCrowded',
  'A1-D1-13': 'rampBothLanesCrowded',
  'A1-D1-14': 'rampBothLanesCrowded',
  'A1-D1-15': 'rampBothLanesCrowded',
  'A1-D1-16': 'rampWithTank',
  'A1-D1-17': 'rampWithTank',
  'A1-D1-18': 'rampWithTank',
  'A1-D1-19': 'rampWithTank',
  'A1-D1-20': 'rampWithTank',
};
