# SPEC.md — Crucible Idle RPG (Index)

> **Zweck dieser Spec:** präzise, umsetzbare Mechanik-Regeln, Formeln und Zustände.
> Beantwortet **„Wie verhält sich das Spiel exakt?"**. Vision & Begründungen stehen
> in [DESIGN.md](DESIGN.md), Begriffe in [GLOSSARY.md](GLOSSARY.md), technische
> Konventionen in [../AGENTS.md](../AGENTS.md).
>
> **Welche Zahlen hier stehen.** Die Spec enthält die **strukturellen Konstanten**, die das
> Verhalten definieren: Caps und Obergrenzen (Level 100, Item-Level `+100`), Stufenzahlen
> (Seltenheiten, Node-Level 1–5), Mengen (3 Akte × 5 Dungeons × 20 Floors, sechs Slots,
> Pool-Größen) und die Struktur der Formeln. **Tuning-Werte** — Kurven, Drop-Raten, Kosten,
> Prozentsätze — leben als deklarativer Content unter `src/game/` (siehe AGENTS.md §4), ihre
> Begründung in [BALANCING.md](BALANCING.md).
>
> _Faustregel:_ Ändert sich eine Zahl beim Balancing-Pass, gehört sie nach `src/game/`. Ändert
> sich mit ihr die **Struktur** des Systems, gehört sie hierher.
>
> **Was hier nicht steht.** Begründungen für Design-Entscheidungen stehen in
> [DESIGN.md](DESIGN.md), Begründungen für Zahlenverhalten in [BALANCING.md](BALANCING.md),
> Entscheidungs-Historie in [adr/](adr/). Hier bleibt Begründung nur, wo sie eine
> **Fehlimplementierung verhindert** (etwa: warum die PRNG-Ströme getrennt sind).
> Offene Punkte sind mit `TODO` markiert.
>
> Diese Datei ist der **Index**. Der Inhalt liegt in [spec/](spec/), aufgeteilt nach
> Themen; die **§-Nummerierung bleibt unverändert** und ist über alle Teildateien
> hinweg eindeutig.

---

## Teildateien

| Datei                                      | §              | Inhalt                                                                      |
| ------------------------------------------ | -------------- | --------------------------------------------------------------------------- |
| [spec/COMBAT.md](spec/COMBAT.md)           | §1, §2         | Rundenablauf, Zielauswahl, Formation, Kampfwerte, Schadenspipeline, Heilung |
| [spec/CHARACTERS.md](spec/CHARACTERS.md)   | §3             | Team, Stats, Attribute, Skilltree, Ausrüstung, Signatur-Skills              |
| [spec/PROGRESSION.md](spec/PROGRESSION.md) | §4.1–4.4, §4.7 | Akte/Dungeons/Floors, Belohnungen, Crucible, Checkpoints, Prestige          |
| [spec/CRAFTING.md](spec/CRAFTING.md)       | §4.5           | Item-Level, Seltenheit, Sockel, Gems, Sigils, Blacksmith & Jeweler          |
| [spec/RUNES.md](spec/RUNES.md)             | §4.6           | Rune Grimoire, Talisman, Rite, Auslösung, Masterwork-Nodes                  |
| [spec/SIMULATION.md](spec/SIMULATION.md)   | §5             | Simulation ≠ Rendering, Playback, Catch-up, Seeds, Reload                   |
| [spec/PERSISTENCE.md](spec/PERSISTENCE.md) | §6             | Speicher-Auslöser und Save-Inhalt                                           |

**Konvention für Verweise:** `§X` innerhalb einer Teildatei bezieht sich auf dieselbe Datei.
Verweise über Dateigrenzen hinweg sind verlinkt.

### §-Index (flach)

Nachschlagetabelle für Verweise ohne Link — etwa `// siehe SPEC §4.6` in einem Code-Kommentar.

