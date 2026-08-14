# ui-foundation-refactor/ — Hybrid-fluides Layout & einheitliches State-System

> **Zweck:** Dieser Ordner enthält die Tasks des UI-Foundation-Refactors: Viewport-Shell ohne
> Seiten-Scroll, hybrid-fluides Responsive-Layout (Per-Token-Clamps) und ein zweiachsiges
> visuelles State-System. Die Zielarchitektur steht in [FOUNDATION.md](FOUNDATION.md);
> Task-Format und Status-Vokabular: [../README.md](../README.md#1-ein-task),
> Vorlage: [../tasks/000-template.md](../tasks/000-template.md).

Meilenstein-Kürzel in den Task-Köpfen: **UIF** (UI-Foundation-Refactor, Branch `feat/ui-fundament`,
zwischen M2.5 und M3).

## Reihenfolge

| Reihenfolge | Task                                                                                  | Status | Hängt ab von       |
| ----------- | ------------------------------------------------------------------------------------- | ------ | ------------------ |
| 1           | [001 — Tokens & State-Fundament](001-tokens-und-state-fundament.md)                   | `done` | —                  |
| 2           | [002 — Shell- & Viewport-Contract](002-shell-und-viewport-contract.md)                | `done` | 001                |
| 3           | [003 — Node-Medallion-Primitive](003-node-medallion-primitive.md)                     | `done` | 001                |
| 4           | [004 — Ornate-Tabs & Roving Focus](004-ornate-tabs-und-roving-focus.md)               | `done` | 001                |
| 5           | [005 — Button-, Dialog- & Tooltip-Härtung](005-button-dialog-tooltip-haertung.md)     | `done` | 001                |
| 6           | [006 — Screen: Dungeon Selection](006-screen-dungeon-selection.md)                    | `done` | 002                |
| 7           | [007 — Screen: Crucible](007-screen-crucible.md)                                      | `done` | 003, 004, 005, 006 |
| 8           | [008 — Screen: Weapon Mastery](008-screen-weapon-mastery.md)                          | `done` | 003, 004, 005, 006 |
| 9           | [009 — Screen: Dungeon Run](009-screen-dungeon-run.md)                                | `done` | 002, 005           |
| 10          | [010 — Ultrawide-Polish & Responsive-E2E](010-ultrawide-polish-und-responsive-e2e.md) | `done` | 006, 007, 008, 009 |
| 11          | [011 — Cleanup & Style-Guide](011-cleanup-und-styleguide.md)                          | `done` | 010                |

## Reihenfolge — zweite Welle (Konsolidierung)

Die Konsolidierungswelle beseitigt gedriftete Duplikate zwischen Crucible und Weapon Mastery,
umgangene Primitive und Konsistenz-Defekte. Sie wurde in einer Session umgesetzt (ein
Conventional Commit je Task auf `feat/ui-fundament`); die Task-Definitionen leben in den
Commit-Beschreibungen, Entscheidungen in [DECISIONS.md](DECISIONS.md) ab D-010.

| Reihenfolge | Task                                                                         | Status | Hängt ab von |
| ----------- | ---------------------------------------------------------------------------- | ------ | ------------ |
| 12          | UIF-012 — Token-Nachträge & mechanische Konsistenz-Fixes                     | `done` | 011          |
| 13          | UIF-013 — Connection-Primitive (`useConnectionPaths` + `ConnectionLayer`)    | `done` | 012          |
| 14          | UIF-014 — `NodeButton`-Primitive & strukturelle Mastery-Availability         | `done` | 013          |
| 15          | UIF-015 — `NodeInspectorPanel`-Primitive                                     | `done` | 012          |
| 16          | UIF-016 — `ConfirmDialog`-Primitive                                          | `done` | 012          |
| 17          | UIF-017 — ProgressBar: `accent`-Tone, `labelSize`, `className`               | `done` | 012          |
| 18          | UIF-018 — Benannte Container-Thresholds (`@tree-cols:`, `@branch-cols:`)     | `done` | 014          |
| 19          | UIF-019 — AppSidebar auf das State-System                                    | `done` | 012          |
| 20          | UIF-020 — `cn()`-Sweep & className-Policy                                    | `done` | 015, 017     |
| 21          | UIF-021 — Combat-Surface-Konsistenz (Panel plain, `SectionTitle`, Run-Titel) | `done` | 020          |
| 22          | UIF-022 — Style-Guide-Abschluss, README & ROADMAP                            | `done` | 021          |

## Parallelisierung

- **003, 004, 005** hängen nur an 001 und berühren getrennte Dateien — parallel bearbeitbar.
- **006 und 009** sind voneinander unabhängig (getrennte Screens).
- **007 und 008** sind voneinander unabhängig (getrennte Screens).
- Alles andere ist eine Kette. Der Merge eines Tasks setzt seine entblockten Folge-Tasks auf
  `ready` ([../README.md §2](../README.md#2-status)).

## Koordination

- [021 — Combat-Feedback und Schadenszahlen](../tasks/021-combat-feedback-und-schadenszahlen.md)
  (`ready`, M2.5) berührt dieselben Combat-UI-Dateien wie
  [009](009-screen-dungeon-run.md) und UIF-021 — diese Tasks nacheinander bearbeiten,
  Reihenfolge frei.
- Simulation, Stores und Save-Schema bleiben in allen UIF-Tasks unverändert; der Refactor ist
  eine reine UI-/Doku-Arbeit.
