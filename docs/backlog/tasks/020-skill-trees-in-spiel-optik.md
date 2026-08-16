# 020 — Skill-Trees in Spiel-Optik

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Meilenstein**  | M2.5   |
| **Hängt ab von** | 018    |

## Ziel

Crucible- und Weapon-Mastery-Ansicht stellen ihre Trees als Spiel-Skilltrees dar: Nodes mit
Icon und zustandsabhängigem Rahmen, sichtbare Verbindungslinien entlang der Voraussetzungen
sowie Inspector- und Respec-Dialoge in Panel-Optik. Der Crucible wird dabei auf drei Trees
konsolidiert: Die Runen-Freischaltungen wechseln als eigener Ast zu Anvil Sparks; der frei
werdende Begriff Masterwork ersetzt die Blacksmith-Aktion Refine.

## Nicht-Ziel

Neue Nodes, geänderte Kosten, Wirkungen oder Voraussetzungen entstehen hier nicht. Außer der
freigegebenen Tree-Konsolidierung und Terminologie bleibt das Spielverhalten unverändert. Die
Equip-Ansicht entsteht in M3.

## Blockiert durch

[018](018-ui-primitives-und-app-rahmen.md) — Panel, ScreenLayout, Icon und Tooltip müssen
gemergt sein.

## Umsetzungsstand

- **Phase 1:** Crucible dient als Pilot für Tree-Navigation, Node-Medaillons, Verbindungslinien,
  Inspector und responsive Stapelung.
- **Phase 2:** Weapon Mastery übernimmt das validierte Muster.

## Verbindliche Spec-Anker

- [Crucible](../../spec/PROGRESSION.md#3-crucible-globaler-skilltree) — drei Trees mit Rängen,
  Kosten, Voraussetzungen, Sperrgründen und Respec-Aktionen
- [Weapon-Mastery-Ansicht](../../spec/WEAPON-MASTERY.md#7-weapon-mastery-ansicht) — Inhalt und
  Verhalten der Mastery-Ansicht
- [Visuelle Umsetzung](../../DESIGN.md#5-visuelle-umsetzung) — Icons aus der hybriden
  Asset-Strategie, per CSS auf die Palette eingefärbt
- [AGENTS.md](../../../AGENTS.md) — Tokens und Primitives als einzige Styling-Quellen;
  semantisches, tastaturbedienbares HTML

## Akzeptanzkriterien

- [x] Jeder Node zeigt ein Icon und einen zustandsabhängigen Rahmen; die Zustände gesperrt,
      kaufbar und gestuft sind auch ohne Farbwahrnehmung unterscheidbar
- [x] Verbindungslinien zeigen die Voraussetzungs-Beziehungen zwischen Nodes und spiegeln den
      Freischalt-Zustand
- [x] Der Crucible zeigt genau Anvil Sparks, Smelting Flames und Molten Cast; Rune Grimoire,
      Talisman, Runic Focus und Rune Mastery bilden einen unabhängigen Ast in Anvil Sparks
- [x] Die vier Runen-Nodes verwenden `anvil.*`-IDs, bleiben bis M5 gesperrt und behalten ihre
      bisherigen Kosten, Wirkungen und internen Voraussetzungen
- [x] Masterwork bezeichnet in allen lebenden Produkttexten die unveränderte Blacksmith-Aktion
      auf Seltenheit; der frühere Begriff Refine entfällt
- [x] Node-Inspector und Respec-Dialoge nutzen die Panel- und Tooltip-Primitives aus 018
- [x] Kauf-, Respec- und Sperr-Verhalten bleiben unverändert; die bestehenden Component-Tests
      beider Screens sind grün
- [x] Beide Trees sind vollständig per Tastatur bedienbar
- [x] `prefers-reduced-motion` reduziert Zustandswechsel-Animationen auf statische Wechsel

## Betroffene Dateien

- `src/features/crucible/` — CrucibleScreen, CrucibleNodeInspector, CrucibleRespecDialog
- `src/game/crucible/` — Drei-Tree-Katalog und `anvil.*`-IDs der Runen-Freischaltungen
- `docs/` — Crucible-/Runen-Specs, Masterwork-Terminologie und ADR
- `src/features/weaponMastery/` — WeaponMasteryScreen, NodeInspector, RespecDialog
- `src/shared/ui/` — ggf. gemeinsames Tree-Node-Primitive
- `public/assets/` — Node-Icons samt Manifest-Einträgen

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
