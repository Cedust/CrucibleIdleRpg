# 027 — Blacksmith: Temper & Masterwork

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Meilenstein**  | M4      |
| **Hängt ab von** | 026     |

## Ziel

Der Blacksmith hebt per Temper das Item-Level gegen Gold bis zum Seltenheits-Cap und per
Masterwork die Seltenheit gegen Cinder und Gold; Gold- und Cinder-Bestand sind in der Station
dauerhaft sichtbar.

## Nicht-Ziel

Brand folgt in [031](031-blacksmith-brand.md) nach dem Sigil Codex
([030](030-sigil-drops-und-sigil-codex.md)). Die Jeweler-Aktionen liegen in
[028](028-jeweler-inlay-und-gem-affixe.md) und 029.

## Blockiert durch

[026](026-item-schichten-und-handwerks-fundament.md) — die fünf Schichten und ihre Caps sind die
Arbeitsfläche der Station.

## Verbindliche Spec-Anker

- [Blacksmith](../../spec/ITEMS.md#7-blacksmith--temper-masterwork--brand) — Temper und
  Masterwork sind RNG-frei; Kostenarten Gold beziehungsweise Cinder plus Gold
- [Seltenheit, Sockel & Level-Cap](../../spec/ITEMS.md#3-seltenheit-sockel--level-cap) —
  Cinder-Tabelle, Masterwork jederzeit ohne Mindestlevel, erster Sockel mit erstem Masterwork
- [Ökonomische Absicht](../../BALANCING.md#3-ökonomische-absicht) — Cinder-Knappheit als
  Rhythmus des Masterwork-Pfads
- [Umgang mit offenen Balancing-Werten](../README.md#4-umgang-mit-offenen-balancing-werten) —
  Gold- und Cinder-Kosten sind markierter Balancing-Content
- [Viewport- und Screen-Contract](../../spec/UI.md#1-viewport--und-screen-contract) und
  [State-Modell](../../spec/UI.md#5-state-modell) — Screen-Aufbau, semantische Zustände und
  Tastaturbedienung

## Akzeptanzkriterien

- [ ] Temper hebt das Item-Level um genau eine Stufe bis zum Seltenheits-Cap, kostet Gold nach
      markierter Balancing-Kurve, und der Innate-Wert wächst sichtbar mit
- [ ] Masterwork hebt die Seltenheit um eine Stufe, öffnet einen zusätzlichen Sockel samt
      höherer Caps und kostet Cinder nach Seltenheits-Tabelle plus Gold; es ist jederzeit
      möglich, sobald die Kosten gedeckt sind
- [ ] Beide Aktionen sind RNG-frei, persistieren atomar und überleben einen Reload
- [ ] Der Blacksmith-Screen ist über die Navigation erreichbar, wählt Charakter und Armor-Slot
      und zeigt Gold- und Cinder-Bestand dauerhaft an
- [ ] Unbezahlbare oder gecappte Aktionen sind deaktiviert und begründen ihren Zustand
      zugänglich; alle Zustände sind per Tastatur erreichbar
- [ ] Unit-, Store- und Component-Tests decken Caps, Kosten, Persistenz und deaktivierte
      Zustände ab

## Betroffene Dateien

- `src/game/crafting/` — Temper-/Masterwork-Logik und Kosten-Content
- `src/features/crafting/` — Crafting-Store und Blacksmith-Screen
- `src/app/` — Navigationseintrag der Station
- `src/features/save/` — atomare Persistenz der Handwerks-Aktionen

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
