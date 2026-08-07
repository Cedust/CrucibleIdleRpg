# review-findings/ — Tasks aus dem Code-Review

> **Zweck:** Funde des Projekt-Reviews vom 2026-08-07 (Wartbarkeit, Testbarkeit, Best
> Practices), gruppiert als Tasks. Format und Status-Vokabular: [../README.md](../README.md#1-ein-task).
> Die Nummern sind Kennungen innerhalb dieses Ordners; die Reihenfolge steht in der Tabelle.

Das Review lief über vier Bereiche (Engine, State/Stores, UI, Spieldaten/Tests/Konfiguration);
alle Quality-Gates waren zum Review-Zeitpunkt grün (Lint, Typecheck, 274 Unit-Tests).

## Tasks

| Reihenfolge | Task                                                                                           | Schwere | Status  | Hängt ab von |
| ----------- | ---------------------------------------------------------------------------------------------- | ------- | ------- | ------------ |
| 1           | [001 — Mastery-Node-IDs explizit machen](001-mastery-node-ids-explizit.md)                     | hoch    | `done`  | —            |
| 2           | [002 — Mastery-Kampfintegration testen](002-mastery-kampfintegration-testen.md)                | hoch    | `done`  | —            |
| 3           | [003 — Toten CombatScreen-Flow entfernen](003-toten-combatscreen-flow-entfernen.md)            | hoch    | `done`  | —            |
| 4           | [004 — Mastery-Balancing deklarativ](004-mastery-balancing-deklarativ.md)                      | hoch    | `done`  | 001, 002     |
| 5           | [005 — Save-Store konsolidieren](005-save-store-konsolidieren.md)                              | mittel  | `done`  | —            |
| 6           | [006 — Dungeon-Run-Lifecycle konsolidieren](006-dungeon-run-lifecycle-konsolidieren.md)        | mittel  | `done`  | 003          |
| 7           | [007 — UI-Subscriptions & Render-Hygiene](007-ui-subscriptions-und-render-hygiene.md)          | mittel  | `ready` | 003          |
| 8           | [008 — WeaponMasteryScreen: A11y & Zerlegung](008-weapon-mastery-screen-a11y-und-zerlegung.md) | mittel  | `ready` | —            |
| 9           | [009 — Typ- & Schema-Härtung](009-typ-und-schema-haertung.md)                                  | mittel  | `ready` | —            |
| 10          | [010 — Testqualität: Invarianten statt Zahlen-Pins](010-testqualitaet-invarianten.md)          | mittel  | `ready` | —            |
| 11          | [011 — Engine-Aufräumarbeiten](011-engine-aufraeumarbeiten.md)                                 | niedrig | `ready` | —            |
| 12          | [012 — Content-Aufräumarbeiten](012-content-aufraeumarbeiten.md)                               | niedrig | `ready` | —            |
| 13          | [013 — Tooling-Feinschliff](013-tooling-feinschliff.md)                                        | niedrig | `ready` | —            |

**001–004 hängen fachlich zusammen** (Mastery-Effekte deklarativ und testbar): 001 sichert die
Save-Keys, 002 legt das Sicherheitsnetz für den Umbau in 004, 003 räumt vorher den toten
Parallel-Flow weg. 005–013 sind unabhängig voneinander bearbeitbar; 006 und 007 setzen den
Wegfall des `CombatScreen` (003) voraus, weil dessen Duplikate sonst mitgepflegt werden müssten.

## Positivbefunde des Reviews

Als Referenz für künftige Arbeit — diese Muster beibehalten:

- Engine-Purity ist per ESLint erzwungen (`no-restricted-imports/globals/properties` für
  `src/features/*/engine/**`); der gesamte Engine-Code ist frei von Purity-Verstößen.
- PRNG-Position als Teil des Kampfzustands macht `nextTick` zu einer reinen Funktion;
  Playback und Catch-up teilen sich denselben Pfad.
- ScriptedPrng-Tests fixieren Anzahl und Label jedes PRNG-Zuges; Profiler-Tests machen das
  Selective-Subscription-Muster einklagbar; Formations-Tests prüfen Verhaltens-Invarianten
  statt exakter Zahlen.
- Save-Schichtung Port → Service → Store mit Zod-Validierung bei Load und Save;
  `useCombatPlayback` injiziert Clock/Scheduler/Visibility vollständig.
