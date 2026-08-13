# 006 — Dungeon-Run-Lifecycle konsolidieren

| Feld             | Wert                                            |
| ---------------- | ----------------------------------------------- |
| **Status**       | `done`                                          |
| **Schwere**      | mittel                                          |
| **Hängt ab von** | [003](003-toten-combatscreen-flow-entfernen.md) |

## Ziel

Run-Lifecycle-Regeln (Floor-Abschluss, Auto-Advance, letzter Floor) leben an einer Stelle im
Store bzw. Encounter-Modul und sind ohne DOM-Tests prüfbar; die View stellt nur dar.

## Befund

- **Commit-Callback dupliziert:** Der `createFloorReward → commitVictory`-Callback steht
  wortgleich in `startRun` und `startNextFloor`
  ([dungeonRunStore.ts](../../../src/features/dungeon/state/dungeonRunStore.ts) Z. 52–64,
  94–106).
- **„Letzter Floor" doppelt kodiert:** fachlich via `floorNumber === 20`
  (dungeonRunStore.ts Z. 89, 149) und als String-Suffix `floorId?.endsWith('-20')` in
  [DungeonRunScreen.tsx](../../../src/features/dungeon/ui/DungeonRunScreen.tsx) (Z. 40, 114) —
  bei geändertem ID-Format oder anderer Floor-Anzahl bricht die UI leise.
- **Lifecycle-Regeln in der View:** „Wipe beendet den Run" und „nach gespeichertem Reward
  automatisch nächster Floor außer Floor 20" leben in zwei `useEffect`s
  (DungeonRunScreen.tsx Z. 33–43) und sind nur über DOM-Tests erreichbar.
- **Pauschales `catch {}`:** dungeonRunStore.ts Z. 67–70 (analog Z. 126–128) maskiert auch
  Throws aus `createDungeonEntryCombat` als „Unable to start dungeon run.".
- **Reward-Semantik per Regex:** [rewards.ts](../../../src/features/dungeon/rewards.ts)
  (Z. 17–31) parst Dungeon-Nummer/Floor aus der ID und kodiert „D5 = Akt-Boss" hart;
  `resolveAct1Encounter` liefert `dungeonId`/`floorNumber` bereits strukturiert.

## Nicht-Ziel

Neue Auto-Progression-Features; es geht um Verlagerung und Entdopplung bestehender Regeln.

## Verbindliche Spec-Anker

- [COMBAT-RUN.md](../../spec/COMBAT-RUN.md) — Run-Ablauf und Abschluss
- [AGENTS.md § Architecture](../../../AGENTS.md#architecture) — Runtime-State außerhalb der Views

## Akzeptanzkriterien

- [x] Eine gemeinsame Commit-Factory ersetzt die duplizierten Callbacks.
- [x] `isFinalFloor` (bzw. die Floor-Anzahl) kommt aus dem Encounter-Modul; UI und Store
      nutzen dieselbe Quelle, der String-Suffix-Check ist ersetzt.
- [x] Wipe- und Auto-Advance-Reaktionen liegen im Store/Controller und sind per Store-Test
      abgedeckt; die `useEffect`s in der View entfallen.
- [x] `catch` umfasst nur den Save-Schritt oder protokolliert den Originalfehler.
- [x] `relicShardRewardForFirstVictory` arbeitet auf strukturierten Encounter-Daten.

## Betroffene Dateien

- `src/features/dungeon/state/dungeonRunStore.ts`, `dungeonRunStore.test.ts`
- `src/features/dungeon/ui/DungeonRunScreen.tsx`, `DungeonRunScreen.test.tsx`
- `src/features/dungeon/rewards.ts`, `rewards.test.ts`
- `src/game/encounters/act1.ts` — `isFinalFloor`/Konstante

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
