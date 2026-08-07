import { describe, expect, it } from 'vitest';
import {
  MAX_CHARACTER_LEVEL,
  XP_PER_ENEMY_BY_FLOOR,
  XP_REQUIRED_PER_LEVEL,
} from '@/game/curves/progressionCurves';
import { createLevelOneProgression } from '@/features/save/saveSchema';
import {
  distributeFloorXp,
  floorXpPool,
  gainExperience,
  respecAttributes,
  spendAttributePoint,
  xpPerEnemyForFloor,
  xpRequiredForNextLevel,
} from './xpRewards';

const EQUAL_DAMAGE = { korvin: 1, rhaya: 1, quinn: 1 } as const;

describe('XP-Tabellen', () => {
  it('decken genau die Grenzen von 300 Floors und 100 Levels ab', () => {
    expect(XP_PER_ENEMY_BY_FLOOR).toHaveLength(300);
    expect(XP_REQUIRED_PER_LEVEL).toHaveLength(99);
    // Clamp an den Rändern über die API statt gepinnter Tabellenwerte:
    expect(xpPerEnemyForFloor(-1)).toBe(xpPerEnemyForFloor(0));
    expect(xpPerEnemyForFloor(300)).toBe(xpPerEnemyForFloor(299));
    expect(xpRequiredForNextLevel(1)).toBe(XP_REQUIRED_PER_LEVEL[0]);
    expect(xpRequiredForNextLevel(100)).toBe(0);
  });

  it('wachsen beide Tabellen monoton mit positiven Einträgen', () => {
    for (const table of [XP_PER_ENEMY_BY_FLOOR, XP_REQUIRED_PER_LEVEL]) {
      expect(table[0]).toBeGreaterThan(0);
      for (let index = 1; index < table.length; index += 1) {
        expect(table[index], `Index ${index}`).toBeGreaterThanOrEqual(table[index - 1] ?? Infinity);
      }
    }
  });

  it('baut den Pool aus dem Wert pro Gegner und der tatsächlichen Gegnerzahl', () => {
    expect(floorXpPool(0, 4)).toBe(4 * xpPerEnemyForFloor(0));
    expect(floorXpPool(299, 6)).toBe(6 * xpPerEnemyForFloor(299));
  });
});

describe('distributeFloorXp', () => {
  it('garantiert jedem Charakter 25 % des Pools und verteilt den Rest nach effektivem Schaden', () => {
    expect(
      distributeFloorXp({
        floorIndex: 0,
        enemyCount: 4,
        effectiveDamage: { korvin: 20, rhaya: 10, quinn: 0 },
      }),
    ).toEqual({ korvin: 20, rhaya: 16, quinn: 12 });
  });

  it('rotiert Gleichstände der größten Reste über den globalen Floor-Index', () => {
    expect(
      distributeFloorXp({ floorIndex: 6, enemyCount: 1, effectiveDamage: EQUAL_DAMAGE }),
    ).toEqual({
      korvin: 6,
      rhaya: 5,
      quinn: 5,
    });
    expect(
      distributeFloorXp({ floorIndex: 7, enemyCount: 1, effectiveDamage: EQUAL_DAMAGE }),
    ).toEqual({
      korvin: 5,
      rhaya: 6,
      quinn: 5,
    });
  });
});

describe('Charakter-XP und Punkte', () => {
  it('verarbeitet mehrere Level-Ups mit je einem freien Attribut- und Skillpunkt', () => {
    // Genau zwei Level-Ups plus 10 Rest-XP, über die API statt gepinnter Tabellenwerte.
    const result = gainExperience(
      createLevelOneProgression(),
      xpRequiredForNextLevel(1) + xpRequiredForNextLevel(2) + 10,
    );

    expect(result).toMatchObject({
      level: 3,
      xp: 10,
      freeAttributePoints: 3,
      freeMasteryPoints: 3,
    });
  });

  it('kappt Level und Rest-XP bei Level 100', () => {
    const result = gainExperience(
      { ...createLevelOneProgression(), level: 99, freeAttributePoints: 99, freeMasteryPoints: 99 },
      xpRequiredForNextLevel(99) + 999_999,
    );

    expect(result.level).toBe(MAX_CHARACTER_LEVEL);
    expect(result.xp).toBe(0);
    expect(result.freeAttributePoints).toBe(100);
    expect(result.freeMasteryPoints).toBe(100);
  });

  it('erreicht im 300-Floor-Kalibrierungsfall mit 4,5 Gegnern im Schnitt Level 100', () => {
    let progression = createLevelOneProgression();

    for (let floorIndex = 0; floorIndex < 300; floorIndex += 1) {
      progression = gainExperience(
        progression,
        distributeFloorXp({
          floorIndex,
          enemyCount: floorIndex % 2 === 0 ? 4 : 5,
          effectiveDamage: EQUAL_DAMAGE,
        }).korvin,
      );
    }

    expect(progression.level).toBe(MAX_CHARACTER_LEVEL);
  });

  it('vergibt freie Punkte und respecct sie gegen Gold', () => {
    const spent = spendAttributePoint(createLevelOneProgression(), 'ferocity');
    expect(spent).toMatchObject({ freeAttributePoints: 0, attributePoints: { ferocity: 1 } });

    expect(respecAttributes(spent ?? createLevelOneProgression(), 9, 10)).toBeNull();
    expect(respecAttributes(spent ?? createLevelOneProgression(), 10, 10)).toEqual({
      gold: 0,
      progression: createLevelOneProgression(),
    });
  });
});
