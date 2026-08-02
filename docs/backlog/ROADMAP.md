# ROADMAP.md — Reihenfolge der Umsetzung

> **Zweck:** Diese Datei legt fest, **in welcher Reihenfolge** gebaut wird. Sie enthält keine
> Spielregeln — die stehen in der [SPEC](../SPEC.md) — und keine Aufgabenbeschreibungen, die
> stehen in [tasks/](tasks/). Format und Status-Vokabular: [README.md](README.md).

---

## 1. Schnittprinzip: vertikale Slices

Jeder Meilenstein ist ein **vertikaler Slice** — er endet mit etwas Spielbarem, nicht mit
einer fertigen Schicht. **Innerhalb** eines Tasks wird von unten nach oben gebaut: reine,
seedbare Logik mit Unit-Tests, dann Store, dann UI
([AGENTS.md §5](../../AGENTS.md#5-architektur-des-game-loops)).

Der Grund für den vertikalen Schnitt liegt im Spiel selbst: Der Kern ist ein Kampf, den der
Spieler **Runde für Runde mitverfolgt** ([Playback](../spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit)).
Ob dieser Kern trägt, zeigt sich am Bildschirm, nicht in der Testsuite.

---

## 2. Meilensteine

| #      | Meilenstein                                                      | Ergebnis                                                                      |
| ------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **M1** | [Ein Floor, sichtbar gekämpft](#m1--ein-floor-sichtbar-gekämpft) | Ein Kampf läuft live ab, endet mit Sieg oder Wipe, das Ergebnis liegt im Save |
| **M2** | [Fortschritt](#m2--fortschritt)                                  | Dungeon-Kette, XP, Level, Attribute, Skilltree, Crucible                      |
| **M3** | [Ausrüstung](#m3--ausrüstung)                                    | Slots, Innate, Item-Drops, Equip-Ansicht                                      |
| **M4** | [Handwerk](#m4--handwerk)                                        | Blacksmith, Jeweler, Gems, Cinder                                             |
| **M5** | [Runen & Sigils](#m5--runen--sigils)                             | Talisman, Rite, Grimoire, Sigil Codex                                         |
| **M6** | [Endgame & Politur](#m6--endgame--politur)                       | Akt 2/3, Bosse, Balancing-Pass, Deploy                                        |

Nur der **aktive** Meilenstein hat ausformulierte Tasks. Spätere Meilensteine stehen als
Umriss — sie werden erst geschnitten, wenn der vorherige läuft, weil sich der Zuschnitt am
Ist-Stand des Codes orientiert.

---

## M1 — Ein Floor, sichtbar gekämpft

**Fertig, wenn:** Der Spieler startet `A1-D1-01`, sieht die Runden Takt für Takt ablaufen,
der Kampf endet mit Sieg oder Wipe, und der Ausgang überlebt einen Reload.

| Reihenfolge | Task                                                                              | Status | Hängt ab von |
| ----------- | --------------------------------------------------------------------------------- | ------ | ------------ |
| 1           | [001 — Platzhalter-Balancing-Content](tasks/001-platzhalter-balancing-content.md) | done   | —            |
| 2           | [002 — Kampfwert-Herleitung](tasks/002-kampfwert-herleitung.md)                   | done   | 001          |
| 3           | [003 — Kampfzustand & Rundenordnung](tasks/003-kampfzustand-und-rundenordnung.md) | done   | 002          |
| 4           | [004 — Ausgehender Schaden](tasks/004-ausgehender-schaden.md)                     | done   | 003          |
| 5           | [005 — Eingehender Schaden](tasks/005-eingehender-schaden.md)                     | done   | 003          |
| 6           | [006 — Schrittwerk & Kampf-Events](tasks/006-schrittwerk-und-events.md)           | done   | 004, 005     |
| 7           | [007 — Playback & Combat-Store](tasks/007-playback-und-store.md)                  | ready  | 006          |
| 8           | [008 — Kampfbildschirm](tasks/008-kampfbildschirm.md)                             | ready  | 007          |
| 9           | [009 — Floor-Abschluss & Save v1](tasks/009-floor-abschluss-und-save.md)          | ready  | 007          |

**004 und 005** hängen beide nur an 003 und berühren getrennte Dateien — sie sind parallel
bearbeitbar. Alles andere ist eine Kette.

**Nicht in M1:** Signatur-Skills (Crucible-gebunden,
[Signatur-Skills](../spec/CHARACTERS.md#7-signatur-skills)), Auto-Progression, 2×-Geschwindigkeit,
Loot, Rally. Die Pipeline nimmt den Mitigation-Anteil `m` als Parameter entgegen, in M1
konstant `0` ([Mitigation](../spec/COMBAT.md#31-mitigation-korvin-tank)).

---

## M2 — Fortschritt

Umriss, noch nicht geschnitten:

- Weltstruktur Akt 1: 5 Dungeons × 20 Floors, Formations-Vorlagen über den Ramp-Up
  ([Struktur](../spec/PROGRESSION.md#1-struktur-akte-dungeons-floors))
- Floor-Kette mit Attrition, Wipe- und Abbruch-Verhalten, Checkpoints
  ([Checkpoints, Wipe & Abbruch](../spec/PROGRESSION.md#4-checkpoints-wipe--abbruch))
- XP-Pool, Charakterlevel, Attributpunkte
  ([Charakterlevel](../spec/CHARACTERS.md#5-charakterlevel),
  [Attribute](../spec/CHARACTERS.md#3-attribute-level-up-progression))
- Charakter-Skilltree mit vier Zweigen ([Skilltree](../spec/CHARACTERS.md#4-charakter-skilltree))
- Crucible inklusive der drei Signatur-Skills
  ([Crucible](../spec/PROGRESSION.md#3-crucible-globaler-skilltree))
- Auto-Progression, 2×-Freischaltung, Optimierungs-Sperre während eines Runs

## M3 — Ausrüstung

Sechs Slots, Innate-Affixe, Item-Level, Seltenheit, Item-Drops, Equip-Ansicht
([Items, Loot & Handwerk](../spec/ITEMS.md)).

## M4 — Handwerk

Blacksmith (Temper, Refine, Brand), Jeweler (Inlay, Attune, Recut), Gems, Cinder-Ökonomie
([Items, Loot & Handwerk](../spec/ITEMS.md)).

## M5 — Runen & Sigils

Talisman, Rite, Rune Grimoire, Runedust, Etch/Inscribe ([Runen](../spec/RUNES.md)); Sigils und
Sigil Codex ([Items, Loot & Handwerk](../spec/ITEMS.md)).

## M6 — Endgame & Politur

Akt 2 und 3, Akt-Bosse, vollständiger Balancing-Pass gegen
[BALANCING](../BALANCING.md#1-balancing-philosophie), GitHub-Pages-Deploy
([AGENTS.md §12](../../AGENTS.md#12-cicd)).
