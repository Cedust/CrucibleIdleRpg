# docs/ — Dokumentations-Leitfaden

> **Zweck:** Dieser Ordner dokumentiert **das Spiel** — Vision, Regeln, Zahlen, Begriffe,
> Entscheidungs-Historie. **Wie** wir es bauen (Stack, Struktur, Tooling, Workflow) steht in
> [../AGENTS.md](../AGENTS.md). Interne Doku ist **Deutsch**, Spieltexte (UI + Content) **Englisch**.

Diese Datei ist der Einstieg in `docs/`: Landkarte, Stil-Regeln, Verweis-Konvention und die
Pflichten bei Doku-Änderungen.

---

## 1. Landkarte

| Datei                                            | Frage                                    | Inhalt                                                                                                                                             |
| ------------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| [DESIGN.md](DESIGN.md)                           | „Warum / wie soll es sich anfühlen?"     | Vision, Design-Pillars, Player Experience                                                                                                          |
| [SPEC.md](SPEC.md)                               | „Wie verhält es sich exakt?"             | Einstieg mit **Invarianten** + Themen-Übersicht; der Inhalt liegt thematisch aufgeteilt in [spec/](spec/)                                          |
| [BALANCING.md](BALANCING.md)                     | „Warum diese Kurve / dieser Wert?"       | Balancing-Philosophie & Begründung. Die umgesetzten Zahlen leben als Content unter `src/game/` ([AGENTS.md §4](../AGENTS.md#4-content--balancing)) |
| [GLOSSARY.md](GLOSSARY.md)                       | „Wie heißt das — DE-Prosa ↔ EN-Code/UI?" | **Namens-Register, keine Regel-Quelle:** ein Eintrag nennt, grenzt ab und verlinkt den Wohnort in der Spec                                         |
| [backlog/OPEN_ISSUES.md](backlog/OPEN_ISSUES.md) | „Was ist noch offen?"                    | offene Design-, Balancing- und Spec-Fragen. **Nichts davon ist entschieden** — kein Agent implementiert daraus                                     |
| [adr/](adr/)                                     | „Was wurde wann & warum entschieden?"    | Architecture Decision Records: unveränderliches Logbuch, erklärt das Warum hinter einer geltenden Regel ([adr/README.md](adr/README.md))           |

### Spec-Teildateien

Der Regelinhalt liegt in [spec/](spec/) — die Aufteilung steht in
[SPEC.md § Teildateien](SPEC.md#teildateien).

---

## 2. Präzedenz bei Konflikten

→ [AGENTS.md § Präzedenz bei Konflikten](../AGENTS.md#präzedenz-bei-konflikten).

---

## 3. Dokumentations-Stil

- **Beschreibe den Ist-Zustand.** Schreib, was gilt — nicht, was nicht (mehr) gilt oder
  wovon etwas unabhängig ist. Kontrast zu früheren Entwürfen gehört in die Diskussion,
  nicht ins Dokument.
- **Ein Fakt an genau einer Stelle.** Punkte nicht über Abschnitte/Dateien wiederholen —
  stattdessen den Wohnort verlinken.
- **Knapp.** Kein rhetorisches Framing; Begründungen gehören nach DESIGN/BALANCING, nicht
  ins SPEC.

---

## 4. Verweise & Anker

- **Adressiert wird über Datei + Anker**, nicht über eine dateiübergreifende Nummerierung:
  `docs/spec/RUNES.md#4-auslösung-verbindlich`.
- Die `§`-Nummern sind **dateilokale** Gliederung und beginnen in **jeder** Datei bei `1`.
- **Jede `§`-Referenz ist ein Link — auch innerhalb derselben Datei.** Der Grund ist der
  Doc-Link-Check: Er prüft Anker, nicht Fließtext. Eine nackte `§2.1` im Text bricht beim
  Umnummerieren still, ein Anker-Link bricht sichtbar.
  - **Innerhalb einer Datei:** Linktext `§2.1`, Linkziel nur der Anker
    (`#21-charakter-zug-ausgehender-schaden`) — ohne Dateinamen.
  - **Über Dateigrenzen:** Dateiname in den Linktext (`BALANCING §4`), Pfad + Anker ins
    Linkziel (`../BALANCING.md#4-ökonomie-anker`).
  - Ausnahme: in Code-Blöcken sind keine Links möglich; dort steht der Verweis als Text mit
    Dateinamen (`COMBAT §2.1`).
- **Aus Code heraus** wird der Pfad genannt, nicht die Nummer:
  `// siehe docs/spec/RUNES.md#4-auslösung-verbindlich`.
- `npm run docs:links` prüft jeden Anker — eine umbenannte Überschrift bricht damit sichtbar.
- **Bestandsschutz für ADRs:** Ein veröffentlichter ADR wird nicht mehr editiert
  ([adr/README.md](adr/README.md#konventionen)); seine `§`-Referenzen bleiben daher als Text
  stehen.

---

## 5. Pflichten bei Doku-Änderungen

1. **Wohnort prüfen:** Gehört der Fakt hierher, oder gibt es ihn schon woanders? Dann dort
   pflegen und hierher verlinken.
2. **Regel ⇒ Spec.** Neues Spielverhalten gehört in [spec/](spec/); Begründung nach
   [DESIGN.md](DESIGN.md) bzw. [BALANCING.md](BALANCING.md); ein Tuning-Wert nach `src/game/`.
3. **Neuer Begriff ⇒ Eintrag im [GLOSSARY.md](GLOSSARY.md)** (mit Link auf den Wohnort).
4. **Entscheidung mit echten Alternativen ⇒ ADR** — Kriterien in
   [adr/README.md](adr/README.md#wann-einen-adr-schreiben). Ändert ein ADR eine geltende Regel,
   wird die Regel zusätzlich an ihrem Wohnort aktualisiert.
5. **Entschiedene Frage ⇒ aus [backlog/OPEN_ISSUES.md](backlog/OPEN_ISSUES.md) entfernen**, sobald
   sie in Spec/Design/ADR gelandet ist.
6. **`npm run docs:links` laufen lassen** — Pflicht in der Definition of Done
   ([AGENTS.md §11](../AGENTS.md#11-entwicklungs-workflow-für-agenten-verbindlich)), läuft auch im
   pre-commit-Hook.
7. **Commit** als `docs:` (Conventional Commits).
