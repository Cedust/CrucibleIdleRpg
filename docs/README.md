# Dokumentations-Leitfaden

Interne Dokumentation ist Deutsch; Spieltexte, UI und Content sind Englisch.

## 1. Landkarte

| Ort                          | Zweck                                                   |
| ---------------------------- | ------------------------------------------------------- |
| [adr/](adr/)                 | unveränderliche Entscheidungs-Historie                  |
| [backlog/](backlog/)         | offene Fragen, Reihenfolge und konkrete Arbeitsaufträge |
| [spec/](spec/)               | verbindliche Spielregeln und Formeln                    |
| [DESIGN.md](DESIGN.md)       | Produktabsicht, Zielgefühl und Tonalität                |
| [BALANCING.md](BALANCING.md) | Begründung der Balance-Leitplanken                      |
| [GLOSSARY.md](GLOSSARY.md)   | verbindliche Begriffe für Prosa, UI und Code            |

Spielverhalten gehört in die passende Regeldatei unter `spec/`; Balancing-Werte in `src/game/`.
`DESIGN`, `BALANCING`, `GLOSSARY` und ADRs erläutern, ersetzen aber keine Regel. Nicht entschiedene
Punkte bleiben in [backlog/OPEN_ISSUES.md](backlog/OPEN_ISSUES.md) und werden nicht implementiert.

## 2. Regeln für Änderungen

- Ein Fakt hat genau **einen** Wohnort. Statt ihn zu wiederholen, dorthin verlinken.
- Regel ⇒ `spec/`; Wert ⇒ `src/game/`; Begründung ⇒ DESIGN/BALANCING; Begriff ⇒ GLOSSARY;
  folgenreiche Entscheidung mit Alternativen ⇒ ADR.
- Verweise nutzen Datei und Anker, etwa
  `[Schadenspipeline](spec/DAMAGE-SYSTEM.md#13-eingehender-schaden-schadenspipeline)`.
  Code-Kommentare nennen nur den Pfad mit Anker.
- Publizierte ADRs nicht inhaltlich ändern. Eine neue Entscheidung erhält einen neuen ADR und
  löst den alten ausdrücklich ab.

Nach jeder Doku-Änderung `npm run docs:links` ausführen. Neue Begriffe erhalten einen
Glossar-Eintrag; entschiedene Fragen werden aus `OPEN_ISSUES.md` entfernt.
