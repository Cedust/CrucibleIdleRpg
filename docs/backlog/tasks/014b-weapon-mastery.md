# 014b — Weapon Mastery

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `blocked` |
| **Meilenstein**  | M2        |
| **Hängt ab von** | 014a      |

## Ziel

Jeder Charakter kann seine 100 Mastery Points regelkonform in fünf Disciplines investieren,
Stat-Wirkungen anwenden, eine Discipline gegen Gold zurücksetzen und den vollständigen Baum in
der Weapon-Mastery-Ansicht bedienen.

## Nicht-Ziel

Die Kampfwirkungen der Expert-, Master- und Capstone-Nodes folgen in
[014c](014c-mastery-combat-arts.md). Dieser Task persistiert und validiert ihre Ränge bereits,
aktiviert ihre Kampfverhalten aber noch nicht.

## Verbindliche Spec-Anker

- [Mastery Points, Ranks und Node-Regeln](../../spec/WEAPON-MASTERY.md#3-mastery-points-ranks-und-node-regeln)
  — Pool, Rank-Gates, Kosten, Verbindungen und Exklusivität.
- [Gemeinsame Disciplines](../../spec/WEAPON-MASTERY.md#4-gemeinsame-disciplines) — Stat-Nodes,
  Werte und kaufbare Kapazitäten.
- [Weapon-Disciplines](../../spec/WEAPON-MASTERY.md#5-charakterindividuelle-weapon-disciplines)
  — charakterindividuelle Stat-Verteilungen.
- [Rank-Verteilung](../../spec/WEAPON-MASTERY.md#6-rank-verteilung-und-verbindungen) — zentrale
  Verhaltenstrasse und Stat-Linien.
- [Ansicht](../../spec/WEAPON-MASTERY.md#7-weapon-mastery-ansicht) — Navigation, Tabs, Inspector,
  Investition und Respec-Bedienung.
- [Persistenz](../../spec/WEAPON-MASTERY.md#8-persistenz-und-laufzeitzustand) — gespeicherte
  Node-Ränge und abgeleitete Locks.

## Blockiert durch

Neben 014a fehlen die konkreten deklarativen Werte für Grundpreis und Punktpreis des
Discipline-Respecs
([OPEN_ISSUES](../OPEN_ISSUES.md#ökonomie-und-endgame)). Die Formel ist entschieden; beide Werte
müssen vor der finalen UI- und Content-Umsetzung festgelegt werden.

## Akzeptanzkriterien

- [ ] Der typisierte Content enthält alle fünf Disciplines pro Charakter mit exakten Rank-,
      Effekt-, Kosten- und Vorgängerangaben aus der Spec.
- [ ] Nur level- und voraussetzungskonforme Nodes sind kaufbar; Stat-Nodes cappen bei Rang 5,
      Verhaltens-Nodes bei Rang 1.
- [ ] Master-Wahlen schließen ihre Alternative aus; genau ein gemeinsamer Discipline Capstone
      und zusätzlich der feste Weapon Capstone sind legal.
- [ ] Stat-Nodes verändern ausschließlich die spezifizierten Stats und respektieren alle Caps.
- [ ] Discipline-Respec berechnet den Preis zentral, verlangt Bestätigung, erstattet nur den
      aktiven Tab und löst dessen Locks regelkonform.
- [ ] Save-Validierung erzwingt Punktesumme, Voraussetzungen und Exklusivität über Reloads.
- [ ] Die Ansicht erfüllt Charakterleiste, Tabs, Punktezähler, horizontale Ranks, Inspector,
      Investieren, Lock-Warnungen, Respec und Run-Sperre; 1920×1080 benötigt keinen Seiten-Scroll.
- [ ] Unit-, Komponenten- und E2E-Tests decken Node-Regeln und den kritischen Bedienfluss ab.

## Betroffene Dateien

- `src/game/weaponMastery/`, `src/features/weaponMastery/`
- `src/features/combat/characterStats.ts`, `src/features/save/`, `src/features/shell/`
- `e2e/`

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
