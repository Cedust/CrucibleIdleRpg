# 013 — XP, Level & Attributpunkte

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Meilenstein**  | M2     |
| **Hängt ab von** | 011    |

## Ziel

Floor-XP levelt die drei Charaktere bis Level 100 und stellt die daraus gewonnenen Attributpunkte zur freien Verteilung bereit.

## Nicht-Ziel

Die in diesem Task vorbereiteten Skillpunkt-Summen werden durch
[014a](014a-weapon-foundation.md) direkt auf Mastery Points umgestellt; Node-Investitionen folgen
in [014b](014b-weapon-mastery.md). Globale Crucible-Boni bleiben in
[015](015-crucible-und-signatur-skills.md).

## Verbindliche Spec-Anker

- [Belohnungen aus einem Sieg](../../spec/PROGRESSION.md#2-belohnungen-aus-einem-sieg) — XP-Pool pro Floor, Basisanteil und individueller Rest
- [Charakterlevel](../../spec/CHARACTERS.md#5-charakterlevel) — Cap 100 und XP-Kurve; die neue
  Level-Folge wird in 014a auf Attribute und Mastery Points umgestellt
- [Attribute](../../spec/CHARACTERS.md#3-attribute-level-up-progression) — drei frei verteilbare Attribute, 100 Punkte und Gold-Respec
- [Stats](../../spec/CHARACTERS.md#2-stats) — Attribute sind die Prozent-Ebene der Derived Stats
- [Save-Inhalt](../../spec/PERSISTENCE.md#2-save-inhalt) — Level, XP und Attributpunkt-Verteilung sind persistent

## Akzeptanzkriterien

- [x] Ein Floor-Reward verteilt einen XP-Pool regelkonform; mehrere Level-Ups und der Cap 100 verhalten sich deterministisch
- [x] Jeder Level-Up vergibt genau einen Attribut- und einen Skillpunkt
- [x] Attributpunkte beeinflussen Attack, Defense bzw. Health über die festgelegte multiplikative Schicht und überleben einen Reload
- [x] Unit-Tests decken XP-Verteilung, Cap, Level-Up-Folgen, Respec und Save-Migration ab

## Betroffene Dateien

- `src/game/curves/`, `src/game/rewards/`, `src/features/progression/`, `src/features/combat/characterStats.ts`, `src/features/save/`
- `docs/backlog/OPEN_ISSUES.md`

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
