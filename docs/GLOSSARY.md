# GLOSSARY.md — Crucible Idle RPG

> **Zweck:** verbindliche Begriffe für Code, UI und Doku — **ein Wort pro Konzept**.
>
> **Namens-Register, keine Regel-Quelle.** Ein Eintrag nennt den Begriff, grenzt ihn gegen
> verwechselbare Nachbarn ab. Zahlen, Formeln und Regeln stehen
> ausschließlich in der Spec.

---

## Konvention

- **Code-Identifier** (Typen, Funktionen, Variablen) folgen dem **englischen** Begriff
  (z. B. `EnemyDefinition`, `combatEngine`), passend zu `src/game/` und `src/features/`.
- **Interne Prosa** (diese Docs, Kommentare) nutzt den **deutschen** Begriff.
- Wenn ein Konzept nur einen sinnvollen Namen hat, steht er einmal.
- Spalte **EN** = Spieltext- und Code-Bezeichnung; leer, wenn identisch oder nicht relevant.

---

## Kern & Architektur

| Begriff                  | EN / Code      | Abgrenzung                                                                                                      |
| ------------------------ | -------------- | --------------------------------------------------------------------------------------------------------------- |
| **Kampf**                | _Combat_       | Rundenbasierte Auto-Battle-Auseinandersetzung. Feature: `src/features/combat/`                                  |
| **Kampf-Engine**         | `combatEngine` | Die reine, seedbare Simulationslogik. Gegenstück: **Playback**                                                  |
| **Playback / Abspielen** | _playback_     | Die Anzeige-Schicht, die simulierte Runden abspielt. Gegenstück: **Kampf-Engine**                               |
| **Runde**                | _Round_        | **Simulations**-Einheit. **Nicht** Render-Tick oder Frame; Anzeigeeinheit ist der **Takt**                      |
| **Takt**                 | _Beat_         | **Anzeige**-Einheit des Playbacks: ein Akteur am Zug. Abzugrenzen von der **Runde**                             |
| **Akteur**               | _Actor_        | Ein am Kampf beteiligter Charakter **oder** Gegner                                                              |
| **Pending-Queue**        | _turn queue_   | Die noch **offenen** Aktionen einer Runde; Teil des Kampfzustands                                               |
| **PRNG**                 | —              | Einzige erlaubte Zufallsquelle der Spiellogik, dependency-frei in `src/shared/utils/`. **Kein** `Math.random()` |
| **Seed / Strom**         | —              | _Seed_ = Startwert des PRNG; _Strom_ = eine der getrennten Ziehreihen (`combat`, `init`, `loot`)                |
| **runCounter**           | `runCounter`   | Persistierter Zähler, der in den `runSeed` eingeht                                                              |
| **Catch-up / Aufholen**  | —              | Nachrechnen fehlender Takte ohne Animation. Abzugrenzen von **Offline-Progress**                                |
| **Offline-Progress**     | —              | Fortschritt bei **geschlossenem** Tab — **bewusstes Nicht-Ziel**, existiert nicht                               |
| **Save / Speicherstand** | —              | Persistierter Zustand in `localStorage`                                                                         |
| **SavePort**             | `SavePort`     | Persistenz-Adapter in `src/shared/ports/`; Implementierung austauschbar                                         |
| **Zahlentyp**            | —              | Alle Werte über native `number`; keine Big-Number-Bibliothek                                                    |

---

## Team & Charakter

| Begriff              | EN / Code             | Abgrenzung                                                                                                                  |
| -------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Team**             | —                     | Die vom Spieler kontrollierte Gruppe. Feature: `src/features/team/`                                                         |
| **Charakter**        | `CharacterDefinition` | Ein Mitglied des Teams. Content unter `src/game/characters/`                                                                |
| **Gegner**           | `EnemyDefinition`     | Gegnerische Einheit. Content unter `src/game/enemies/`                                                                      |
| **Archetyp / Rolle** | _Role_                | **Tank**, **Melee** oder **Ranged**; gilt für Charaktere **und** Gegner                                                     |
| **DD**               | _Damage Dealer_       | Charakter mit Schadensfokus (Melee & Ranged). Abzugrenzen vom **Tank**                                                      |
| **Signatur-Skill**   | _Signature Skill_     | Charaktergebundener Crucible-Unlock — die Kapselungsform für globale Archetyp-Hebel. Abzugrenzen von einer **Mastery-Node** |
| **Mitigation**       | _Mitigation_          | Korvins Signatur-Skill (Schadensverteilung)                                                                                 |
| **Sunder**           | _Sunder_              | Rhayas Signatur-Skill (**Bulwark**-Abbau)                                                                                   |
| **Suppression**      | _Suppression_         | Quinns Signatur-Skill (Verschiebung in der **Pending-Queue**)                                                               |

