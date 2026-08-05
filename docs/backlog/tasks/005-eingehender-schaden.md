# 005 — Eingehender Schaden (Schadenspipeline & Counter)

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Meilenstein**  | M1     |
| **Hängt ab von** | 003    |

## Ziel

Ein Gegner-Zug verteilt seine Attack team-weit, führt je Charakter die sechsstufige Pipeline
aus und löst anschließend die Counter aus.

## Nicht-Ziel

**Mitigation** als Signatur-Skill ([Mitigation](../../spec/SIGNATURES.md#11-mitigation-korvin-tank))
wird in M1 nicht freigeschaltet. Der Umleitungsanteil `m` ist trotzdem **Parameter** der
Verteilung — in M1 konstant `0`, damit die Summen-Erhaltung von Anfang an testbar ist.

## Verbindliche Spec-Anker

- [Schadenspipeline](../../spec/DAMAGE-SYSTEM.md#13-eingehender-schaden-schadenspipeline) —
  `S` ist team-weit und flat, Verteilung auf **lebende** Charaktere, verbindliche Reihenfolge
  Evasion → Block → Defense → Barrier → Health, plus **Test-Vektor**
- [Treffermodell](../../spec/DAMAGE-SYSTEM.md#12-treffermodell) —
  `Trefferchance = Accuracy × (1 − Evasion)`
- [Charakter-Zug](../../spec/DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden), Abschnitt
  „Counter im Detail" — eigener Grundschaden-Wurf, kein Multi Hit, kein Splash, Ziel ist der
  auslösende Gegner unabhängig vom Frontline-Lock, verbindliche PRNG-Sequenz je Charakter in
  Slot-Reihenfolge
- [Rundenablauf](../../spec/COMBAT-RUN.md#11-rundenablauf) — Counter **nach** Abschluss der
  Team-Pipeline, in Slot-Reihenfolge, nicht verschachtelt
- [Heilung](../../spec/DAMAGE-SYSTEM.md#16-heilung--grenzen-und-auslösung) — Regeneration ist flach,
  triggert einmal je eigener Handlung, keine Überheilung, besiegte Charaktere sind nicht heilbar

## Akzeptanzkriterien

- [x] Der Test-Vektor aus
      [Schadenspipeline](../../spec/DAMAGE-SYSTEM.md#13-eingehender-schaden-schadenspipeline) läuft als
      Unit-Test durch (Korvin `−10`, Rhaya `0`, Quinn `−56`)
- [x] Summen-Erhaltung: die verteilten Ticks ergeben exakt `S`, auch bei `m > 0`
- [x] Ein sterbender Charakter erhöht den Tick der Überlebenden — Test mit zwei Toten
- [x] Defense drückt den Schaden nie auf `0`
- [x] Block ist partiell, nicht all-or-nothing; ein geblockter Treffer löst Counter aus,
      ein ausgewichener nicht
- [x] Counter-Rekursion ist strukturell ausgeschlossen (Test: ein Counter erzeugt keinen Counter)
- [x] Ein Test zählt Zahl und Reihenfolge der PRNG-Züge über einen vollständigen Gegner-Zug

## Anmerkung zur Umsetzung

Ob ein Charakter, der durch **diesen** Gegner-Angriff fällt, noch countert, legt die SPEC nicht
ausdrücklich fest. Die Umsetzung lässt ihn nicht countern; der Punkt steht als Klarstellung in
[OPEN_ISSUES §2](../OPEN_ISSUES.md#2-offene-spec-punkte).

## Betroffene Dateien

- `src/features/combat/damagePipeline.ts` + Test
- `src/features/combat/counter.ts` + Test
- `src/features/combat/regeneration.ts` + Test
