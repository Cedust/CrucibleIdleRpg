import { describe, expect, it } from 'vitest';

import { formatNumber } from '@/shared/utils/formatNumber';

describe('formatNumber', () => {
  it('gibt Werte unter 1000 als ganze Zahl aus', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(7)).toBe('7');
    expect(formatNumber(999)).toBe('999');
  });

  it('schneidet Nachkommastellen unter 1000 ab', () => {
    expect(formatNumber(12.9)).toBe('12');
  });

  it('nutzt Suffixe ab 1000', () => {
    expect(formatNumber(1000)).toBe('1.0K');
    expect(formatNumber(12_300)).toBe('12.3K');
    expect(formatNumber(1_500_000)).toBe('1.5M');
  });

  it('lässt die Nachkommastelle ab drei Vorkommastellen weg', () => {
    expect(formatNumber(100_000_000)).toBe('100M');
    expect(formatNumber(999_400_000)).toBe('999M');
  });

  it('deckt die Spitzenwerte der Progressions-Achsen ab (ADR-0004)', () => {
    expect(formatNumber(1e10)).toBe('10.0B');
  });

  it('behandelt negative Werte', () => {
    expect(formatNumber(-2500)).toBe('-2.5K');
  });

  it('fängt nicht-endliche Werte ab', () => {
    expect(formatNumber(Number.NaN)).toBe('—');
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('—');
  });
});
