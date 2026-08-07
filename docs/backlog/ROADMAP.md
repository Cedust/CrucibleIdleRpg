# ROADMAP.md — Reihenfolge der Umsetzung

> **Zweck:** Diese Datei legt fest, **in welcher Reihenfolge** gebaut wird. Sie enthält keine
> Spielregeln — die stehen in der [SPEC](../spec/README.md) — und keine Aufgabenbeschreibungen, die
> stehen in [tasks/](tasks/). Format und Status-Vokabular: [README.md](README.md).

---

## 1. Schnittprinzip: vertikale Slices

Jeder Meilenstein ist ein **vertikaler Slice** — er endet mit etwas Spielbarem, nicht mit
einer fertigen Schicht. **Innerhalb** eines Tasks wird von unten nach oben gebaut: reine,
seedbare Logik mit Unit-Tests, dann Store, dann UI
([AGENTS.md](../../AGENTS.md)).

Der Grund für den vertikalen Schnitt liegt im Spiel selbst: Der Kern ist ein Kampf, den der
Spieler **Runde für Runde mitverfolgt** ([Playback](../spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit)).
Ob dieser Kern trägt, zeigt sich am Bildschirm, nicht in der Testsuite.

---

## 2. Meilensteine

| #        | Meilenstein                                                      | Ergebnis                                                                         |
| -------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **M1**   | [Ein Floor, sichtbar gekämpft](#m1--ein-floor-sichtbar-gekämpft) | Ein Kampf läuft live ab, endet mit Sieg oder Wipe, das Ergebnis liegt im Save    |
| **M2**   | [Fortschritt](#m2--fortschritt)                                  | Dungeon-Kette, XP, Level, Attribute, Weapon Mastery, Crucible                    |
| **M2.5** | [UI-Fundament](#m25--ui-fundament)                               | „Gilded Ruins“-Design-System, Assets, Combat View und Skill Trees in Spiel-Optik |
| **M3**   | [Ausrüstung](#m3--ausrüstung)                                    | Armor-Slots, Innate, Item-Drops, Equip-Ansicht                                   |
| **M4**   | [Handwerk](#m4--handwerk)                                        | Blacksmith, Jeweler, Gems, Cinder                                                |
| **M5**   | [Runen & Sigils](#m5--runen--sigils)                             | Talisman, Rite, Grimoire, Sigil Codex                                            |
| **M6**   | [Endgame & Politur](#m6--endgame--politur)                       | Akt 2/3, Bosse, Balancing-Pass, Deploy                                           |

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
| 7           | [007 — Playback & Combat-Store](tasks/007-playback-und-store.md)                  | done   | 006          |
| 8           | [008 — Kampfbildschirm](tasks/008-kampfbildschirm.md)                             | done   | 007          |
| 9           | [009 — Floor-Abschluss & Save v1](tasks/009-floor-abschluss-und-save.md)          | done   | 007          |

**004 und 005** hängen beide nur an 003 und berühren getrennte Dateien — sie sind parallel
bearbeitbar. Alles andere ist eine Kette.

**Nicht in M1:** Signatur-Skills (Crucible-gebunden,
[Signatur-Skills](../spec/CHARACTERS.md#7-signatur-skills)), Auto-Progression, 2×-Geschwindigkeit,
Loot, Rally. Die Pipeline nimmt den Mitigation-Anteil `m` als Parameter entgegen, in M1
konstant `0` ([Mitigation](../spec/SIGNATURES.md#11-mitigation-korvin-tank)).

---

## M2 — Fortschritt

**Fertig, wenn:** Akt 1 ist als Dungeon-Kette spielbar; der Spieler gewinnt XP und Punkte,
entwickelt Charaktere und Crucible weiter und kann freigeschaltete Dungeons automatisiert farmen.

| Reihenfolge | Task                                                                                      | Status | Hängt ab von |
| ----------- | ----------------------------------------------------------------------------------------- | ------ | ------------ |
| 1           | [010 — Akt-1-Content & Dungeon-Auswahl](tasks/010-akt-1-content-und-dungeon-auswahl.md)   | done   | 009          |
| 2           | [011a — Dungeon-Auswahl & Run-Isolation](tasks/011a-dungeon-auswahl-und-run-isolation.md) | done   | 010          |
| 3           | [011 — Dungeon-Run & Attrition](tasks/011-dungeon-run-und-attrition.md)                   | done   | 010, 011a    |
| 4           | [012 — Auto-Progression & Run-Sperre](tasks/012-auto-progression-und-run-sperre.md)       | done   | 011          |
| 5           | [013 — XP, Level & Attributpunkte](tasks/013-xp-level-und-attributpunkte.md)              | done   | 011          |
| 6           | [014a — Weapon Foundation](tasks/014a-weapon-foundation.md)                               | done   | 013          |
| 7           | [014b — Weapon Mastery](tasks/014b-weapon-mastery.md)                                     | done   | 014a         |
| 8           | [014c — Mastery Combat Arts](tasks/014c-mastery-combat-arts.md)                           | done   | 014b         |
| 9           | [015 — Crucible & Signatur-Skills](tasks/015-crucible-und-signatur-skills.md)             | done   | 012, 014c    |
| 10          | [016 — Molten Cast Vertiefungen](tasks/016-molten-cast-vertiefungen.md)                   | done   | 015          |

## M2.5 — UI-Fundament

**Fertig, wenn:** Alle bestehenden Screens tragen das „Gilded Ruins“-Design-System
([DESIGN §5](../DESIGN.md#5-visuelle-umsetzung)): Combat View und Skill Trees nutzen Assets,
Hintergründe und Ornamentrahmen, und die M3+-Screens bauen auf denselben Tokens und Primitives
auf. Der vollständige Politur-Pass über alle Screens bleibt in [M6](#m6--endgame--politur).

| Reihenfolge | Task                                                                              | Status  | Hängt ab von |
| ----------- | --------------------------------------------------------------------------------- | ------- | ------------ |
| 1           | [017 — Art-Direction & Theme-Tokens](tasks/017-art-direction-und-theme-tokens.md) | ready   | 016          |
| 2           | [018 — UI-Primitives & App-Rahmen](tasks/018-ui-primitives-und-app-rahmen.md)     | blocked | 017          |
| 3           | [019 — Combat View in Spiel-Optik](tasks/019-combat-view-in-spiel-optik.md)       | blocked | 018          |
| 4           | [020 — Skill-Trees in Spiel-Optik](tasks/020-skill-trees-in-spiel-optik.md)       | blocked | 018          |

**019 und 020** hängen beide nur an 018 und berühren getrennte Screens — sie sind parallel
bearbeitbar. Der Meilenstein ist reine View-Arbeit: Simulation, Stores und Save-Schema bleiben
unverändert.

## M3 — Ausrüstung

Vier Armor-Slots, Innate-Affixe, Item-Level, Seltenheit, Item-Drops, Equip-Ansicht
([Items, Loot & Handwerk](../spec/ITEMS.md)).

## M4 — Handwerk

Blacksmith (Temper, Refine, Brand), Jeweler (Inlay, Attune, Recut), Gems, Cinder-Ökonomie
([Items, Loot & Handwerk](../spec/ITEMS.md)).

## M5 — Runen & Sigils

Talisman, Rite, Rune Grimoire, Runedust, Etch/Inscribe ([Runen](../spec/RUNES.md)); Sigils und
Sigil Codex ([Items, Loot & Handwerk](../spec/ITEMS.md)).

## M6 — Endgame & Politur

Akt 2 und 3, Akt-Bosse, vollständiger Balancing-Pass gegen
[BALANCING](../BALANCING.md#1-zielbild), GitHub-Pages-Deploy
([AGENTS.md](../../AGENTS.md)).
