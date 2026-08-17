# 028 — Jeweler: Inlay & Gem-Affixe

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `blocked` |
| **Meilenstein**  | M4        |
| **Hängt ab von** | 026, 027  |

## Ziel

Der Jeweler setzt per Inlay Gems aus dem Bestand in Sockel, würfelt Affix und Wert über den
loot-Strom, und gesockelte Affixe wirken in effektiven Stats und Kampf.

## Nicht-Ziel

Attune und Recut folgen in [029](029-jeweler-attune-und-recut.md). Diamond-Inlay und
Prismatic-Effekte warten auf den offenen Spec-Punkt
([OPEN_ISSUES §2](../OPEN_ISSUES.md#2-offene-spec-punkte)) und die Akt-2-Drops (M6).

## Blockiert durch

[026](026-item-schichten-und-handwerks-fundament.md) — Sockel-Modell und Gem-Bindung.
[027](027-blacksmith-temper-und-masterwork.md) — Sockel entstehen per Masterwork; die Station
folgt dem dort etablierten Crafting-Rahmen.

## Verbindliche Spec-Anker

- [Jeweler](../../spec/ITEMS.md#8-jeweler--inlay-attune--recut) — Inlay, Farb-Pools,
  Item-Bindung der Gems und Überschreiben belegter Sockel
- [Item-Anatomie](../../spec/ITEMS.md#2-item-anatomie-fünf-schichten) — Schicht 4 als
  Min-Max-Achse und einziger Zufall im Handwerk
- [Seeds und Zufalls-Ströme](../../spec/SIMULATION.md#4-seeds-und-zufalls-ströme) — Affix- und
  Value-Rolls laufen über den seedbaren `loot`-Strom
- [Stats](../../spec/CHARACTERS.md#2-stats) — Stat-Kategorien hinter den vier Farb-Pools
- [Umgang mit offenen Balancing-Werten](../README.md#4-umgang-mit-offenen-balancing-werten) —
  Pool-Gewichte und Value-Ranges sind markierter Balancing-Content

## Akzeptanzkriterien

- [ ] Inlay verbraucht genau einen Gem der gewählten Farbe aus dem Bestand, rollt Affix aus dem
      Farb-Pool und Wert aus dessen Range über den loot-Strom; gleiche Seeds liefern denselben
      Roll
- [ ] Ein belegter Sockel wird überschrieben; der bisherige gebundene Gem ist verloren, der
      Bestand bleibt unverändert
- [ ] Amber-, Ruby-, Sapphire- und Emerald-Affixe aggregieren in die effektiven Stats (Heroes)
      und die Kampfwert-Herleitung; gleiche Seeds liefern denselben Kampfverlauf
- [ ] Der Jeweler-Screen ist über die Navigation erreichbar und zeigt die Gem-Bestände dauerhaft
      an; Prismatic-Sockel erscheinen als Diamond-gebunden gesperrt
- [ ] Unit-, Store- und Component-Tests decken Verbrauch, Determinismus, Überschreiben,
      Pool-Zuordnung und Stat-Aggregation ab

## Betroffene Dateien

- `src/game/crafting/` — Inlay-Logik; `src/game/items/` — Farb-Pools und Value-Ranges
- `src/features/crafting/` — Jeweler-Screen und Store-Aktionen
- `src/features/heroes/`, `src/features/combat/` — Affix-Aggregation in Stats und Herleitung
- `src/features/save/` — persistierte Sockelbelegung

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