---

## Stats & Progression

| Begriff                           | EN / Code                           | Abgrenzung                                                                                                                      |
| --------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Stat**                          | _Stat_                              | Granularer Kampfwert; Kategorien Core, Derived, Offensive, Defensive, Utility. **Nicht** synonym zu **Attribut**                |
| **Wachstumsachse**                | —                                   | Eine der zwei geometrischen Kurvenfamilien (**Offense-** / **Defense-Rennen**), von denen alle Zahlenkurven ihre Steigung erben |
| **Core-Stat**                     | _Core Stat_                         | **Might**, **Toughness**, **Vitality**. Abzugrenzen von **Attribut** und **Derived Stat**                                       |
| **Derived Stat**                  | _Derived Stat_                      | **Attack**, **Defense**, **Health** — nicht direkt vergeben, sondern zusammengesetzt                                            |
| **Attribut**                      | _Attribute_                         | Die Level-Up-Achsen **Ferocity**, **Resilience**, **Vigor**. **Nicht** **Stat**, **nicht** **Core-Stat**, **nicht** **Zweig**   |
| **Charakterlevel**                | _Level_                             | Fortschrittsstufe eines Charakters, steigt durch **XP**                                                                         |
| **Attributpunkt / Mastery Point** | _Attribute Point_ / _Mastery Point_ | Die beiden pro Level vergebenen Punkte — einer ins Attribut, einer in **Weapon Mastery**                                        |
| **Weapon Mastery**                | _Weapon Mastery_                    | Charaktereigene Waffenprogression aus fünf **Disciplines**. Abzugrenzen vom globalen **Crucible**                               |
| **Discipline**                    | _Discipline_                        | **Finesse**, **Tempest**, **Dominance**, **Valor** oder die charakterindividuelle Weapon-Discipline                             |
| **Mastery Rank**                  | _Mastery Rank_                      | Levelgebundene Spalte: Initiate, Adept, Expert, Master, Grandmaster. Keine Item-**Seltenheit**                                  |
| **Mastery-Node**                  | _Mastery Node_                      | Stat- oder Verhaltens-Node einer Discipline. Abzugrenzen vom Crucible-**Signatur-Skill**                                        |

---

## Kampfmechanik

| Begriff                              | EN / Code         | Abgrenzung                                                                                                                    |
| ------------------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Initiative**                       | _Initiative_      | Zugreihenfolge-Wert; zugleich Ziel-Priorisierungsschlüssel der Charaktere                                                     |
| **Basisangriff**                     | _Basic Attack_    | Die einzige Aktion eines Charakters pro Zug                                                                                   |
| **Proc**                             | —                 | Sammelbegriff für **Crit**, **Multi Hit**, **Splash**, **Counter**                                                            |
| **Modifikator vs. Generator**        | —                 | Verbindliche Zweiteilung der Procs: **Crit** modifiziert einen Treffer, die drei anderen **erzeugen** welche                  |
| **Crit**                             | _Critical Hit_    | Schadens-**Multiplikator**, kein Aufschlag                                                                                    |
| **Multi Hit / Chain / Chain Factor** | —                 | Zusatztreffer **auf dasselbe Ziel**; _Multi Hit Chain_ = Kettenlänge, _Multi Hit Chain Factor_ = Abklingfaktor je Kettenstufe |
| **Splash / Splash Radius**           | —                 | Zusatztreffer auf **Nebenziele**; _Radius_ = deren Anzahl                                                                     |
| **Counter**                          | _Counterattack_   | **Reaktiver** Gegenangriff. Abzugrenzen von den Zug-eigenen Procs                                                             |
| **Schadenspipeline**                 | _damage pipeline_ | Verbindliche Reihenfolge für **eingehenden** Schaden pro Charakter                                                            |
| **Accuracy**                         | _Accuracy_        | Gegner-Trefferwert gegen Charakter-**Evasion**                                                                                |
| **Precision**                        | _Precision_       | Charakter-Waffenwert für **Clean Hit** gegen **Glancing Blow**. Abzugrenzen von Gegner-**Accuracy**                           |
| **Clean Hit**                        | _Clean Hit_       | Erfolgreicher Precision-Wurf: normale Weapon Range und Crit-Berechtigung                                                      |
| **Glancing Blow**                    | _Glancing Blow_   | Fehlgeschlagener Precision-Wurf: MIN RNG und keine Crit-Berechtigung; kein vollständiger Miss                                 |
| **Weapon Range**                     | _Weapon Range_    | Intervall aus MIN RNG und MAX RNG, das den Rohschaden eines Clean Angriffs moduliert                                          |
| **Evasion**                          | _Evasion_         | Charakter-Ausweichwert gegen **Accuracy**                                                                                     |
| **Block / Block Chance**             | —                 | **Partielle** Reduktion, nicht all-or-nothing. Abzugrenzen von **Evasion** und **Defense**                                    |
| **Defense / Toughness**              | —                 | _Defense_ = der **Derived Stat**; _Toughness_ = der **Core-Stat**, der ihn speist                                             |
| **TTK**                              | _Time to Kill_    | Runden bis zum Floor-Sieg — zentrale Tuning-Kenngröße. Abzugrenzen von der **Runde** selbst                                   |
| **Barrier**                          | _Barrier_         | Temporärer Absorptions-**Pool**. Abzugrenzen von **Health**                                                                   |
| **Regeneration**                     | _Regeneration_    | **Flache** Heilung nach eigener Handlung                                                                                      |
| **Health**                           | _Health / HP_     | Lebenspunkte. Abzugrenzen von **Barrier**                                                                                     |
| **Formation / Lane**                 | —                 | Die **2×3**-Aufstellung der Gegner in **Frontline** und **Backline**                                                          |
| **Taunt**                            | _Taunt_           | Zielzwang für Tank/Melee auf einen gegnerischen **Tank**                                                                      |
| **Bulwark**                          | _Bulwark_         | Deckung der Backline durch lebende Frontline-Gegner (**Bulwark-Malus**)                                                       |

