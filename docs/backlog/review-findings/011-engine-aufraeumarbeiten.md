# 011 — Engine-Aufräumarbeiten

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Schwere**      | niedrig |
| **Hängt ab von** | —       |

## Ziel

Kleine Korrektheits-, Performance- und Lesbarkeits-Funde der Kampf-Engine sind behoben; das
Verhalten bleibt bit-identisch (bestehende ScriptedPrng-Tests als Beleg).

## Befund

Alle Fundstellen unter `src/features/combat/engine/`:

- **NaN-Pfad Perfect Exploit:**
  [outgoingDamage.ts](../../../src/features/combat/engine/outgoingDamage.ts) (Z. 206–208)
  rechnet `(base.damage / baseDamage) * maxRaw`; bei `baseDamage === 0` mit erzwungenem Crit
  propagiert `NaN` bis in `enemy.health`.
- **Wegwerf-Allokation:** `projectedState(state, hits)` (Z. 219–220) klont pro Kettenglied
  das Enemy-Array; genutzt wird das Ergebnis ausschließlich bei `relentlessPursuit`.
- **Hotpath ohne Memoisierung:**
  [combatEngine.ts](../../../src/features/combat/engine/combatEngine.ts) (Z. 391–403) ruft
  `contextFor` pro Result und Counter; `masteryContextFor` baut dabei jedes Mal den
  kompletten Node-Katalog neu auf ([mastery.ts](../../../src/game/weaponMastery/mastery.ts)
  Z. 442–446). Im Catch-up (`runCombat`, bis 100k Takte) der heißeste Pfad — Kontext einmal
  pro Takt auflösen.
- **Funktionsgröße:** `resolveCharacterAttack` (Z. 159–314, ~155 Zeilen) mit mutierenden
  Closures; Splash-Block (Z. 238–279) und Weapon-Follow-ups (Z. 280–294) als benannte
  Hilfsfunktionen herauslösen. `rollDamage` (Z. 108–118) trägt 9 Positionsparameter —
  Options-Objekt für die Flags.
- **Tote Exports:** `queueIndexOf`, `removeFromQueue`
  ([turnOrder.ts](../../../src/features/combat/engine/turnOrder.ts) Z. 87–89, 103–105),
  `actorAt` ([combatState.ts](../../../src/features/combat/engine/combatState.ts) Z. 338–343),
  `bulwarkMalus` ([bulwark.ts](../../../src/features/combat/engine/bulwark.ts) Z. 50–55) —
  nur von den eigenen Tests genutzt.
- **ID-Aufzählung:** `effectiveDamage: { korvin: 0, rhaya: 0, quinn: 0 }`
  (combatState.ts Z. 323) statt Aufbau über `TEAM_ORDER`.

## Nicht-Ziel

Verlagerung der Balancing-Literale — [004](004-mastery-balancing-deklarativ.md).

## Verbindliche Spec-Anker

- [AGENTS.md § Architecture](../../../AGENTS.md#architecture) — Simulation pur, geteilter Pfad für Playback und Catch-up
- [DAMAGE-SYSTEM.md](../../spec/DAMAGE-SYSTEM.md) — Schadensformeln

## Akzeptanzkriterien

- [ ] Perfect Exploit rechnet über den Crit-Multiplikator; ein Test deckt `baseDamage === 0`.
- [ ] `projectedState` läuft nur bei `relentlessPursuit`.
- [ ] Der Mastery-Kontext wird einmal pro Takt aufgelöst; ein ScriptedPrng-Test belegt
      unveränderte PRNG-Sequenzen.
- [ ] Splash/Follow-ups sind benannte Funktionen; `rollDamage`-Flags stecken in einem
      Options-Objekt.
- [ ] Tote Exports sind entfernt oder als für kommende Tasks vorgesehen markiert.
- [ ] `effectiveDamage` wird über `TEAM_ORDER` aufgebaut.

## Betroffene Dateien

- `src/features/combat/engine/outgoingDamage.ts`, `combatEngine.ts`, `combatState.ts`, `turnOrder.ts`, `bulwark.ts` + Tests
- `src/game/weaponMastery/mastery.ts` — Katalog-Cache

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
