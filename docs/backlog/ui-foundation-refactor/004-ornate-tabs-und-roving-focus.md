# 004 — Ornate-Tabs & Roving Focus

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Meilenstein**  | UIF     |
| **Hängt ab von** | 001     |

## Ziel

Ein gemeinsames `OrnateTabs`/`OrnateTab`-Primitive mit `useRovingFocus`-Hook trägt beide
Tree-Tab-Leisten, und der `CharacterSwitcher` nutzt denselben Hook sowie die State-Tokens.

## Nicht-Ziel

Screen-Layout-Änderungen der Tree-Screens liegen in [007](007-screen-crucible.md) und
[008](008-screen-weapon-mastery.md).

## Blockiert durch

[001](001-tokens-und-state-fundament.md) — State-Tokens, `--spacing-tab-strip`, Glow-Tokens,
`cn()` und `state.ts` müssen gemergt sein.

## Verbindliche Spec-Anker

- [FOUNDATION §5](FOUNDATION.md#5-state-modell) — `selected`-Prop, `data-selected` +
  `aria-selected`, ARIA-Pattern `role=tab`
- [FOUNDATION §6](FOUNDATION.md#6-visuelle-state-regeln) — Selected-/Hover-Sprache,
  De-Emphasis-Skala für inaktive Frame-Art
- [FOUNDATION §7](FOUNDATION.md#7-shared-primitives) — `OrnateTabs`-API mit `surface`-Render-Slot
- [FOUNDATION §10](FOUNDATION.md#10-bewusste-sonderfälle) — Ember-Inset der Mastery-Tabs und
  Focus-Offset `-5px` als dokumentierte Ausnahmen

## Akzeptanzkriterien

- [ ] `OrnateTabs`/`OrnateTab` (`selected`, `controls`, `surface: ReactNode`) und
      `useRovingFocus` existieren in `src/shared/ui/` mit Component-Tests
- [ ] `CrucibleTreeNavigation` und `MasteryDisciplineNavigation` rendern über das Primitive;
      der `surface`-Slot bewahrt die Crucible-Bildfläche und den Mastery-Ember-Inset
      (`--shadow-glow-ember-inset`)
- [ ] Tab-Höhe und Frame kommen aus `h-tab-strip` und den bestehenden
      `border-image-tab-ornate`/`tab-ornate-surface`-Utilities; Glow-Werte aus
      `drop-shadow-glow-accent`
- [ ] `data-selected` + `aria-selected` ersetzen `data-state="active|inactive"`; Roving-TabIndex
      und Pfeiltasten-Navigation laufen zentral über `useRovingFocus`
- [ ] `CharacterSwitcher` nutzt `useRovingFocus`, den `selected`-Prop-Namen und die
      De-Emphasis-/Glow-Tokens; Rolle `radio` + `aria-checked` bleiben
- [ ] Tests asserten `aria-selected`/`data-selected`; `npm test` und `npm run test:e2e` sind grün

## Betroffene Dateien

- `src/shared/ui/OrnateTabs.tsx` (+ Test), `src/shared/ui/useRovingFocus.ts` (+ Test) — neu
- `src/features/crucible/CrucibleTreeNavigation.tsx`
- `src/features/weaponMastery/MasteryDisciplineNavigation.tsx`
- `src/app/ui/CharacterSwitcher.tsx` (+ Test)
- `src/features/crucible/CrucibleScreen.test.tsx` — `data-state`-Assertions

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
