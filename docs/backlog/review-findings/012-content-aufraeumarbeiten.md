# 012 — Content-Aufräumarbeiten

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Schwere**      | niedrig |
| **Hängt ab von** | —       |

## Ziel

Der Content unter `src/game/` hat je Sachverhalt genau eine Quelle; Platzhalter sind benannt,
tote Artefakte entfernt.

## Befund

- **Zwei Wahrheitsquellen für Floor→Formation:** die produktiv ungenutzte Tabelle
  `FLOOR_FORMATIONS` ([formations.ts](../../../src/game/encounters/formations.ts) Z. 85–106)
  und die berechnete Zuordnung `formationFor`
  ([act1.ts](../../../src/game/encounters/act1.ts) Z. 31–37, 122–129).
- **Redundantes Feld:** `bulwarkContribution`
  ([enemies.ts](../../../src/game/enemies/enemies.ts) Z. 32/42/52/62) wiederholt
  `BULWARK_CONTRIBUTION_BY_ROLE[role]` und ist vollständig aus `role` ableitbar.
- **Dangling-Docblock:** [characterCurves.ts](../../../src/game/curves/characterCurves.ts)
  (Z. 10–18) beschreibt eine Core-Stat-Umrechnungskonstante ohne zugehörigen Export; die
  1:1-Umrechnung steckt implizit in `characterStats.ts` (Z. 90).
- **Unbenannter Platzhalter:** `gold: 10` inline in
  [floorRewards.ts](../../../src/game/rewards/floorRewards.ts) (Z. 16); die übrigen
  Platzhalter sind benannte Exporte in `curves/`. `createFloorReward` hat zudem keinen Test
  für die Verdrahtung (floorId/Gold/XP-Zusammenbau).
- **Fehlerhafte, ungenutzte Funktion:** `maximumInvestableCapacity`
  ([mastery.ts](../../../src/game/weaponMastery/mastery.ts) Z. 478–480) — nur vom Test
  genutzt, die Doku „Maximum legal spend" ignoriert die Shared-Capstone-Sperre, der
  Exclusive-Abzug ist hartkodiert.
- **Modul-Level-Throw:** [act1.ts](../../../src/game/encounters/act1.ts) (Z. 57–60)
  validiert Content zur Import-Zeit; ein Content-Fehler crasht den gesamten App-Import,
  `validateAct1Encounters` läuft ohnehin im Test.

## Nicht-Ziel

Balancing-Änderungen; alle Werte bleiben identisch.

## Verbindliche Spec-Anker

- [AGENTS.md § Architecture](../../../AGENTS.md#architecture) — Balancing deklarativ in `src/game/`
- [../README.md § Umgang mit offenen Balancing-Werten](../README.md#4-umgang-mit-offenen-balancing-werten) — Platzhalter-Konvention

## Akzeptanzkriterien

- [ ] Floor→Formation hat eine Quelle; Tabelle oder Formel ist entfernt bzw. abgeleitet.
- [ ] `bulwarkContribution` ist entfernt; Consumer schlagen über die Rolle nach.
- [ ] Der Docblock in `characterCurves.ts` gehört zu einem Export oder ist entfernt.
- [ ] Der Gold-Platzhalter ist ein benannter Export; `createFloorReward` hat einen Test.
- [ ] `maximumInvestableCapacity` ist entfernt oder korrekt aus den Node-Daten hergeleitet.
- [ ] Die Content-Validierung läuft im Test bzw. Boot-Check statt zur Import-Zeit.

## Betroffene Dateien

- `src/game/encounters/formations.ts`, `act1.ts` + Tests
- `src/game/enemies/enemies.ts`, `src/game/curves/characterCurves.ts`
- `src/game/rewards/floorRewards.ts` + neuer Test
- `src/game/weaponMastery/mastery.ts`, `mastery.test.ts`

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
