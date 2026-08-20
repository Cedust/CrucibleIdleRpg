import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '@/game/characters/characters';
import { deriveCharacterStats, neutralProgression } from '@/features/combat/engine/characterStats';
import { ATTRIBUTE_AXES, combatStatRows, formatStatValue, statGroups } from './statsPresentation';

const stats = deriveCharacterStats(CHARACTERS.korvin, neutralProgression(1));
const [core, offensive, defensive, utility] = statGroups(stats);

describe('statsPresentation', () => {
  it('deckt jede Stat des Charakters genau einmal ab', () => {
    expect(core.stats.map((stat) => stat.label)).toEqual(['Might', 'Toughness', 'Vitality']);
    // Die Offensive Stats stehen paarweise: eine Zeile trägt Chance und Damage eines Musters.
    expect(offensive.stats).toHaveLength(Object.keys(stats.offensive).length / 2);
    expect(defensive.stats).toHaveLength(Object.keys(stats.defensive).length);
    expect(utility.stats).toHaveLength(Object.keys(stats.utility).length);
    expect(combatStatRows(stats.derived).map((row) => row.label)).toEqual([
      'Attack',
      'Defense',
      'Health',
    ]);
  });

  it('trägt je Gruppe eine eigene Tönung und je Zeile ein Icon', () => {
    expect([core.tone, offensive.tone, defensive.tone, utility.tone]).toEqual([
      'accent',
      'offense',
      'defense',
      'utility',
    ]);
    for (const group of [core, offensive, defensive, utility]) {
      for (const stat of group.stats) {
        expect(stat.icon).toMatch(/^(stat|discipline)-/);
      }
    }
  });

  it('tönt die Core Stats je Zeile nach der Achse ihres Derived Stats', () => {
    expect(core.stats.map((stat) => stat.tone)).toEqual(['offense', 'defense', 'vitality']);
    expect(core.stats.map((stat) => stat.tone)).toEqual(
      combatStatRows(stats.derived).map((row) => row.tone),
    );
  });

  it('lässt die übrigen Gruppen ohne Zeilen-Tönung, damit die Gruppen-Tönung trägt', () => {
    for (const group of [offensive, defensive, utility]) {
      for (const stat of group.stats) {
        expect(stat.tone).toBeUndefined();
      }
    }
  });

  it('stellt jedes offensive Muster als eine Zeile aus Chance und Damage dar', () => {
    expect(offensive.valueColumns).toEqual(['Chance', 'Damage']);
    expect(offensive.stats.map((stat) => stat.label)).toEqual([
      'Critical Hits',
      'Multi Hits',
      'Splash Hits',
      'Counter Hits',
    ]);
    expect(offensive.stats.map((stat) => [stat.value, stat.pairedValue])).toEqual([
      [stats.offensive.critChance, stats.offensive.critDamage],
      [stats.offensive.multiHitChance, stats.offensive.multiHitDamage],
      [stats.offensive.splashChance, stats.offensive.splashDamage],
      [stats.offensive.counterChance, stats.offensive.counterDamage],
    ]);
    for (const stat of offensive.stats) {
      expect(stat.format).toBe('percent');
    }
  });

  it('trägt je offensivem Muster genau einmal das Discipline-Icon seiner Weapon Mastery', () => {
    expect(offensive.stats.map((stat) => stat.icon)).toEqual([
      'discipline-finesse',
      'discipline-tempest',
      'discipline-dominance',
      'discipline-valor',
    ]);
  });

  it('lässt die übrigen Gruppen einwertig und ohne Spaltenköpfe', () => {
    for (const group of [core, defensive, utility]) {
      expect(group.valueColumns).toBeUndefined();
      for (const stat of group.stats) {
        expect(stat.pairedValue).toBeUndefined();
      }
    }
  });

  it('koppelt jedes Attribut an Icon und Tönung seines Derived Stats', () => {
    const combat = combatStatRows(stats.derived);
    expect(ATTRIBUTE_AXES.map((axis) => axis.derived)).toEqual(['attack', 'defense', 'health']);
    for (const [index, axis] of ATTRIBUTE_AXES.entries()) {
      expect(axis.tone).toBe(combat[index]?.tone);
      expect(axis.icon).toBe(combat[index]?.icon);
    }
  });

  it('formatiert Anteile als Prozent und alles andere als Zahl', () => {
    expect(formatStatValue({ value: 0.24, format: 'percent' })).toBe('24%');
    expect(formatStatValue({ value: 1284 })).toBe('1,284');
    expect(formatStatValue({ value: 14.1666, format: 'number' })).toBe('14.17');
  });
});
