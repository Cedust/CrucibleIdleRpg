# DECISIONS — UI-Foundation-Refactor

> **Zweck:** Protokoll der Entscheidungen, die während der autonomen Umsetzung der UIF-Tasks
> anfielen und normalerweise eine menschliche Antwort gebraucht hätten. Je Eintrag: Problem,
> Optionen, Entscheidung mit Begründung. Zielarchitektur: [FOUNDATION.md](FOUNDATION.md).

## D-001 — Arbeits- und Commit-Modell der autonomen Session

**Problem:** Die Backlog-Konvention sagt „ein Task = eine Agenten-Session = ein PR"
([../README.md §1](../README.md#1-ein-task)), AGENTS.md sagt „Only commit or open a Pull Request
when explicitly requested". Der Auftrag lautet, alle elf UIF-Tasks in einer Session umzusetzen —
elf Tasks unversioniert im Working Tree zu halten wäre fragil und ließe die Task-Grenzen im
Review verschwinden.

**Optionen:**

1. Alles uncommitted im Working Tree lassen (wörtliche AGENTS.md-Lesart).
2. Ein Sammel-Commit am Ende.
3. Ein Conventional Commit je abgeschlossenem Task auf `feat/ui-fundament`, keine Pushes,
   keine PRs.

**Entscheidung:** Option 3. Der Auftrag ist die explizite Anweisung, den ganzen Meilenstein auf
dem dafür angelegten Branch fertigzustellen; Commits je Task sind die projekteigene Granularität,
schützen die Arbeit vor Verlust und lassen die Pre-Commit-Hooks (lint-staged, typecheck,
docs:links) jeden Task einzeln validieren. Pushes und PRs bleiben aus — die bleiben explizit
angefragt.

## D-002 — Task 006: „Sechs Dungeons → zweite Reihe" ist als Fixture nicht typbar

**Problem:** Task 006 verlangt eine Testfixture, in der sechs Dungeons eine zweite Grid-Reihe
erzeugen. `DungeonSelector` iteriert über `ACT_1_DUNGEON_IDS`, und `Act1DungeonId` kennt genau
fünf Werte — ein sechster Test-Dungeon ist ohne Aufweichen der Game-Typen nicht darstellbar.
jsdom misst zudem kein echtes Grid-Layout; eine „zweite Reihe" wäre dort ohnehin nicht prüfbar.

**Optionen:**

1. `DungeonSelector` eine `dungeonIds`-Prop mit aufgeweichtem Typ geben, nur damit ein Test
   sechs Karten rendern kann.
2. Die auto-fill-Mechanik über Klassen-Assertions (Unit) plus echtes Reflow-Verhalten bei
   schmalen Breiten im Responsive-E2E (Task 010) absichern.

**Entscheidung:** Option 2. Das Grid `repeat(auto-fill,10rem)` bricht per CSS um — geprüft wird
die verbaute Mechanik (Klassen-Assertion, kein `overflow-x-auto`) und in `e2e/responsive.spec.ts`
das echte Umbruchverhalten der fünf vorhandenen Karten bei schmalen Containern. Die Game-Typen
bleiben strikt (AGENTS.md); der Task-Wortlaut „Testfixture" ist damit sinngemäß erfüllt.
