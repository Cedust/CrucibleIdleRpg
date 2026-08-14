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
