# 036 — Talisman & Rite-Konfiguration

| Feld             | Wert     |
| ---------------- | -------- |
| **Status**       | `done`   |
| **Meilenstein**  | M5       |
| **Hängt ab von** | 033, 035 |

## Ziel

Jeder per Anvil freigeschaltete Charakter erhält in Runescribe einen Talisman mit frei
umsteckbarem Rite; jede bekannte Rune ist im gesamten Team höchstens einmal aktiv.

## Nicht-Ziel

Dieser Task definiert keine Kampfauslösung und lässt einen gelegten Rite noch nicht wirken — das
geschieht in [037](037-rite-ausloesung-effects.md) und
[038](038-rite-modifier-m5-abschluss.md). Talismane erhalten keine Item-Schichten und keine
Armor- oder Crafting-Aktion.

## Blockiert durch

[033](033-rune-grimoire-fundament.md) liefert die validierte Rite-Struktur und die
Anvil-Rangregeln; [035](035-runescribe-inscribe-etch.md) liefert Runescribe und bekannte Runen.

## Verbindliche Spec-Anker

- [Träger: Rune Grimoire, Talisman, Rite](../../spec/RUNES.md#2-träger-rune-grimoire-talisman-rite)
  — ein Talisman pro Charakter, kein Armor-Slot, kostenloses Umsockeln
- [Aufbau eines Rite](../../spec/RUNES.md#3-aufbau-eines-rite) — genau Trigger, Effect und
  optionaler Modifier mit teamweiter Einmaligkeit
- [Anvil-Sparks-Nodes](../../spec/RUNES.md#8-anvil-sparks-nodes) — Talisman und Runic Focus
  schalten Slots gestaffelt pro Charakter frei
- [Loadout-Ansicht](../../spec/CHARACTERS.md#6-ausrüstung) — Talisman trägt keine der fünf
  Item-Schichten
- [Viewport- und Screen-Contract](../../spec/UI.md#1-viewport--und-screen-contract) — Auswahl
  ist lokal scrollbar, per Tastatur erreichbar und responsive

## Akzeptanzkriterien

- [x] Runescribe zeigt die Talismane aller drei Charaktere und ihre Rite-Slots; Talisman-Rang
      `n` öffnet Trigger und Effect nur für Charakter `n`, Runic-Focus-Rang `n` zusätzlich den
      Modifier-Slot
- [x] Die Auswahl lässt nur bekannte Runen ihrer Kategorie zu und schließt jede Rune, die bereits
      in einem anderen Slot desselben Teams liegt, aus
- [x] Ein Umsockeln kostet nichts, verliert keine Rune und erhält deren Level; alle Änderungen
      sind als vollständiger Rite-Zustand atomar persistiert und überstehen Reloads
- [x] Talismane werden nach ihrer Freischaltung ausschließlich in Runescribe konfiguriert; Heroes
      behandelt sie nicht mehr als auswählbaren Loadout-Slot
- [x] Component- und Store-Tests decken Rang-Gates, Kategorien, teamweite Einmaligkeit,
      kostenloses Umsockeln, Reload und zugängliche Bedienung ab

## Betroffene Dateien

- `src/features/runes/` — Talisman- und Rite-Auswahl in Runescribe
- `src/features/save/`, `src/game/runes/` — validierte, atomare Rite-Änderungen
- `src/features/heroes/` — veralteten Talisman-Platzhalter aus dem Loadout entfernen

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
