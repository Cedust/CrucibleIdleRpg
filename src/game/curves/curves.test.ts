import { describe, expect, it } from 'vitest';
import { ATTRIBUTE_BONUS_PER_POINT } from './characterCurves';
import {
  ACCURACY_CAP,
  BLOCK_DAMAGE_REDUCTION,
  BULWARK_CONTRIBUTION_BY_ROLE,
  DEFENSE_CONSTANT_K,
} from './combatConstants';
import {
  ENEMY_ACCURACY_BONUS,
  ENEMY_ATTACK_MULTIPLIER,
  ENEMY_HEALTH_MULTIPLIER,
} from './enemyCurves';

describe('character and enemy curves', () => {
  it('keeps the attribute bonus positive and the enemy curves bounded at their start', () => {
    expect(ATTRIBUTE_BONUS_PER_POINT).toBe(0.0125);
    expect(ENEMY_HEALTH_MULTIPLIER[0]).toBe(1);
    expect(ENEMY_ATTACK_MULTIPLIER[0]).toBe(1);
    expect(ENEMY_ACCURACY_BONUS[0]).toBe(0);
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
