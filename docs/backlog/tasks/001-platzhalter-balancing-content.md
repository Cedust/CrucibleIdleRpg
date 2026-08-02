# 001 — Platzhalter-Balancing-Content

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Meilenstein**  | M1      |
| **Hängt ab von** | —       |

## Ziel

Alle Zahlen, die die Kampf-Engine zum Laufen braucht, liegen als typisierter Content unter
`src/game/` — als **Platzhalter erkennbar**, damit der spätere Balancing-Pass eine reine
`src/game/`-Änderung bleibt.

## Nicht-Ziel

**Balancing.** Kein Wert aus diesem Task ist eine Festlegung, und keiner wandert nach
[BALANCING.md](../../BALANCING.md) oder in die [SPEC](../../SPEC.md). Die zugehörigen
Entscheidungen bleiben offen in
[OPEN_ISSUES §1](../OPEN_ISSUES.md#1-offene-balancing-fragen--tuning-notizen).

## Verbindliche Spec-Anker

- [SPEC § Welche Zahlen in der Spec stehen](../../SPEC.md#welche-zahlen-in-der-spec-stehen) —
  Tuning-Werte gehören nach `src/game/`, nicht in die Spec
- [AGENTS.md §4](../../../AGENTS.md#4-content--balancing) — deklarative, typisierte TS-Module;
  Wachstumskurven als vorberechnete Werte je Stufe, kein `Math.pow` zur Laufzeit
- [Bulwark](../../spec/COMBAT.md#24-bulwark-deckung-der-backline) — `bᵢ` je Frontline-Rolle
- [Schadenspipeline](../../spec/COMBAT.md#23-eingehender-schaden-schadenspipeline) —
  Defense-Konstante `K`
- [Charakter-Zug](../../spec/COMBAT.md#21-charakter-zug-ausgehender-schaden) — Damage-Range,
  Multi-Hit-Werte
- [Gegnerformation](../../spec/COMBAT.md#13-gegnerformation) — Gegner haben genau vier Stats

## Umfang

Benötigt werden mindestens: Defense-Konstante `K`, Waffen-Damage-Range der Main Hand,
Bulwark-Beitrag `bᵢ` je Frontline-Rolle, Gegner-Stats für die Floors des ersten Dungeons
(Health, Attack, Accuracy, Initiative-Range) und die Formations-Vorlagen des Ramp-Ups
([Struktur](../../spec/PROGRESSION.md#1-struktur-akte-dungeons-floors)).

## Akzeptanzkriterien

- [ ] Jeder Platzhalter-Wert ist im Content als provisorisch kommentiert und verweist auf
      seinen Eintrag in [OPEN_ISSUES.md](../OPEN_ISSUES.md)
- [ ] Kurven liegen als vorberechnete Werte je Stufe vor, nicht als Laufzeit-Formel
- [ ] Keine Logik-Datei enthält eine Balancing-Zahl — die Engine liest sie ausschließlich
      aus `src/game/`
- [ ] Die Werte tragen einen Kampf auf `A1-D1-01`, der weder in einer Runde noch in
      dreistelliger Rundenzahl endet (grobe Plausibilität, kein Tuning)

## Betroffene Dateien

- `src/game/curves/` — neu
- `src/game/enemies/enemies.ts`, `src/game/encounters/formations.ts`
- `src/game/types.ts` — Erweiterung um die Content-Formen der neuen Werte
