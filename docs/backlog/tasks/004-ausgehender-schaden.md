# 004 — Ausgehender Schaden (Charakter-Zug)

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Meilenstein**  | M1      |
| **Hängt ab von** | 003     |

## Ziel

Ein Charakter-Zug erzeugt seine Trefferliste — Grundtreffer, Multi-Hit-Kette, Splash — in der
spezifizierten PRNG-Zugreihenfolge, inklusive Zielauswahl und Bulwark-Malus.

## Nicht-Ziel

Der **Counter** gehört zum Gegner-Zug und liegt in
[005](005-eingehender-schaden.md). Suppression und Sunder sind Crucible-gebunden und nicht
Teil von M1 ([Signatur-Skills](../../spec/CHARACTERS.md#7-signatur-skills)).

## Verbindliche Spec-Anker

- [Charakter-Zug](../../spec/COMBAT.md#21-charakter-zug-ausgehender-schaden) — Modifikator vs.
  Generator, Bezug **jedes** Treffers auf den rohen Grundschaden, Crit-Wurf pro Treffer, die
  verbindliche PRNG-Zugreihenfolge und der **Test-Vektor** im Abschnitt
- [Zielauswahl](../../spec/COMBAT.md#12-zielauswahl) — Frontline-Lock für Tank/Melee, Taunt,
  Ranged auf die Backline, Priorisierung nach höchster Initiative
- [Bulwark](../../spec/COMBAT.md#24-bulwark-deckung-der-backline) — multiplikative Stapelung,
  Anwendung **pro Treffer und Ziel**, plus **Test-Vektor**
- [Treffermodell](../../spec/COMBAT.md#22-treffermodell) — Charakter → Gegner trifft immer voll
- [Skilltree](../../spec/CHARACTERS.md#4-charakter-skilltree) — die Crit-Erweiterungen je
  Trefferklasse hängen an Knoten; ohne Knoten crittet nur der Grundtreffer

## Akzeptanzkriterien

- [ ] Der Test-Vektor aus [Charakter-Zug](../../spec/COMBAT.md#21-charakter-zug-ausgehender-schaden)
      läuft als Unit-Test mit gestelltem PRNG durch und trifft `210 / 52.5 / 63` sowie `84`
- [ ] Der Test-Vektor aus [Bulwark](../../spec/COMBAT.md#24-bulwark-deckung-der-backline)
      läuft als Unit-Test durch, inklusive der Variante mit gefallenem Frontline-Gegner
- [ ] Ein Test zählt die **Zahl und Reihenfolge** der PRNG-Züge — ein zusätzlicher oder
      entfallener Wurf schlägt fehl
- [ ] Generatoren lösen einander nicht aus: Multi-Hit-Treffer splashen nicht, Splash kettet nicht
- [ ] Die Multi-Hit-Kettenlänge steht mit dem **einen** Chance-Wurf fest
- [ ] `multiHitChainFactor` wird auf `< 1` geklemmt
- [ ] Splash-Nebenziele: gleiche Lane zuerst, dann reguläre Priorisierung

## Betroffene Dateien

- `src/features/combat/outgoingDamage.ts` + Test
- `src/features/combat/targeting.ts` + Test
- `src/features/combat/bulwark.ts` + Test
