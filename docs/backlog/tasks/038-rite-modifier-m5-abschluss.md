# 038 — Rite-Modifier & M5-Abschluss

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `blocked` |
| **Meilenstein**  | M5        |
| **Hängt ab von** | 037       |

## Ziel

Alle fünf Modifier verändern ihre jeweils eine Effect-Facette deterministisch, sind im Kampf
verständlich sichtbar und schließen damit den vollständigen M5-Runen-Loop ab.

## Nicht-Ziel

M6 liefert Akt 2/3, neue Gegner- und Diamond-Inhalte sowie den vollständigen Balancing-Pass. Es
entsteht keine Modifier-Kompatibilitätsmatrix und kein zweiter Rite pro Charakter.

## Blockiert durch

[037](037-rite-ausloesung-effects.md) liefert Basis-Effects und Event-Anbindung. Die offene
Ausführungs- und Zielregel aus [OPEN_ISSUES](../OPEN_ISSUES.md#1-offene-balancing-fragen--tuning-notizen)
muss vorher verbindlich in die SPEC wandern.

## Verbindliche Spec-Anker

- [Aufbau eines Rite](../../spec/RUNES.md#3-aufbau-eines-rite) — Echo, Chain, Prism, Surge und
  Lingering manipulieren je exakt eine Facette
- [Auslösung](../../spec/RUNES.md#4-auslösung-verbindlich) — Modifier umgehen das
  Einmal-pro-Runde-Limit nicht und erzeugen keine Trigger-Ketten
- [Rune-Level](../../spec/RUNES.md#5-rune-level) — Modifier-Level skaliert die eigene Facette
- [Rundenablauf](../../spec/COMBAT-RUN.md#11-rundenablauf) — Lingering fügt sich in einen
  definierten Rundenbeginn ein
- [Viewport- und Screen-Contract](../../spec/UI.md#1-viewport--und-screen-contract) —
  Runescribe und Combat Log bleiben ohne Dokument-Scroll bedienbar

## Akzeptanzkriterien

- [ ] Echo verändert nur die Frequenz, Chain und Prism nur die Zielmenge, Surge nur die
      Magnitude und Lingering nur die Dauer; jede Trigger/Effect/Modifier-Kombination bleibt ohne
      Sondermatrix definiert
- [ ] Kein Modifier umgeht das Eine-Auslösung-pro-Runde-Limit, löst Folge-Trigger aus oder
      erzeugt ungebundene Zufallsquellen; Effect- und Modifier-Level skalieren getrennt
- [ ] Modifier-Auflösungen, Ziele und verzögerte Effekte erscheinen in deterministischer
      Reihenfolge als verständliche Combat-Events und sind im Runescribe-Rite sichtbar
- [ ] Unit-, Store- und Component-Tests decken alle fünf Modifier, Edge-Cases der Ausführungs-
      und Zielregel, Level-Skalierung, Replay-Determinismus und Reload der Konfiguration ab
- [ ] Die betroffenen M5-Flows sind zusätzlich per E2E abgedeckt; anschließend laufen mindestens
      `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run format:check`
      und `npm run docs:links` grün

## Betroffene Dateien

- `src/game/runes/` — Modifier-Content und Facetten-Skalierung
- `src/features/combat/engine/`, `src/features/combat/ui/` — Modifier-Auflösung und Playback
- `src/features/runes/` — Rite- und Modifier-Präsentation
- `e2e/` — kompletter Spieler-Flow von Freischaltung bis Kampf-Feedback

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
