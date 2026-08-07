# 004 — Mastery-Balancing deklarativ

| Feld             | Wert                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------- |
| **Status**       | `blocked`                                                                              |
| **Schwere**      | hoch                                                                                   |
| **Hängt ab von** | [001](001-mastery-node-ids-explizit.md), [002](002-mastery-kampfintegration-testen.md) |

## Ziel

Sämtliche Mastery-Balancing-Zahlen leben maschinenlesbar in den Node-Definitionen unter
`src/game/`; die Engine wendet sie nur noch an, und ein Balancing-Pass ist eine reine
`src/game/`-Änderung.

## Befund

Balancing-Literale sind über den Engine-Code verstreut:

- [characterStats.ts](../../../src/features/combat/engine/characterStats.ts) (Z. 126–137):
  Waffen-Flat-Boni `+5`/`+3`/`+3`, Block `+0.15`.
- [outgoingDamage.ts](../../../src/features/combat/engine/outgoingDamage.ts) (Z. 123, 151,
  190, 194, 232, 257, 262, 268, 281, 286, 295): Executioner `+0.5` mit Schwelle `0.25`,
  Zeroing `0.05`/Stack mit Caps `3`/`5`, Epicenter `0.5`, Focused Blast `0.25` mit Cap `1`,
  Aftershock `0.5`, Echo `0.5`, Second Wind `0.25`, Storm-Surge-Cap `2`.
- [counter.ts](../../../src/features/combat/engine/counter.ts) (Z. 101) und
  [combatEngine.ts](../../../src/features/combat/engine/combatEngine.ts) (Z. 404):
  Escalating Retaliation `0.25` mit Cap `3`.
- [masteryCombat.ts](../../../src/features/combat/engine/masteryCombat.ts) (Z. 28–49):
  Weapon-Mode-Deltas.

Die `effect`-Strings in [mastery.ts](../../../src/game/weaponMastery/mastery.ts) (Z. 366–437)
beschreiben dieselben Werte als Freitext — Anzeige und Wirkung können lautlos divergieren.

## Nicht-Ziel

Änderung der Balancing-Werte selbst; die Struktur der Formeln bleibt unangetastet.

## Verbindliche Spec-Anker

- [WEAPON-MASTERY.md](../../spec/WEAPON-MASTERY.md) — Effekte der Nodes
- [AGENTS.md § Architecture](../../../AGENTS.md#architecture) — Balancing deklarativ in `src/game/`, getrennt von Logik

## Akzeptanzkriterien

- [ ] Zahleneffekte der Behavior-Nodes sind als typisierte Felder der `MasteryNode`-Definitionen
      deklariert (z. B. Flat-Boni, Multiplikatoren, Caps).
- [ ] Die Engine bezieht alle oben gelisteten Werte aus `src/game/`; im Engine-Code stehen
      keine Mastery-Balancing-Literale mehr.
- [ ] Der `effect`-Anzeigetext ist aus denselben Daten abgeleitet oder per Test gegen sie
      geprüft.
- [ ] Die Tests aus [002](002-mastery-kampfintegration-testen.md) bleiben grün
      (Verhaltens-Äquivalenz des Umbaus).

## Betroffene Dateien

- `src/game/weaponMastery/mastery.ts` — Effektfelder
- `src/features/combat/engine/characterStats.ts`, `outgoingDamage.ts`, `counter.ts`, `combatEngine.ts`, `masteryCombat.ts` — Literale ersetzen

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
