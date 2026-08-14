# 003 — Node-Medallion-Primitive

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `blocked` |
| **Meilenstein**  | UIF       |
| **Hängt ab von** | 001       |

## Ziel

Ein gemeinsames `NodeMedallion`- und `RankPips`-Primitive rendert die Medaillons beider
Node-Buttons; deren State läuft über `stateAttrs` plus Facette `data-availability` nach dem
gemeinsamen State-Modell.

## Nicht-Ziel

Screen-Layout-Änderungen der Tree-Screens liegen in [007](007-screen-crucible.md) und
[008](008-screen-weapon-mastery.md); die Tab-Leisten liegen in
[004](004-ornate-tabs-und-roving-focus.md).

## Blockiert durch

[001](001-tokens-und-state-fundament.md) — State-Tokens, `--spacing-medallion*`, `cn()` und
`state.ts` müssen gemergt sein.

## Verbindliche Spec-Anker

- [FOUNDATION §5](FOUNDATION.md#5-state-modell) — `selected`-Prop, Facette `data-availability`,
  Locked bleibt klickbar
- [FOUNDATION §6](FOUNDATION.md#6-visuelle-state-regeln) — Regeln für Locked/Selected/Facetten,
  Opacity nur auf Art-Layern
- [FOUNDATION §7](FOUNDATION.md#7-shared-primitives) — `NodeMedallion`-API
- [FOUNDATION §11](FOUNDATION.md#11-teststrategie) — State-Assertions über `data-*`/`aria-*`

## Akzeptanzkriterien

- [ ] `NodeMedallion` (`size: 'md' | 'lg'`, `invested`, children = Icon) und `RankPips` existieren
      in `src/shared/ui/` mit Component-Tests; die Größen nutzen `--spacing-medallion(-sm)`
- [ ] `CrucibleNodeButton` und `MasteryNodeButton` rendern über die Primitives; die
      byte-identischen `MEDALLION_STATE_CLASS`/`STATE_CLASS`-Maps und die duplizierten
      RankPips sind entfernt
- [ ] Beide Buttons setzen `stateAttrs({ selected, semantic })` plus `data-availability`;
      der Prop heißt einheitlich `selected`; `aria-pressed` bleibt
- [ ] Gesperrte Nodes zeigen keinen Gold-Hover (Hover-Fragment aus `state.ts`); der
      Selection-Ring kommt aus `ring-state-selected`, Pips-Glow aus `shadow-glow-accent-sm`
- [ ] Die `data-node-medallion`-Hooks für die SVG-Connector-Messung bleiben erhalten
- [ ] Tests asserten `data-availability`/`data-semantic`/`aria-pressed`;
      `npm test` und `npm run test:e2e` sind grün

## Betroffene Dateien

- `src/shared/ui/NodeMedallion.tsx` (+ Test) — neu, enthält `RankPips`
- `src/features/crucible/CrucibleNodeButton.tsx`
- `src/features/weaponMastery/MasteryNodeButton.tsx`
- `src/features/crucible/CrucibleScreen.test.tsx`,
  `src/features/weaponMastery/WeaponMasteryScreen.test.tsx` — Assertions

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
