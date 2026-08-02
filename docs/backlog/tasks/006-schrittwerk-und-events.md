# 006 — Schrittwerk & Kampf-Events

| Feld             | Wert     |
| ---------------- | -------- |
| **Status**       | `ready`  |
| **Meilenstein**  | M1       |
| **Hängt ab von** | 004, 005 |

## Ziel

Die Kampf-Engine exponiert eine reine „Zustand → nächster Takt"-Funktion, die einen Akteur
handeln lässt, den Folgezustand samt Kampf-Events zurückgibt und Sieg beziehungsweise Wipe
erkennt.

## Nicht-Ziel

Timing und Anzeige — Takt-Länge, Pause und Catch-up liegen in
[007](007-playback-und-store.md). Diese Funktion kennt keine Zeit.

## Verbindliche Spec-Anker

- [Grundmodell](../../spec/SIMULATION.md#1-grundmodell-verbindlich) — inkrementell, kein
  Vorabdurchlauf; **dasselbe Schrittwerk** bedient Playback und Catch-up
- [Rundenablauf](../../spec/COMBAT.md#11-rundenablauf) — Rundenbeginn, Aktionen, Rundenende;
  Sieg-, Wipe- und Abbruchbedingungen; kein Rundenlimit
- [Feststehende Regeln](../../spec/COMBAT.md#25-feststehende-regeln) — Events in
  deterministisch fester Reihenfolge; sie sind später die Anbindung der Rune-Trigger
- [Playback](../../spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit) — **ein Takt =
  ein Akteur am Zug**; der Zug ist ein Block, keine Einzelzeilen
- [SPEC § Invarianten](../../SPEC.md#invarianten) — Punkt 7: die Gegner-Gesamt-Health sinkt
  monoton, jeder Kampf endet in endlicher Rundenzahl

## Akzeptanzkriterien

- [ ] Die Funktion ist rein: kein `Date.now()`, kein Timer, kein DOM, kein Store-Zugriff
      ([AGENTS.md §5](../../../AGENTS.md#5-architektur-des-game-loops))
- [ ] Ein vollständiger Kampf, Takt für Takt bis zum Ende gerechnet, ist bei gleichem Seed
      bit-identisch reproduzierbar
- [ ] Derselbe Seed liefert dasselbe Ergebnis, ob die Takte einzeln oder in einer Schleife
      am Stück ausgeführt werden — es gibt keine zweite Code-Bahn
- [ ] Die Gegner-Gesamt-Health sinkt über den gesamten Kampf monoton (Test über alle Takte)
- [ ] Jeder Takt liefert genau einen Zug-Block an Events; die Event-Reihenfolge innerhalb
      eines Zuges ist getestet
- [ ] Sieg und Wipe werden erkannt und beenden das Schrittwerk

## Betroffene Dateien

- `src/features/combat/combatEngine.ts` + Test
- `src/features/combat/combatEvents.ts` (Event-Typen)
