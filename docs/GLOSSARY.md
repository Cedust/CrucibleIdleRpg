# GLOSSARY.md — Crucible Idle RPG

> **Zweck dieser Datei:** verbindliche Begriffe für Code, UI und Doku.
> Ziel ist **ein Wort pro Konzept** — damit Agenten und Menschen dieselbe Sprache
> sprechen. Besonders wichtig wegen der Trennung: interne Doku/Code-Kommentare
> **Deutsch**, Spieltexte (UI + Content) **Englisch** (AGENTS.md §1).
>
> Für jeden Begriff sind — wo relevant — **DE** (interne Bezeichnung) und
> **EN** (Spieltext/Code-Identifier) angegeben. `TODO` = noch nicht final.

---

## Konvention

- **Code-Identifier** (Typen, Funktionen, Variablen) folgen dem **englischen** Begriff
  (z. B. `EnemyDefinition`, `combatEngine`), passend zu `src/game/` und `src/features/`.
- **Interne Prosa** (diese Docs, Kommentare) nutzt den **deutschen** Begriff.
- Wenn ein Konzept nur einen sinnvollen Namen hat, steht er einmal.

---

## Begriffe

### Kampf (EN: _Combat_)

Rundenbasierte Auto-Battle-Auseinandersetzung zwischen eigenem Team und Gegner(n).
Einziger Weg zu Fortschritt. — Feature-Ordner: `src/features/combat/`.

### Kampf-Engine (EN: _combat engine_, Code: `combatEngine`)

Reine, deterministische, seedbare Logik, die einen Kampf vollständig simuliert.
Kein Bezug zu Timern, DOM oder Echtzeit. Gegenstück: **Playback**.

### Playback / Abspielen (EN: _playback_)

Das Rendering, das die von der Engine simulierten Runden mit visueller Verzögerung
für den Spieler abspielt. Klar getrennt von der Simulation.

### Runde (EN: _Round_)

Eine Simulations-Einheit des Kampfes: **jeder lebende Akteur** (Charaktere + Gegner) handelt
**genau einmal**, in absteigender **Initiative**-Reihenfolge (SPEC §1.1). **Nicht** mit einem
Render-„Tick" oder Frame verwechseln — die Runde ist eine reine Simulations-Größe.

### Team

Die vom Spieler kontrollierte Gruppe von Charakteren. — Feature: `src/features/team/`.

### Charakter (EN: _Character_, Code: `CharacterDefinition`)

Ein Mitglied des Teams. Deklarativer Content unter `src/game/characters/`.

### Gegner (EN: _Enemy_, Code: `EnemyDefinition`)

Gegnerische Einheit im Kampf. Deklarativer Content unter `src/game/enemies/`.

### Attribut (EN: _Attribute_)

Eine der **drei** Level-Up-Achsen und eine der drei Quellen der **Derived Stats** (§3.0):
**Ferocity** (→ Attack), **Resilience** (→ Defense), **Vigor** (→ Health). Pro Level 1 Punkt, frei
verteilbar, Respec gegen Gold. **Nicht** synonym zu **Stat**, **nicht** mit den **Core-Stats**
(Might/Toughness/Vitality) und **nicht** mit den Skilltree-**Zweigen**
(Finesse/Tempest/Dominance/Valor) verwechseln. Regeln: SPEC §3.1.

### Stat (EN: _Stat_)

Ein einzelner, granularer Kampfwert eines Charakters (z. B. Attack, Crit Damage,
Evasion). Kategorien: **Core** (Might/Toughness/Vitality), **Derived** (Attack/Defense/Health),
**Offensive**, **Defensive**, **Utility** (SPEC §3.0). Abzugrenzen von **Attribut**.

### Core-Stat (EN: _Core Stat_)

Die drei **Primär**-Stats **Might** (→ Attack), **Toughness** (→ Defense), **Vitality** (→ Health).
Quellen: **Item-Innate** (§3.4) und **Emerald**-Gems (§4.5). Speisen zusammen mit **Attribut** und
**Baseline** die **Derived Stats**.

### Derived Stat (EN: _Derived Stat_)

**Attack**, **Defense**, **Health** — nicht direkt vergeben, sondern je aus drei Quellen mit
eigener Kurve zusammengesetzt: **Baseline** (Level, §3.3) + **Attribut** (§3.1) + **Core-Stat**
(§3.0). Abzugrenzen von **Core-Stat**.

### Zweig / Finesse / Tempest / Dominance / Valor (EN: _Branch_)

