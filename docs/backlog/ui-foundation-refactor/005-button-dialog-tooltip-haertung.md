# 005 — Button-, Dialog- & Tooltip-Härtung

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `blocked` |
| **Meilenstein**  | UIF       |
| **Hängt ab von** | 001       |

## Ziel

`Button` trägt einen `selected`-Prop und die Cursor-Policy, ein `Dialog`-Primitive vereinheitlicht
beide Respec-Dialoge, `ErrorBoundary` nutzt `Button`, und der Tooltip-Trigger-Contract kommt ohne
erzwungene Fokussierbarkeit aus.

## Nicht-Ziel

Die Screen-Migrationen, die diese Primitives konsumieren, liegen in
[006](006-screen-dungeon-selection.md) bis [009](009-screen-dungeon-run.md);
eine Tooltip-Kollisionslogik liegt außerhalb des Refactors (Optional-Kandidat,
[FOUNDATION §10](FOUNDATION.md#10-bewusste-sonderfälle)).

## Blockiert durch

[001](001-tokens-und-state-fundament.md) — State-Tokens, `cn()` und `state.ts` müssen gemergt sein.

## Verbindliche Spec-Anker

- [FOUNDATION §5](FOUNDATION.md#5-state-modell) — `selected`/`disabled`-Achsen, natives `disabled`
- [FOUNDATION §6](FOUNDATION.md#6-visuelle-state-regeln) — Disabled-Sprache, Cursor-Policy,
  Focus-Standard
- [FOUNDATION §7](FOUNDATION.md#7-shared-primitives) — APIs von `Button`-Erweiterung und `Dialog`
- [AGENTS.md](../../../AGENTS.md) — semantisches, tastaturbedienbares HTML

## Akzeptanzkriterien

- [ ] `Button` bietet `selected?: boolean` (→ `data-selected`, Gold-Border/Tint auf `ghost`) und
      trägt `cursor-pointer` sowie `disabled:cursor-not-allowed`; die Playback-Buttons im
      `DungeonRunScreen` nutzen `selected` bei stabiler Variant
- [ ] `Dialog` in `src/shared/ui/` wrappt natives `<dialog>` + `showModal` mit Panel-thin-Chrome
      und `backdrop:bg-black/70`; `RespecDialog` und `CrucibleRespecDialog` rendern darüber
- [ ] Der Fallback-Button der `ErrorBoundary` ist ein `Button` (sichtbarer Focus-Ring); der
      Wrapper nutzt `min-h-dvh`
- [ ] Der Tooltip-Trigger-Contract vergibt kein `tabIndex` mehr; alle Trigger sind nativ
      fokussierbare Elemente
- [ ] Alle Buttons und Dialoge nutzen `transition-state` und den Focus-Standard aus FOUNDATION §6
- [ ] `npm test` und `npm run test:e2e` sind grün; `Button`- und `Tooltip`-Tests decken die neuen
      Contracts ab

## Betroffene Dateien

- `src/shared/ui/Button.tsx` (+ Test), `src/shared/ui/Dialog.tsx` (+ Test) — Erweiterung/neu
- `src/shared/ui/ErrorBoundary.tsx`, `src/shared/ui/Tooltip.tsx` (+ Tests)
- `src/features/weaponMastery/RespecDialog.tsx`, `src/features/crucible/CrucibleRespecDialog.tsx`
- `src/features/dungeon/ui/DungeonRunScreen.tsx` — Playback-Buttons

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
