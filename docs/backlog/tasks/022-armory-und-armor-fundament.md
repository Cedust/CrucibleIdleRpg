# 022 — Armory & Armor-Fundament

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Meilenstein**  | M3     |
| **Hängt ab von** | 016    |

## Ziel

Armory-Ränge schalten für das gesamte Team nacheinander dauerhafte Armor-Slots frei, deren
`Common +1`-Basen und Innate-Affixe persistieren und die effektiven Kampfwerte bestimmen.

## Nicht-Ziel

Gem-Sockel, Seltenheit, Temper, Masterwork, Brand und alle Stationen gehören nach M4. Loot wird
in [025](025-gem-und-cinder-drops.md) vergeben; die spielbare Darstellung der Slots entsteht in
[024](024-loadout-ansicht.md).

## Verbindliche Spec-Anker

- [Slots, Basen & Innate-Affixe](../../spec/ITEMS.md#1-slots-basen--innate-affixe) — vier
  Slot-Reihenfolge, permanente `Common +1`-Basis und je Slot fester Innate
- [Item-Anatomie](../../spec/ITEMS.md#2-item-anatomie-fünf-schichten) — Basis und Item-Level sind
  getrennte Item-Schichten; spätere Schichten werden nicht vorweggenommen
- [Anvil Sparks](../../spec/PROGRESSION.md#31-anvil-sparks) — `anvil.armory` besitzt vier Ränge
  für Chest, Legs, Head und Feet
- [Stats](../../spec/CHARACTERS.md#2-stats) — Core-Stats speisen ausschließlich ihre zugehörigen
  Derived Stats; Initiative bleibt ein Utility-Stat
- [Save-Inhalt](../../spec/PERSISTENCE.md#2-save-inhalt) und
  [Migrationen im Pre-Release](../../spec/PERSISTENCE.md#21-migrationen-im-pre-release) —
  freigeschaltete Items werden gespeichert, Unlocks aus Crucible-Rängen abgeleitet und alte
  Formate kontrolliert zurückgesetzt

## Akzeptanzkriterien

- [ ] `anvil.armory` ist kaufbar; jeder Rang schaltet für alle drei Charaktere genau einen Slot
      in der Reihenfolge Chest, Legs, Head, Feet frei
- [ ] Der Crucible-Inspector benennt für jeden kaufbaren Armory-Rang den konkreten nächsten,
      teamweiten Slot und dessen Rangkosten
- [ ] Ein neu freigeschalteter Slot erzeugt genau eine dauerhafte `Common +1`-Basis mit dem
      richtigen Slot-Typ und Innate-Affix; weder Item-Inventar noch Tausch existieren
- [ ] Innate-Werte fließen in die zugehörigen effektiven Kampfwerte ein: Head in Vitality, Chest
      und Legs in Toughness, Feet in Initiative; die Item-Level-Kurve liegt als ausdrücklich
      gekennzeichneter Balancing-Content unter `src/game/`
- [ ] Der Save enthält nur die aus Armory-Rängen abgeleiteten Slot-Items, validiert ihre zulässige
      M3-Form und setzt jeden bisherigen Save gemäß Pre-Release-Policy auf den aktualisierten
      Default zurück
- [ ] Crucible-Kauf, Save-Reload und Kampfaufbau verwenden dieselbe Armor-Wahrheit; ein laufender
      Dungeon-Run bleibt von Ausgaben und Ausrüstungsänderungen ausgeschlossen
- [ ] Unit-Tests prüfen Slot-Reihenfolge, Anfangszustand, Stat-Zuordnung, Save-Validierung und
      Kampfwerte mit und ohne jeden freigeschalteten Slot deterministisch

## Betroffene Dateien

- `src/game/items/` — typisierter Armor- und Innate-Content samt Platzhalterkurve
- `src/game/crucible/` — aktivierter Armory-Node und abgeleitete Slot-Freischaltung
- `src/features/save/` — Save-Schema, Default-Save und atomare Armory-Kaufaktion
- `src/features/combat/engine/` — Einbezug der persistierten Innate-Werte in den Kampfaufbau
- `src/game/types.ts` — persistierbare Item- und Slot-Typen

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
