import { describe, expect, it } from 'vitest';
import { RUNE_BALANCING } from './runes';
import {
  RITE_MODIFIER_BALANCING,
  riteEffectMagnitude,
  riteModifierFacet,
  riteModifierMagnitude,
  riteTriggerChance,
} from './riteEffects';

describe('Rite-Balancing — deklarative Level-Skalierung', () => {
  it('hebt allein das Trigger-Level die eine Auslösechance bis zum Cap', () => {
    expect(riteTriggerChance(1, RUNE_BALANCING.triggerAttunement)).toBe(0.8);
    expect(riteTriggerChance(5, RUNE_BALANCING.triggerAttunement)).toBe(1);
  });

  it('addiert Prism erst vor dem einen Trigger-Wurf und deckelt bei 100 Prozent', () => {
    expect(riteTriggerChance(1, RUNE_BALANCING.triggerAttunement, 0.15)).toBeCloseTo(0.95);
    expect(riteTriggerChance(5, RUNE_BALANCING.triggerAttunement, 0.25)).toBe(1);
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

describe('Rite-Modifier — getrennte Facetten-Skalierung', () => {
  it.each([
    ['rune.modifier.echo', 'Frequency', RITE_MODIFIER_BALANCING.echoFactor],
    ['rune.modifier.chain', 'Target Count', RITE_MODIFIER_BALANCING.chainAdditionalTargets],
    ['rune.modifier.prism', 'Trigger Chance', RITE_MODIFIER_BALANCING.prismChance],
    ['rune.modifier.surge', 'Magnitude', RITE_MODIFIER_BALANCING.surgeBonus],
    ['rune.modifier.lingering', 'Duration', RITE_MODIFIER_BALANCING.lingeringRounds],
  ] as const)('skaliert %s nur über %s', (modifier, facet, values) => {
    expect(riteModifierFacet(modifier)).toBe(facet);
    expect(riteModifierMagnitude(modifier, 1)).toBe(values[0]);
    expect(riteModifierMagnitude(modifier, 5)).toBe(values[4]);
  });
});
