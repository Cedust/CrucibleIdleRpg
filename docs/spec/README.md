# SPECIFICATIONS

Diese Dateien beschreiben, **wie sich das Spiel verhält**: Regeln, Zustände, Formeln und
Persistenz. Für eine Implementierung wird die direkt betroffene Datei gelesen, nicht diese
Übersicht vollständig wiederholt.

| Frage                                  | Verbindlicher Wohnort                 |
| -------------------------------------- | ------------------------------------- |
| Spielregel oder Formel                 | passende Datei in `spec/`             |
| Balancing-Leitplanke oder Zielkorridor | [BALANCE.md](BALANCE.md)              |
| konkrete Kurve, Kosten oder Drop-Rate  | typisierter Content unter `src/game/` |
| Produktabsicht und Spielerlebnis       | [../DESIGN.md](../DESIGN.md)          |
| Begründung einer Balance-Entscheidung  | [../BALANCING.md](../BALANCING.md)    |

## Regeldateien

| Datei                                | Inhalt                                                        |
| ------------------------------------ | ------------------------------------------------------------- |
| [COMBAT-RUN.md](COMBAT-RUN.md)       | Kampfablauf, Initiative, Zielauswahl und Formation            |
| [DAMAGE-SYSTEM.md](DAMAGE-SYSTEM.md) | Angriffe, Procs, Schadenspipeline, Bulwark und Heilung        |
| [SIGNATURES.md](SIGNATURES.md)       | Mitigation, Sunder und Suppression                            |
| [CHARACTERS.md](CHARACTERS.md)       | Team, Stats, Attribute, Skilltree und Ausrüstung              |
| [PROGRESSION.md](PROGRESSION.md)     | Weltstruktur, Belohnungen, Crucible, Checkpoints und Prestige |
| [ITEMS.md](ITEMS.md)                 | Items, Loot und Handwerk                                      |
| [RUNES.md](RUNES.md)                 | Rune Grimoire, Talismane, Rites und Masterwork                |
| [SIMULATION.md](SIMULATION.md)       | Simulation, Playback, Catch-up, Seeds und Reload              |
| [PERSISTENCE.md](PERSISTENCE.md)     | Speicherzeitpunkte und Save-Inhalt                            |

Dateiübergreifende Regeln werden an ihrem fachlichen Wohnort formuliert und von dort verlinkt.
Ein Invarianten-Index ist bewusst nicht vorhanden: Er wäre eine zweite, pflegeintensive
Formulierung derselben Regeln.

## Werte und Regeln

Regeln und Formeln stehen in den Fachdateien. Zielkorridore stehen in [BALANCE.md](BALANCE.md),
konkrete Kurven und Kosten unter `src/game/`; offene Werte gehören in
[OPEN_ISSUES.md](../backlog/OPEN_ISSUES.md).
