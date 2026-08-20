# OPEN_ISSUES.md — offene Fragen

> Nicht verbindlich. Ein Punkt wird erst implementierbar, wenn er nach `spec/`, `src/game/`,
> DESIGN oder BALANCING entschieden wurde. Er verlässt diese Liste dann vollständig.

## 1. Offene Balancing-Fragen / Tuning-Notizen

### Charaktere und Gegner

- [ ] Core-Stat- und Attribut-Kurven für die Derived Stats. → [Stats](../spec/CHARACTERS.md#2-stats)
- [ ] Gegnerkurven für Health, Attack und Accuracy je Akt/Dungeon/Floor. → [BALANCE](../spec/BALANCE.md#1-wachstum-und-zahlenraum)
- [ ] Gegner-Basiswerte und Initiative-Ranges je Typ. → [Formation](../spec/COMBAT-RUN.md#13-gegnerformation)
- [ ] Formationsbesetzung je Floor und Ramp-up je Akt; jeder Pflicht-Encounter hat mindestens **zwei** Gegneraktionen pro Runde. → [BALANCE](../spec/BALANCE.md#2-spielbare-korridore)
- [ ] Regeneration-Kurve. → [Heilung](../spec/DAMAGE-SYSTEM.md#16-heilung--grenzen-und-auslösung)

### Kampf

- [ ] Bulwark-Beiträge `bᵢ` je Gegnertyp. → [Bulwark](../spec/DAMAGE-SYSTEM.md#14-bulwark-deckung-der-backline)
- [ ] Defense-Konstante `K` und Block-Reduktion. → [Eingehender Schaden](../spec/DAMAGE-SYSTEM.md#13-eingehender-schaden-schadenspipeline)
- [ ] Grundtakt und 2×-Geschwindigkeit. → [Playback](../spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit)

### Ökonomie und Endgame

- [ ] **Weapon Mastery:** Discipline-Respec-Grundpreis und Punktpreis festlegen. Aktuell nutzt
      `src/game/weaponMastery/mastery.ts` die expliziten Platzhalter `100 Gold + 25 Gold ×
erstattete Mastery Points`; die Formel selbst ist verbindlich. → [Weapon Mastery](../spec/WEAPON-MASTERY.md#31-discipline-respec)
- [ ] Gold-Drops je Floor sowie die Kosten des Attribut-Respecs. Aktuell nutzt
      `src/game/rewards/xpRewards.ts` den expliziten Platzhalter
      `25 Gold × erstattete Attributpunkte`; die Bemessung je erstatteten Punkt ist
      verbindlich und hat mit der Heroes-Stats-Ansicht einen Konsumenten. →
      [Belohnungen](../spec/PROGRESSION.md#2-belohnungen-aus-einem-sieg),
      [Attribute](../spec/CHARACTERS.md#3-attribute-level-up-progression)
- [ ] Item-Level-Kurve, Seltenheits-Caps und Sockel-Meilensteine. → [Items](../spec/ITEMS.md#3-seltenheit-sockel--level-cap)
- [ ] Cinder-, Blacksmith- und Jeweler-Kosten. → [Handwerk](../spec/ITEMS.md#7-blacksmith--temper-masterwork--brand)
- [ ] Gem-Werte, Targeting, Drops und Aufleveln-Kosten. → [Jeweler](../spec/ITEMS.md#8-jeweler--inlay-attune--recut)
- [ ] Sigil-Drop-Chance je Wiederholungs-Kill, Auswahl-Gewichte des Akt-3-Bosses und
      Imprint-Stärke je Sigil-Level. → [Sigils](../spec/ITEMS.md#5-sigils--sigil-codex)
- [ ] Diamond-Effekte sowie Runedust-, Rune-Katalog-, Rune-Stärke- und Trigger-Kurven. → [Runen](../spec/RUNES.md)

## 2. Offene Spec-Punkte

- [ ] Prismatic-/Diamond-Mechanik im Detail. → [Jeweler](../spec/ITEMS.md#8-jeweler--inlay-attune--recut)
- [ ] Name des Akt-3-Bosses; die Rolle ist eine **Empress** und die vier Boss-Sigils tragen sie
      im Namen. → [Struktur](../spec/PROGRESSION.md#1-struktur-akte-dungeons-floors)
- [ ] Mehrfachzug für Boss-Gegner statt zusätzlicher Gegner. → [Rundenablauf](../spec/COMBAT-RUN.md#11-rundenablauf)
- [ ] Tiebreak bei gleicher gegnerischer Initiative für die Zielpriorisierung. → [Zielauswahl](../spec/COMBAT-RUN.md#12-zielauswahl)
- [ ] Counter eines Charakters, der durch denselben Gegner-Angriff fällt. → [Ausgehender Schaden](../spec/DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden)
