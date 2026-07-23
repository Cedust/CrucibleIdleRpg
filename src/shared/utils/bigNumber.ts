import Decimal, { type DecimalSource } from 'break_eternity.js';

/**
 * Dünner Wrapper um break_eternity.js (siehe AGENTS.md §5).
 * Alle Werte, die Number.MAX_SAFE_INTEGER überschreiten können (Schaden, Ressourcen,
 * Prestige-Skalen), werden als Decimal geführt — nicht als native number.
 */
export { Decimal };
export type { DecimalSource };

export function big(value: DecimalSource): Decimal {
  return new Decimal(value);
}

/**
 * Formatiert große Zahlen kompakt für die UI.
 * < 1e6: mit Tausendertrennzeichen; darüber: wissenschaftliche Notation.
 */
export function formatNumber(value: DecimalSource): string {
  const d = new Decimal(value);
  if (d.lt(1e6)) {
    return d.toNumber().toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  return d.toExponential(2).replace('e+', 'e');
}
