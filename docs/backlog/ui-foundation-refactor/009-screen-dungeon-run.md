# 009 — Screen: Dungeon Run

| Feld             | Wert     |
| ---------------- | -------- |
| **Status**       | `ready`  |
| **Meilenstein**  | UIF      |
| **Hängt ab von** | 002, 005 |

## Ziel

Die Kampf-Arena rendert zentriert mit dem `--container-run`-Cap, Layout-Wechsel laufen über
Container-Queries, die Portraits skalieren über Tokens, und die Combat-States (defeated, leerer
Slot, aktiver Akteur, Playback) sprechen das gemeinsame State-Modell.

## Nicht-Ziel

Kampf-Feedback und Schadenszahlen liegen in
[021](../tasks/021-combat-feedback-und-schadenszahlen.md); Clamp-Feintuning und Ultrawide-E2E
liegen in [010](010-ultrawide-polish-und-responsive-e2e.md).

## Blockiert durch

[002](002-shell-und-viewport-contract.md) — ScreenLayout-Contract;
[005](005-button-dialog-tooltip-haertung.md) — `Button selected` für die Playback-Steuerung.

## Verbindliche Spec-Anker

- [Fortschritt §4](../../spec/PROGRESSION.md#4-checkpoints-wipe--abbruch) — ein laufender Run
  belegt den gesamten Viewport ohne Primärnavigation
- [FOUNDATION §1](FOUNDATION.md#1-viewport-und-screen-contract) — Screen-Contract mit
  `scroll={false}` und eigenen Scrollern (Arena, Log, TurnOrder)
- [FOUNDATION §3](FOUNDATION.md#3-zuordnung-fixed-und-fluid) — fluide Arena-Spalten, Cap
  `--container-run`, leicht fluide Portraits
- [FOUNDATION §6](FOUNDATION.md#6-visuelle-state-regeln) — Facetten `defeated`, `semantic="empty"`,
  Selected-Sprache des TurnOrder-Akteurs

## Akzeptanzkriterien

- [ ] Die Run-Section ist `mx-auto … max-w-run`; die Arena-Spalten wechseln über `@min-[85rem]`,
      die Status-Leiste über `@min-[60rem]` (Container-Queries)
- [ ] `TeamPanel` und `EnemyFormation` tragen `min-h-0`; die TurnOrder-Leiste stellt den Glow des
      aktiven Akteurs über das `-mx-2 px-2`-Clearance-Idiom frei
- [ ] `CombatPortrait` bezieht seine Größen aus den `--spacing-portrait-*`-Tokens
- [ ] Besiegte Kämpfer tragen `data-defeated`; gedimmt wird ausschließlich das Portrait, Name und
      Werte bleiben voll lesbar
- [ ] Leere Gegner-Slots tragen `semantic="empty"` (gestrichelte Border, lesbare Beschriftung)
- [ ] Die Playback-Geschwindigkeit nutzt `Button selected` bei stabiler Variant
- [ ] Die Run-E2E-Szenarien (kein Dokument-/`main`-Scroll, Arena-Geometrie bei 1680×937,
      Formation bei 390×844) sind grün; `npm test` und `npm run test:e2e` sind grün

## Betroffene Dateien

- `src/features/dungeon/ui/DungeonRunScreen.tsx` (+ Test)
- `src/features/combat/ui/TeamPanel.tsx`, `src/features/combat/ui/EnemyFormation.tsx`,
  `src/features/combat/ui/CombatPortrait.tsx`, `src/features/combat/ui/TurnOrderBar.tsx` (+ Tests)
- `e2e/smoke.spec.ts` — Run-Szenarien prüfen/anpassen

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
