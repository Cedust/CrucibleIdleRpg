# 012 — Auto-Progression & Run-Sperre

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `blocked` |
| **Meilenstein**  | M2        |
| **Hängt ab von** | 011       |

## Ziel

Freigeschaltete Auto-Progression startet bis zum Dungeon-Ende den nächsten Floor, und während eines Runs sind alle Optimierungsaktionen gesperrt.

## Nicht-Ziel

Die Node-Freischaltung selbst liegt in [015](015-crucible-und-signatur-skills.md); der Dungeon-Run ohne Automatik in [011](011-dungeon-run-und-attrition.md).

## Verbindliche Spec-Anker

- [Checkpoints, Wipe & Abbruch](../../spec/PROGRESSION.md#4-checkpoints-wipe--abbruch) — Auto-Progression, manueller Neustart am Dungeon-Ende und Run-Sperre
- [Playback](../../spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit) — Pause ab Start, 2× nach Dungeon-Abschluss, nur Anzeige-Effekt
- [Save-Inhalt](../../spec/PERSISTENCE.md#2-save-inhalt) — Vollendet-Flags und Playback-Geschwindigkeit sind gespeichert

## Blockiert durch

Welche Anvil-Sparks-Nodes Auto-Progression und welche Checkpoints freischalten, ist in der [Crucible-Spec](../../spec/PROGRESSION.md#3-crucible-globaler-skilltree) nicht strukturell definiert.

## Akzeptanzkriterien

- [ ] Mit freigeschalteter Automatik startet nach einem Sieg genau der nächste Floor; nach Floor 20 endet der Run ohne automatische Dungeon-Kette
- [ ] 2× ist nur für mindestens einmal vollendete Dungeons auswählbar und ändert nie den simulierten Ausgang
- [ ] Attribut-, Skilltree-, Crucible-, Respec- und Handwerksaktionen sind während eines Runs nicht ausführbar und als gesperrt kommuniziert
- [ ] Component- und Store-Tests decken Sperre, Freischaltungen und Dungeon-Ende ab

## Betroffene Dateien

- `src/features/combat/`, `src/features/progression/`, `src/features/shell/`, `src/features/save/`
- `docs/spec/PROGRESSION.md`, `docs/backlog/OPEN_ISSUES.md`

## Definition of Done

[AGENTS.md §11](../../../AGENTS.md#11-entwicklungs-workflow-für-agenten-verbindlich).
