# 017 — Art-Direction & Theme-Tokens

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Meilenstein**  | M2.5   |
| **Hängt ab von** | 016    |

## Ziel

Das „Gilded Ruins“-Design-System liegt als Tailwind-`@theme`-Token-Satz mit eingebundenen
Schriften vor, und die Asset-Pipeline steht: ein Manifest unter `public/assets/` mit Quelle und
Lizenz je Asset sowie je eine Stilprobe für Icon, Hintergrund und Portrait.

## Nicht-Ziel

Der Umbau bestehender Screens auf die neue Optik liegt in
[018](018-ui-primitives-und-app-rahmen.md), [019](019-combat-view-in-spiel-optik.md) und
[020](020-skill-trees-in-spiel-optik.md). Dieser Task liefert Tokens, Schriften und
Asset-Grundlagen; die Screens rendern damit unverändert funktionsfähig.

## Verbindliche Spec-Anker

- [Zielgefühl und Tonalität](../../DESIGN.md#4-zielgefühl-und-tonalität) — „Gilded Ruins“:
  schwere Steinarchitektur, warmes Gold, klare Lesbarkeit; edel und geheimnisvoll
- [Visuelle Umsetzung](../../DESIGN.md#5-visuelle-umsetzung) — hybride Asset-Strategie
  (freie Icon-Bibliotheken per CSS eingefärbt, Hintergründe und Portraits KI-generiert) und
  Manifest-Pflicht je Asset
- [Design-Pillars](../../DESIGN.md#2-design-pillars) — Pillar 5: eigenständiger Look über
  eigene UI-Primitives, Lesbarkeit vor Effekt
- [AGENTS.md](../../../AGENTS.md) — Tailwind-Tokens aus `@theme`, semantisches HTML, keine
  Inline-Styles

## Akzeptanzkriterien

- [ ] `@theme` in `src/app/index.css` definiert die Palette (Stein-, Gold- und Glut-Töne),
      eine Typografie-Skala und semantische Tokens für Flächen, Ränder und Text-Hierarchie
- [ ] Eine Display-Schrift und eine Text-Schrift sind lokal ins Bundle eingebunden und über
      Tokens ansprechbar
- [ ] `public/assets/` enthält ein Manifest, das je Asset Quelle, Autor und Lizenz nennt
- [ ] Je eine Stilprobe liegt vor und ist im Manifest erfasst: ein per CSS auf die Palette
      eingefärbtes Icon, ein Dungeon-Hintergrund, ein Charakter-Portrait
- [ ] Alle bestehenden Screens rendern mit den neuen Tokens funktionsfähig; `npm test` und
      `npm run test:e2e` sind grün

## Betroffene Dateien

- `src/app/index.css` — `@theme`-Tokens, Schrift-Einbindung
- `public/assets/` — Manifest und Stilproben
- `docs/DESIGN.md` — nur falls sich beim Umsetzen eine Präzisierung von §5 ergibt

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
