import { describe, expect, it } from 'vitest';
import { ATTRIBUTE_BONUS_PER_POINT, BASELINE_GROWTH, CORE_STAT_PER_POINT } from './characterCurves';
import {
  BOSS_MULTIPLIER,
  ELITE_MULTIPLIER,
  ENEMY_ACCURACY_BONUS,
  ENEMY_ATTACK_MULTIPLIER,
  ENEMY_HEALTH_MULTIPLIER,
} from './enemyCurves';
import {
  ACCURACY_CAP,
  BLOCK_DAMAGE_REDUCTION,
  BULWARK_CONTRIBUTION_BY_ROLE,
  DEFENSE_CONSTANT_K,
} from './combatConstants';
import { MAIN_HAND_DAMAGE_RANGE } from './weaponCurves';

/** Prüft konstanten relativen Zuwachs (geometrische Kurve) über die ganze Tabelle. */
function expectGeometrisch(tabelle: readonly number[], basis: number, toleranz: number): void {
  for (let i = 1; i < tabelle.length; i++) {
    const prev = tabelle[i - 1];
    const curr = tabelle[i];
    expect(prev).toBeDefined();
    expect(curr).toBeDefined();
    expect((curr as number) / (prev as number)).toBeCloseTo(basis, toleranz);
  }
}

describe('BASELINE_GROWTH', () => {
  it('umfasst 100 Level und startet bei ×1', () => {
    for (const tabelle of Object.values(BASELINE_GROWTH)) {
      expect(tabelle).toHaveLength(100);
      expect(tabelle[0]).toBe(1);
    }
  });

  it('erreicht die Achsen-Ziele: Attack ×8, Defense/Health ×5', () => {
    expect(BASELINE_GROWTH.attack[99]).toBeCloseTo(8, 3);
    expect(BASELINE_GROWTH.defense[99]).toBeCloseTo(5, 3);
    expect(BASELINE_GROWTH.health[99]).toBeCloseTo(5, 3);
  });

  it('wächst geometrisch (konstanter relativer Zuwachs pro Level)', () => {
    expectGeometrisch(BASELINE_GROWTH.attack, 8 ** (1 / 99), 3);
    expectGeometrisch(BASELINE_GROWTH.defense, 5 ** (1 / 99), 3);
    expectGeometrisch(BASELINE_GROWTH.health, 5 ** (1 / 99), 3);
  });
});

describe('Gegner-Floor-Kurven', () => {
  it('umfassen 300 Floors und starten bei ×1 bzw. +0', () => {
    expect(ENEMY_HEALTH_MULTIPLIER).toHaveLength(300);
    expect(ENEMY_ATTACK_MULTIPLIER).toHaveLength(300);
    expect(ENEMY_ACCURACY_BONUS).toHaveLength(300);
    expect(ENEMY_HEALTH_MULTIPLIER[0]).toBe(1);
    expect(ENEMY_ATTACK_MULTIPLIER[0]).toBe(1);
    expect(ENEMY_ACCURACY_BONUS[0]).toBe(0);
  });

  it('erreichen die Achsen-Ziele (Health ×~5.000, Attack ×~200, Accuracy +0.25)', () => {
    expect(ENEMY_HEALTH_MULTIPLIER[299]).toBeGreaterThan(4900);
    expect(ENEMY_HEALTH_MULTIPLIER[299]).toBeLessThan(5400);
    expect(ENEMY_ATTACK_MULTIPLIER[299]).toBeGreaterThan(195);
    expect(ENEMY_ATTACK_MULTIPLIER[299]).toBeLessThan(215);
    expect(ENEMY_ACCURACY_BONUS[299]).toBe(0.25);
  });

  it('Health/Attack wachsen geometrisch mit den Achsen-Basen 1.029 / 1.018', () => {
    expectGeometrisch(ENEMY_HEALTH_MULTIPLIER, 1.029, 3);
    expectGeometrisch(ENEMY_ATTACK_MULTIPLIER, 1.018, 3);
  });

  it('die Accuracy-Rampe wächst monoton und bleibt unter dem Cap', () => {
    for (let i = 1; i < ENEMY_ACCURACY_BONUS.length; i++) {
      expect(ENEMY_ACCURACY_BONUS[i]).toBeGreaterThan(ENEMY_ACCURACY_BONUS[i - 1] as number);
    }
    expect(0.75 + (ENEMY_ACCURACY_BONUS[299] as number)).toBeLessThanOrEqual(ACCURACY_CAP + 0.05);
  });
});

