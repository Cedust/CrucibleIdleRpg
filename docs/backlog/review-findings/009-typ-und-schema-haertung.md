# 009 — Typ- & Schema-Härtung

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Schwere**      | mittel  |
| **Hängt ab von** | —       |

## Ziel

Content-Referenzen sind compile-time-geprüft, das Save-Schema validiert vollständig, und
Typ-Umgehungen (`as`-Casts, Non-Null-Assertions, tote Guards) sind beseitigt.

## Befund

- **Nackte String-Typen:** [types.ts](../../../src/game/types.ts) (Z. 10–11) definiert
  `EnemyId = string` / `FormationId = string`; Tippfehler in `DUNGEON_FORMATIONS` oder
  Formation-Slots fallen erst zur Laufzeit auf. `CharacterId` zeigt das Zielmuster.
- **Manuell behauptete Schema-Deckung:**
  [saveSchema.ts](../../../src/features/save/saveSchema.ts) (Z. 126–128) baut `SaveData` als
  `Omit<z.infer<...>> & { characters: ... }`; ein neues Feld in
  `CharacterProgressionState` bliebe unvalidiert.
- **Schema-Lücken:** `firstVictories` (Z. 85) akzeptiert beliebige Strings und Duplikate;
  `unlockedDungeonIds` (Z. 86) erlaubt Duplikate.
- **NaN-Risiko im Stat-Loop:**
  [characterStats.ts](../../../src/features/combat/engine/characterStats.ts) (Z. 117–119):
  Utility-Zweig als Negativ-Fallback mit ungeprüftem `as`-Cast — ein unkategorisierter
  Node-Stat schreibt still `undefined + bonus = NaN`.
- **Non-Null-Assertion:** [mastery.ts](../../../src/game/weaponMastery/mastery.ts) (Z. 104)
  `target!` statt `NonNullable<MasteryNode['stat']>` als Parametertyp.
- **Port-Kontrakt:** [savePort.ts](../../../src/shared/ports/savePort.ts) (Z. 23–31):
  `localStorage`-Zugriffe können synchron werfen; `async`-Adapter-Methoden halten den
  Promise-Kontrakt auch im Fehlerfall.
- **Inkonsistente Guards:** [combatState.ts](../../../src/features/combat/engine/combatState.ts)
  (Z. 259–262) prüft das totale `CHARACTERS`-Record auf `undefined`;
  [masteryCombat.ts](../../../src/features/combat/engine/masteryCombat.ts) (Z. 19) greift
  ungeprüft zu.

## Nicht-Ziel

Save-Schema-Erweiterungen um neue Felder; Pre-Release-Save-Policy bleibt unberührt.

## Verbindliche Spec-Anker

- [PERSISTENCE.md](../../spec/PERSISTENCE.md) — Save-Validierung
- [AGENTS.md § Coding Style](../../../AGENTS.md#coding-style--naming-conventions) — explizite, deterministische Typen

## Akzeptanzkriterien

- [ ] `EnemyId`/`FormationId` sind als `keyof typeof`-Unions abgeleitet; das Projekt
      typecheckt.
- [ ] Ein statischer Assert prüft Schema ⇄ `CharacterProgressionState` in beide Richtungen.
- [ ] `firstVictories`/`unlockedDungeonIds` validieren Format und Eindeutigkeit.
- [ ] Der Utility-Zweig prüft die Key-Existenz und wirft bei unkategorisierten Stats.
- [ ] `target!` und der tote `CHARACTERS`-Guard sind ersetzt; ein Guard-Stil gilt einheitlich.
- [ ] Die SavePort-Adapter sind `async`.

## Betroffene Dateien

- `src/game/types.ts`, `src/game/weaponMastery/mastery.ts`
- `src/features/save/saveSchema.ts`, `saveSchema.test.ts`
- `src/features/combat/engine/characterStats.ts`, `combatState.ts`, `masteryCombat.ts`
- `src/shared/ports/savePort.ts`

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
