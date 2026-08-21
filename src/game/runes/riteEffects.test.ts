import { describe, expect, it } from 'vitest';
import { RUNE_BALANCING } from './runes';
import { riteEffectMagnitude, riteTriggerChance } from './riteEffects';

describe('Rite-Balancing — deklarative Level-Skalierung', () => {
  it('hebt allein das Trigger-Level die eine Auslösechance bis zum Cap', () => {
    expect(riteTriggerChance(1, RUNE_BALANCING.triggerAttunement)).toBe(0.8);
    expect(riteTriggerChance(5, RUNE_BALANCING.triggerAttunement)).toBe(1);
  });

  it('skaliert jede Basis-Magnitude mit dem Effect-Level', () => {
    expect(
      riteEffectMagnitude('rune.effect.heal', 5, RUNE_BALANCING.effectMagnitude),
    ).toBeGreaterThan(riteEffectMagnitude('rune.effect.heal', 1, RUNE_BALANCING.effectMagnitude));
    expect(
      riteEffectMagnitude('rune.effect.bolt', 5, RUNE_BALANCING.effectMagnitude),
    ).toBeGreaterThan(riteEffectMagnitude('rune.effect.bolt', 1, RUNE_BALANCING.effectMagnitude));
  });
});
