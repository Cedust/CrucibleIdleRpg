import { describe, expect, it } from 'vitest';
import type { Role } from '@/game/types';
import { applyBulwark, bulwarkDamageFactor } from './bulwark';
import type { CombatEnemy } from '../combatState';
import { enemyFixture } from '../testFixtures';

/** Malus als Gegenstück zum Faktor — die Lesart des Spec-Vektors (COMBAT §2.4). */
function bulwarkMalus(enemies: readonly CombatEnemy[], target: Pick<CombatEnemy, 'lane'>): number {
  return 1 - bulwarkDamageFactor(enemies, target);
}

/**
 * Eigene Eingangswerte statt Platzhalter-Content: geprüft wird die **multiplikative Stapelung**,
 * nicht das Tuning (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten).
 */

function enemy(
  formationIndex: number,
  role: Role,
  bulwarkContribution: number,
  health = 50,
): CombatEnemy {
  return enemyFixture({
    formationIndex,
    role,
    bulwarkContribution,
    health,
    maxHealth: 50,
    attack: 10,
    accuracy: 0.5,
    initiative: 10,
  });
}

describe('Bulwark — Test-Vektor aus COMBAT §2.4', () => {
  // Frontline: Tank (b = 0.30) und zwei Melee (b = 0.15); ein Treffer von 1000 auf die Backline.
  const tank = enemy(0, 'tank', 0.3);
  const meleeA = enemy(1, 'melee', 0.15);
  const meleeB = enemy(2, 'melee', 0.15);
  const backline = enemy(3, 'ranged', 0);

  it('stapelt die Beiträge multiplikativ: 1000 → 505.75', () => {
    const enemies = [tank, meleeA, meleeB, backline];

    expect(bulwarkMalus(enemies, backline)).toBeCloseTo(0.49425, 10);
    expect(applyBulwark(1000, enemies, backline)).toBeCloseTo(505.75, 10);
    // Additiv wären es 0.60 statt 0.494250 — genau das schließt der Vektor aus.
    expect(bulwarkMalus(enemies, backline)).not.toBeCloseTo(0.6, 3);
  });

  it('Sunder senkt das bᵢ des Tanks (0.30 → 0.10): 1000 → 650.25', () => {
    const enemies = [{ ...tank, bulwarkContribution: 0.1 }, meleeA, meleeB, backline];

    expect(bulwarkMalus(enemies, backline)).toBeCloseTo(0.34975, 10);
    expect(applyBulwark(1000, enemies, backline)).toBeCloseTo(650.25, 10);
  });

  it('ein gefallener Melee wirkt über dieselbe Formel: 1000 → 595.00', () => {
    const enemies = [tank, meleeA, { ...meleeB, health: 0 }, backline];

    expect(bulwarkMalus(enemies, backline)).toBeCloseTo(0.405, 10);
    expect(applyBulwark(1000, enemies, backline)).toBeCloseTo(595, 10);
  });
});

describe('Bulwark — Geltungsbereich', () => {
  const tank = enemy(0, 'tank', 0.3);
  const backline = enemy(3, 'ranged', 0);

  it('deckt nur die Backline — ein Frontline-Ziel nimmt vollen Schaden', () => {
    expect(bulwarkDamageFactor([tank, backline], tank)).toBe(1);
    expect(applyBulwark(1000, [tank, backline], tank)).toBe(1000);
  });

  it('entfällt vollständig, sobald die Frontline gefallen ist', () => {
    const enemies = [{ ...tank, health: 0 }, backline];

    expect(bulwarkMalus(enemies, backline)).toBe(0);
    expect(applyBulwark(1000, enemies, backline)).toBe(1000);
  });

  it('bleibt für jedes bᵢ < 1 unter 100 % — kein Cap nötig', () => {
    const dicht = [enemy(0, 'tank', 0.9), enemy(1, 'melee', 0.9), enemy(2, 'melee', 0.9), backline];

    expect(bulwarkMalus(dicht, backline)).toBeLessThan(1);
    expect(applyBulwark(1000, dicht, backline)).toBeGreaterThan(0);
  });

  it('Backline-Gegner decken niemanden', () => {
    const enemies = [enemy(3, 'ranged', 0.5), enemy(4, 'ranged', 0.5)];

    expect(bulwarkMalus(enemies, enemies[0] as CombatEnemy)).toBe(0);
  });
});