| §        | Datei                 | Abschnitt                                                                                |
| -------- | --------------------- | ---------------------------------------------------------------------------------------- |
| **§1**   | `spec/COMBAT.md`      | [Kampf — Grundmodell](spec/COMBAT.md#1-kampf--grundmodell)                               |
| **§1.1** | `spec/COMBAT.md`      | [Rundenablauf](spec/COMBAT.md#11-rundenablauf)                                           |
| **§1.2** | `spec/COMBAT.md`      | [Zielauswahl](spec/COMBAT.md#12-zielauswahl)                                             |
| **§1.3** | `spec/COMBAT.md`      | [Gegnerformation](spec/COMBAT.md#13-gegnerformation)                                     |
| **§2**   | `spec/COMBAT.md`      | [Kampfwerte & Formeln](spec/COMBAT.md#2-kampfwerte--formeln)                             |
| **§2.1** | `spec/COMBAT.md`      | [Charakter-Zug (ausgehend)](spec/COMBAT.md#21-charakter-zug-ausgehender-schaden)         |
| **§2.2** | `spec/COMBAT.md`      | [Treffermodell](spec/COMBAT.md#22-treffermodell)                                         |
| **§2.3** | `spec/COMBAT.md`      | [Schadenspipeline](spec/COMBAT.md#23-eingehender-schaden-schadenspipeline)               |
| **§2.4** | `spec/COMBAT.md`      | [Bulwark](spec/COMBAT.md#24-bulwark-deckung-der-backline)                                |
| **§2.5** | `spec/COMBAT.md`      | [Feststehende Regeln](spec/COMBAT.md#25-feststehende-regeln)                             |
| **§2.6** | `spec/COMBAT.md`      | [Heilung](spec/COMBAT.md#26-heilung--grenzen-und-auslösung)                              |
| **§3**   | `spec/CHARACTERS.md`  | [Team](spec/CHARACTERS.md#3-team)                                                        |
| **§3.0** | `spec/CHARACTERS.md`  | [Stats](spec/CHARACTERS.md#30-stats)                                                     |
| **§3.1** | `spec/CHARACTERS.md`  | [Attribute](spec/CHARACTERS.md#31-attribute-level-up-progression)                        |
| **§3.2** | `spec/CHARACTERS.md`  | [Charakter-Skilltree](spec/CHARACTERS.md#32-charakter-skilltree)                         |
| **§3.3** | `spec/CHARACTERS.md`  | [Charakterlevel](spec/CHARACTERS.md#33-charakterlevel)                                   |
| **§3.4** | `spec/CHARACTERS.md`  | [Ausrüstung](spec/CHARACTERS.md#34-ausrüstung)                                           |
| **§3.5** | `spec/CHARACTERS.md`  | [Signatur-Skills](spec/CHARACTERS.md#35-signatur-skills)                                 |
| **§4.1** | `spec/PROGRESSION.md` | [Akte, Dungeons, Floors](spec/PROGRESSION.md#41-struktur-akte-dungeons-floors)           |
| **§4.2** | `spec/PROGRESSION.md` | [Belohnungen](spec/PROGRESSION.md#42-belohnungen-aus-einem-sieg)                         |
| **§4.3** | `spec/PROGRESSION.md` | [Crucible](spec/PROGRESSION.md#43-crucible-globaler-skilltree)                           |
| **§4.4** | `spec/PROGRESSION.md` | [Checkpoints, Wipe & Abbruch](spec/PROGRESSION.md#44-checkpoints-wipe--abbruch)          |
| **§4.5** | `spec/CRAFTING.md`    | [Ausrüstung, Loot & Handwerk](spec/CRAFTING.md#45-ausrüstung-loot--handwerk-kern-loop)   |
| **§4.6** | `spec/RUNES.md`       | [Runen](spec/RUNES.md#46-runen-endgame--masterwork)                                      |
| **§4.7** | `spec/PROGRESSION.md` | [Prestige](spec/PROGRESSION.md#47-prestige)                                              |
| **§5**   | `spec/SIMULATION.md`  | [Simulation & Zeitverhalten](spec/SIMULATION.md#5-simulation--zeitverhalten-verbindlich) |
| **§5.1** | `spec/SIMULATION.md`  | [Playback](spec/SIMULATION.md#51-playback--takt-und-geschwindigkeit)                     |
| **§5.2** | `spec/SIMULATION.md`  | [Catch-up](spec/SIMULATION.md#52-zeitverhalten--catch-up)                                |
| **§5.3** | `spec/SIMULATION.md`  | [Seeds & Ströme](spec/SIMULATION.md#53-seeds-und-zufalls-ströme)                         |
| **§5.4** | `spec/SIMULATION.md`  | [Kampfzustand & Reload](spec/SIMULATION.md#54-kampfzustand-und-reload)                   |
| **§6**   | `spec/PERSISTENCE.md` | [Persistenz](spec/PERSISTENCE.md#6-persistenz-save-verhalten)                            |

**Wohnorte.** „Ein Fakt an genau einer Stelle" gilt projektweit
([AGENTS.md](../AGENTS.md), Doku-Konventionen); Tabellen sind der Wohnort, Prosa verweist.
Diese Wohnorte sind über die Teildateien hinweg leicht zu verfehlen:

| Thema                                 | Wohnort                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------- |
| Barrier (Setzen, Verfall, Pool)       | [§1.1 Rundenbeginn](spec/COMBAT.md#11-rundenablauf)                       |
| Bulwark-Malus (Anwendung pro Treffer) | [§2.4](spec/COMBAT.md#24-bulwark-deckung-der-backline)                    |
| Seltenheit → Sockel / Caps / Cinder   | [§4.5 Seltenheits-Tabelle](spec/CRAFTING.md#seltenheit-sockel--level-cap) |
| Drops von Gems, Cinder, Sigils        | [§4.5 Drops](spec/CRAFTING.md#drops-gems-cinder--sigils)                  |
| Runedust-Drop                         | [§4.6 Runedust](spec/RUNES.md#runedust-drop)                              |
| Temper / Refine / Brand               | [§4.5 Blacksmith](spec/CRAFTING.md#blacksmith--temper-refine--brand)      |
| Inlay / Attune / Recut, Gem-Pools     | [§4.5 Jeweler](spec/CRAFTING.md#jeweler--inlay-attune--recut)             |
| XP, Gold, Crystals                    | [§4.2](spec/PROGRESSION.md#42-belohnungen-aus-einem-sieg)                 |
| Simulation, Playback, Seeds           | [§5](spec/SIMULATION.md#5-simulation--zeitverhalten-verbindlich)          |

---

## Invarianten

Diese Regeln gelten dateiübergreifend und sind bei **jeder** Implementierung einzuhalten.
Sie stehen hier gesammelt, damit sie auch dann sichtbar sind, wenn nur eine Teildatei gelesen
wird. Der verbindliche Wortlaut steht jeweils am verlinkten Ort.

1. **Aller Zufall läuft über den seedbaren PRNG** — kein `Math.random()`. Kampf,
   Gegner-Initiative und Loot laufen über **getrennte Ströme**, und die **Ziehreihenfolge** ist
   Teil der Spezifikation. → [§2.5](spec/COMBAT.md#25-feststehende-regeln),
   [§5.3](spec/SIMULATION.md#53-seeds-und-zufalls-ströme)
2. **Determinismus:** gleicher Seed + gleicher Input ⇒ exakt gleicher Verlauf.
   → [§5](spec/SIMULATION.md#5-simulation--zeitverhalten-verbindlich)
3. **Simulation ≠ Rendering.** Die Engine ist reine Logik ohne Timer, DOM oder Echtzeit und
   erzeugt Runden **schrittweise auf Abruf**.
   → [§5](spec/SIMULATION.md#5-simulation--zeitverhalten-verbindlich),
   [ADR 0002](adr/0002-inkrementelle-kampfsimulation.md)
4. **Generatoren lösen einander nie aus** (Multi Hit, Splash, Counter); **Crit ist Modifikator**,
   kein Generator, und wird pro Treffer genau einmal gewürfelt.
   → [§2.1](spec/COMBAT.md#21-charakter-zug-ausgehender-schaden)
5. **Keine charakterexklusiven Stats.** Archetyp-Spezifisches wird als Signatur-Skill gekapselt.
   → [§3](spec/CHARACTERS.md#3-team),
   [ADR 0001](adr/0001-keine-charakterexklusiven-stats.md)
6. **Eine Rune trägt nie „+X Stat"**, und **ein Rite löst maximal einmal pro Runde aus** — ohne
   Ausnahme. → [§4.6](spec/RUNES.md#46-runen-endgame--masterwork)
7. **Die Gegner-Gesamt-Health sinkt monoton.** Nichts heilt oder belebt Gegner; darauf beruht die
   Endlichkeit jedes Kampfes (es gibt kein Rundenlimit).
   → [§1.1](spec/COMBAT.md#11-rundenablauf)
8. **Der laufende Kampfzustand wird nie serialisiert**; ein Dungeon startet immer bei Floor 1,
   Belohnungen werden **pro Floor-Sieg** committet.
   → [§5.4](spec/SIMULATION.md#54-kampfzustand-und-reload),
   [§4.2](spec/PROGRESSION.md#42-belohnungen-aus-einem-sieg)
9. **Alle Werte laufen über native `number`**; die Achsen sind gedeckelt (Level 100, Item-Level
   `+100`, kein Prestige). → [§2.5](spec/COMBAT.md#25-feststehende-regeln),
   [§4.7](spec/PROGRESSION.md#47-prestige)
10. **Kein Offline-Progress.** → [§5](spec/SIMULATION.md#5-simulation--zeitverhalten-verbindlich)

---

## Verweise

- Vision & Design-Begründungen → [DESIGN.md](DESIGN.md)
- Balancing-Philosophie & Kurven → [BALANCING.md](BALANCING.md)
- Verbindliche Begriffe → [GLOSSARY.md](GLOSSARY.md)
- Architektur-Entscheidungen → [adr/](adr/)
- Technischer Leitfaden für Agenten → [../AGENTS.md](../AGENTS.md)
