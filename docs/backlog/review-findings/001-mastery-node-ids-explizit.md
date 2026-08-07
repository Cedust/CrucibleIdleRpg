# 001 — Mastery-Node-IDs explizit machen

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Schwere**      | hoch   |
| **Hängt ab von** | —      |

## Ziel

Mastery-Node-IDs sind explizit deklariert und von Anzeige-Labels entkoppelt; jede in der
Engine referenzierte ID ist durch einen Test gegen den Node-Katalog abgesichert.

## Befund

- [mastery.ts](../../../src/game/weaponMastery/mastery.ts) (Z. 53, 73) leitet Node-IDs aus
  Anzeige-Labels ab (`label.toLowerCase().replaceAll(' ', '-')`), inklusive Apostrophen
  (`weapon.titan's-arc`). Eine Label-Umbenennung — reiner Spieltext — ändert damit still die
  Save-Keys in `masteryRanks`.
- [characterStats.ts](../../../src/features/combat/engine/characterStats.ts) (Z. 126–137) und
  [masteryCombat.ts](../../../src/features/combat/engine/masteryCombat.ts) (Z. 28–49)
  referenzieren dieselben IDs als frei getippte String-Literale. Ein Tippfehler oder eine
  ID-Drift deaktiviert den Effekt still.

## Nicht-Ziel

Maschinenlesbare Effektwerte in den Node-Definitionen — das ist
[004](004-mastery-balancing-deklarativ.md).

## Verbindliche Spec-Anker

- [WEAPON-MASTERY.md](../../spec/WEAPON-MASTERY.md) — Node-Katalog der Disziplinen
- [AGENTS.md § Coding Style](../../../AGENTS.md#coding-style--naming-conventions) — Content-Identifier explizit und deterministisch
- [AGENTS.md § Architecture](../../../AGENTS.md#architecture) — Pre-Release-Save-Policy (Save-Keys)

## Akzeptanzkriterien

- [x] Jeder `MasteryNode` trägt seine `id` als explizites Feld; die heutigen ID-Werte bleiben
      unverändert (Save-Kompatibilität).
- [x] Labels sind ohne Auswirkung auf IDs änderbar.
- [x] Die Engine bezieht referenzierte IDs aus exportierten Konstanten, oder ein Test
      validiert jede in `characterStats.ts`/`masteryCombat.ts` referenzierte ID gegen
      `nodeById`.
- [x] Ein Test prüft die ID-Eindeutigkeit über alle Nodes.

## Betroffene Dateien

- `src/game/weaponMastery/mastery.ts` — explizite IDs
- `src/features/combat/engine/characterStats.ts`, `masteryCombat.ts` — Konstanten statt Literale
- `src/game/weaponMastery/mastery.test.ts` — ID-Validierung

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