Die vier **Skilltree-Zweige** (EN, Spieltext & Code), je an ein offensives Schadens-Muster
gekoppelt: **Finesse** = Crit, **Tempest** = Multi-Hit (**ein** Ziel), **Dominance** =
Splash (**mehrere** Ziele), **Valor** = Counter. **Nicht** „Attribute" (SPEC §3.2).

### Belohnung (EN: _Reward_)

Ergebnis eines gewonnenen Kampfes; einziger Fortschritts-Input.

### PRNG (seedbarer Zufallszahlengenerator)

Einzige erlaubte Zufallsquelle in der Spiellogik (z. B. `mulberry32`/`sfc32`),
dependency-frei in `src/shared/utils/`. **Kein** `Math.random()` in Spiellogik.

### Seed

Startwert des PRNG. Gleicher Seed + gleicher Input ⇒ exakt gleicher Kampfverlauf.
Grundlage für Tests, Bug-Reports („Seed 12345") und spätere Replays.

### Catch-up / Aufholen

Nachrechnen fehlender Runden **ohne Animation**, wenn ein minimierter/gedrosselter Tab
wieder sichtbar wird (Page Visibility API). Abzugrenzen von **Offline-Progress**.

### Offline-Progress

Fortschritt bei **geschlossenem** Tab. **Bewusstes Nicht-Ziel** — existiert nicht.

### Save / Speicherstand

Persistierter Spielzustand in `localStorage`, mit Versionsfeld und Migration.
Zugriff nur über den **SavePort**.

### SavePort

Abstrahierter Persistenz-Adapter (`src/shared/ports/`) mit `load()` / `save()` /
`clear()`. Aktuelle Implementierung: `localStorage`; später gegen ein Cloud-Backend
austauschbar, ohne Spiellogik anzufassen.

### Große Zahl (EN: _big number_)

Wert, der `Number.MAX_SAFE_INTEGER` überschreiten kann; wird über **break_eternity.js**
geführt, nie über native `number`.

### Prestige

**Bewusstes Nicht-Ziel** — kein Reset-/Prestige-Loop geplant (festes Drei-Charakter-Team,
SPEC §4.6).

---

## Kampf — Akteure & Ablauf

### Akteur (EN: _Actor_)

Ein am Kampf beteiligter Charakter **oder** Gegner, der in einer Runde eine Aktion ausführt.

### Initiative

Wert, der die Zugreihenfolge bestimmt (höchste zuerst). Charaktere: fester Stat. Gegner:
**einmalig pro Kampf** aus einer **Initiative-Range** per PRNG gewürfelt. Bei Gleichstand
handelt der **Gegner** zuerst. Zugleich **Ziel-Priorisierungsschlüssel** der Charaktere
(höchste Initiative zuerst).

### Archetyp / Rolle (EN: _Role_)

**Tank**, **Melee** oder **Ranged** — bestimmt Zielregeln (Frontline/Backline, Taunt) und
Signatur-Skills. Gilt für Charaktere **und** Gegner.

### DD (Damage Dealer)

Charakter mit Fokus auf ausgeteilten Schaden (Melee & Ranged). Abgrenzung: **Tank**.

## Charakter-Progression

### Charakterlevel (EN: _Level_)

Charakter-Fortschrittsstufe (max. **100**), steigt durch **XP**. Ein Level-Up gibt
Baseline-Wachstum der **Derived Stats** **+** 1 Attributpunkt **+** 1 Skillpunkt (SPEC §3.3).

### Attributpunkt / Skillpunkt (EN: _Attribute Point_ / _Skill Point_)

Pro Level-Up je **1** Attributpunkt (in ein **Attribut**) und **1** Skillpunkt (in den
**Skilltree**). Frei verteilbar, **Respec gegen Gold**.

### Skilltree (Charakter) (EN: _Skill Tree_)

Charaktereigener Baum mit mehreren **Pfaden**; enthält **Stat-Knoten** und
**Verhaltens-/Trigger-Knoten**. Wird mit Skillpunkten gefüllt. — Vgl. **Crucible** (global).

### Skill (EN: _Skill_)

Ein per Skilltree freigeschalteter Effekt — passiver Stat-Boost **oder** Verhaltensregel/Trigger (z. B. **Mitigation**, „Stagger als Skill", Per-Hit-Crit).

## Charakter-Kampfmechanik

### Basisangriff (EN: _Basic Attack_)

Die einzige Aktion eines Charakters pro Zug: ein Angriff auf ein Ziel, moduliert durch die
Offensiv-Procs (SPEC §2.1).

### Proc (Offensiv-Mechanik)

Chance-basierter Zusatzeffekt eines Angriffs: **Crit**, **Multi Hit**, **Splash**, **Counter**
— jeweils als **Chance + Damage**-Paar (an ein **Attribut** gekoppelt).

### Crit (EN: _Critical Hit_)

Kritischer Treffer: mit _Crit Chance_ → Schaden `× Crit Damage`.

### Multi Hit / Multi Hit Chain

Zusatztreffer **auf dasselbe Ziel**: mit _Multi Hit Chance_ bis zu _Multi Hit Chain_-mal in
Folge nachgewürfelt, endet beim ersten Fehlwurf. Jeder Zusatztreffer macht _Multi Hit Damage_.

### Splash / Splash Radius

Zusatztreffer auf **Nebenziele**: mit _Splash Chance_ bis zu _Splash Radius_ weitere Gegner
(Lane-übergreifend, gleiche Lane zuerst). _Splash Damage_ = %-Anteil des tatsächlich
verursachten Schadens (Bulwark-Malus darin bereits enthalten).

### Counter (EN: _Counterattack_)

**Reaktiver** Gegenangriff: Wird ein Charakter getroffen, löst er mit _Counter Chance_
**sofort** einen Angriff aus. **Geblockter** Treffer löst Counter aus, **ausgewichener**
(Evasion) nicht.

### Sustain

Flache Selbstheilung pro getroffenem Gegner.

## Verteidigung & Schadenspipeline

### Schadenspipeline (EN: _damage pipeline_)

Verbindliche Reihenfolge für **eingehenden** Schaden pro Charakter:
**Basis-Verteilung → Evasion → Block → Defense → Barrier → Health** (SPEC §2.3).

### Mitigation

Leitet nach Freischaltung einen Anteil `m` des DD-Schadens auf den Tank um; vor Freischaltung keine Umleitung. Node-Maxlevel = natürlicher Cap (SPEC §2.3, §3.2).

### Evasion (vs. Accuracy)

Binäres Ausweichen: Miss-Roll _Gegner-Accuracy_ gegen _Evasion_ → **0 Schaden, kein Counter**.

### Block / Block Chance

**partielle** Reduktion `Schaden × (1 − Block%)`, wirkt **vor** Defense. Geblockter Treffer bleibt ein Treffer (löst Counter aus).

### Defense (Derived) / Toughness (Core)

_Defense_ = **flacher** Schadensabzug (nach Block); ein **Derived Stat** (§3.0). _Toughness_ =
Core-Stat, der _Defense_ speist (aus Item-Innate + Emerald-Gems).

### Barrier

Temporärer Absorptionsschild, **zu Rundenbeginn** neu gesetzt, verfällt durch Neu-Setzen
(kein Stacking). Greift **nach** Block/Defense, **vor** Health.

### Regeneration

Passive Heilung, triggert **direkt nach der eigenen Handlung** des Akteurs.

### Health (EN: _Health / HP_)

Lebenspunkte eines Akteurs. **Keine Heilung zwischen Floors** (Attrition, SPEC §4.4).

## Gegner & Formation

### Accuracy

Gegner-Trefferwert gegen Charakter-**Evasion**. Wächst linear mit der Floor-Tiefe. (Gegner
haben nur Health, Attack, Accuracy, Initiative — keine Defense/Evasion.)

### Formation / Lane / Frontline / Backline

**2×3-Formation**: zwei **Lanes** (Frontline: Tank & Melee; Backline: Ranged) mit je drei
Slots → max. 6 Gegner, max. 1 Tank-Gegner.

### Taunt

Zwang für Tank-/Melee-Charaktere, einen lebenden **gegnerischen Tank vorrangig** anzugreifen.
Der Ranged-Charakter **umgeht** den Taunt (zahlt dafür Bulwark-Malus).

### Bulwark

Deckungs-Mechanik: Solange Frontline-Gegner leben, erleiden Backline-Gegner reduzierten
Schaden (**Bulwark-Malus**, additiv pro Frontline-Gegnertyp; SPEC §2.4).

## Welt, Fortschritt & Wirtschaft

### Akt / Dungeon / Floor

**3 Akte × 5 Dungeons × 20 Floors = 300 Floors**. Notation `A<Akt>-D<Dungeon>-<Floor>`
(z. B. `A1-D4-20`). Ein **Floor** = ein Kampf.

### Elite-Floor / Boss-Floor

**Elite** = Floor 20 der Dungeons 1–4 eines Akts. **Boss** = Floor 20 des letzten Dungeons
eines Akts.

### Ramp-Up

Gestaffelte Einführung der vollen Gegnervielfalt im **ersten Dungeon eines Akts** (vier Phasen, SPEC §4.1).

### Checkpoint

Menge **freigeschalteter Dungeon-Einstiege** (Dungeon-Granularität, jeweils Floor 1). Default pro Akt: `A<Akt>-1-01`; Anvil-Sparks-Nodes schalten spätere Einstiege frei (SPEC §4.4).

### Wipe / Attrition

**Wipe** = alle Charaktere besiegt → Dungeon verlassen (Rewards bleiben). **Attrition** = keine Heilung zwischen Floors; Health wird über eine Auto-Progression-Kette mitgeschleppt.

### XP (EN: _Experience_)

Belohnung → Charakterlevel. Pro Floor ein **XP-Pool** (Basisanteil je Charakter + individueller Rest).

### Gold

Globale Währung (Respecs, Blacksmith/Jeweler).

### Crystal

Globale Währung für den **Crucible**. Nur beim **allerersten** Sieg eines Floors (Normal 1,
Elite 3, Boss 10; insgesamt **351** im Spiel).

### Crucible

**Globaler, charakterübergreifender** Skilltree; Crystals werden „eingeschmolzen". Vier Trees:
**Anvil Sparks** (Freischaltungen), **Smelting Flames** (Stat-Boosts), **Molten Cast** (Economy),
**Masterwork** (Endgame). Stufbare Nodes (max. 5, lineare Crystal-Kosten). — Vgl. **Skilltree** (charaktereigen).

### Ausrüstung (EN: _Equipment_)

Items in sechs Slots **Main Hand**, **Off Hand**, Head, Chest, Legs, Feet. **Hauptmotor** des
Fortschritts. Jedes Item trägt drei Schichten: **Basis** (+ **Innate**) + **Item-Level** +
**Sockel/Gems** (SPEC §3.4). Seltenheiten (EN: _Rarity_): Common, Magic, Rare, Legendary, Unique.

### Item-Basis (EN: _Base_)

Item-Typ + Slot eines Items; legt den **Innate-Affix** und die (rollenspezifische) Slot-Rolle fest.
**Reguläre Basen werden beim Blacksmith geforged** (droppen nicht); nur **Uniques** droppen
(Elite/Boss) (SPEC §3.4/§4.5).

### Innate (EN: _Innate_)

Fester Basis-Stat je Slot, der mit dem **Item-Level** skaliert: **Might** (Main Hand, DD-Off-Hand),
**Toughness** (Tank-Off-Hand/Schild, Chest, Legs), **Vitality** (Head), **Initiative** (Feet).
(SPEC §3.4)

### Item-Level (EN: _Item Level_, `+n`)

Bis **+100** hochstufbare Basis-Power eines Items; skaliert den **Innate-Value** und trägt die
**exponentielle** Incremental-Kurve (gedeckelt bei +100). Wird beim **Blacksmith** per **Temper**
gegen **Gold** gehoben (kein RNG). Persistentes Item „wächst mit"; gedroppte **Uniques** können
floor-skaliert **vorgelevelt** erscheinen (SPEC §3.4/§4.5).

### Seltenheit (EN: _Rarity_)

Stufe eines Items: **Common → Magic → Rare → Legendary → Unique**. **Master-Regler der
Min-Max-Achse**: bestimmt die **Anzahl der Sockel** (1→4, Breite) **und** das **Gem-Level-Cap**
(Höhe). Wird per **Refine** (Blacksmith, gegen **Cinder** — eskalierend 1/3/6) gehoben. **Unique**
ist Drop-exklusiv (Elite/Boss), trägt einen **Implicit** + einen **Prismatic-Slot** und startet
floor-skaliert mit 1–3 Sockeln. Konkrete Zahlen: SPEC §4.5.

### Refine (EN: _Refine_)

**Blacksmith**-Aktion, die die **Seltenheit** um eine Stufe hebt (Common → Legendary; +1 Sockel,
höheres Gem-Cap). **Kein RNG**, Kosten in **Cinder** (eskalierend 1/3/6) + Gold. Bei **Uniques**
schaltet dieselbe Cinder-Ausgabe die restlichen Normal-Sockel frei (SPEC §4.5).

### Recut (EN: _Recut_)

**Jeweler**-Aktion, die einen gesockelten Gem auflevelt (im Sockel, durch die Item-Seltenheit
gedeckelt) → hebt die **Value-Range**, relative Position bleibt. Kostet gleichfarbige Gems als
Fodder (jedes Level mehr) (SPEC §4.5).

### Attune (EN: _Attune_)

**Jeweler**-Aktion, die den **Value** eines gesockelten Gems innerhalb seiner Range neu würfelt
(seed-PRNG) (SPEC §4.5).

### Cinder (EN: _Cinder_)

Boss-Währung für die **Seltenheits-Kapazität**. **Bosse droppen garantiert 1/Kill** (100 %, jeder
Durchlauf), **Elites** mit tiefen-skalierter **Bonus**-Chance. Finanziert **Refine** und das
Freischalten weiterer **Unique-Sockel** (SPEC §4.2/§4.5). Abgegrenzt von **Crystals** (Crucible,
nur First-Clear).

### Sockel (EN: _Socket_)

Steckplatz eines Items für einen **Gem**. Zahl = Seltenheit (per **Refine**/Cinder gehoben). Zusätzlich hat ein **Unique** einen **Prismatic-Slot** (nur für **Diamond**), der ab
Drop **leer** ist. (SPEC §4.5)

### Gem (EN: _Gem_)

Affix-Träger. Un-gesockelte Gems sind eine **Ressource** (Bestands-Zähler pro Farbe, **kein
Inventar**). Beim **Inlay** (Jeweler) wird 1 Gem verbraucht und rollt einen zufälligen Affix
aus dem **Farb-Pool** mit **Value-Range**; der gesockelte Gem ist dann **am Item gebunden**
(Überschreiben des Sockels = alter Gem verloren). Farben: **Amber** (Offensive – Chance), **Ruby**
(Offensive – Damage), **Sapphire** (Defensive), **Emerald** (Core), **Diamond** (Prismatic, nur
Prismatic-Slot). Aufleveln (im Sockel, Seltenheit-gedeckelt) kostet gleichfarbige Gems als Fodder
(SPEC §4.5).

### Amber / Ruby / Sapphire / Emerald / Diamond

Die fünf **Gem-Farben**. **Amber** rollt Offensiv-**Chance** (Crit/Multi/Splash/Counter Chance),
**Ruby** rollt Offensiv-**Damage** (Crit/Multi/Splash/Counter Damage). **Sapphire** rollt
Defensiv-Stats (Barrier, Block Chance, Sustain, Regeneration, Evasion). **Emerald** rollt
**Core**-Stats (Might, Toughness, Vitality). **Diamond** (Prismatic, Unique-Slot-only) trägt
item-lokale **Meta-Multiplikatoren**. Amber/Ruby/Sapphire/Emerald sind reguläre Fodder-Farben,
Diamond der Elite/Boss-Chase (SPEC §3.0/§4.5).

### Implicit (Unique-Sonder-Effekt)

Fester Effekt eines **Unique**-Items (nicht neu rollbar), zusätzlich zu Sockeln + Prismatic-Slot.
Uniques droppen mit **vordefinierter Affix-Identität** (nur Values würfeln) (SPEC §4.5).

### Drop / Loot

Aus einem Sieg gewonnene **Gems** (Amber/Ruby/Sapphire/Emerald; Diamond nur Elite/Boss), **Cinder**
(Boss garantiert, Elite als Bonus) + **Uniques** (nur Elite/Boss). **Reguläre Item-Basen droppen nicht** (Blacksmith-Forge). (SPEC §4.2/§4.5)
**Seedbasiert** (§2.5): reproduzierbar innerhalb eines Runs; beim **Farmen** neuer Seed pro Durchlauf.

### Blacksmith / Jeweler

**Blacksmith** = Power- **und** Seltenheits-Achse: Item-Basen **Forge** (einzige Basis-Quelle),
**Temper** (Item-Level `+n` → Innate, bis +100, Gold, kein RNG) und **Refine** (Seltenheit +1
Stufe, Cinder + Gold).
**Jeweler** = Gem-Achse: **Inlay** (sockeln), **Recut** (Gem aufleveln), **Attune** (Value-Reroll, seed-PRNG).
Alle Aktionen kosten **Gold** (Refine zusätzlich **Cinder**) (SPEC §4.5).

### Amulet / Rune

Angedachte, **noch nicht spezifizierte** Endgame-Systeme (Sonder-Slot Amulet, Runen ggf. ins
Amulet gesockelt) — bewusst **separate** spätere Runde, Anbindung an **Masterwork** (SPEC §4.5).
_(Das Sockeln übernimmt der **Jeweler** per **Inlay**.)_

---

## Verweise

- Vision & Design → [DESIGN.md](DESIGN.md)
- Präzise Mechanik & Formeln → [SPEC.md](SPEC.md)
- Balancing-Philosophie → [BALANCING.md](BALANCING.md)
- Technischer Leitfaden für Agenten → [../AGENTS.md](../AGENTS.md)
