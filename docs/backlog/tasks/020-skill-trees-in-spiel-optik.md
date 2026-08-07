# 020 — Skill-Trees in Spiel-Optik

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `blocked` |
| **Meilenstein**  | M2.5      |
| **Hängt ab von** | 018       |

## Ziel

Crucible- und Weapon-Mastery-Ansicht stellen ihre Trees als Spiel-Skilltrees dar: Nodes mit
Icon und zustandsabhängigem Rahmen, sichtbare Verbindungslinien entlang der Voraussetzungen
sowie Inspector- und Respec-Dialoge in Panel-Optik.

## Nicht-Ziel

Neue Nodes, geänderte Kosten oder Freischalt-Regeln entstehen hier nicht — der Task ändert
ausschließlich die Darstellung. Die Equip-Ansicht entsteht in M3.

## Blockiert durch

[018](018-ui-primitives-und-app-rahmen.md) — Panel, ScreenLayout, Icon und Tooltip müssen
gemergt sein.

## Verbindliche Spec-Anker

- [Crucible](../../spec/PROGRESSION.md#3-crucible-globaler-skilltree) — vier Trees mit Rängen,
  Kosten, Voraussetzungen, Sperrgründen und Respec-Aktionen
- [Weapon-Mastery-Ansicht](../../spec/WEAPON-MASTERY.md#7-weapon-mastery-ansicht) — Inhalt und
  Verhalten der Mastery-Ansicht
- [Visuelle Umsetzung](../../DESIGN.md#5-visuelle-umsetzung) — Icons aus der hybriden
  Asset-Strategie, per CSS auf die Palette eingefärbt
- [AGENTS.md](../../../AGENTS.md) — Tokens und Primitives als einzige Styling-Quellen;
  semantisches, tastaturbedienbares HTML

## Akzeptanzkriterien

- [ ] Jeder Node zeigt ein Icon und einen zustandsabhängigen Rahmen; die Zustände gesperrt,
      kaufbar und gestuft sind auch ohne Farbwahrnehmung unterscheidbar
- [ ] Verbindungslinien zeigen die Voraussetzungs-Beziehungen zwischen Nodes und spiegeln den
      Freischalt-Zustand
- [ ] Node-Inspector und Respec-Dialoge nutzen die Panel- und Tooltip-Primitives aus 018
- [ ] Kauf-, Respec- und Sperr-Verhalten bleiben unverändert; die bestehenden Component-Tests
      beider Screens sind grün
- [ ] Beide Trees sind vollständig per Tastatur bedienbar
- [ ] `prefers-reduced-motion` reduziert Zustandswechsel-Animationen auf statische Wechsel

## Betroffene Dateien

- `src/features/crucible/` — CrucibleScreen, CrucibleNodeInspector, CrucibleRespecDialog
- `src/features/weaponMastery/` — WeaponMasteryScreen, NodeInspector, RespecDialog
- `src/shared/ui/` — ggf. gemeinsames Tree-Node-Primitive
- `public/assets/` — Node-Icons samt Manifest-Einträgen

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
