# 019 — Combat View in Spiel-Optik

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Meilenstein**  | M2.5   |
| **Hängt ab von** | 018    |

## Ziel

Der Kampfbildschirm zeigt Team, Gegnerformation, Zugreihenfolge, Log und Run-Steuerung in einer
lesbaren „Gilded Ruins“-Spielansicht, ohne Playback, Kampf-Engine oder Save zu verändern.

## Nicht-Ziel

Treffer- und Todesanimationen, schwebende Schadenszahlen sowie Reduced-Motion-Feedback ziehen in
[021](021-combat-feedback-und-schadenszahlen.md) um. Animierte Sprites und Sound bleiben außerhalb
von M2.5; die Skill-Tree-Screens liegen in [020](020-skill-trees-in-spiel-optik.md).

## Verbindliche Spec-Anker

- [Playback](../../spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit) — Takt,
  Geschwindigkeitsstufen und Zugblöcke bleiben unverändert
- [Visuelle Umsetzung](../../DESIGN.md#5-visuelle-umsetzung) — statische Portraits und Primitives
  aus `src/shared/ui/`
- [Design-Pillars](../../DESIGN.md#2-design-pillars) — Lesbarkeit und Nachvollziehbarkeit Zug für
  Zug gehen vor Effekt
- [AGENTS.md](../../../AGENTS.md) — Tokens und Primitives als einzige Styling-Quellen; Simulation
  bleibt frei von DOM und Timern

## Akzeptanzkriterien

- [x] Jeder Akt-1-Dungeon liefert über deklarative Content-Metadaten seinen Hintergrund und Titel
- [x] Team und Gegner erscheinen in der festen Formation mit statischen Portraits,
      Ressourcenanzeigen und sichtbaren Gefallen-Zuständen
- [x] Zugreihenfolge und Combat Log bleiben während des Kampfs lesbar; das Log zeigt vollständige
      Zugblöcke chronologisch von alt nach neu
- [x] Die Statusleiste bietet Pause/Resume, 1×/2×, Run-Rewards und das bestätigte Verlassen
- [x] Kampfverlauf, Events und Save bleiben unverändert; Component-Tests und `npm run test:e2e`
      sind grün

## Betroffene Dateien

- `src/features/combat/ui/` — Portraits, Team, Gegnerformation, Zugreihenfolge und Combat Log
- `src/features/dungeon/ui/` — Fullscreen-Run-Screen und Statusleiste
- `src/shared/ui/` — einzelne, getönte ProgressBar und erweiterte Dungeon-Hintergründe

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
