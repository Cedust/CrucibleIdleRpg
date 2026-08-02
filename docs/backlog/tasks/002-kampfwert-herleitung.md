# 002 — Kampfwert-Herleitung

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Meilenstein**  | M1      |
| **Hängt ab von** | 001     |

## Ziel

Eine reine Funktion setzt aus Charakter-Definition, Level und Content die effektiven
Kampfwerte eines Charakters zusammen — die Eingabe jeder Kampfformel.

## Nicht-Ziel

Attribute, Skilltree-Knoten, Crucible-Boni und Item-Innate. Deren Beiträge sind in der Formel
**als Faktoren vorgesehen**, in M1 aber neutral (`0` Punkte, Multiplikator `1`); die Vergabe
folgt in M2/M3.

## Verbindliche Spec-Anker

- [Stats](../../spec/CHARACTERS.md#2-stats) — Derived Stat =
  `(Baseline + Core-Stat) × (1 + Attribut) × (1 + Crucible)`; die fünf Stat-Kategorien
- [Charakterlevel](../../spec/CHARACTERS.md#5-charakterlevel) — Baseline wächst je Level
- [Team](../../spec/CHARACTERS.md#1-team) — keine charakterexklusiven Stats
- [Feststehende Regeln](../../spec/COMBAT.md#25-feststehende-regeln) — Achsen-Trennung: kein
  Effekt konvertiert zwischen Offense und Defense

## Akzeptanzkriterien

- [ ] Reine Funktion ohne Store-, Timer- oder DOM-Zugriff
- [ ] Die multiplikative Schichtung ist als solche testbar: Core-Zuwachs und Attribut-Prozent
      wirken auf verschiedenen Ebenen und sind im Test unterscheidbar
- [ ] Der Level-1-Fall reproduziert die Startwerte aus `src/game/characters/characters.ts`
- [ ] Unit-Tests decken alle fünf Stat-Kategorien ab
- [ ] Kein Balancing-Wert steht in der Funktion

## Betroffene Dateien

- `src/features/combat/characterStats.ts` + Test
- `src/game/types.ts`
