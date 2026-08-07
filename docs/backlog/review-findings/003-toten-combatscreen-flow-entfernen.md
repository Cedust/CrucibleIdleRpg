# 003 — Toten CombatScreen-Flow entfernen

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Schwere**      | hoch   |
| **Hängt ab von** | —      |

## Ziel

Es existiert genau ein Kampf-Flow (`DungeonSelectionScreen`/`DungeonRunScreen`); die
wertvollen Testblöcke des alten Screens leben an den echten Komponenten weiter.

## Befund

Bezog sich auf die inzwischen entfernten Dateien `src/features/combat/ui/CombatScreen.tsx`
und `CombatScreen.test.tsx`:

- `CombatScreen.tsx` wurde ausschließlich vom eigenen Test importiert; die AppShell rendert
  die Dungeon-Screens. Der Screen enthielt eine dritte Kopie der Run-Start-Orchestrierung
  (Z. 34–52) und driftete bereits (Playback-Speed fehlte).
- `CombatScreen.test.tsx` deckte zugleich `EnemyFormation`, `TeamPanel`, `TurnOrderBar` und
  `CombatLog` ab: Profiler-Tests (Z. 109–125, 186–229), Lane-Rendering (ab Z. 232),
  Log-DOM-Stabilität (Z. 399–423). Diese Abdeckung lebt jetzt als Komponenten-Tests neben den
  Bausteinen weiter.
- Der Selected-Dungeon-Fallback existierte doppelt (`CombatScreen.tsx` Z. 29–32,
  [DungeonSelectionScreen.tsx](../../../src/features/dungeon/ui/DungeonSelectionScreen.tsx)
  Z. 16–19).

## Nicht-Ziel

Umbau des Dungeon-Run-Lifecycles — [006](006-dungeon-run-lifecycle-konsolidieren.md).

## Verbindliche Spec-Anker

- [AGENTS.md § Architecture](../../../AGENTS.md#architecture) — feature-scoped Stores, Navigation state-basiert

## Akzeptanzkriterien

- [x] `CombatScreen.tsx` ist entfernt.
- [x] Profiler-, Lane-, Turn-Order- und Log-Tests laufen gegen die echten Screens bzw. direkt
      gegen `EnemyFormation`/`TeamPanel`/`TurnOrderBar`/`CombatLog` und bleiben grün.
- [x] Der Selected-Dungeon-Fallback lebt an genau einer Stelle.

## Betroffene Dateien

- `src/features/combat/ui/CombatScreen.tsx`, `CombatScreen.test.tsx` — entfernen/umziehen
- `src/features/dungeon/ui/` — Zielort der umgezogenen Tests

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
