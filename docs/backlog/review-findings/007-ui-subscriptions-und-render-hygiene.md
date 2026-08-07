# 007 — UI-Subscriptions & Render-Hygiene

| Feld             | Wert                                            |
| ---------------- | ----------------------------------------------- |
| **Status**       | `ready`                                         |
| **Schwere**      | mittel                                          |
| **Hängt ab von** | [003](003-toten-combatscreen-flow-entfernen.md) |

## Ziel

Alle Kampf- und Dungeon-Views abonnieren ausschließlich die Felder, die sie rendern; Reads
laufen reaktiv über Selektoren, Listen-Keys sind stabil.

## Befund

- **Nicht-reaktiver Read im Render:**
  [TurnOrderBar.tsx](../../../src/features/combat/ui/TurnOrderBar.tsx) (Z. 7–12) liest
  `useCombatStore.getState()` in `actorName` während des Renders — bricht das
  Rendering-Modell und die React-Compiler-Annahmen.
- **Zu breite Subscriptions:**
  [DungeonRunScreen.tsx](../../../src/features/dungeon/ui/DungeonRunScreen.tsx) (Z. 13–14)
  abonniert das komplette `combat`-Objekt für `floorId` — der gesamte Screen rendert bei
  jedem Tick. [DungeonSelectionScreen.tsx](../../../src/features/dungeon/ui/DungeonSelectionScreen.tsx)
  (Z. 10) abonniert das ganze Save-Objekt für `unlockedDungeonIds`.
- **Key-Kollisionen:** [CombatLog.tsx](../../../src/features/combat/ui/CombatLog.tsx) (Z. 83)
  nutzt `${round}-${side}-${index}`; zieht derselbe Akteur zweimal pro Runde (Second Wind),
  kollidieren Keys; der Fallback basiert auf dem Index des reversed Arrays.
- **Kleinigkeiten:** [EnemyFormation.tsx](../../../src/features/combat/ui/EnemyFormation.tsx)
  dreifacher `find`-Scan pro Slot (Z. 17–29) und manuelles `useCallback` trotz React
  Compiler (Z. 57–65).

## Nicht-Ziel

Umbau des WeaponMasteryScreens — [008](008-weapon-mastery-screen-a11y-und-zerlegung.md).

## Verbindliche Spec-Anker

- [AGENTS.md § Architecture](../../../AGENTS.md#architecture) — selektive Zustand-Subscriptions

## Akzeptanzkriterien

- [ ] Kein `getState()`-Read im Render-Pfad; `TurnOrderBar` leitet Namen aus der abonnierten
      Selektion ab.
- [ ] `DungeonRunScreen` abonniert `floorId`, `DungeonSelectionScreen` die benötigten
      Save-Felder.
- [ ] Log-Einträge tragen einen stabilen Key (z. B. monotone Tick-ID aus dem Store).
- [ ] Die Profiler-Tests (Commit nur auf der veränderten Kampfseite) bleiben grün.

## Betroffene Dateien

- `src/features/combat/ui/TurnOrderBar.tsx`, `CombatLog.tsx`, `EnemyFormation.tsx`
- `src/features/dungeon/ui/DungeonRunScreen.tsx`, `DungeonSelectionScreen.tsx`
- `src/features/combat/state/combatStore.ts` — Tick-ID für Log-Keys

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
