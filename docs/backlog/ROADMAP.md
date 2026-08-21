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
| **M5**   | [Runen](#m5--runen)                                              | Talisman, Rite, Grimoire                                                         |
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

| Reihenfolge | Task                                                                                        | Status | Hängt ab von |
| ----------- | ------------------------------------------------------------------------------------------- | ------ | ------------ |
| 1           | [017 — Art-Direction & Theme-Tokens](tasks/017-art-direction-und-theme-tokens.md)           | done   | 016          |
| 2           | [018 — UI-Primitives & App-Rahmen](tasks/018-ui-primitives-und-app-rahmen.md)               | done   | 017          |
| 3           | [019 — Combat View in Spiel-Optik](tasks/019-combat-view-in-spiel-optik.md)                 | done   | 018          |
| 4           | [020 — Skill-Trees in Spiel-Optik](tasks/020-skill-trees-in-spiel-optik.md)                 | done   | 018          |
| 5           | [021 — Combat-Feedback und Schadenszahlen](tasks/021-combat-feedback-und-schadenszahlen.md) | ready  | 019          |

**020** bleibt unabhängig von 019 und kann parallel zu 021 umgesetzt werden. Simulation, Stores
und Save-Schema bleiben unverändert; die freigegebene Crucible-Konsolidierung ist Teil von 020.

### UI-Foundation-Refactor (zwischen M2.5 und M3)

Abgeschlossen auf `feat/ui-fundament`: Viewport-Shell ohne Seiten-Scroll, hybrid-fluides
Layout über Per-Token-Clamps, zweiachsiges visuelles State-System und die konsolidierten
Shared Primitives. Task 021 (Combat-Feedback) baut auf den daraus entstandenen Combat-UI-Dateien
auf.

## M3 — Ausrüstung

**Fertig, wenn:** Alle Charaktere können über Armory-Ränge ihre vier dauerhaften Armor-Slots
freischalten, deren Innate-Werte in den Kampf einfließen. Heroes bündelt effektive Stats und das
Loadout aus Signaturwaffe und Armor; Gem- und Cinder-Drops speisen den späteren Handwerk-Loop.

| Reihenfolge | Task                                                                      | Status | Hängt ab von |
| ----------- | ------------------------------------------------------------------------- | ------ | ------------ |
| 1           | [022 — Armory & Armor-Fundament](tasks/022-armory-und-armor-fundament.md) | done   | 016          |
| 2           | [023 — Heroes-Hub & Stats](tasks/023-heroes-hub-und-stats.md)             | done   | 022          |
| 3           | [024 — Loadout-Ansicht](tasks/024-loadout-ansicht.md)                     | done   | 022, 023     |
| 4           | [025 — Gem- & Cinder-Drops](tasks/025-gem-und-cinder-drops.md)            | done   | 022, 024     |

**022 → 023 → 024 → 025** ist eine absichtliche Kette: Das persistierte Armor-Fundament steht vor
der Heroes-Struktur, diese vor der Loadout-Darstellung und diese vor den erst in M4 nutzbaren
Materialien.

## M4 — Handwerk

**Fertig, wenn:** Der Spieler entwickelt die permanente Armor über die Stationen weiter: Temper
und Masterwork heben Item-Level und Seltenheit gegen Gold und Cinder, Inlay, Attune und Recut
bewirtschaften Gem-Affixe, Sigils füllen den Sigil Codex, und Brand prägt Imprints auf Items ab
Magic — alle Effekte wirken sichtbar im Kampf ([Items, Loot & Handwerk](../spec/ITEMS.md)).

| Reihenfolge | Task                                                                                              | Status | Hängt ab von |
| ----------- | ------------------------------------------------------------------------------------------------- | ------ | ------------ |
| 1           | [026 — Item-Schichten & Handwerks-Fundament](tasks/026-item-schichten-und-handwerks-fundament.md) | done   | 025          |
| 2           | [027 — Blacksmith: Temper & Masterwork](tasks/027-blacksmith-temper-und-masterwork.md)            | done   | 026          |
| 3           | [028 — Jeweler: Inlay & Gem-Affixe](tasks/028-jeweler-inlay-und-gem-affixe.md)                    | done   | 026, 027     |
| 4           | [029 — Jeweler: Attune & Recut](tasks/029-jeweler-attune-und-recut.md)                            | done   | 028          |
| 5           | [032 — Imprint-Begriff & Brand-Schwelle](tasks/032-imprint-und-brand-schwelle.md)                 | done   | 026          |
| 6           | [030 — Sigil-Drops & Sigil Codex](tasks/030-sigil-drops-und-sigil-codex.md)                       | done   | 026, 032     |
| 7           | [031 — Blacksmith: Brand & Re-Brand](tasks/031-blacksmith-brand.md)                               | done   | 027, 030     |

**032** benennt Schicht 5 in `Imprint` um und öffnet Brand für Items ab Magic; es steht vor
**030**, damit der Sigil-Content nicht gegen die alte Benennung schreibt. **030** ist von den
Jeweler-Tasks unabhängig; beide Stränge ändern das Save-Schema, der später gemergte Task rebased.
Der Sigil-Katalog ist entschieden und liegt in [ITEMS §5.1](../spec/ITEMS.md#51-katalog).
Prismatic-/Diamond-Effekte bleiben außerhalb von M4 (offener Spec-Punkt, Drops ab Akt 2 →
[M6](#m6--endgame--politur)).

## M5 — Runen

**Fertig, wenn:** Der Spieler schaltet das Rune Grimoire über Anvil Sparks frei, erhält und
investiert Runewords, entdeckt und levelt Runen in Runescribe und legt einzigartige Rites auf die
Talismane des Teams. Trigger, Effects und Modifier wirken als lesbare, deterministische
Kampfereignisse ([Runen](../spec/RUNES.md)).

| Reihenfolge | Task                                                                            | Status  | Hängt ab von |
| ----------- | ------------------------------------------------------------------------------- | ------- | ------------ |
| 1           | [033 — Rune-Grimoire-Fundament](tasks/033-rune-grimoire-fundament.md)           | done    | 031          |
| 2           | [034 — Runewords-Drops & Reward-Commit](tasks/034-runewords-drops.md)           | done    | 033          |
| 3           | [035 — Runescribe: Inscribe & Etch](tasks/035-runescribe-inscribe-etch.md)      | done    | 033, 034     |
| 4           | [036 — Talisman & Rite-Konfiguration](tasks/036-talisman-rite-konfiguration.md) | done    | 033, 035     |
| 5           | [037 — Rite-Auslösung & Basis-Effects](tasks/037-rite-ausloesung-effects.md)    | blocked | 036          |
| 6           | [038 — Rite-Modifier & M5-Abschluss](tasks/038-rite-modifier-m5-abschluss.md)   | blocked | 037          |

**033 → 034 → 035 → 036** etabliert zuerst das vollständige, streng validierte M5-Modell und
seinen Spieler-Loop. **037** und **038** sind zusätzlich durch die offene fachliche Entscheidung
zu Zeitpunkt und Zielreihenfolge der Rite-Effects blockiert; Runen-Katalog, Drop-Kurven, Kosten
und Stärken bleiben bis zum Balancing-Pass ausdrücklich deklarativer Content. Der Talisman
verlässt mit 036 die Heroes-Loadout-Ansicht und wird ausschließlich in Runescribe konfiguriert,
wie es die SPEC verlangt.

## M6 — Endgame & Politur

Akt 2 und 3, Akt-Bosse, vollständiger Balancing-Pass gegen
[BALANCING](../BALANCING.md#1-zielbild), GitHub-Pages-Deploy
([AGENTS.md](../../AGENTS.md)).
