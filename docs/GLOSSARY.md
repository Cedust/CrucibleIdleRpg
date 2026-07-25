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

Eine der **vier rein offensiven** Level-Up-Achsen (**Finesse, Tempest, Dominance,
Valor**), in die der Spieler pro Level einen Punkt investiert. **Nicht** synonym zu **Stat**
verwenden. Regeln: SPEC §3.1.

### Stat (EN: _Stat_)

Ein einzelner, granularer Kampfwert eines Charakters (z. B. Attack, Crit Damage,
Evasion). Ein **Attribut** skaliert mehrere Stats; ein Stat ist die unterste
Ebene. Abzugrenzen von **Attribut**.

### Finesse / Tempest / Dominance / Valor

Die vier **Attribute** (EN, Spieltext & Code). Zuordnung zum Schadens-Muster:
**Finesse** = Crit, **Tempest** = Multi-Hit (**ein** Ziel), **Dominance** =
Splash (**mehrere** Ziele), **Valor** = Counter.

### Belohnung (EN: _Reward_)

Ergebnis eines gewonnenen Kampfes; einziger Fortschritts-Input.

### Upgrade

Dauerhafte Verbesserung, die mit Belohnungen erworben wird. — Feature:
`src/features/upgrades/`.

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

Charakter-Fortschrittsstufe (max. **100**), steigt durch **XP**. Ein Level-Up gibt Core-Stat-
Wachstum **+** 1 Attributpunkt **+** 1 Skillpunkt (SPEC §3.3).

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

### Defense (Core) / Armor (Defensive)

_Defense_ = **flacher** Schadensabzug (nach Block). _Armor_ = Stat, der _Defense_ erhöht.

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

**3 Akte × 5 Dungeons × 20 Floors = 300 Floors**. Notation `A<Akt>-<Dungeon>-<Floor>`
(z. B. `A1-4-20`). Ein **Floor** = ein Kampf.

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

Globale Währung (Respecs, Crafting/Enchant).

### Crystal

Globale Währung für den **Crucible**. Nur beim **allerersten** Sieg eines Floors (Normal 1,
Elite 3, Boss 10; insgesamt **351** im Spiel).

### Crucible

**Globaler, charakterübergreifender** Skilltree; Crystals werden „eingeschmolzen". Vier Trees:
**Anvil Sparks** (Freischaltungen), **Tempering** (Stat-Boosts), **Refining** (Economy),
**Masterwork** (Endgame). Stufbare Nodes (max. 5, lineare Crystal-Kosten). — Vgl. **Skilltree** (charaktereigen).

### Ausrüstung (EN: _Equipment_)

Items in Slots **Main Hand** (_Signature Slot_: Weapon/Shield), Head, Chest, Legs, Feet.
Hauptmotor des Fortschritts. Seltenheiten: Common, Magic, Rare, Epic, Legendary.

### Blacksmith / Enchanter

**Blacksmith** = Items herstellen/aufwerten/zerlegen. **Enchanter** = Items verzaubern
(Zusatzeffekte). Details offen (SPEC §4.5).

### Amulet / Rune / Cube

Angedachte, **noch nicht spezifizierte** Systeme (Sonder-Slot Amulet, Runen ggf. ins Amulet
gesockelt, Cube als Sockel-Station). Endgame-Anbindung an **Masterwork** (SPEC §4.5).

---

## Verweise

- Vision & Design → [DESIGN.md](DESIGN.md)
- Präzise Mechanik & Formeln → [SPEC.md](SPEC.md)
- Balancing-Philosophie → [BALANCING.md](BALANCING.md)
- Technischer Leitfaden für Agenten → [../AGENTS.md](../AGENTS.md)
