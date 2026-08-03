---
name: next-task
description: Implement a task from docs/backlog/ROADMAP.md, optionally selected by task number; otherwise choose the next ready task. Use when the user asks to start or complete the next roadmap task.
---

Start the requested task from `docs/backlog/ROADMAP.md`. If no task number is supplied, select the next `ready` task.

1. Read `AGENTS.md` and `docs/backlog/README.md`.
2. Select the task. Without a number, choose the first `ready` entry in the active milestone in `docs/backlog/ROADMAP.md`. Confirm all dependencies are `done`, then read the corresponding file under `docs/backlog/tasks/`.
3. Read every specification section linked under `Verbindliche Spec-Anker` before writing code. If the task conflicts with the SPEC, follow the SPEC.
4. Briefly tell the user which task was selected and how the implementation will be divided before beginning implementation.
5. Set the task to `in progress` and implement from the bottom up: pure logic with unit tests, then store, then UI. Cover every acceptance criterion with a test or another verifiable change.
6. If a required rule is missing, do not invent it. Add an entry to `docs/backlog/OPEN_ISSUES.md`, set the task to `blocked`, and report the blocker to the user.
7. Complete the Definition of Done from `AGENTS.md` section 11 until all required checks pass.
8. Set the task to `done`, change newly unblocked follow-up tasks to `ready`, and synchronize the table in `docs/backlog/ROADMAP.md`.
9. Create a Conventional Commit. Do not push or open a pull request without explicit user approval.
