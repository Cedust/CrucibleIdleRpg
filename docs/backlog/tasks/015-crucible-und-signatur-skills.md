# 015 — Crucible & Signatur-Skills

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `blocked` |
| **Meilenstein**  | M2        |
| **Hängt ab von** | 012, 014  |

## Ziel

Der Crucible investiert Crystals in globale und charaktergebundene Nodes, einschließlich der drei Signatur-Skills, und wendet deren freigeschaltete Kampfwirkungen deterministisch an.

## Nicht-Ziel

Nodes für Handwerk, Ausrüstung und Runen dürfen nur als noch gesperrte, klar gekennzeichnete Voraussetzungen erscheinen; die jeweiligen Systeme folgen in M3–M5.

## Verbindliche Spec-Anker

- [Crucible](../../spec/PROGRESSION.md#3-crucible-globaler-skilltree) — vier Trees, stufbare Nodes, lineare Crystal-Kosten und Gold-Respec
- [Signatur-Skills](../../spec/CHARACTERS.md#7-signatur-skills) — drei charaktergebundene Nodes mit Level 1–5
- [Signatur-Skills (Kampfwirkung)](../../spec/COMBAT.md#3-signatur-skills-kampfwirkung) — Mitigation, Sunder und Suppression
- [Save-Inhalt](../../spec/PERSISTENCE.md#2-save-inhalt) — Crucible-Node-Stände und Währungen sind persistent

## Blockiert durch

Die Node-Kataloge, Voraussetzungen und Werte der vier Crucible-Trees fehlen. Zusätzlich sind Mitigation-, Sunder- und Rally-Werte offen ([OPEN_ISSUES](../OPEN_ISSUES.md#1-offene-balancing-fragen--tuning-notizen)). Sie müssen zuerst in Spec beziehungsweise Balancing-Content festgelegt werden.

## Akzeptanzkriterien

- [ ] Nur bezahlbare, voraussetzungserfüllte Nodes sind kaufbar; stufbare Nodes kosten auf Level `n` genau `n` Crystals und cappen bei Level 5
- [ ] Gold-Respec setzt Crucible-Investitionen regelkonform zurück und persistiert den neuen Stand
- [ ] Die drei Signatur-Skills verändern ihre festgelegten Kampfhebel nur nach Freischaltung; gleiche Seeds liefern denselben Kampfverlauf
- [ ] Unit-Tests decken Kosten, Caps, Respec, Persistenz und alle drei Signatur-Skills ab

## Betroffene Dateien

- `src/game/`, `src/features/progression/`, `src/features/combat/`, `src/features/save/`
- `docs/spec/PROGRESSION.md`, `docs/spec/CHARACTERS.md`, `docs/backlog/OPEN_ISSUES.md`

## Definition of Done

[AGENTS.md §11](../../../AGENTS.md#11-entwicklungs-workflow-für-agenten-verbindlich).
