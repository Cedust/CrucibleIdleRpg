import type { EffectRuneId, RuneLevel } from './types';

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

/** Rune-Level 1–5 lesen den deklarativen Multiplikator an ihrer festen Position. */
export function runeMagnitude(level: RuneLevel, scaling: readonly number[]): number {
  return scaling[level - 1] ?? 1;
}

/** Trigger-Level hebt allein die Chance des einen Rite-Wurfs. */
export function riteTriggerChance(level: RuneLevel, triggerAttunement: readonly number[]): number {
  return Math.min(
    Math.max(RITE_EFFECT_BALANCING.triggerBaseChance + runeMagnitude(level, triggerAttunement), 0),
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
