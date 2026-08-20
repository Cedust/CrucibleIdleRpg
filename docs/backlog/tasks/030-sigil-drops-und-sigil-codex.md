# 030 — Sigil-Drops & Sigil Codex

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `blocked` |
| **Meilenstein**  | M4        |
| **Hängt ab von** | 026, 032  |

## Ziel

Elite- und Boss-Siege schreiben das Sigil ihrer Quelle in den Sigil Codex — der erste Kill
garantiert, jeder weitere mit flacher Chance auf +1 Level —, und eine Codex-Ansicht zeigt
Wissensstand und Level.

## Nicht-Ziel

Brand wendet Sigils erst in [031](031-blacksmith-brand.md) an; dort entstehen auch die
Imprint-Kampfwirkungen.

## Blockiert durch

[032](032-imprint-und-brand-schwelle.md) — der Begriff `Imprint` steht vor dem Sigil-Content,
damit der neue Code nicht gegen die alte Benennung schreibt.
[026](026-item-schichten-und-handwerks-fundament.md) liefert das gemeinsame Save-Schema.

## Verbindliche Spec-Anker

- [Sigils & Sigil Codex](../../spec/ITEMS.md#5-sigils--sigil-codex) — Wissensstand plus Level
  1–5, kein Bestand, feste Quelle, Slot(-Typ)-Bindung, 18 Sigils bei 12 Slots, Anzeigeform
  `Sigil of …`, verdeckte Einträge als Platzhalter
- [Katalog](../../spec/ITEMS.md#51-katalog) — die 18 Sigils mit Quelle, Imprint und Slot-Bindung
- [Drops](../../spec/ITEMS.md#6-drops-gems-cinder--sigils) — eine Quelle je Sigil, erster Kill
  garantiert, flache Chance bei Wiederholungen, Level 5 erschöpft die Quelle, Akt-3-Boss mit vier
  Sigils und gewichteter Auswahl
- [Seeds und Zufalls-Ströme](../../spec/SIMULATION.md#4-seeds-und-zufalls-ströme) — Sigil-Würfe
  laufen über den seedbaren `loot`-Strom
- [Save-Inhalt](../../spec/PERSISTENCE.md#2-save-inhalt) — der Codex-Stand ist persistenter
  Save-Inhalt
- [Belohnungen aus einem Sieg](../../spec/PROGRESSION.md#2-belohnungen-aus-einem-sieg) —
  Sigil-Drops committen atomar mit dem Floor-Sieg
- [Umgang mit offenen Balancing-Werten](../README.md#4-umgang-mit-offenen-balancing-werten) —
  Drop-Chance und Imprint-Stärke je Sigil-Level sind markierter Balancing-Content

## Akzeptanzkriterien

- [ ] `src/game/sigils/` deklariert alle 18 Sigils des Katalogs mit Quelle, Imprint-Identität und
      Slot(-Typ)-Bindung; jeder Elite- und Boss-Floor hat genau eine Sigil-Quelle, der
      Akt-3-Boss vier
- [ ] Der erste Sieg über eine Quelle schreibt ihr Sigil RNG-frei auf Level 1 in den Codex; beim
      Akt-3-Boss ist das `Empress's Mandate`
- [ ] Jeder weitere Sieg über eine Quelle hebt ihr Sigil mit flacher Chance über den `loot`-Strom
      um +1 Level; ein Sigil auf Level 5 erschöpft seine Quelle
- [ ] Der Akt-3-Boss würfelt bei Wiederholungen zuerst die Chance, dann gewichtet unter seinen
      vier Sigils; unbekannte sind höher gewichtet, Sigils auf Level 5 fallen aus der Auswahl
- [ ] Der Codex-Stand persistiert im Save, und Sigil-Drops erscheinen in der
      Reward-Zusammenfassung
- [ ] Die Codex-Ansicht zeigt bekannte Sigils als `Sigil of …` mit Level, Slot-Bindung und
      Imprint; unbekannte Einträge erscheinen als Platzhalter, und die Ansicht rendert die
      Einträge freigeschalteter Akte
- [ ] Unit- und Store-Tests decken Garantie, Wiederholungs-Chance, Level-Pfad,
      Quellen-Erschöpfung und die gewichtete Auswahl des Akt-3-Bosses deterministisch ab

## Betroffene Dateien

- `src/game/sigils/` — Sigil-Katalog-Content und Drop-Logik
- `src/game/rewards/`, `src/features/dungeon/` — Sieg-Commit und Reward-Zusammenfassung
- `src/features/save/` — persistierter Codex-Stand
- Codex-Ansicht samt Navigationseinbindung — Zuschnitt nach Ist-Stand der App-Struktur

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
