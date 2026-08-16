import { describe, expect, it } from 'vitest';
import type { CharacterId, DefensiveStats } from '@/game/types';
import type { CombatCharacter } from '../combatState';
import { resolveRegeneration } from './regeneration';

/**
 * Eigene Eingangswerte statt Platzhalter-Content: geprüft werden die **Grenzen** der Heilung
 * (flacher Wert, keine Überheilung, Besiegte nicht heilbar), nicht das Tuning der
 * Regeneration-Kurve (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten).
 */

function character(
  health: number,
  maxHealth: number,
  defensive: Partial<DefensiveStats> = {},
  id: CharacterId = 'korvin',
): CombatCharacter {
  return {
    id,
    name: id,
    role: 'tank',
    slotIndex: 0,
    stats: {
      core: { might: 0, toughness: 0, vitality: 0 },
      derived: { attack: 100, defense: 10, health: maxHealth },
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
      defensive: { barrier: 0, blockChance: 0, evasion: 0, regeneration: 20, ...defensive },
      utility: { initiative: 10, multiHitChain: 1, multiHitChainFactor: 0.4, splashRadius: 1 },
    },
    health,
    maxHealth,
    barrier: 0,
  };
}

describe('Regeneration — Grenzen und Auslösung (COMBAT §2.6)', () => {
  it('heilt einen flachen Wert, keinen Anteil der Max-Health', () => {
    const klein = resolveRegeneration(character(50, 100));
    const gross = resolveRegeneration(character(500, 1000));

    // Derselbe Stat heilt bei zehnfacher Max-Health denselben Betrag.
    expect(klein.healed).toBe(20);
    expect(gross.healed).toBe(20);
    expect(klein.health).toBe(70);
    expect(gross.health).toBe(520);
  });

  it('heilt nie über die maximale Health hinaus — der Überschuss verfällt', () => {
    const result = resolveRegeneration(character(95, 100));

    expect(result.healed).toBe(5);
    expect(result.health).toBe(100);
  });

  it('heilt einen Charakter auf voller Health um 0', () => {
    const result = resolveRegeneration(character(100, 100));

    expect(result.healed).toBe(0);
    expect(result.health).toBe(100);
  });

  it('heilt besiegte Charaktere nicht', () => {
    const result = resolveRegeneration(character(0, 100));

    expect(result.healed).toBe(0);
    expect(result.health).toBe(0);
  });

  it('heilt ohne Regeneration-Stat um 0', () => {
    const result = resolveRegeneration(character(10, 100, { regeneration: 0 }));

    expect(result.healed).toBe(0);
    expect(result.health).toBe(10);
  });

  it('lässt den Kampfzustand unberührt — das Anwenden liegt im Schrittwerk', () => {
    const korvin = character(50, 100);

    resolveRegeneration(korvin);

    expect(korvin.health).toBe(50);
  });
});
