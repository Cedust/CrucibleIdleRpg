# SPEC.md — Crucible Idle RPG (Einstieg)

> **Zweck:** präzise, umsetzbare Mechanik-Regeln, Formeln und Zustände — „Wie verhält sich das
> Spiel exakt?". Einordnung der Doku-Dateien: [README.md](README.md#1-landkarte).
>
> Diese Datei ist der **Einstieg**: Teildateien und Invarianten. Der Regelinhalt liegt in
> [spec/](spec/).

---

## Welche Zahlen in der Spec stehen

Die Spec enthält die **strukturellen Konstanten**, die das Verhalten definieren: Caps und
Obergrenzen (Level 100, Item-Level `+100`), Stufenzahlen (Seltenheiten, Node-Level 1–5), Mengen
(3 Akte × 5 Dungeons × 20 Floors, sechs Slots, Pool-Größen) und die Struktur der Formeln.
**Tuning-Werte** — Kurven, Drop-Raten, Kosten, Prozentsätze — leben als deklarativer Content
unter `src/game/` ([AGENTS.md §4](../AGENTS.md#4-content--balancing)), ihre Begründung in
[BALANCING.md](BALANCING.md).

_Faustregel:_ Ändert sich eine Zahl beim Balancing-Pass, gehört sie nach `src/game/`. Ändert
sich mit ihr die **Struktur** des Systems, gehört sie hierher.

Begründung bleibt in der Spec nur, wo sie eine **Fehlimplementierung verhindert**. Noch nicht Entschiedenes steht in
[backlog/OPEN_ISSUES.md](backlog/OPEN_ISSUES.md); `TODO`-Kommentare markieren hier nur die
Stelle, an der es später landet.

---

## Teildateien

| Datei                                      | Inhalt                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| [spec/COMBAT.md](spec/COMBAT.md)           | Rundenablauf, Zielauswahl, Formation, Kampfwerte, Schadenspipeline, Heilung, Signatur-Skills |
| [spec/CHARACTERS.md](spec/CHARACTERS.md)   | Team, Stats, Attribute, Skilltree, Charakterlevel, Zuordnung der Signatur-Skills             |
| [spec/PROGRESSION.md](spec/PROGRESSION.md) | Akte/Dungeons/Floors, Belohnungen, Crucible, Checkpoints, Prestige                           |
| [spec/ITEMS.md](spec/ITEMS.md)             | Slots & Innate, Item-Anatomie, Seltenheit, Sockel, Gems, Sigils, Handwerk                    |
| [spec/RUNES.md](spec/RUNES.md)             | Rune Grimoire, Talisman, Rite, Auslösung, Rune-Level, Masterwork-Nodes                       |
| [spec/SIMULATION.md](spec/SIMULATION.md)   | Simulation ≠ Rendering, Playback, Catch-up, Seeds, Reload                                    |
| [spec/PERSISTENCE.md](spec/PERSISTENCE.md) | Speicher-Auslöser und Save-Inhalt                                                            |

Die `§`-Nummern sind **dateilokal** und beginnen in jeder Teildatei bei `1`; über Dateigrenzen
hinweg wird verlinkt ([README.md § Verweise & Anker](README.md#4-verweise--anker)).

---

## Invarianten

Diese Regeln gelten dateiübergreifend und sind bei **jeder** Implementierung einzuhalten.
Sie stehen hier als **Index** gesammelt, damit sie auch dann sichtbar sind, wenn nur eine
Teildatei gelesen wird. Der verbindliche Wortlaut steht jeweils am verlinkten Ort.

1. **Aller Zufall läuft über den seedbaren PRNG** — kein `Math.random()`. Kampf,
   Gegner-Initiative und Loot laufen über getrennte Ströme, und die Ziehreihenfolge ist
   Teil der Spezifikation. → [Feststehende Regeln](spec/COMBAT.md#25-feststehende-regeln),
   [Seeds und Zufalls-Ströme](spec/SIMULATION.md#4-seeds-und-zufalls-ströme)
2. **Determinismus:** gleicher Seed + gleicher Input ⇒ exakt gleicher Verlauf.
   → [Grundmodell](spec/SIMULATION.md#1-grundmodell-verbindlich)
3. **Simulation ≠ Rendering.** Die Engine ist reine Logik ohne Timer, DOM oder Echtzeit und
   erzeugt Runden schrittweise auf Abruf.
   → [Grundmodell](spec/SIMULATION.md#1-grundmodell-verbindlich),
   [ADR 0002](adr/0002-inkrementelle-kampfsimulation.md)
4. **Generatoren lösen einander nie aus** (Multi Hit, Splash, Counter); Crit ist Modifikator,
   kein Generator, und wird pro Treffer genau einmal gewürfelt.
   → [Charakter-Zug](spec/COMBAT.md#21-charakter-zug-ausgehender-schaden)
5. **Keine charakterexklusiven Stats.** Archetyp-Spezifisches wird als Signatur-Skill gekapselt.
   → [Team](spec/CHARACTERS.md#1-team),
   [ADR 0001](adr/0001-keine-charakterexklusiven-stats.md)
6. **Eine Rune trägt nie „+X Stat"**, und **ein Rite löst maximal einmal pro Runde aus** — ohne
   Ausnahme. → [Grundsatz & Abgrenzung](spec/RUNES.md#1-grundsatz--abgrenzung),
   [Auslösung](spec/RUNES.md#4-auslösung-verbindlich)
7. **Die Gegner-Gesamt-Health sinkt monoton.** Nichts heilt oder belebt Gegner; darauf beruht die
   Endlichkeit jedes Kampfes (es gibt kein Rundenlimit).
   → [Rundenablauf](spec/COMBAT.md#11-rundenablauf)
8. **Der laufende Kampfzustand wird nie serialisiert**; ein Dungeon startet immer bei Floor 1,
   Belohnungen werden pro Floor-Sieg committet.
   → [Kampfzustand und Reload](spec/SIMULATION.md#5-kampfzustand-und-reload),
   [Belohnungen aus einem Sieg](spec/PROGRESSION.md#2-belohnungen-aus-einem-sieg)
9. **Alle Werte laufen über native `number`**; die Achsen sind gedeckelt (Level 100, Item-Level
   `+100`, kein Prestige). → [Feststehende Regeln](spec/COMBAT.md#25-feststehende-regeln),
   [Prestige](spec/PROGRESSION.md#5-prestige)
10. **Kein Offline-Progress.** → [Grundmodell](spec/SIMULATION.md#1-grundmodell-verbindlich)
11. **Achsen-Trennung:** Offensive Magnituden skalieren ausschließlich aus Attack, defensive
    ausschließlich aus defensiven Quellen; kein Stat und kein Effekt konvertiert zwischen den
    Achsen. → [Feststehende Regeln](spec/COMBAT.md#25-feststehende-regeln)
