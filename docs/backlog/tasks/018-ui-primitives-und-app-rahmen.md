# 018 — UI-Primitives & App-Rahmen

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Meilenstein**  | M2.5    |
| **Hängt ab von** | 017     |

## Ziel

`src/shared/ui/` bietet die Spiel-Primitives — Panel mit Ornamentrahmen, Screen-Layout mit
Hintergrund-Layer, Icon-Komponente, Tooltip sowie Button und ProgressBar in „Gilded
Ruins“-Optik — und AppShell, Navigation und die Dungeon-Screens sind darauf umgezogen.

## Nicht-Ziel

Combat View und Skill Trees ziehen in [019](019-combat-view-in-spiel-optik.md) und
[020](020-skill-trees-in-spiel-optik.md) um; sie nutzen bis dahin die restylten Basis-Primitives
(Button, ProgressBar), aber noch keine Panels und Hintergründe.

## Blockiert durch

[017](017-art-direction-und-theme-tokens.md) — Tokens, Schriften und Asset-Pipeline müssen
gemergt sein, bevor Primitives dagegen gebaut werden.

## Verbindliche Spec-Anker

- [Visuelle Umsetzung](../../DESIGN.md#5-visuelle-umsetzung) — Primitives wohnen in
  `src/shared/ui/`, Ornamentik kommt aus Tokens und Assets
- [Design-Pillars](../../DESIGN.md#2-design-pillars) — Pillar 5: eigenständiger Look,
  Produkt-Anmutung statt Komponentenbibliothek
- [AGENTS.md](../../../AGENTS.md) — `@theme`-Tokens und `src/shared/ui/`-Primitives sind die
  einzigen Styling-Quellen; semantisches, tastaturbedienbares HTML

## Akzeptanzkriterien

- [ ] Ein Panel-Primitive rendert Ornamentrahmen (z. B. `border-image`/9-Slice) und
      Flächen-Hierarchie ausschließlich über Tokens und Assets aus 017
- [ ] Ein Screen-Layout-Primitive stellt einen Hintergrund-Layer bereit, auf dem Inhalte
      lesbar bleiben (Kontrast-Overlay)
- [ ] Icon-Komponente und Tooltip sind tastaturbedienbar und per Screenreader zugänglich
- [ ] Button und ProgressBar tragen die neue Optik; alle bestehenden Verwendungen bleiben
      funktionsfähig
- [ ] AppShell, Navigation, Dungeon-Auswahl und Dungeon-Run-Screen nutzen die Primitives
- [ ] Component-Tests der umgezogenen Screens und `npm run test:e2e` sind grün

## Betroffene Dateien

- `src/shared/ui/` — Panel, ScreenLayout, Icon, Tooltip; Restyling von Button und ProgressBar
- `src/app/AppShell.tsx` — Navigation und Rahmen
- `src/features/dungeon/ui/` — Umzug auf die Primitives

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
