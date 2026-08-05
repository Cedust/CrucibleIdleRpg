# 011 — Dungeon-Run & Attrition

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `ready`   |
| **Meilenstein**  | M2        |
| **Hängt ab von** | 010, 011a |

## Ziel

Ein Dungeon-Run verbindet seine Floors mit übertragener Health und beendet sich bei Wipe, Verlassen oder dem letzten Floor regelkonform.

## Nicht-Ziel

Auto-Progression und die Optimierungs-Sperre folgen in [012](012-auto-progression-und-run-sperre.md); Rally folgt in [015](015-crucible-und-signatur-skills.md).

## Verbindliche Spec-Anker

- [Checkpoints, Wipe & Abbruch](../../spec/PROGRESSION.md#4-checkpoints-wipe--abbruch) — Attrition, Neubeginn, Wipe/Verlassen und Checkpoints
- [Belohnungen aus einem Sieg](../../spec/PROGRESSION.md#2-belohnungen-aus-einem-sieg) — Floor-Rewards werden sofort committet, aber erst nach dem Run ausgebbar
- [Kampfzustand und Reload](../../spec/SIMULATION.md#5-kampfzustand-und-reload) — Reload beendet den Run ohne Verlust committeter Rewards
- [Seeds und Zufalls-Ströme](../../spec/SIMULATION.md#4-seeds-und-zufalls-ströme) — persistierter Run-Counter und abgeleitete Floor-Seeds

## Entblockt durch

[011a](011a-dungeon-auswahl-und-run-isolation.md) definiert und implementiert die isolierte
Run-Ansicht: Der Run nutzt den Dungeon-View-Bereich ohne Navigation oder Ausgabefunktionen, während
die Kopfzeile Ressourcen nur lesend zeigt. 011 baut darauf den fachlichen Run-Lifecycle.

## Akzeptanzkriterien

- [ ] Ein manueller Floor-Start übergibt Health und Tod-Zustand an den Folgekampf; ein Dungeon-Neustart beginnt mit vollem Team
- [ ] Wipe, Verlassen und Reload verlassen den kompletten Dungeon und behalten nur bereits committete Belohnungen
- [ ] Der Abschluss von Floor 20 markiert genau diesen Dungeon als vollendet und aktualisiert den wählbaren Checkpoint
- [ ] Unit-Tests decken Sieg, Wipe, Verlassen, Reload und die Seed-Kette über mehrere Floors ab

## Betroffene Dateien

- `src/features/combat/`, `src/features/progression/`, `src/features/save/`
- `docs/spec/PROGRESSION.md`, `docs/spec/PERSISTENCE.md`, `docs/backlog/OPEN_ISSUES.md`

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