---

## Welt & Fortschritt

| Begriff                      | EN / Code     | Abgrenzung                                                                                                                                                                                               |
| ---------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Akt / Dungeon / Floor**    | —             | Die dreistufige Weltstruktur; ein **Floor** = ein Kampf. Notation `A<Akt>-D<Dungeon>-<Floor>`                                                                                                            |
| **Elite-Floor / Boss-Floor** | —             | Die Sonder-Floors am Dungeon-Ende. Abzugrenzen vom normalen Floor                                                                                                                                        |
| **Ramp-Up**                  | —             | Gestaffelte Einführung der Gegnervielfalt im ersten Dungeon eines Akts                                                                                                                                   |
| **Run**                      | —             | Ein Dungeon-Durchlauf bis Sieg, **Wipe** oder Verlassen. Abzugrenzen vom **Floor**                                                                                                                       |
| **Wipe**                     | —             | Alle Charaktere besiegt                                                                                                                                                                                  |
| **Attrition**                | —             | Der über einen **Run** mitgeschleppte Health-Verlust                                                                                                                                                     |
| **Rally**                    | _Rally_       | Molten-Cast-Node, der alle Gefallenen am erfolgreichen Floor-Übergang aufstehen lässt                                                                                                                    |
| **Checkpoint**               | —             | Menge freigeschalteter **Dungeon-Einstiege**; folgt aus den **Waystones**                                                                                                                                |
| **Waystone**                 | _Waystone_    | Anvil-Sparks-Node, der einen späteren Dungeon-Einstieg dauerhaft freischaltet                                                                                                                            |
| **Belohnung**                | _Reward_      | Ergebnis eines gewonnenen Kampfes; einziger Fortschritts-Input                                                                                                                                           |
| **XP**                       | _Experience_  | Belohnung → **Charakterlevel**                                                                                                                                                                           |
| **Gold**                     | _Gold_        | Laufende globale Währung. Abzugrenzen von **Relic Shard**, **Cinder**, **Runedust**                                                                                                                      |
| **Relic Shard**              | _Relic Shard_ | Fragment alter Waffen, Siegel oder Schmiedewerke des gefallenen Reiches; Erstsieg-Währung für den **Crucible**. Abzugrenzen von **Gems**, **Cinder** und **Runedust**                                    |
| **Crucible**                 | _Crucible_    | Der **globale** Skilltree: **Anvil Sparks** (permanente Zugänge und alle Systemfreischaltungen), **Smelting Flames** (Charakterwerte), **Molten Cast** (Kampfregeln). Abzugrenzen von **Weapon Mastery** |
| **Respec**                   | _Respec_      | Vollständiger Rücksetzer eines flexiblen Crucible-Trees gegen volle Relic-Shard-Erstattung; Anvil ist permanent                                                                                          |
| **Prestige**                 | —             | **Bewusstes Nicht-Ziel** — kein Reset-Loop geplant                                                                                                                                                       |

---

## Ausrüstung, Loot & Handwerk

