# OPEN_ISSUES.md — offene Fragen

> Nicht verbindlich. Ein Punkt wird erst implementierbar, wenn er nach `spec/`, `src/game/`,
> DESIGN oder BALANCING entschieden wurde. Er verlässt diese Liste dann vollständig.

## 1. Offene Balancing-Fragen / Tuning-Notizen

### Charaktere und Gegner

- [ ] Derived-Stat-Kurven für Baseline und Core-Stats. → [Stats](../spec/CHARACTERS.md#2-stats)
- [ ] Gegnerkurven für Health, Attack und Accuracy je Akt/Dungeon/Floor. → [BALANCE](../spec/BALANCE.md#1-wachstum-und-zahlenraum)
- [ ] Gegner-Basiswerte und Initiative-Ranges je Typ. → [Formation](../spec/COMBAT-RUN.md#13-gegnerformation)
- [ ] Formationsbesetzung je Floor und Ramp-up je Akt; jeder Pflicht-Encounter hat mindestens **zwei** Gegneraktionen pro Runde. → [BALANCE](../spec/BALANCE.md#2-spielbare-korridore)
- [ ] Regeneration-Kurve. → [Heilung](../spec/DAMAGE-SYSTEM.md#16-heilung--grenzen-und-auslösung)

### Kampf

- [ ] Bulwark-Beiträge und Mitigation `m` je Node-Stufe. → [Bulwark](../spec/DAMAGE-SYSTEM.md#14-bulwark-deckung-der-backline), [Mitigation](../spec/SIGNATURES.md#11-mitigation-korvin-tank)
- [ ] Sunder-Abbau und -Cap je Node-Stufe. → [Sunder](../spec/SIGNATURES.md#12-sunder-rhaya-melee)
- [ ] Defense-Konstante `K`, Block-Reduktion und Waffen-Damage-Range je Seltenheit. → [Eingehender Schaden](../spec/DAMAGE-SYSTEM.md#13-eingehender-schaden-schadenspipeline), [Ausgehender Schaden](../spec/DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden)
- [ ] Rally-Anteil je Node-Stufe. → [Checkpoints](../spec/PROGRESSION.md#4-checkpoints-wipe--abbruch)
- [ ] Multi-Hit-Werte und Bewertung des Valor-Zweigs. → [Ausgehender Schaden](../spec/DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden), [Skilltree](../spec/CHARACTERS.md#4-charakter-skilltree)
- [ ] Grundtakt und 2×-Geschwindigkeit. → [Playback](../spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit)

### Ökonomie und Endgame

- [ ] Gold-Drops und Respec-Kosten. → [Belohnungen](../spec/PROGRESSION.md#2-belohnungen-aus-einem-sieg)
- [ ] Item-Level-Kurve, Seltenheits-Caps und Sockel-Meilensteine. → [Items](../spec/ITEMS.md#3-seltenheit-sockel--level-cap)
- [ ] Cinder-, Blacksmith- und Jeweler-Kosten. → [Handwerk](../spec/ITEMS.md#7-blacksmith--temper-refine--brand)
- [ ] Gem-Werte, Targeting, Drops und Aufleveln-Kosten. → [Jeweler](../spec/ITEMS.md#8-jeweler--inlay-attune--recut)
- [ ] Sigil-Pool, Mindesttiefen, Gewichte, Drops und Skalierung. → [Sigils](../spec/ITEMS.md#5-sigils--sigil-codex)
- [ ] Diamond-Effekte sowie Runedust-, Rune-Katalog-, Rune-Stärke- und Trigger-Kurven. → [Runen](../spec/RUNES.md)

## 2. Offene Spec-Punkte

- [ ] Prismatic-/Diamond-Mechanik im Detail. → [Jeweler](../spec/ITEMS.md#8-jeweler--inlay-attune--recut)
- [ ] Sigil-Katalog, Implicit-Klassen und Boss-Signatur-Sigils. → [Sigils](../spec/ITEMS.md#5-sigils--sigil-codex)
- [ ] Mehrfachzug für Boss-Gegner statt zusätzlicher Gegner. → [Rundenablauf](../spec/COMBAT-RUN.md#11-rundenablauf)
- [ ] Tiebreak bei gleicher gegnerischer Initiative für die Zielpriorisierung. → [Zielauswahl](../spec/COMBAT-RUN.md#12-zielauswahl)
- [ ] Counter eines Charakters, der durch denselben Gegner-Angriff fällt. → [Ausgehender Schaden](../spec/DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden)
