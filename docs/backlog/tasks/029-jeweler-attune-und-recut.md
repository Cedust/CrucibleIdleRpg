# 029 — Jeweler: Attune & Recut

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `blocked` |
| **Meilenstein**  | M4        |
| **Hängt ab von** | 028       |

## Ziel

Gesockelte Gems steigen per Attune bis zum seltenheits-gedeckelten Gem-Level mit wachsenden
Fodder-Kosten und behalten dabei ihre relative Range-Position; Recut würfelt den Wert innerhalb
der aktuellen Range neu.

## Nicht-Ziel

Diamond bleibt wie in [028](028-jeweler-inlay-und-gem-affixe.md) außen vor. Sigil Codex und
Brand liegen in [030](030-sigil-drops-und-sigil-codex.md) und [031](031-blacksmith-brand.md).

## Blockiert durch

[028](028-jeweler-inlay-und-gem-affixe.md) — Attune und Recut arbeiten auf per Inlay gesockelten
Gems.

## Verbindliche Spec-Anker

- [Jeweler](../../spec/ITEMS.md#8-jeweler--inlay-attune--recut) — Attune-Cap durch
  Item-Seltenheit, Erhalt der relativen Position, Fodder-Sink; Recut innerhalb der aktuellen
  Range
- [Seeds und Zufalls-Ströme](../../spec/SIMULATION.md#4-seeds-und-zufalls-ströme) — Recut rollt
  über den seedbaren `loot`-Strom
- [Umgang mit offenen Balancing-Werten](../README.md#4-umgang-mit-offenen-balancing-werten) —
  Fodder-Kosten je Level sind markierter Balancing-Content

## Akzeptanzkriterien

- [ ] Attune hebt das Gem-Level im Sockel um eine Stufe bis zum Cap der Item-Seltenheit; die
      Value-Range steigt und der Wert behält seine relative Position in der Range
- [ ] Attune kostet Gems gleicher Farbe als Fodder; die Kosten steigen je Level nach markierter
      Balancing-Kurve
- [ ] Recut würfelt den Wert innerhalb der aktuellen Range über den loot-Strom; gleiche Seeds
      liefern denselben Wert
- [ ] Beide Aktionen persistieren atomar, überleben einen Reload und wirken unmittelbar in
      effektiven Stats und Kampf
- [ ] Unit- und Store-Tests decken Cap, Positions-Erhalt, Fodder-Kosten und Determinismus ab

## Betroffene Dateien

- `src/game/crafting/` — Attune-/Recut-Logik und Fodder-Kosten-Content
- `src/features/crafting/` — Jeweler-Screen um beide Aktionen erweitert
- `src/features/save/` — persistierte Gem-Level und -Werte

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
