# 026 — Item-Schichten & Handwerks-Fundament

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Meilenstein**  | M4     |
| **Hängt ab von** | 025    |

## Ziel

Das persistierte Armor-Item trägt alle fünf Schichten — Basis, Item-Level, Seltenheit, Sockel mit
gebundenen Gems und Implicit — mit seltenheits-abgeleiteten Caps, und der Innate-Wert fließt am
aktuellen Item-Level in effektive Stats und Kampf ein.

## Nicht-Ziel

Die Handwerks-Aktionen und Stationen-Screens entstehen in [027](027-blacksmith-temper-und-masterwork.md)
bis 029 und 031; Sigil-Inhalte in 030 und 031. Diamond-Effekte warten auf den offenen Spec-Punkt
([OPEN_ISSUES §2](../OPEN_ISSUES.md#2-offene-spec-punkte)) und die Akt-2-Drops (M6).

## Verbindliche Spec-Anker

- [Item-Anatomie](../../spec/ITEMS.md#2-item-anatomie-fünf-schichten) — fünf Schichten und
  Stamm-Modell: Item-Level als Basis-Power, Seltenheit als Kapazität
- [Seltenheit, Sockel & Level-Cap](../../spec/ITEMS.md#3-seltenheit-sockel--level-cap) —
  Seltenheit als Master-Regler, Cap-Tabelle, Common +1 ohne Sockel
- [Slots, Basen & Innate-Affixe](../../spec/ITEMS.md#1-slots-basen--innate-affixe) — der
  Innate-Wert skaliert mit dem Item-Level
- [Prismatic-Sockel](../../spec/ITEMS.md#4-prismatic-sockel) — `floor(Item-Level / 50)`,
  ausschließlich Diamond, unabhängig von Seltenheit und Brand
- [Save-Inhalt](../../spec/PERSISTENCE.md#2-save-inhalt) — Item-Zustände sind persistenter
  Save-Inhalt; Pre-Release-Save-Policy nach [AGENTS.md](../../../AGENTS.md)
- [Umgang mit offenen Balancing-Werten](../README.md#4-umgang-mit-offenen-balancing-werten) —
  die Innate-Wert-Kurve ist markierter Balancing-Content

## Akzeptanzkriterien

- [ ] `ArmorItem` persistiert Item-Level, Seltenheit, Sockelbelegung (gebundene Gems mit Farbe,
      Affix, Gem-Level und Wert) und optionales Implicit; das Schema erzwingt Item-Level ≤
      Seltenheits-Cap und Sockelzahl nach Seltenheits-Tabelle plus Prismatic-Formel
- [ ] Der Default-Save startet weiterhin als Common +1 ohne Sockel; Saves in anderer Form
      resetten beim Laden auf den Default (Schema, Default und Tests atomar ersetzt)
- [ ] Der Innate-Wert folgt einer als Balancing-Content markierten Kurve über den vollen
      Level-Bereich bis +100 und fließt am aktuellen Item-Level in effektive Stats und
      Kampfwert-Herleitung ein
- [ ] Die Loadout-Detailkarte zeigt die persistierten Schichten Seltenheit, Item-Level und
      Sockel des ausgewählten Items
- [ ] Unit-Tests decken Cap-Invarianten, Prismatic-Formel, Innate-Skalierung, Save-Roundtrip
      und den Reset fremder Formate ab

## Betroffene Dateien

- `src/game/types.ts`, `src/game/items/` — Item-Schichten, Caps und Innate-Kurve
- `src/features/save/` — ersetztes Save-Schema mit Default und Tests
- `src/features/heroes/` — Loadout-Detailkarte und effektive Stats
- `src/features/combat/` — Innate-Wert am Item-Level in der Kampfwert-Herleitung

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
