# 010 — Testqualität: Invarianten statt Zahlen-Pins

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Schwere**      | mittel |
| **Hängt ab von** | —      |

## Ziel

Balancing-Tests prüfen Invarianten (Länge, Monotonie, Caps, Regeln) und überleben damit
Tuning-Änderungen; wertlose oder fehleranfällige Assertions sind ersetzt; gemeinsame
Test-Helper beseitigen die Kopien.

## Befund

- **Kurven ungeprüft:** [curves.test.ts](../../../src/game/curves/curves.test.ts) (Z. 16–21)
  pinnt `ATTRIBUTE_BONUS_PER_POINT` exakt und prüft von den drei 300-Einträge-Tabellen nur
  Index 0. Länge, Monotonie, `ENEMY_ACCURACY_BONUS`-Cap und `ELITE_/BOSS_MULTIPLIER > 1`
  sind unbelegt — ein gelöschter Tabelleneintrag bricht keinen Test.
- **Snapshot-artige Pins:** [xpRewards.test.ts](../../../src/game/rewards/xpRewards.test.ts)
  (Z. 23–29, 33–34, 69) pinnt exakte Platzhalterwerte;
  [mastery.test.ts](../../../src/game/weaponMastery/mastery.test.ts) (Z. 17) pinnt
  `toBe(229)`. Beide brechen bei jedem Tuning ohne Erkenntnisgewinn.
- **Immer-grüne Assertion:** [AppShell.test.tsx](../../../src/app/AppShell.test.tsx) (Z. 73)
  prüft die Abwesenheit eines Buttons `CHARACTERS`; das Nav-Label heißt `TEAM`
  ([AppShell.tsx](../../../src/app/AppShell.tsx) Z. 15).
- **Cast-Umgehungen:** [formations.test.ts](../../../src/game/encounters/formations.test.ts)
  (Z. 77, 102) umgeht `noUncheckedIndexedAccess` per Cast — im Fehlerfall Laufzeit-Crash
  statt Assertion.
- **Mock-Leak:** [dungeonRunStore.test.ts](../../../src/features/dungeon/state/dungeonRunStore.test.ts)
  (Z. 33–43) restauriert `beginRun` nach der Assertion; ein Fehlschlag davor lässt den Mock
  für Folgetests aktiv.
- **Kopierte Helper:** `scriptedPrng` samt Doku existiert dreifach identisch
  (`outgoingDamage.test.ts`, `damagePipeline.test.ts`, `counter.test.ts`); die
  `character()`/`enemy()`/`state()`-Factories in fünf Testdateien in Varianten.
- **Mastery-Katalog-Invarianten:** Existenz aller `prerequisites`/`exclusiveWith`-Referenzen
  und Symmetrie der Exclusive-Paare sind ungeprüft (ID-Eindeutigkeit:
  [001](001-mastery-node-ids-explizit.md)).

## Nicht-Ziel

Neue Testabdeckung für Mastery-Kampfpfade — [002](002-mastery-kampfintegration-testen.md).

## Verbindliche Spec-Anker

- [AGENTS.md § Testing Guidelines](../../../AGENTS.md#testing-guidelines) — Tests prüfen Struktur mit eigenen Eingangswerten
- [../README.md § Umgang mit offenen Balancing-Werten](../README.md#4-umgang-mit-offenen-balancing-werten)

## Akzeptanzkriterien

- [x] Kurven-Tests prüfen Länge (300), strikte Monotonie, Accuracy-Cap und Multiplier > 1.
- [x] Zahlen-Pins in `xpRewards.test.ts`/`mastery.test.ts` sind über die API bzw. als
      Regel-Invariante ausgedrückt.
- [x] Die `CHARACTERS`-Assertion prüft `TEAM`.
- [x] Die Casts in `formations.test.ts` sind durch Guards/`toBeDefined()` ersetzt.
- [x] Der `beginRun`-Mock wird per `try/finally` oder `beforeEach` restauriert.
- [x] `scriptedPrng` und die Engine-Test-Factories liegen in einem gemeinsamen Helper-Modul
      (`testFixtures.ts`); die Testdateien halten ihre Profile als dünne Wrapper.
- [x] Der Mastery-Katalog-Test prüft Referenz-Existenz und Exclusive-Symmetrie.

## Betroffene Dateien

- `src/game/curves/curves.test.ts`, `src/game/rewards/xpRewards.test.ts`, `src/game/weaponMastery/mastery.test.ts`
- `src/game/encounters/formations.test.ts`, `src/app/AppShell.test.tsx`
- `src/features/dungeon/state/dungeonRunStore.test.ts`
- `src/features/combat/engine/` — gemeinsames Test-Helper-Modul

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
