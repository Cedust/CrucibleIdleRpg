# 006 — Schrittwerk & Kampf-Events

| Feld             | Wert     |
| ---------------- | -------- |
| **Status**       | `done`   |
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

- [x] Die Funktion ist rein: kein `Date.now()`, kein Timer, kein DOM, kein Store-Zugriff
      ([AGENTS.md §5](../../../AGENTS.md#5-architektur-des-game-loops))
- [x] Ein vollständiger Kampf, Takt für Takt bis zum Ende gerechnet, ist bei gleichem Seed
      bit-identisch reproduzierbar
- [x] Derselbe Seed liefert dasselbe Ergebnis, ob die Takte einzeln oder in einer Schleife
      am Stück ausgeführt werden — es gibt keine zweite Code-Bahn
- [x] Die Gegner-Gesamt-Health sinkt über den gesamten Kampf monoton (Test über alle Takte)
- [x] Jeder Takt liefert genau einen Zug-Block an Events; die Event-Reihenfolge innerhalb
      eines Zuges ist getestet
- [x] Sieg und Wipe werden erkannt und beenden das Schrittwerk

## Betroffene Dateien

- `src/features/combat/combatEngine.ts` + Test
- `src/features/combat/combatEvents.ts` (Event-Typen)
- `src/shared/utils/prng.ts` + Test — `ResumablePrng.state()` und `resumePrng`
- `src/features/combat/combatState.ts` — Feld `combatPrngState`

## Umsetzungsnotiz

Die Reinheit hängt daran, dass der **PRNG-Fortschritt im Zustand liegt**: `CombatState`
trägt mit `combatPrngState` die Position im `combat`-Strom, ein Takt nimmt sie über
`resumePrng` auf und schreibt sie zurück. Ohne das wäre die Takt-Funktion an eine
mitgeschleppte Generator-Instanz gebunden und derselbe Eingangszustand lieferte zweimal
verschiedene Takte.

Der Rundenbeginn ist **kein eigener Takt**, sondern der Kopf des ersten Zug-Blocks einer
Runde — ein Takt bleibt damit ausnahmslos ein Akteur am Zug
([Playback](../../spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit)).
