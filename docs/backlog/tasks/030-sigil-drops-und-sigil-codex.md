# 030 — Sigil-Drops & Sigil Codex

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `blocked` |
| **Meilenstein**  | M4        |
| **Hängt ab von** | 026       |

## Ziel

Elite- und Boss-Siege schreiben Sigils tiefen-gestaffelt in den Sigil Codex — unbekannte auf
Level 1, bekannte um +1 —, der erste Sigil-Drop eines Spielstands ist garantiert, und eine
Codex-Ansicht zeigt Wissensstand und Level.

## Nicht-Ziel

Brand wendet Sigils erst in [031](031-blacksmith-brand.md) an; dort entstehen auch die
Implicit-Kampfwirkungen.

## Blockiert durch

Der Sigil-Katalog mit Implicit-Klassen, Slot-Bindungen, Mindesttiefen und dem
Boss-Signatur-Sigil ist ein offener Spec-Punkt
([OPEN_ISSUES §2](../OPEN_ISSUES.md#2-offene-spec-punkte)); Gewichte und Skalierung sind offenes
Balancing ([OPEN_ISSUES §1](../OPEN_ISSUES.md#1-offene-balancing-fragen--tuning-notizen)). Der
Katalog wird zuerst in Spec beziehungsweise Balancing-Content festgelegt.
[026](026-item-schichten-und-handwerks-fundament.md) liefert davor das gemeinsame Save-Schema.

## Verbindliche Spec-Anker

- [Sigils & Sigil Codex](../../spec/ITEMS.md#5-sigils--sigil-codex) — Wissensstand plus Level
  1–5, kein Bestand, Slot(-Typ)-Bindung, Pool-Größe unter 12
- [Drops](../../spec/ITEMS.md#6-drops-gems-cinder--sigils) — Elite/Boss ab `A1-D1-20`, erster
  Drop garantiert, tiefen-gestaffelter Pool, Gewichtung unbekannter Sigils, Level 5 verlässt den
  Pool, Akt-Boss-Signatur-Sigil
- [Seeds und Zufalls-Ströme](../../spec/SIMULATION.md#4-seeds-und-zufalls-ströme) — Sigil-Würfe
  laufen über den seedbaren `loot`-Strom
- [Save-Inhalt](../../spec/PERSISTENCE.md#2-save-inhalt) — der Codex-Stand ist persistenter
  Save-Inhalt
- [Belohnungen aus einem Sieg](../../spec/PROGRESSION.md#2-belohnungen-aus-einem-sieg) —
  Sigil-Drops committen atomar mit dem Floor-Sieg

## Akzeptanzkriterien

- [ ] Elite- und Boss-Siege ab `A1-D1-20` würfeln Sigils über den loot-Strom aus dem
      tiefen-gestaffelten Pool; unbekannte Sigils sind höher gewichtet
- [ ] Der erste Sigil-Drop eines Spielstands ist garantiert; der Akt-1-Boss droppt beim ersten
      Kill sein Signatur-Sigil und würfelt bei Wiederholungen aus dem obersten Tier
- [ ] Unbekannte Sigils erscheinen auf Level 1 im Codex, bekannte steigen um +1; Sigils auf
      Level 5 verlassen den Pool, und mit allen Sigils auf Level 5 entfällt der Wurf
- [ ] Der Codex-Stand persistiert im Save, und Sigil-Drops erscheinen in der
      Reward-Zusammenfassung
- [ ] Die Codex-Ansicht zeigt bekannte Sigils mit Level, Slot-Bindung und Implicit-Identität;
      unbekannte Einträge erscheinen verdeckt
- [ ] Unit- und Store-Tests decken Garantie, Staffelung, Gewichtung, Level-Pfad und Pool-Austritt
      deterministisch ab

## Betroffene Dateien

- `src/game/sigils/` — Sigil-Katalog-Content und Drop-Logik
- `src/game/rewards/`, `src/features/dungeon/` — Sieg-Commit und Reward-Zusammenfassung
- `src/features/save/` — persistierter Codex-Stand
- Codex-Ansicht samt Navigationseinbindung — Zuschnitt nach Ist-Stand der App-Struktur

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
