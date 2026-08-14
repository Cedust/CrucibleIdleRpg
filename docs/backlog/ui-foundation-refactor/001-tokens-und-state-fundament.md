# 001 — Tokens & State-Fundament

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Meilenstein**  | UIF    |
| **Hängt ab von** | —      |

## Ziel

`@theme` trägt die Layout-Clamp-, Screen-Cap-, Typografie- und State-Tokens samt
`@utility transition-state`, und `src/shared/ui/cn.ts` + `src/shared/ui/state.ts` liefern die
gemeinsame State-Mechanik — bei ≤ 1920px-Äquivalent rendert die App pixelidentisch zum Stand davor.

## Nicht-Ziel

Die Migration der Konsumenten auf die Tokens und Fragmente liegt in
[002](002-shell-und-viewport-contract.md) bis [009](009-screen-dungeon-run.md); Clamps für die
9-Slice-Frame-Geometrie liegen in [010](010-ultrawide-polish-und-responsive-e2e.md).

## Verbindliche Spec-Anker

- [FOUNDATION §2](FOUNDATION.md#2-responsive-mechanik) — Clamp-Muster mit 16:9-normiertem
  Viewport-Term und präkomputiertem SLOPE
- [FOUNDATION §4](FOUNDATION.md#4-token-katalog) — vollständiger Token-Katalog samt bewusst
  tokenfreier Werte
- [FOUNDATION §5](FOUNDATION.md#5-state-modell) — `SemanticState`, `stateAttrs()`, kanonische
  Fragmente und Facetten-Regel
- [AGENTS.md](../../../AGENTS.md) — `@theme`-Tokens und `src/shared/ui/`-Primitives als einzige
  Styling-Quellen, keine neuen Libraries

## Akzeptanzkriterien

- [ ] `@theme` in `src/app/index.css` definiert die Tokens aus FOUNDATION §4: Layout-Clamps,
      Screen-Caps, fluide Text-Skala (`--text-xs/sm/base`, `--text-display-*`), State-Farben,
      De-Emphasis-Skala, Glow-Tokens
- [ ] `@utility transition-state` existiert mit der Property-Liste und 150 ms aus FOUNDATION §4
- [ ] Alle Glow-Tokens beziehen ihre Farbe per `color-mix` aus der Palette; `index.css` enthält
      keine hardcodierten Akzent-RGB-Werte in Shadows
- [ ] `src/shared/ui/cn.ts` exportiert `cn()` (falsy filtern, joinen) mit Unit-Test
- [ ] `src/shared/ui/state.ts` exportiert `SemanticState`, `VisualStateProps`, `stateAttrs()` und
      die kanonischen Fragmente mit Unit-Tests (`stateAttrs` liefert `data-selected`/`data-semantic`
      exakt nach FOUNDATION §5)
- [ ] Bei 1920×1080 sind die computed styles aller neuen Tokens identisch zu den heutigen Werten
      (Clamp-Minima aktiv); `npm test` und `npm run test:e2e` sind grün

## Betroffene Dateien

- `src/app/index.css` — `@theme`-Erweiterung, `transition-state`
- `src/shared/ui/cn.ts`, `src/shared/ui/cn.test.ts` — neu
- `src/shared/ui/state.ts`, `src/shared/ui/state.test.ts` — neu

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
