# 008 — Kampfbildschirm

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Meilenstein**  | M1     |
| **Hängt ab von** | 007    |

## Ziel

Der Kampf ist sichtbar: Team und Gegnerformation mit Health-Bars, die Zugreihenfolge mit
Markierung des aktiven Akteurs, ein Kampf-Log und die Pause-Schaltfläche.

## Nicht-Ziel

Detailansichten zu Charakteren, Stats-Tooltips und Ausrüstung. Der Bildschirm zeigt den
laufenden Kampf.

## Verbindliche Spec-Anker

- [Playback](../../spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit) — pro Takt rückt
  die Markierung einen Eintrag weiter und im Log erscheint **ein** Eintrag: der vollständige
  Zug als Block, nicht als Einzelzeilen
- [Gegnerformation](../../spec/COMBAT.md#13-gegnerformation) — 2×3-Darstellung mit Lanes
- [Rundenablauf](../../spec/COMBAT.md#11-rundenablauf) — die Anzeige hält die vollständige
  Zugreihenfolge stabil; pro Takt wandert nur die aktive Markierung
- [AGENTS.md §8](../../../AGENTS.md#8-ui-styling--accessibility) — Dark Mode, eigene
  UI-Primitives, Tailwind, Accessibility-Basisanspruch

## Akzeptanzkriterien

- [x] Health-Bars nutzen die Inline-Style-Ausnahme ausschließlich für die berechnete Breite
      ([AGENTS.md §14](../../../AGENTS.md#14-do-not)); alles andere sind Tailwind-Klassen
- [x] Die Barrier ist als eigener Anteil erkennbar, nicht in die Health gerechnet
- [x] Der Log zeigt Crit, Multi Hit, Splash, Block, Evade und Counter unterscheidbar an
- [x] Der Log ist gedeckelt und wächst nicht unbegrenzt
- [x] Selektive Subscriptions: ein Takt rendert nicht die ganze Ansicht neu
- [x] Component-Tests mit React Testing Library; Playwright-Smoke-Test „Kampf starten →
      Takte laufen ab → Kampf endet"
- [x] Alle Spieltexte sind Englisch
      ([AGENTS.md §11](../../../AGENTS.md#11-entwicklungs-workflow-für-agenten-verbindlich))

## Betroffene Dateien

- `src/features/combat/CombatScreen.tsx` (ersetzt den Platzhalter) + Test
- `src/features/combat/TeamPanel.tsx`, `EnemyFormation.tsx`, `TurnOrderBar.tsx`, `CombatLog.tsx`
- `src/shared/ui/ProgressBar.tsx` — neu
- `e2e/smoke.spec.ts`
