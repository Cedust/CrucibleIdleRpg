# 008 — Screen: Weapon Mastery

| Feld             | Wert               |
| ---------------- | ------------------ |
| **Status**       | `done`             |
| **Meilenstein**  | UIF                |
| **Hängt ab von** | 003, 004, 005, 006 |

## Ziel

Der Weapon-Mastery-Screen rendert zentriert mit `max-w-page`, der Tree-Canvas schwebt zentriert im
Scroll-Panel, der Layout-Threshold ist mit Crucible vereinheitlicht, und Nodes, Tabs, Dialog und
Kopfbereich laufen über die gemeinsamen Primitives.

## Nicht-Ziel

Crucible liegt in [007](007-screen-crucible.md); Clamp-Feintuning und Ultrawide-E2E liegen in
[010](010-ultrawide-polish-und-responsive-e2e.md).

## Blockiert durch

[003](003-node-medallion-primitive.md), [004](004-ornate-tabs-und-roving-focus.md),
[005](005-button-dialog-tooltip-haertung.md) — Node-, Tab- und Dialog-Primitives;
[006](006-screen-dungeon-selection.md) — `ScreenHeader`.

## Verbindliche Spec-Anker

- [Weapon Mastery §7](../../spec/WEAPON-MASTERY.md#7-weapon-mastery-ansicht) — bei 1920×1080
  passt die Ansicht ohne Seiten-Scroll; kleinere Auflösungen nutzen einen responsiven Fallback
- [FOUNDATION §1](FOUNDATION.md#1-viewport-und-screen-contract) — Screen-Contract, Cap-Wahl
  `--container-page`
- [FOUNDATION §3](FOUNDATION.md#3-zuordnung-fixed-und-fluid) — Tree-Canvas als lokaler Scroller
- [FOUNDATION §10](FOUNDATION.md#10-bewusste-sonderfälle) — `min-w-225` bleibt als
  Lesbarkeits-Floor

## Akzeptanzkriterien

- [ ] Die Screen-Section ist `mx-auto w-full max-w-page`; der Zwei-Spalten-Threshold liegt wie bei
      Crucible auf `@min-[1200px]` mit `grid-cols-[minmax(0,1fr)_var(--spacing-inspector)]`
- [ ] Der Tree-Canvas liegt mit `m-auto` zentriert im Scroll-Panel; die `min-h-120`-Regel der
      Rank-Spalten ist entfernt; `min-w-225` bleibt mit Verweis auf FOUNDATION §10
- [ ] Unterhalb des Thresholds trägt der ScreenLayout-Scroller die gestapelte Ansicht
      (contained, ohne Dokument-Scroll)
- [ ] Der Kopfbereich rendert über `ScreenHeader`, die Tab-Leiste über `OrnateTabs` mit
      `h-tab-strip` und Ember-Surface, `RespecDialog` über das `Dialog`-Primitive
- [ ] Die Mastery-E2E-Szenarien (Tree scrollt intern bei 1920×700; Tab-Strip scrollt intern bei
      1024×768; kein `main`-Scroll) sind grün; `npm test` und `npm run test:e2e` sind grün

## Betroffene Dateien

- `src/features/weaponMastery/WeaponMasteryScreen.tsx` (+ Test)
- `src/features/weaponMastery/MasteryTreeGraph.tsx`
- `src/features/weaponMastery/MasteryDisciplineNavigation.tsx`,
  `src/features/weaponMastery/RespecDialog.tsx`, `src/features/weaponMastery/NodeInspector.tsx`
- `e2e/smoke.spec.ts` — Mastery-Szenarien prüfen/anpassen

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
