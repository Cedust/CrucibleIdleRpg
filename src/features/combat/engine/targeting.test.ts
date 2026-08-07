import { describe, expect, it } from 'vitest';
import type { CharacterId, CharacterStats, Lane, Role } from '@/game/types';
import type { CombatCharacter, CombatEnemy, CombatState } from './combatState';
import {
  attackableEnemies,
  comparePriority,
  livingEnemies,
  selectPrimaryTarget,
  selectSplashTargets,
  type EnemyTarget,
} from './targeting';

/**
 * Eigene Eingangswerte statt Platzhalter-Content: geprüft wird die **Auswahlregel**, nicht das
 * Tuning (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten). Die Zustände sind von
 * Hand gestellt, damit Rollen-Lock, Taunt und Gleichstände erzwingbar sind.
 */

function stats(splashRadius = 1): CharacterStats {
  return {
    core: { might: 0, toughness: 0, vitality: 0 },
    derived: { attack: 100, defense: 10, health: 100 },
    offensive: {
      critChance: 0,
      critDamage: 1,
      multiHitChance: 0,
      multiHitDamage: 0,
      splashChance: 0,
      splashDamage: 0,
      counterChance: 0,
      counterDamage: 0,
    },
    defensive: { barrier: 0, blockChance: 0, evasion: 0, regeneration: 0 },
    utility: { initiative: 10, multiHitChain: 1, multiHitChainFactor: 0.5, splashRadius },
  };
}

function character(id: CharacterId, role: Role, slotIndex = 0): CombatCharacter {
  return {
    id,
    name: id,
    role,
    slotIndex,
    stats: stats(),
    health: 100,
    maxHealth: 100,
    barrier: 0,
  };
}

function enemy(
  formationIndex: number,
  initiative: number,
  role: Role = 'melee',
  health = 50,
): CombatEnemy {
  const lane: Lane = formationIndex < 3 ? 'frontline' : 'backline';

  return {
    definitionId: 'ashenGhoul',
    name: `Enemy ${formationIndex}`,
    role,
    lane,
    formationIndex,
    health,
    maxHealth: 50,
    attack: 10,
    accuracy: 0.5,
    initiative,
    bulwarkContribution: 0,
  };
}

function state(enemies: CombatEnemy[]): CombatState {
  return {
    floorId: 'A1-D1-01',
    floorIndex: 0,
    floorSeed: 1,
    combatPrngState: 1,
    characters: [],
    effectiveDamage: { korvin: 0, rhaya: 0, quinn: 0 },
    enemies,
    round: 1,
    pending: [],
  };
}

function slots(targets: readonly EnemyTarget[]): number[] {
  return targets.map((target) => target.enemy.formationIndex);
}

const korvin = character('korvin', 'tank', 0);
const rhaya = character('rhaya', 'melee', 1);
const quinn = character('quinn', 'ranged', 2);

describe('comparePriority — höchste Initiative zuerst', () => {
  it('sortiert absteigend nach Initiative', () => {
    const gestellt = state([enemy(0, 5), enemy(1, 12), enemy(2, 9)]);

    expect(slots(livingEnemies(gestellt).sort(comparePriority))).toEqual([1, 2, 0]);
  });

  it('löst einen Gleichstand über den niedrigeren Formations-Index auf', () => {
    const gestellt = state([enemy(2, 7), enemy(0, 7), enemy(1, 7)]);

    expect(slots(livingEnemies(gestellt).sort(comparePriority))).toEqual([0, 1, 2]);
  });

  it('nimmt besiegte Gegner nicht auf', () => {
    const gestellt = state([enemy(0, 5), enemy(1, 12, 'melee', 0)]);

    expect(slots(livingEnemies(gestellt))).toEqual([0]);
  });
});

