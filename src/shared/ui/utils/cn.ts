/**
 * Fügt Klassenlisten zusammen und filtert falsy Teile (bedingte Klassen wie
 * `selected && 'ring-2'`). Bewusst ohne Dedupe/Merge-Logik — Konflikte werden
 * an den Callsites vermieden (FOUNDATION §7).
 */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