describe('Kampf-Stellgrößen', () => {
  it('Elite-/Boss-Multiplikatoren folgen den TTK-Korridoren (Elite < Boss)', () => {
    expect(ELITE_MULTIPLIER.health).toBeGreaterThan(1);
    expect(BOSS_MULTIPLIER.health).toBeGreaterThan(ELITE_MULTIPLIER.health);
    expect(ELITE_MULTIPLIER.attack).toBeGreaterThanOrEqual(1);
    expect(BOSS_MULTIPLIER.attack).toBeGreaterThanOrEqual(ELITE_MULTIPLIER.attack);
  });

  it('Defense-Konstante und Accuracy-Cap liegen im gültigen Bereich', () => {
    expect(DEFENSE_CONSTANT_K).toBeGreaterThan(0);
    expect(ACCURACY_CAP).toBeGreaterThan(0);
    expect(ACCURACY_CAP).toBeLessThan(1);
    expect(ATTRIBUTE_BONUS_PER_POINT).toBeGreaterThan(0);
    expect(CORE_STAT_PER_POINT).toBe(1);
  });

  it('die Block-Reduktion mindert partiell (0 < Block% < 1)', () => {
    expect(BLOCK_DAMAGE_REDUCTION).toBeGreaterThan(0);
    expect(BLOCK_DAMAGE_REDUCTION).toBeLessThan(1);
  });
});

describe('BULWARK_CONTRIBUTION_BY_ROLE', () => {
  it('Tank deckt stärker als Melee, Ranged deckt nicht', () => {
    expect(BULWARK_CONTRIBUTION_BY_ROLE.tank).toBeGreaterThan(BULWARK_CONTRIBUTION_BY_ROLE.melee);
    expect(BULWARK_CONTRIBUTION_BY_ROLE.melee).toBeGreaterThan(0);
    expect(BULWARK_CONTRIBUTION_BY_ROLE.ranged).toBe(0);
  });

  it('hält den multiplikativ gestapelten Malus einer vollen Frontline unter 100 %', () => {
    const malus =
      1 - (1 - BULWARK_CONTRIBUTION_BY_ROLE.tank) * (1 - BULWARK_CONTRIBUTION_BY_ROLE.melee) ** 2;
    expect(malus).toBeGreaterThan(0);
    expect(malus).toBeLessThan(1);
  });
});

describe('MAIN_HAND_DAMAGE_RANGE', () => {
  const RARITIES = ['common', 'magic', 'rare', 'epic', 'legendary'] as const;

  it('streut symmetrisch um den neutralen Faktor 1', () => {
    for (const rarity of RARITIES) {
      const range = MAIN_HAND_DAMAGE_RANGE[rarity];
      expect(range.min).toBeLessThan(1);
      expect(range.max).toBeGreaterThan(1);
      expect((range.min + range.max) / 2).toBeCloseTo(1, 10);
    }
  });

  it('wird mit steigender Seltenheit breiter', () => {
    const breiten = RARITIES.map(
      (r) => MAIN_HAND_DAMAGE_RANGE[r].max - MAIN_HAND_DAMAGE_RANGE[r].min,
    );
    for (let i = 1; i < breiten.length; i++) {
      expect(breiten[i]).toBeGreaterThan(breiten[i - 1] as number);
    }
  });
});
