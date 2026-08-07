import { describe, expect, it } from 'vitest';
import { ATTRIBUTE_BONUS_PER_POINT } from './characterCurves';
import {
  ACCURACY_CAP,
  BLOCK_DAMAGE_REDUCTION,
  BULWARK_CONTRIBUTION_BY_ROLE,
  DEFENSE_CONSTANT_K,
} from './combatConstants';
import {
  BOSS_MULTIPLIER,
  ELITE_MULTIPLIER,
  ENEMY_ACCURACY_BONUS,
  ENEMY_ATTACK_MULTIPLIER,
  ENEMY_HEALTH_MULTIPLIER,
} from './enemyCurves';

/**
 * Geprüft werden Invarianten der Kurven — Länge, Monotonie, Grenzen —, nicht ihre
 * Platzhalter-Werte (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten).
 */

describe('enemy curves', () => {
  it('decken alle 300 Floors ab', () => {
    expect(ENEMY_HEALTH_MULTIPLIER).toHaveLength(300);
    expect(ENEMY_ATTACK_MULTIPLIER).toHaveLength(300);
    expect(ENEMY_ACCURACY_BONUS).toHaveLength(300);
  });

  it('lässt Health- und Attack-Multiplikatoren streng monoton von 1 aus wachsen', () => {
    for (const table of [ENEMY_HEALTH_MULTIPLIER, ENEMY_ATTACK_MULTIPLIER]) {
      expect(table[0]).toBe(1);
      for (let index = 1; index < table.length; index += 1) {
        expect(table[index], `Index ${index}`).toBeGreaterThan(
          table[index - 1] ?? Number.POSITIVE_INFINITY,
        );
      }
    }
  });

  it('hält die Accuracy-Rampe monoton wachsend, nichtnegativ und unter dem Cap', () => {
    expect(ENEMY_ACCURACY_BONUS[0]).toBe(0);
    for (let index = 0; index < ENEMY_ACCURACY_BONUS.length; index += 1) {
      const bonus = ENEMY_ACCURACY_BONUS[index] ?? Number.NaN;
      expect(bonus, `Index ${index}`).toBeGreaterThanOrEqual(ENEMY_ACCURACY_BONUS[index - 1] ?? 0);
      expect(bonus, `Index ${index}`).toBeLessThan(ACCURACY_CAP);
    }
  });

  it('verstärkt Elite- und Boss-Floors mit Multiplikatoren über 1', () => {
    expect(ELITE_MULTIPLIER.health).toBeGreaterThan(1);
    expect(ELITE_MULTIPLIER.attack).toBeGreaterThan(1);
    expect(BOSS_MULTIPLIER.health).toBeGreaterThan(ELITE_MULTIPLIER.health);
    expect(BOSS_MULTIPLIER.attack).toBeGreaterThan(1);
  });
});

describe('combat constants', () => {
  it('keeps the attribute bonus a positive fraction', () => {
    expect(ATTRIBUTE_BONUS_PER_POINT).toBeGreaterThan(0);
    expect(ATTRIBUTE_BONUS_PER_POINT).toBeLessThan(1);
  });

  it('keeps combat constants within their valid ranges', () => {
    expect(DEFENSE_CONSTANT_K).toBeGreaterThan(0);
    expect(ACCURACY_CAP).toBeGreaterThan(0);
    expect(ACCURACY_CAP).toBeLessThan(1);
    expect(BLOCK_DAMAGE_REDUCTION).toBeGreaterThan(0);
    expect(BLOCK_DAMAGE_REDUCTION).toBeLessThan(1);
    expect(BULWARK_CONTRIBUTION_BY_ROLE.tank).toBeGreaterThan(BULWARK_CONTRIBUTION_BY_ROLE.melee);
  });
});
