# 002 — Mastery-Kampfintegration testen

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Schwere**      | hoch    |
| **Hängt ab von** | —       |

## Ziel

Die Mastery-Pfade der Kampf-Engine sind mit deterministischen Tests belegt — vom
ID→Effekt-Mapping bis zu den Schrittwerk- und Counter-Integrationen.

## Befund

Die Engine-Tests laufen mit `neutralProgression` ausschließlich durch den Alles-false-Pfad;
`outgoingDamage.test.ts` baut `MasteryEffects` von Hand. Ungetestet sind dadurch:

- [masteryCombat.ts](../../../src/features/combat/engine/masteryCombat.ts) (gesamt, ohne
  Testdatei): ID→Effekt-Mapping (Z. 51–75), `weaponBonus`-Akkumulation (Z. 10–15), die
  exklusive `else if`-Kette der Weapon-Modes inklusive Präzedenz Titan's Arc vor Shielded
  Advance (Z. 28–49), der `Math.max`-Clamp (Z. 78).
- [combatEngine.ts](../../../src/features/combat/engine/combatEngine.ts) (Z. 309–312,
  396–407): Verbrauch von `guarded` samt Write-back von `nextZeroing`, `guarded = true` nach
  Block mit Immovable Guard, Stack-Inkrement mit Cap 3.
- [counter.ts](../../../src/features/combat/engine/counter.ts): `guardedReprisal`
  (Z. 87–88), `escalatingRetaliation`-Bonus (Z. 100–101), `perfectRiposte` (Z. 166). In den
  `guaranteed`-Pfaden verschieben übersprungene Chance-Würfe die PRNG-Sequenz — das
  vorhandene ScriptedPrng-Protokoll deckt genau diese Fehlerklasse auf.
- [characterStats.ts](../../../src/features/combat/engine/characterStats.ts): Defensive-Zweig
  (Z. 114–116), Utility-Fallback (Z. 117–119), Cap-Verhalten der Chance-Stats (Z. 139–142).

## Nicht-Ziel

Verlagerung der Balancing-Zahlen in die Node-Definitionen —
[004](004-mastery-balancing-deklarativ.md).

## Verbindliche Spec-Anker

- [WEAPON-MASTERY.md](../../spec/WEAPON-MASTERY.md) — Wirkung der Behavior-Nodes
- [AGENTS.md § Testing Guidelines](../../../AGENTS.md#testing-guidelines) — deterministische Tests für Spiellogik

## Akzeptanzkriterien

- [ ] `masteryCombat.test.ts` deckt Mapping, Akkumulation, Weapon-Mode-Präzedenz und Clamp.
- [ ] ScriptedPrng-Tests (mit Draw-Protokoll) belegen die `guaranteed`-Pfade in
      `combatEngine`/`counter` inklusive PRNG-Zug-Anzahl.
- [ ] `characterStats.test.ts` belegt Defensive-Zweig, Utility-Fallback und Caps.
- [ ] Tests bauen Kontexte über `masteryContextFor` mit echten `masteryRanks` auf, statt
      `MasteryEffects` von Hand zu setzen.

## Betroffene Dateien

- `src/features/combat/engine/masteryCombat.test.ts` — neu
- `src/features/combat/engine/combatEngine.test.ts`, `counter.test.ts`, `characterStats.test.ts` — Ergänzungen

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
