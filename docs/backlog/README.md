# backlog/ — Arbeitsvorrat und offene Fragen

> **Zweck:** Dieser Ordner beantwortet zwei getrennte Fragen. Einordnung aller Doku-Dateien:
> [../README.md](../README.md#1-landkarte).

| Datei / Ordner                   | Frage                                     | Verbindlichkeit                                       |
| -------------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| [OPEN_ISSUES.md](OPEN_ISSUES.md) | „Was ist noch **nicht entschieden**?"     | **Nichts davon wird implementiert.**                  |
| [ROADMAP.md](ROADMAP.md)         | „In welcher **Reihenfolge** wird gebaut?" | Gibt die Reihenfolge vor, enthält keine Regeln.       |
| [tasks/](tasks/)                 | „Was genau ist zu tun?"                   | **Arbeitsauftrag** — ein Task = eine Agenten-Session. |

Die Trennung ist der Kern dieses Ordners: OPEN_ISSUES sammelt Fragen, `tasks/` sammelt
Aufträge. Ein Task, dessen Ausführung eine offene Frage entscheiden würde, ist falsch
geschnitten — die Frage wird zuerst entschieden und wandert an ihren Wohnort
([../README.md §5](../README.md#2-regeln-für-änderungen)).

---

## 1. Ein Task

- **Ein Task = eine Agenten-Session = ein PR.** Zuschnitt so, dass die Definition of Done
  ([AGENTS.md](../../AGENTS.md)) am Stück
  erreichbar ist.
- **Dateiname:** `NNN-kurz-beschreibend.md`, dreistellig fortlaufend. Die Nummer ist eine
  Kennung, keine Reihenfolge — die Reihenfolge steht in [ROADMAP.md](ROADMAP.md).
- **Vorlage:** [tasks/000-template.md](tasks/000-template.md).

### Pflichtabschnitte

| Abschnitt                   | Inhalt                                                     |
| --------------------------- | ---------------------------------------------------------- |
| **Ziel**                    | ein Satz: was danach funktioniert                          |
| **Nicht-Ziel**              | was ausdrücklich in einem späteren Task liegt              |
| **Verbindliche Spec-Anker** | Links auf die Regeln, gegen die gebaut wird                |
| **Akzeptanzkriterien**      | prüfbare Aussagen, je eine Zeile — Testbarkeit ist Pflicht |
| **Betroffene Dateien**      | erwarteter Umfang, als Orientierung                        |

**Der Abschnitt „Verbindliche Spec-Anker" ist der wichtigste.** Ein Task wiederholt keine
Regel, er verlinkt sie ([../README.md §3](../README.md#2-regeln-für-änderungen)). Was dort nicht
verlinkt ist, wird im Task auch nicht entschieden: Fehlt eine Regel, endet der Task mit einem
Eintrag in [OPEN_ISSUES.md](OPEN_ISSUES.md) statt mit einer erfundenen.

`npm run docs:links` prüft diese Anker mit — eine umbenannte Spec-Überschrift bricht damit
sichtbar, nicht still.

---

## 2. Status

Der Status steht im Kopf der Task-Datei; die Reihenfolge in [ROADMAP.md](ROADMAP.md) spiegelt
ihn.

| Status        | Bedeutung                                              |
| ------------- | ------------------------------------------------------ |
| `ready`       | Abhängigkeiten erfüllt, kann sofort begonnen werden    |
| `in progress` | in Arbeit                                              |
| `done`        | gemerged, Definition of Done erfüllt                   |
| `blocked`     | wartet — die blockierende Frage steht mit Link im Task |

Auf dem Task-Branch stehen `done` und dadurch neu entblockte `ready`-Folgetasks als vorgeschlagener
Zielzustand im finalen PR-Diff. Für die gemeinsame Roadmap werden diese Status erst mit dem Merge
verbindlich; ein Folgetask beginnt daher nicht vom ungemergten Task-Branch aus.

---

## 3. Arbeitsweise für Agenten

1. **Task wählen:** den obersten `ready`-Eintrag des aktiven Meilensteins in
   [ROADMAP.md](ROADMAP.md) — Abhängigkeiten sind im Task genannt.
2. **Spec lesen**, nicht den Task als Regelquelle behandeln: Bei Widerspruch gilt die
   [SPEC](../spec/README.md) ([AGENTS.md](../../AGENTS.md)).
3. **Bauen** — innerhalb eines Tasks von unten nach oben: reine Logik mit Unit-Tests, dann
   Store, dann UI ([AGENTS.md](../../AGENTS.md),
   [§10](../../AGENTS.md)).
4. **Definition of Done** abarbeiten
   ([AGENTS.md](../../AGENTS.md)).
5. **Status pflegen:** Im finalen PR-Diff den Task auf `done` und Folge-Tasks auf `ready` setzen;
   verbindlich werden die Status mit dem Merge. Offen Gebliebenes nach
   [OPEN_ISSUES.md](OPEN_ISSUES.md).

---

## 4. Umgang mit offenen Balancing-Werten

Viele Tuning-Werte sind noch offen ([OPEN_ISSUES §1](OPEN_ISSUES.md#1-offene-balancing-fragen--tuning-notizen)).
Die Kampf-Engine wird trotzdem gebaut: Verbindlich ist die **Struktur** der Formeln, nicht ihr
Tuning ([SPEC § Welche Zahlen in der Spec stehen](../spec/README.md#werte-und-regeln)).

- Fehlende Werte leben als **Platzhalter-Content** unter `src/game/`, sichtbar als solcher
  markiert ([tasks/001-platzhalter-balancing-content.md](tasks/001-platzhalter-balancing-content.md)).
- Unit-Tests prüfen die **Struktur** (Reihenfolge, Summen-Erhaltung, Bezugsgrößen) mit
  eigenen Eingangswerten — sie hängen nicht am Platzhalter-Content.
- Der spätere Balancing-Pass ist damit eine reine `src/game/`-Änderung
  ([AGENTS.md](../../AGENTS.md)).
