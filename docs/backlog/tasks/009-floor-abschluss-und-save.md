# 009 — Floor-Abschluss & Save v1

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Meilenstein**  | M1      |
| **Hängt ab von** | 007     |

## Ziel

Ein Sieg committet seine Belohnung in den Speicherstand, ein Wipe beendet den Run, und beides
überlebt einen Reload.

## Nicht-Ziel

Die Floor-**Kette** (Attrition über mehrere Floors, Auto-Progression, Checkpoints, Rally) und
Loot-Drops folgen in M2/M3. M1 committet den Sieg **eines** Floors: XP, Gold und die Crystals
des Erstsiegs.

## Verbindliche Spec-Anker

- [Belohnungen aus einem Sieg](../../spec/PROGRESSION.md#2-belohnungen-aus-einem-sieg) —
  Commit **pro Floor-Sieg**, nicht am Run-Ende; Crystals nur beim Erstsieg (Normal 1,
  Elite 3, Boss 10)
- [Speicher-Auslöser](../../spec/PERSISTENCE.md#1-speicher-auslöser) — nach jedem Floor-Sieg
  und **beim Run-Start** (der `runCounter` muss vor dem ersten Kampf persistiert sein)
- [Save-Inhalt](../../spec/PERSISTENCE.md#2-save-inhalt) — Save-Version, `saveSeed`,
  `runCounter`, Playback-Geschwindigkeit, pro Charakter Level und XP, Erstsieg-Flags
- [Kampfzustand und Reload](../../spec/SIMULATION.md#5-kampfzustand-und-reload) — der laufende
  Kampfzustand wird **nie** serialisiert; ein Reload beendet den Run, committete Belohnungen
  bleiben
- [Seeds und Zufalls-Ströme](../../spec/SIMULATION.md#4-seeds-und-zufalls-ströme) —
  `runCounter` ist monoton und beim Run-Start persistiert; Save-Scumming ist damit unmöglich
- [AGENTS.md §7](../../../AGENTS.md#7-persistenz--robustheit) — `SavePort`, Versionsfeld,
  Migration, Zod-Validierung beim Laden mit kontrolliertem Fallback

## Offener Punkt

Die konkrete Feldstruktur je Save-Version ist als Spec-Punkt offen
([OPEN_ISSUES §2](../OPEN_ISSUES.md#2-offene-spec-punkte)). Dieser Task legt sie **für Save
v1** fest und trägt sie in [Save-Inhalt](../../spec/PERSISTENCE.md#2-save-inhalt) nach, soweit
sie strukturell ist — der Eintrag in OPEN_ISSUES wird entsprechend gekürzt
([README.md §5](../../README.md#5-pflichten-bei-doku-änderungen)).

## Akzeptanzkriterien

- [ ] Der Zod-Schema-Platzhalter in `src/features/save/saveSchema.ts` ist durch die echten
      Felder ersetzt; Zugriff läuft ausschließlich über den `SavePort`
- [ ] Ein manipuliertes oder korruptes Save führt zu einem kontrollierten Fallback, nicht zu
      einem Absturz — Test mit ungültigem JSON und mit schema-verletzendem JSON
- [ ] Kein Feld des laufenden Kampfes (Health, Pending-Queue, PRNG-Zustand, Floor-Index)
      erscheint im Save — Test gegen das Schema
- [ ] Ein Reload während eines laufenden Kampfes verliert den Kampf und behält die zuvor
      committete Belohnung
- [ ] Zwei Runs desselben Floors nacheinander laufen unterschiedlich (`runCounter` steigt);
      ein Reload vor demselben Kampf liefert exakt denselben Verlauf
- [ ] Playwright-E2E: „Kampf starten → Sieg → Reward → Reload → Reward ist noch da"

## Betroffene Dateien

- `src/features/save/saveSchema.ts`, `src/features/save/saveService.ts` + Tests
- `src/features/combat/combatStore.ts` (Abschluss-Übergang)
- `src/features/progression/rewards.ts` — neu, + Test
- `e2e/smoke.spec.ts`
- `docs/spec/PERSISTENCE.md`, `docs/backlog/OPEN_ISSUES.md`
