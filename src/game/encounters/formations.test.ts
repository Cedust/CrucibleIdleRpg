import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '@/game/characters/characters';
import { BLOCK_DAMAGE_REDUCTION, DEFENSE_CONSTANT_K } from '@/game/curves/combatConstants';
import { ENEMY_ATTACK_MULTIPLIER, ENEMY_HEALTH_MULTIPLIER } from '@/game/curves/enemyCurves';
import { ENEMIES } from '@/game/enemies/enemies';
import type { EnemyDefinition, EnemyId, FormationDefinition } from '@/game/types';
import { ACT_1_ENCOUNTERS, resolveAct1Encounter } from './act1';
import { FORMATIONS } from './formations';

/** Alle besetzten Slots einer Vorlage als Gegner-Definitionen, in Formations-Index-Reihenfolge. */
function besetzung(formation: FormationDefinition): EnemyDefinition[] {
  return [...formation.slots.frontline, ...formation.slots.backline]
    .filter((id): id is EnemyId => id !== null)
    .map((id) => ENEMIES[id]);
}

describe('FORMATIONS', () => {
  it('besetzen 2–6 Slots aus bekannten Gegnern', () => {
    for (const formation of Object.values(FORMATIONS)) {
      const gegner = besetzung(formation);
      expect(gegner.length).toBeGreaterThanOrEqual(2);
      expect(gegner.length).toBeLessThanOrEqual(6);
    }
  });

  it('stellen Tank und Melee in die Frontline, Ranged in die Backline', () => {
    for (const formation of Object.values(FORMATIONS)) {
      for (const id of formation.slots.frontline) {
        if (id !== null) expect(ENEMIES[id]?.role).not.toBe('ranged');
      }
      for (const id of formation.slots.backline) {
        if (id !== null) expect(ENEMIES[id]?.role).toBe('ranged');
      }
    }
  });

  it('führen höchstens einen Tank-Gegner pro Kampf', () => {
    for (const formation of Object.values(FORMATIONS)) {
      const tanks = besetzung(formation).filter((enemy) => enemy.role === 'tank');
      expect(tanks.length).toBeLessThanOrEqual(1);
    }
  });

  it('bilden den Ramp-Up in vier Phasen ab: eine Lane → beide Lanes → mehrere → mit Tank', () => {
    const phasen = [
      FORMATIONS.rampSingleLanePair,
      FORMATIONS.rampBothLanes,
      FORMATIONS.rampBothLanesCrowded,
      FORMATIONS.rampWithTank,
    ] as const;
    for (const phase of phasen) expect(phase).toBeDefined();

    const [p1, p2, p3, p4] = phasen as [
      FormationDefinition,
      FormationDefinition,
      FormationDefinition,
      FormationDefinition,
    ];
    expect(p1.slots.backline.every((id) => id === null)).toBe(true);
    expect(p2.slots.backline.some((id) => id !== null)).toBe(true);
    expect(besetzung(p3).length).toBeGreaterThan(besetzung(p2).length);
    expect(besetzung(p4).some((enemy) => enemy.role === 'tank')).toBe(true);
  });
});

describe('Floor→Formation für A1-D1 (eine Quelle: act1.ts)', () => {
  const dungeonFloors = ACT_1_ENCOUNTERS.filter((encounter) => encounter.dungeonId === 'A1-D1');

  it('deckt die 20 Floors von A1-D1 mit bekannten Vorlagen ab', () => {
    expect(dungeonFloors).toHaveLength(20);
    for (const encounter of dungeonFloors) {
      expect(FORMATIONS[encounter.formationId], encounter.id).toBeDefined();
    }
  });

  it('führt die vier Ramp-Up-Phasen der Reihe nach ein', () => {
    const ersteVorkommen = [...new Set(dungeonFloors.map((encounter) => encounter.formationId))];
    expect(ersteVorkommen).toEqual([
      'rampSingleLanePair',
      'rampBothLanes',
      'rampBothLanesCrowded',
      'rampWithTank',
    ]);
  });
});

/**
 * Grobe Plausibilität des Platzhalter-Contents auf dem allerersten Floor — kein Tuning und
 * kein Ersatz für die Kampf-Engine. Gerechnet wird mit **Erwartungswerten** statt PRNG:
 * Damage-Range-Mitte, Crit als Erwartungsfaktor, Trefferchance und Block als Anteil.
 * Die Generator-Muster (Multi Hit, Splash, Counter) stehen auf Level 1 bei Chance 0 und
 * tragen daher nichts bei.
 */
describe('Plausibilität A1-D1-01', () => {
  const FLOOR_INDEX = 0;
  const formation = FORMATIONS[resolveAct1Encounter('A1-D1-01').formationId];
  const gegner = besetzung(formation);
  const healthMultiplier = ENEMY_HEALTH_MULTIPLIER[FLOOR_INDEX];
  const attackMultiplier = ENEMY_ATTACK_MULTIPLIER[FLOOR_INDEX];
  if (healthMultiplier === undefined || attackMultiplier === undefined) {
    throw new Error('Floor-Kurven decken Index 0 nicht ab');
  }

  /** Ausgehender Team-Schaden pro Runde: je Charakter Attack × Damage-Range-Mitte × Crit-Faktor. */
  const teamSchadenProRunde = Object.values(CHARACTERS).reduce((summe, charakter) => {
    const range = charakter.weapon.damageRange;
    const rangeMitte = (range.min + range.max) / 2;
    const critFaktor =
      1 + charakter.baseOffensive.critChance * (charakter.baseOffensive.critDamage - 1);
    return summe + charakter.weapon.baseDamage * rangeMitte * critFaktor;
  }, 0);

  const gegnerHealth = gegner.reduce((summe, e) => summe + e.health * healthMultiplier, 0);

  /** Eingehender Schaden pro Runde: je Gegner-Angriff `S` gleichmäßig auf drei Charaktere. */
  const charaktere = Object.values(CHARACTERS);
  const teamSchadenErlittenProRunde = gegner.reduce((summe, e) => {
    const tick = (e.attack * attackMultiplier) / charaktere.length;
    return (
      summe +
      charaktere.reduce((proAngriff, charakter) => {
        const trefferchance = e.accuracy * (1 - charakter.baseDefensive.evasion);
        const nachBlock = 1 - charakter.baseDefensive.blockChance * BLOCK_DAMAGE_REDUCTION;
        const nachDefense =
          DEFENSE_CONSTANT_K / (DEFENSE_CONSTANT_K + charakter.baseDerived.defense);
        return proAngriff + tick * trefferchance * nachBlock * nachDefense;
      }, 0)
    );
  }, 0);

  const teamHealth = charaktere.reduce((summe, c) => summe + c.baseDerived.health, 0);
  const rundenBisSieg = Math.ceil(gegnerHealth / teamSchadenProRunde);
  const rundenBisWipe = Math.ceil(teamHealth / teamSchadenErlittenProRunde);

  it('endet weder in einer Runde noch in dreistelliger Rundenzahl', () => {
    expect(rundenBisSieg).toBeGreaterThan(1);
    expect(rundenBisSieg).toBeLessThan(100);
  });

  it('gewinnt das Startteam den ersten Floor', () => {
    expect(rundenBisSieg).toBeLessThan(rundenBisWipe);
  });

  it('lässt das Team Health verlieren (Attrition ist spürbar)', () => {
    expect(teamSchadenErlittenProRunde).toBeGreaterThan(0);
  });
});
