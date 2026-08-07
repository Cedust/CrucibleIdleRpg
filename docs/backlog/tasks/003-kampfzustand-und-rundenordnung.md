# 003 — Kampfzustand & Rundenordnung

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Meilenstein**  | M1     |
| **Hängt ab von** | 002    |

## Ziel

Der Kampfzustand ist typisiert, wird aus Floor-Seed und Formation deterministisch aufgebaut,
und die Pending-Queue einer Runde steht in der spezifizierten Ordnung.

## Nicht-Ziel

Schadensberechnung (004, 005) und das Schrittwerk (006). Dieser Task erzeugt den Zustand und
die Reihenfolge, in der gehandelt wird — nicht das Handeln selbst.

## Verbindliche Spec-Anker

- [Rundenablauf](../../spec/COMBAT-RUN.md#11-rundenablauf) — dreistufige totale Ordnung
  (Initiative → Gegner vor Charakter → niedrigerer Slot-Index), Pending-Queue aus **lebenden**
  Akteuren, Barrier-Reset zu Rundenbeginn ohne Stacking
- [Gegnerformation](../../spec/COMBAT-RUN.md#13-gegnerformation) — 2×3-Lanes, max. sechs Gegner,
  max. ein Tank; Gegner-Initiative einmalig zu Kampfbeginn in **Formations-Index-Reihenfolge**
  gewürfelt
- [Seeds und Zufalls-Ströme](../../spec/SIMULATION.md#4-seeds-und-zufalls-ströme) — die
  Initiative läuft über den `init`-Strom, getrennt von `combat`
- [Team](../../spec/CHARACTERS.md#1-team) — besiegte Slots fallen aus Reihenfolge und
  Verteilung heraus
- [AGENTS.md](../../../AGENTS.md) — `noUncheckedIndexedAccess`:
  Slot-Zugriffe liefern `| undefined`

## Akzeptanzkriterien

- [x] `deriveSeed`/`derivePrng` aus `src/shared/utils/prng.ts` bilden die Kette
      `saveSeed → runSeed → floorSeed → Strom`; Strom-Label nur über `PRNG_STREAM`
- [x] Der Aufbau desselben Floors mit demselben Seed liefert bit-identische Initiative-Werte
- [x] Die Ordnung verbraucht **keinen** PRNG-Zug — Test mit erzwungenem Initiative-Gleichstand
      über alle drei Stufen
- [x] Ein Todesfall entfernt den Akteur aus der offenen Queue
- [x] Barrier wird zu Rundenbeginn neu gesetzt; Rest der Vorrunde verfällt
- [x] Der Kampfzustand enthält keine Referenz auf Timer, DOM oder Store

## Betroffene Dateien

- `src/features/combat/combatState.ts` (Zustandstypen, Aufbau) + Test
- `src/features/combat/turnOrder.ts` (Ordnung, Pending-Queue) + Test
