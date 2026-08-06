# 014a — Weapon Foundation

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Meilenstein**  | M2      |
| **Hängt ab von** | 013     |

## Ziel

Jeder Charakter kämpft mit seinem festen Waffenprofil, leitet seine Derived Stats ohne
automatische Level-Baseline her und löst reguläre Angriffe sowie Counter deterministisch als
Clean Hit oder Glancing Blow auf.

## Nicht-Ziel

Mastery-Nodes, Investitionen, Respec und die Weapon-Mastery-Ansicht folgen in
[014b](014b-weapon-mastery.md); Expert-, Master- und Capstone-Verhalten in
[014c](014c-mastery-combat-arts.md).

## Verbindliche Spec-Anker

- [Waffenprofile und Derived Stats](../../spec/WEAPON-MASTERY.md#2-waffenprofile-und-derived-stats)
  — feste Signaturwaffen, Startwerte und neue Formeln.
- [Precision](../../spec/WEAPON-MASTERY.md#21-precision-clean-hit-und-glancing-blow) — Clean Hit,
  Glancing Blow, Caps und gemeinsame Trefferbasis.
- [Charakter-Zug](../../spec/DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden) — verbindliche
  Auflösung und PRNG-Reihenfolge für Angriff und Counter.
- [Charakterlevel](../../spec/CHARACTERS.md#5-charakterlevel) — Level vergibt Attribute und
  Mastery Points, aber keine automatischen Derived Stats.
- [Armor-Slots](../../spec/ITEMS.md#1-slots-basen--innate-affixe) — Main/Off entfallen aus dem
  Datenmodell.
- [Persistenz](../../spec/PERSISTENCE.md#22-aktuelles-pre-release-schema) — direkte
  Pre-Release-Schema-Umstellung ohne Migration.

## Akzeptanzkriterien

- [ ] Korvin, Rhaya und Quinn verwenden ihre spezifizierten Weapon Base Damage-, Range- und
      Precision-Startwerte.
- [ ] Attack, Defense und Health folgen den neuen Formeln; ein Level-Up verändert keinen der
      drei Werte automatisch und vergibt je einen Attribute und Mastery Point.
- [ ] Ein regulärer Angriff und ein ausgelöster Counter würfeln Precision vor Range; Glancing
      verwendet MIN RNG, unterbindet alle Crits und lässt Multi/Splash normal auslösen.
- [ ] Der Range-Wurf findet auch bei Glancing statt; gleiche Seeds und Inputs liefern dieselbe
      Ziehreihenfolge und dasselbe Ergebnis.
- [ ] Main/Off existieren in aktuellen Typen, Content und Save-Schema nicht mehr; es wird keine
      neue Save-Migration angelegt.
- [ ] Deterministische Unit-Tests decken Formeln, Caps, Clean/Glancing, Generatoren und Counter ab.

## Betroffene Dateien

- `src/game/characters/`, `src/game/types.ts`, `src/game/curves/`
- `src/features/combat/`, `src/features/save/`

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
