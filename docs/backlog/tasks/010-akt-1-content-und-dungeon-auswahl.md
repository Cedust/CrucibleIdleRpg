# 010 — Akt-1-Content & Dungeon-Auswahl

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Meilenstein**  | M2      |
| **Hängt ab von** | 009     |

## Ziel

Akt 1 mit fünf Dungeons zu je zwanzig Floors ist als deklarativer Content vorhanden, und der Spieler kann einen freigeschalteten Dungeon zum Start auswählen.

## Nicht-Ziel

Die Floor-Kette, Attrition und das Freischalten weiterer Einstiege folgen in [011](011-dungeon-run-und-attrition.md); Akt 2 und 3 folgen in M6.

## Verbindliche Spec-Anker

- [Struktur](../../spec/PROGRESSION.md#1-struktur-akte-dungeons-floors) — IDs, 5 × 20 Floors, Elite-/Boss-Floors, Ramp-Up und wiederholbare Dungeons
- [Gegnerformation](../../spec/COMBAT.md#13-gegnerformation) — jeder Floor referenziert eine Formation mit zwei bis sechs Gegnern
- [Save-Inhalt](../../spec/PERSISTENCE.md#2-save-inhalt) — Checkpoints und Vollendet-Flags je Dungeon sind persistierter Fortschritt
- [AGENTS.md §4](../../../AGENTS.md#4-content--balancing) — typisierter, deklarativer Content; provisorische Zahlen bleiben markiert

## Akzeptanzkriterien

- [ ] `A1-D1-01` bis `A1-D5-20` sind eindeutig typisiert und validiert; Elite- und Boss-IDs entsprechen der Spec
- [ ] Der erste Dungeon bildet den vierphasigen Ramp-Up ab; die übrigen Dungeons verwenden nachvollziehbare Formations-Vorlagen
- [ ] Der Selector bietet nur freigeschaltete Dungeon-Einstiege und kennzeichnet den gewählten Einstieg zugänglich
- [ ] Unentschiedene Formations- und Gegnerwerte bleiben Platzhalter-Content mit Link auf [OPEN_ISSUES](../OPEN_ISSUES.md#1-offene-balancing-fragen--tuning-notizen)
- [ ] Deterministische Tests decken ID-Auflösung, 100 Floors und die Encounter-Klassifikation ab

## Betroffene Dateien

- `src/game/encounters/`, `src/game/enemies/`, `src/game/types.ts`
- `src/features/progression/`, `src/features/save/`

## Definition of Done

[AGENTS.md §11](../../../AGENTS.md#11-entwicklungs-workflow-für-agenten-verbindlich).
