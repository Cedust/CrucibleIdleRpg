# 006 — Screen: Dungeon Selection

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Meilenstein**  | UIF    |
| **Hängt ab von** | 002    |

## Ziel

Die Dungeon-Auswahl rendert zentriert mit `max-w-page-narrow`, das Kartengrid reflowt über
`auto-fill`, Layout-Wechsel laufen über Container-Queries, und die neuen Primitives
`ScreenHeader` und `FramedCard` tragen Kopfbereich und Karten mit dem gemeinsamen State-Modell.

## Nicht-Ziel

Die Tree-Screens liegen in [007](007-screen-crucible.md) und
[008](008-screen-weapon-mastery.md); der Dungeon-Run liegt in [009](009-screen-dungeon-run.md).

## Blockiert durch

[002](002-shell-und-viewport-contract.md) — ScreenLayout-Contract und `@container` müssen
gemergt sein.

## Verbindliche Spec-Anker

- [FOUNDATION §1](FOUNDATION.md#1-viewport-und-screen-contract) — Screen-Contract mit
  `ScreenHeader` und Cap-Wahl
- [FOUNDATION §2](FOUNDATION.md#2-responsive-mechanik) — Container-Query-Regel und
  Threshold-Rezept
- [FOUNDATION §6](FOUNDATION.md#6-visuelle-state-regeln) — Locked-/Selected-Sprache der Karten,
  Regeln für nicht-interaktive Elemente (ActPanel)
- [FOUNDATION §7](FOUNDATION.md#7-shared-primitives) — APIs von `ScreenHeader` und `FramedCard`

## Akzeptanzkriterien

- [ ] Der Screen-Container ist `mx-auto w-full max-w-page-narrow`; die `w-220`-Spalte ist entfernt
- [ ] Die Kartenreihe ist ein `auto-fill`-Grid: mit sechs Dungeons entsteht eine zweite Reihe
      (Testfixture), die Kachelgröße `h-74 w-40` bleibt
- [ ] Alle `lg:`-Layout-Wechsel des Screens laufen über Container-Queries (`@min-[42rem]`)
- [ ] `ScreenHeader` (neu, `src/shared/ui/`) rendert Titel und Intro des Screens
- [ ] `FramedCard` (neu, `src/shared/ui/`) trägt die Dungeon-Karten: `stateAttrs`-gesteuert,
      Locked dimmt ausschließlich Art-Layer (De-Emphasis-Tokens + `grayscale-50`), Statustext
      bleibt voll lesbar, Selected trägt Frame in voller Stärke + `shadow-glow-accent`
- [ ] `ActPanel` rendert über `FramedCard` ohne Hover und ohne Selection-Glow; „current" zeigt
      sich über vollen Frame und Gold-Titel, `aria-current` bleibt
- [ ] Tests asserten Karten-States über `data-semantic`/`checked`;
      `npm test` und `npm run test:e2e` sind grün

## Betroffene Dateien

- `src/shared/ui/ScreenHeader.tsx` (+ Test), `src/shared/ui/FramedCard.tsx` (+ Test) — neu
- `src/features/dungeon/ui/DungeonSelectionScreen.tsx` (+ Test)
- `src/features/dungeon/ui/DungeonSelector.tsx` (+ Test)
- `src/features/dungeon/ui/ActPanel.tsx`, `src/features/dungeon/ui/SelectedDungeonPanel.tsx`

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
