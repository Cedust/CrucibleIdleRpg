# 021 — Combat-Feedback und Schadenszahlen

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Meilenstein**  | M2.5    |
| **Hängt ab von** | 019     |

## Ziel

Der Combat View vermittelt Treffer, Schaden und Tod synchron zu bereits vorhandenen Kampf-Events,
ohne den Playback-Takt oder die deterministische Simulation zu beeinflussen.

## Nicht-Ziel

Neue Kampfregeln, Änderungen an Events, Save-Schema, animierte Sprites und Sound gehören nicht zu
diesem Task.

## Verbindliche Spec-Anker

- [Playback](../../spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit) — Events treiben das
  Feedback, niemals umgekehrt
- [Visuelle Umsetzung](../../DESIGN.md#5-visuelle-umsetzung) — Treffer-, Schadens- und
  Todes-Feedback über Animationen und schwebende Schadenszahlen
- [AGENTS.md](../../../AGENTS.md) — Simulation bleibt frei von DOM, Timern und Zufall

## Akzeptanzkriterien

- [ ] Treffer lösen eine kurze, dem Kampf-Event zugeordnete Portrait-Reaktion und schwebende
      Schadenszahl aus
- [ ] Gefallene Akteure erhalten ein eindeutiges Todesfeedback, ohne Formation oder Zuglogik zu
      verändern
- [ ] Feedback funktioniert bei 1× und 2× und beeinflusst weder Ereignisfolge noch Playback-Takt
- [ ] `prefers-reduced-motion` reduziert Feedback auf lesbare Zustandswechsel ohne Bewegung
- [ ] Component-Tests und `npm run test:e2e` sind grün

## Betroffene Dateien

- `src/features/combat/ui/` — eventgebundenes Feedback auf den Portraits und Schadenszahlen
- `src/app/index.css` — Token-basierte Keyframes und Reduced-Motion-Regeln

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
