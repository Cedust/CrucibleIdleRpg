/**
 * Zahlformatierung für die UI (siehe AGENTS.md).
 *
 * Alle Spielwerte laufen über native `number` — die Progressions-Achsen sind gedeckelt und
 * die Spitzenwerte bleiben weit unter Number.MAX_SAFE_INTEGER (ADR-0004).
 */

/** Suffixe ab 1e3, jeweils Faktor 1000. */
const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'] as const;

const THOUSAND = 1000;

/**
 * Formatiert einen Wert kompakt: unter 1000 als ganze Zahl, darüber mit Suffix und
 * einer Nachkommastelle (z. B. 12.300 → "12.3K", 100.000.000 → "100M").
 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';

  const sign = value < 0 ? '-' : '';
  let magnitude = Math.abs(value);

  if (magnitude < THOUSAND) {
    return `${sign}${Math.floor(magnitude)}`;
  }

  let tier = 0;
  while (magnitude >= THOUSAND && tier < SUFFIXES.length - 1) {
    magnitude /= THOUSAND;
    tier += 1;
  }

  // Ab drei Stellen vor dem Komma ist die Nachkommastelle nur Rauschen.
  const decimals = magnitude >= 100 ? 0 : 1;
  return `${sign}${magnitude.toFixed(decimals)}${SUFFIXES[tier]}`;
}
