# 004 — Ausgehender Schaden (Charakter-Zug)

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Meilenstein**  | M1     |
| **Hängt ab von** | 003    |

## Ziel

Ein Charakter-Zug erzeugt seine Trefferliste — Grundtreffer, Multi-Hit-Kette, Splash — in der
spezifizierten PRNG-Zugreihenfolge, inklusive Zielauswahl und Bulwark-Malus.

## Nicht-Ziel

Der **Counter** gehört zum Gegner-Zug und liegt in
[005](005-eingehender-schaden.md). Suppression und Sunder sind Crucible-gebunden und nicht
Teil von M1 ([Signatur-Skills](../../spec/CHARACTERS.md#7-signatur-skills)).

## Verbindliche Spec-Anker

- [Charakter-Zug](../../spec/DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden) — Modifikator vs.
  Generator, Bezug **jedes** Treffers auf den rohen Grundschaden, Crit-Wurf pro Treffer, die
  verbindliche PRNG-Zugreihenfolge und der **Test-Vektor** im Abschnitt
- [Zielauswahl](../../spec/COMBAT-RUN.md#12-zielauswahl) — Frontline-Lock für Tank/Melee, Taunt,
  Ranged auf die Backline, Priorisierung nach höchster Initiative
- [Bulwark](../../spec/DAMAGE-SYSTEM.md#14-bulwark-deckung-der-backline) — multiplikative Stapelung,
  Anwendung **pro Treffer und Ziel**, plus **Test-Vektor**
- [Treffermodell](../../spec/DAMAGE-SYSTEM.md#12-treffermodell) — Charakter → Gegner trifft immer voll
- [Skilltree](../../spec/CHARACTERS.md#4-charakter-skilltree) — die Crit-Erweiterungen je
  Trefferklasse hängen an Knoten; ohne Knoten crittet nur der Grundtreffer

## Akzeptanzkriterien

- [x] Der Test-Vektor aus [Charakter-Zug](../../spec/DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden)
      läuft als Unit-Test mit gestelltem PRNG durch und trifft `210 / 52.5 / 63` sowie `84`
- [x] Der Test-Vektor aus [Bulwark](../../spec/DAMAGE-SYSTEM.md#14-bulwark-deckung-der-backline)
      läuft als Unit-Test durch, inklusive der Variante mit gefallenem Frontline-Gegner
- [x] Ein Test zählt die **Zahl und Reihenfolge** der PRNG-Züge — ein zusätzlicher oder
      entfallener Wurf schlägt fehl
- [x] Generatoren lösen einander nicht aus: Multi-Hit-Treffer splashen nicht, Splash kettet nicht
- [x] Die Multi-Hit-Kettenlänge steht mit dem **einen** Chance-Wurf fest
- [x] `multiHitChainFactor` wird auf `< 1` geklemmt
- [x] Splash-Nebenziele: gleiche Lane zuerst, dann reguläre Priorisierung

## Betroffene Dateien

- `src/features/combat/outgoingDamage.ts` + Test
- `src/features/combat/targeting.ts` + Test
- `src/features/combat/bulwark.ts` + Test
