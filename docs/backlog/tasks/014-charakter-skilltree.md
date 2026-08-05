# 014 — Charakter-Skilltree

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `blocked` |
| **Meilenstein**  | M2        |
| **Hängt ab von** | 013       |

## Ziel

Jeder Charakter kann seine Skillpunkte in denselben vier Zweigen investieren, deren Knoten die vorgesehenen Kampfwerte und Verhaltensfreischaltungen wirksam machen.

## Nicht-Ziel

Die globalen Crucible-Nodes und Signatur-Skills liegen in [015](015-crucible-und-signatur-skills.md); Ausrüstungswerte folgen in M3.

## Verbindliche Spec-Anker

- [Charakter-Skilltree](../../spec/CHARACTERS.md#4-charakter-skilltree) — Zweige, gekoppelte Stats, Knotenarten, Multiplikation, Caps und Gold-Respec
- [Charakter-Zug](../../spec/DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden) — Freischaltungen erweitern exakt diese Kampfpfade
- [Save-Inhalt](../../spec/PERSISTENCE.md#2-save-inhalt) — Skillpunkt-Verteilung ist persistent

## Blockiert durch

Die Spec definiert keine Knotenliste, Kosten, Voraussetzungen oder Werte der Stat-Knoten. Diese Strukturfrage muss vor dem Code in [CHARACTERS](../../spec/CHARACTERS.md#4-charakter-skilltree) entschieden werden.

## Akzeptanzkriterien

- [ ] Der Tree zeigt Finesse, Tempest, Dominance und Valor pro Charakter mit nur legalen Investitionen
- [ ] Stat- und Verhaltens-Knoten beeinflussen nur die jeweils spezifizierten Kampfwerte bzw. Generatoren
- [ ] Chancen cappen bei 100 %, Damage nicht; ein Respec erstattet den Tree regelkonform gegen Gold
- [ ] Deterministische Tests decken Voraussetzungen, Caps, Respec und die drei Crit-Erweiterungen ab

## Betroffene Dateien

- `src/game/characters/`, `src/features/progression/`, `src/features/combat/`, `src/features/save/`
- `docs/spec/CHARACTERS.md`, `docs/backlog/OPEN_ISSUES.md`

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
