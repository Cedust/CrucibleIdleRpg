# 007 — Screen: Crucible

| Feld             | Wert               |
| ---------------- | ------------------ |
| **Status**       | `blocked`          |
| **Meilenstein**  | UIF                |
| **Hängt ab von** | 003, 004, 005, 006 |

## Ziel

Der Crucible-Screen rendert zentriert mit `max-w-page`, Inspector-Spalte und Tab-Höhe kommen aus
Tokens, und Nodes, Tabs, Dialog und Kopfbereich laufen über die gemeinsamen Primitives.

## Nicht-Ziel

Weapon Mastery liegt in [008](008-screen-weapon-mastery.md); Clamp-Feintuning und
Ultrawide-E2E liegen in [010](010-ultrawide-polish-und-responsive-e2e.md).

## Blockiert durch

[003](003-node-medallion-primitive.md), [004](004-ornate-tabs-und-roving-focus.md),
[005](005-button-dialog-tooltip-haertung.md) — Node-, Tab- und Dialog-Primitives;
[006](006-screen-dungeon-selection.md) — `ScreenHeader`.

## Verbindliche Spec-Anker

- [FOUNDATION §1](FOUNDATION.md#1-viewport-und-screen-contract) — Screen-Contract, Cap-Wahl
  `--container-page`
- [FOUNDATION §3](FOUNDATION.md#3-zuordnung-fixed-und-fluid) — fluide Graph-Spalte, Token-Spalten
- [FOUNDATION §10](FOUNDATION.md#10-bewusste-sonderfälle) — `max-w-5xl` des Branch-Graphen bleibt
- [Fortschritt §3](../../spec/PROGRESSION.md#3-crucible-globaler-skilltree) — fachliche Struktur
  der drei Tabs und Nodes bleibt unverändert

## Akzeptanzkriterien

- [ ] Die Screen-Section ist `mx-auto w-full max-w-page`; das Layout nutzt ab `@min-[1200px]`
      `grid-cols-[minmax(0,1fr)_var(--spacing-inspector)]`
- [ ] Der Kopfbereich rendert über `ScreenHeader`; die Tab-Leiste über `OrnateTabs` mit
      `h-tab-strip`
- [ ] Die `8rem`-Node-Spaltenbreite der Branch-Layouts lebt als eine lokale TS-Konstante in
      `AnvilBranchGraph.tsx`
- [ ] Der innere `mx-auto max-w-5xl`-Cap des Branch-Graphen bleibt bestehen
      (dokumentierter Sonderfall)
- [ ] `CrucibleRespecDialog` rendert über das `Dialog`-Primitive
- [ ] Die Crucible-E2E-Szenarien (Zwei-Spalten-Grid, Ein-Spalten-Fallback, interner
      Tab-Strip-Scroll) sind grün; `npm test` und `npm run test:e2e` sind grün

## Betroffene Dateien

- `src/features/crucible/CrucibleScreen.tsx` (+ Test)
- `src/features/crucible/AnvilBranchGraph.tsx`, `src/features/crucible/CrucibleTreeGraph.tsx`
- `src/features/crucible/CrucibleTreeNavigation.tsx`, `src/features/crucible/CrucibleRespecDialog.tsx`
- `e2e/smoke.spec.ts` — Crucible-Szenarien prüfen/anpassen

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
