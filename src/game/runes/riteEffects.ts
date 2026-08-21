import type { EffectRuneId, ModifierRuneId, RuneLevel } from './types';

/**
 * PLATZHALTER — Basiswerte für Task 037. Die Formeln und ihre Bezugsgroessen sind verbindlich;
 * konkrete Werte bleiben bis zum Balancing-Pass deklarativer Content.
 */
export const RITE_EFFECT_BALANCING = {
  triggerBaseChance: 0.8,
  heal: 30,
  barrier: 24,
  boltDamageFactor: 0.55,
  empowerAttackBonus: 0.15,
  empowerDuration: 1,
  markDamageFactor: 0.35,
  reprisalDamageFactor: 1,
} as const;

/**
 * PLATZHALTER — Modifier-Werte bleiben deklarativer Balancing-Content. Jede Zeile steuert nur
 * die in RUNES §3 festgelegte eigene Facette.
 */
export const RITE_MODIFIER_BALANCING = {
  echoFactor: [0.5, 0.6, 0.7, 0.8, 0.9],
  chainAdditionalTargets: [1, 2, 2, 3, 3],
  prismChance: [0.05, 0.1, 0.15, 0.2, 0.25],
  surgeBonus: [0.1, 0.15, 0.2, 0.25, 0.3],
  lingeringRounds: [1, 2, 3, 4, 5],
} as const;

/** Rune-Level 1–5 lesen den deklarativen Multiplikator an ihrer festen Position. */
export function runeMagnitude(level: RuneLevel, scaling: readonly number[]): number {
  return scaling[level - 1] ?? 1;
}

/** Trigger-Level hebt die Chance des einen Rite-Wurfs; Prism addiert erst danach seine Facette. */
export function riteTriggerChance(
  level: RuneLevel,
  triggerAttunement: readonly number[],
  prismChance = 0,
): number {
  return Math.min(
    Math.max(
      RITE_EFFECT_BALANCING.triggerBaseChance +
        runeMagnitude(level, triggerAttunement) +
        prismChance,
      0,
    ),
    1,
  );
}

/** Basis-Magnitude eines Effects, getrennt vom späteren Modifier-System. */
export function riteEffectMagnitude(
  effect: EffectRuneId,
  level: RuneLevel,
  effectScaling: readonly number[],
): number {
  const multiplier = runeMagnitude(level, effectScaling);
  switch (effect) {
    case 'rune.effect.heal':
      return RITE_EFFECT_BALANCING.heal * multiplier;
    case 'rune.effect.barrier':
      return RITE_EFFECT_BALANCING.barrier * multiplier;
    case 'rune.effect.bolt':
      return RITE_EFFECT_BALANCING.boltDamageFactor * multiplier;
    case 'rune.effect.empower':
      return RITE_EFFECT_BALANCING.empowerAttackBonus * multiplier;
    case 'rune.effect.mark':
      return RITE_EFFECT_BALANCING.markDamageFactor * multiplier;
    case 'rune.effect.reprisal':
      return RITE_EFFECT_BALANCING.reprisalDamageFactor * multiplier;
  }
}

/** Stärke des Modifier-Levels auf seiner jeweils einzigen Facette. */
export function riteModifierMagnitude(modifier: ModifierRuneId, level: RuneLevel): number {
  switch (modifier) {
    case 'rune.modifier.echo':
      return runeMagnitude(level, RITE_MODIFIER_BALANCING.echoFactor);
    case 'rune.modifier.chain':
      return runeMagnitude(level, RITE_MODIFIER_BALANCING.chainAdditionalTargets);
    case 'rune.modifier.prism':
      return runeMagnitude(level, RITE_MODIFIER_BALANCING.prismChance);
    case 'rune.modifier.surge':
      return runeMagnitude(level, RITE_MODIFIER_BALANCING.surgeBonus);
    case 'rune.modifier.lingering':
      return runeMagnitude(level, RITE_MODIFIER_BALANCING.lingeringRounds);
  }
}

/** Lesbare Rite-Facette für Runescribe und Combat Log. */
export function riteModifierFacet(modifier: ModifierRuneId): string {
  switch (modifier) {
    case 'rune.modifier.echo':
      return 'Frequency';
    case 'rune.modifier.chain':
      return 'Target Count';
    case 'rune.modifier.prism':
      return 'Trigger Chance';
    case 'rune.modifier.surge':
      return 'Magnitude';
    case 'rune.modifier.lingering':
      return 'Duration';
  }
}

/** Spieltext zur gerade gebundenen Modifier-Stärke im Runescribe. */
export function riteModifierDescription(modifier: ModifierRuneId, level: RuneLevel): string {
  const value = riteModifierMagnitude(modifier, level);
  switch (modifier) {
    case 'rune.modifier.echo':
      return `Echoes the Effect at ${Math.round(value * 100)}% strength.`;
    case 'rune.modifier.chain':
      return `Reaches ${value} additional ${value === 1 ? 'target' : 'targets'}.`;
    case 'rune.modifier.prism':
      return `Adds ${Math.round(value * 100)}% trigger chance.`;
    case 'rune.modifier.surge':
      return `Adds ${Math.round(value * 100)}% Effect magnitude.`;
    case 'rune.modifier.lingering':
      return `Repeats for ${value} following ${value === 1 ? 'round' : 'rounds'}.`;
  }
}