| Begriff                                         | EN / Code           | Abgrenzung                                                                                                       |
| ----------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Ausrüstung / Armor**                          | _Equipment / Armor_ | Items in **vier Slots**: Head, Chest, Legs, Feet. **Das Item ist der Slot** — kein Inventar, kein Tausch         |
| **Item-Basis**                                  | _Base_              | Item-Typ + Slot; legt den **Innate**-Affix fest. **Item-Basen droppen nicht**                                    |
| **Innate**                                      | _Innate_            | Der feste Basis-Stat eines Slots. Abzugrenzen vom **Gem**-Affix und vom **Implicit**                             |
| **Item-Level**                                  | _Item Level_ (`+n`) | **Stamm** des Ausbaus, gehoben per **Temper**. Abzugrenzen von der **Seltenheit**                                |
| **Seltenheit**                                  | _Rarity_            | **Master-Regler** eines Armor-Items, gehoben per **Masterwork**. Abzugrenzen von **Mastery Rank** und Item-Level |
| **Sockel**                                      | _Socket_            | Steckplatz für einen **Gem**                                                                                     |
| **Prismatic-Sockel**                            | _Prismatic Socket_  | Sonder-Sockel nur für **Diamond**-Gems                                                                           |
| **Gem**                                         | _Gem_               | Affix-Träger. Un-gesockelt eine **Ressource** (Bestands-Zähler), gesockelt **am Item gebunden**                  |
| **Amber / Ruby / Sapphire / Emerald / Diamond** | —                   | Die fünf **Gem-Farben** mit je eigenem Affix-Pool                                                                |
| **Sigil**                                       | _Sigil_             | Codex-Eintrag mit vordefinierter **Implicit**-Identität und Slot(-Typ)-Bindung                                   |
| **Sigil Codex**                                 | —                   | Sammlung der bekannten Sigils — reiner **Wissensstand**, keine Ressource. Modellform wie das **Rune Grimoire**   |
| **Implicit**                                    | _Implicit_          | Affix aus einem **Sigil**, per **Brand** auf dem Item. Abzugrenzen von **Innate** und **Gem**-Affix              |
| **Cinder**                                      | _Cinder_            | Boss-/Elite-Währung für **Masterwork** und **Brand**. Abzugrenzen von **Relic Shard** und **Runedust**           |
| **Drop / Loot**                                 | —                   | Was ein Sieg ausschüttet. Wohnort ist die **Ressource**, nicht der Sieg                                          |
| **Blacksmith**                                  | _Blacksmith_        | Station für **Temper**, **Masterwork**, **Brand** — **RNG-frei**. Abzugrenzen vom **Jeweler**                    |
| **Temper**                                      | _Temper_            | Blacksmith-Aktion auf dem **Item-Level**                                                                         |
| **Masterwork**                                  | _Masterwork_        | Blacksmith-Aktion auf der **Seltenheit**. Abzugrenzen von **Weapon Mastery**                                     |
| **Brand / Re-Brand**                            | _Brand_             | Blacksmith-Aktion auf dem **Implicit**; **Re-Brand** überschreibt                                                |
| **Jeweler**                                     | _Jeweler_           | Station für **Inlay**, **Attune**, **Recut** — der **einzige Zufall im Handwerk**                                |
| **Inlay**                                       | _Inlay_             | Jeweler-Aktion: Gem sockeln, Affix rollen                                                                        |
| **Attune**                                      | _Attune_            | Jeweler-Aktion: gesockelten Gem aufleveln                                                                        |
| **Recut**                                       | _Recut_             | Jeweler-Aktion: **Value** eines gesockelten Gems neu würfeln                                                     |

---

## Runen (Endgame)

| Begriff                         | EN / Code  | Abgrenzung                                                                                        |
| ------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| **Rune**                        | _Rune_     | Träger eines **konditionalen Kampf-Ereignisses** — die einzige **qualitative** Fortschritts-Achse |
| **Trigger / Effect / Modifier** | —          | Die drei Runen-Kategorien: _wann?_ · _was?_ · _wie?_                                              |
| **Rune Grimoire**               | —          | Katalog aller Runen; zugleich Station für **Inscribe** und **Etch**. Kein Bestand, kein Inventar  |
| **Talisman**                    | _Talisman_ | Schmuckstück, eines pro Charakter, trägt genau einen **Rite**. **Kein Ausrüstungs-Slot**          |
| **Rite**                        | _Rite_     | Die Zeile auf dem Talisman: **Trigger + Effect + Modifier**                                       |
| **Runedust**                    | _Runedust_ | Runen-Währung für **Inscribe** und **Etch**. Abzugrenzen von **Cinder** und **Relic Shard**       |
| **Inscribe**                    | _Inscribe_ | Grimoire-Aktion: liefert eine **noch unbekannte** Rune. Abzugrenzen von **Etch**                  |
| **Etch**                        | _Etch_     | Grimoire-Aktion: hebt das **Level** einer bekannten Rune                                          |