describe('Rollen-Lock — Tank und Melee vs. Ranged', () => {
  const gemischt = state([
    enemy(0, 5),
    enemy(1, 8),
    enemy(3, 20, 'ranged'),
    enemy(4, 18, 'ranged'),
  ]);

  it('sperrt Tank und Melee auf die Frontline, solange dort ein Gegner lebt', () => {
    expect(slots(attackableEnemies(gemischt, korvin))).toEqual([0, 1]);
    expect(slots(attackableEnemies(gemischt, rhaya))).toEqual([0, 1]);
  });

  it('greift für Tank und Melee die Frontline mit der höchsten Initiative an — nicht den stärksten Ranged', () => {
    expect(selectPrimaryTarget(gemischt, korvin)?.enemy.formationIndex).toBe(1);
    expect(selectPrimaryTarget(gemischt, rhaya)?.enemy.formationIndex).toBe(1);
  });

  it('öffnet die Backline für Tank und Melee, sobald die Frontline gefallen ist', () => {
    const gefallen = state([
      enemy(0, 5, 'melee', 0),
      enemy(1, 8, 'melee', 0),
      enemy(3, 20, 'ranged'),
      enemy(4, 18, 'ranged'),
    ]);

    expect(slots(attackableEnemies(gefallen, rhaya))).toEqual([3, 4]);
    expect(selectPrimaryTarget(gefallen, rhaya)?.enemy.formationIndex).toBe(3);
  });

  it('lässt Ranged die Backline von Beginn an anvisieren', () => {
    expect(slots(attackableEnemies(gemischt, quinn))).toEqual([0, 1, 3, 4]);
    expect(selectPrimaryTarget(gemischt, quinn)?.enemy.formationIndex).toBe(3);
  });

  it('liefert kein Ziel, wenn kein Gegner mehr lebt', () => {
    const leer = state([enemy(0, 5, 'melee', 0)]);

    expect(selectPrimaryTarget(leer, rhaya)).toBeUndefined();
    expect(selectPrimaryTarget(leer, quinn)).toBeUndefined();
  });
});

describe('Taunt — gegnerischer Tank hat Vorrang', () => {
  // Der Tank hat die niedrigste Initiative; ohne Taunt wäre er nicht das Ziel.
  const mitTank = state([enemy(0, 3, 'tank'), enemy(1, 14), enemy(3, 20, 'ranged')]);

  it('zwingt Tank und Melee auf den gegnerischen Tank, trotz niedrigerer Initiative', () => {
    expect(selectPrimaryTarget(mitTank, korvin)?.enemy.role).toBe('tank');
    expect(selectPrimaryTarget(mitTank, rhaya)?.enemy.role).toBe('tank');
  });

  it('wird von Ranged umgangen', () => {
    expect(selectPrimaryTarget(mitTank, quinn)?.enemy.formationIndex).toBe(3);
  });

  it('entfällt mit dem Tod des Tanks — dann greift wieder die Initiative', () => {
    const ohneTank = state([enemy(0, 3, 'tank', 0), enemy(1, 14), enemy(3, 20, 'ranged')]);

    expect(selectPrimaryTarget(ohneTank, rhaya)?.enemy.formationIndex).toBe(1);
  });
});

describe('Splash-Nebenziele — gleiche Lane zuerst', () => {
  // Primärziel ist Frontline-Slot 1; die Backline trägt die höheren Initiativen.
  const gestellt = state([
    enemy(0, 6),
    enemy(1, 14),
    enemy(2, 9),
    enemy(3, 20, 'ranged'),
    enemy(4, 18, 'ranged'),
  ]);
  const primary = livingEnemies(gestellt).find(
    (target) => target.enemy.formationIndex === 1,
  ) as EnemyTarget;

  it('nimmt die eigene Lane vor der Backline, obwohl die Backline schneller ist', () => {
    expect(slots(selectSplashTargets(gestellt, primary, 1))).toEqual([2]);
    expect(slots(selectSplashTargets(gestellt, primary, 2))).toEqual([2, 0]);
  });

  it('greift Lane-übergreifend, sobald die eigene Lane erschöpft ist — dann nach Initiative', () => {
    expect(slots(selectSplashTargets(gestellt, primary, 4))).toEqual([2, 0, 3, 4]);
  });

  it('nimmt das Primärziel nie als Nebenziel', () => {
    expect(slots(selectSplashTargets(gestellt, primary, 6))).not.toContain(1);
  });

  it('liefert bei Radius 0 keine Nebenziele', () => {
    expect(selectSplashTargets(gestellt, primary, 0)).toEqual([]);
  });

  it('liefert höchstens so viele Nebenziele, wie Gegner leben', () => {
    const knapp = state([enemy(1, 14), enemy(2, 9, 'melee', 0)]);
    const einzeln = livingEnemies(knapp)[0] as EnemyTarget;

    expect(selectSplashTargets(knapp, einzeln, 3)).toEqual([]);
  });
});
