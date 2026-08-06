# 012 — Auto-Progression & Run-Sperre

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Meilenstein**  | M2     |
| **Hängt ab von** | 011    |

## Ziel

Auto-Progression startet bis zum Dungeon-Ende den nächsten Floor, und während eines Runs sind alle Optimierungsaktionen gesperrt.

## Nicht-Ziel

Der Dungeon-Run ohne Automatik liegt in [011](011-dungeon-run-und-attrition.md). Keine
Crucible-Nodes, Kaufmechanik oder Features aus 013–015 sind Teil dieses Tasks.

## Verbindliche Spec-Anker

- [Checkpoints, Wipe & Abbruch](../../spec/PROGRESSION.md#4-checkpoints-wipe--abbruch) — Auto-Progression, manueller Neustart am Dungeon-Ende und Run-Sperre
- [Playback](../../spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit) — Pause ab Start, 2× nach Dungeon-Abschluss, nur Anzeige-Effekt
- [Save-Inhalt](../../spec/PERSISTENCE.md#2-save-inhalt) — Vollendet-Flags und Playback-Geschwindigkeit sind gespeichert

## Akzeptanzkriterien

- [x] Nach einem gespeicherten Sieg startet genau der nächste Floor desselben Dungeons; nach Floor 20 endet der Run ohne automatische Dungeon-Kette
- [x] 2× ist nur für mindestens einmal vollendete Dungeons auswählbar und ändert nie den simulierten Ausgang
- [x] Attribut-, Skilltree-, Crucible-, Respec- und Handwerksaktionen sind während eines Runs nicht ausführbar und als gesperrt kommuniziert
- [x] Component- und Store-Tests decken Sperre, Freischaltungen und Dungeon-Ende ab

## Betroffene Dateien

- `src/features/combat/`, `src/features/progression/`, `src/features/shell/`, `src/features/save/`
- `docs/spec/PROGRESSION.md`, `docs/backlog/OPEN_ISSUES.md`

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
