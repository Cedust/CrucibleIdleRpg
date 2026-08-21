# 034 — Runewords-Drops & Reward-Commit

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Meilenstein**  | M5     |
| **Hängt ab von** | 033    |

## Ziel

Jeder Floor-Sieg schreibt Runewords nach der Gegner- und Tiefenregel atomar in den Save und
zeigt den konkreten Gewinn in der laufenden Run- und Sieg-Belohnung.

## Nicht-Ziel

Die Ausgabe von Runewords durch Inscribe und Etch gehört nach
[035](035-runescribe-inscribe-etch.md). Dieser Task konfiguriert weder Talismane noch Rites und
verändert keine Kampfeffekte.

## Blockiert durch

[033](033-rune-grimoire-fundament.md) — liefert M5-Save, Rune-Grimoire-Freischaltung und die
kanonische Runewords-Bezeichnung.

## Verbindliche Spec-Anker

- [Runewords (Drop)](../../spec/RUNES.md#6-runewords-drop) — Drop-Gate, Gegnerquellen,
  Elite-/Boss-Bonus und tiefenabhängige Kurve
- [Belohnungen aus einem Sieg](../../spec/PROGRESSION.md#2-belohnungen-aus-einem-sieg) — Loot
  committet mit XP, Gold und Relic Shards am Floor-Sieg
- [Seeds und Zufalls-Ströme](../../spec/SIMULATION.md#4-seeds-und-zufalls-ströme) — Loot ist
  seedbar und bleibt vom Kampf- und Init-Strom getrennt
- [Save-Inhalt](../../spec/PERSISTENCE.md#2-save-inhalt) — Runewords sind ein globaler,
  persistierter Bestand
- [Umgang mit offenen Balancing-Werten](../README.md#4-umgang-mit-offenen-balancing-werten) —
  Mengen, Staffelung und Elite-/Boss-Bonus sind markierter Content

## Akzeptanzkriterien

- [ ] Alle Gegner vergeben Runewords erst nach Freischaltung von Rune Grimoire; davor bleiben
      Drop, Reward-Text und Bestandsänderung garantiert bei `0`
- [ ] Die deklarative Drop-Kurve wächst mit der Floor-Tiefe und ergänzt Elite- und Boss-Boni,
      ohne eine zweite Balancing-Tabelle außerhalb von `src/game/` einzuführen
- [ ] Der Runewords-Wurf verwendet ausschließlich den seedbaren `loot`-Strom und verändert weder
      Initialisierungs- noch Kampf-PRNG; gleiche Eingaben liefern denselben Gain
- [ ] Der Gewinn wird mit dem Floor-Sieg atomar gespeichert, überlebt einen Reload und erscheint
      als konkrete Position in Reward-Zusammenfassung und Run-Reward-Zähler
- [ ] Unit- und Store-Tests decken das Grimoire-Gate, Tiefen- und Klassifikationsregel,
      Determinismus, atomaren Commit und Reload ab

## Betroffene Dateien

- `src/game/rewards/` — deklarative Runewords-Kurve und Floor-Loot
- `src/features/dungeon/` — Victory-Commit, Reward-Summary und Run-Status
- `src/features/save/` — atomare Bestandsaktualisierung und persistierter Roundtrip

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
