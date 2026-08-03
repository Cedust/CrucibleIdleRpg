---
name: next-task
description: Einen Task aus docs/backlog/ROADMAP.md spezifikationsgeleitet, testgestützt und mit risikobasiertem unabhängigem Review umsetzen. Verwenden, wenn der Benutzer den nächsten Roadmap-Task oder einen bestimmten beziehungsweise bereits laufenden Task starten, fortsetzen oder abschließen möchte.
---

# Roadmap-Task umsetzen

Den angeforderten Task aus `docs/backlog/ROADMAP.md` vollständig bis zu einem geprüften,
committeten Ergebnis umsetzen. Einen laufenden Task fortsetzen, bevor neue Arbeit begonnen wird.

## 1. Auftrag und Quellen klären

1. `AGENTS.md` und `docs/backlog/README.md` vollständig lesen.
2. Den Task auswählen: eine genannte Tasknummer verwenden; bei Formulierungen wie „aktueller
   Task“, „fortsetzen“ oder „abschließen“ den passenden `in progress`-Task verwenden. Ohne Nummer
   oder laufenden Task den ersten `ready`-Eintrag des aktiven Milestones wählen. Bei mehreren
   laufenden Tasks nicht raten, sondern eine eindeutige Auswahl anfordern. Alle Abhängigkeiten
   auf `done` prüfen und die zugehörige Datei unter `docs/backlog/tasks/` lesen.
3. Alle unter `Verbindliche Spec-Anker` verlinkten Abschnitte vor einer Codeänderung lesen. Bei
   Widersprüchen der SPEC folgen.
4. Ausgangs-Commit sowie staged, unstaged und ungetrackte Dateien festhalten und als
   `taskzugehörig` oder `taskfremd` einordnen. Beim Fortsetzen bereits vorhandene taskzugehörige
   Änderungen in Umsetzung und Review aufnehmen. Taskfremde Änderungen nicht überschreiben und
   nicht in den Task hineinziehen.
5. Akzeptanzkriterien in beobachtbare Ergebnisse übersetzen und dem Benutzer kurz Task,
   Umsetzungsschnitte, Teststrategie und vorgesehene Review-Stufe nennen.

## 2. Teststrategie und Ausgangslage festlegen

- Bei einem Bugfix zuerst einen Regressionstest schreiben, der den Fehler reproduziert.
- Bei neuer oder geänderter Spiellogik zuerst deterministische Verhaltenstests aus SPEC und
  Akzeptanzkriterien ableiten; keine Implementierungsdetails festschreiben.
- Bei UI-Verhalten bevorzugt aus Benutzersicht testen. Playwright nur für kritische
  Ende-zu-Ende-Flows einsetzen.
- Bei reinen Doku-, Formatierungs-, Styling- oder mechanischen Refactoring-Änderungen kein
  künstliches TDD erzwingen; stattdessen den passenden statischen oder visuellen Nachweis planen.
- Relevante bestehende Tests vor der Änderung ausführen, wenn das mit vertretbarem Aufwand eine
  belastbare Baseline liefert. Vorbestehende Fehler ausdrücklich festhalten.

## 3. Von unten nach oben implementieren

1. Den Task auf `in progress` setzen.
2. In kleinen, prüfbaren Schnitten arbeiten: reine Logik und Unit-Tests, danach Store und
   Integration, zuletzt UI.
3. Für testpflichtige Logik den Red-Green-Refactor-Zyklus verwenden und nach jedem Schnitt die
   engste relevante Suite ausführen.
4. Jedes Akzeptanzkriterium durch einen Test oder einen anderen nachvollziehbaren Nachweis
   abdecken.
5. Fehlende Regeln nicht erfinden. Stattdessen einen Eintrag in
   `docs/backlog/OPEN_ISSUES.md` anlegen, den Task auf `blocked` setzen und den Blocker melden.

## 4. Selbstvalidierung abschließen

1. Den vollständigen Diff gegen Task, SPEC, Architekturregeln und unbeabsichtigte Nebenänderungen
   prüfen.
2. Die gesamte anwendbare Definition of Done aus `AGENTS.md` Abschnitt 11 ausführen. Einen Task
   erst reviewen lassen, wenn die Implementierung in einem belastbar prüfbaren Zustand ist.
3. Fehlgeschlagene Checks beheben oder als nachweislich vorbestehend melden; nicht verschweigen.

## 5. Unabhängiges Review risikobasiert ausführen

Reviewer ausschließlich lesend einsetzen. Ihnen Task, verbindliche SPEC-Anker und den exakten
Review-Umfang geben: alle als taskzugehörig eingeordneten Änderungen seit dem festgehaltenen
Ausgangs-Commit einschließlich bereits vorhandener Task-Arbeit, den zugehörigen staged und
unstaged Diff sowie jede zugehörige ungetrackte Datei. Taskfremde Änderungen ausdrücklich
ausschließen. Weder erwartete Findings noch eigene Schlussfolgerungen vorwegnehmen. Parallele
Reviewer müssen voneinander unabhängige Prüffragen erhalten. Alle Ergebnisse abwarten.

- **Trivial:** Nur bei nachweislich verhaltensneutralen Änderungen wie Formatierung,
  redaktioneller Doku oder einer mechanischen Umbenennung keinen Subagenten erzwingen; einen
  fokussierten Selbstreview durchführen. SPEC-, Architektur-, Workflow- und Statusänderungen sind
  nicht automatisch trivial.
- **Standard:** Bei einer nicht trivialen Code- oder internen Dokumentationsänderung
  `correctness_reviewer` einsetzen.
- **Erhöht:** Bei Spiellogik, Determinismus, Timern, Persistenz, Migrationen, Security oder
  querschnittlichen Änderungen zusätzlich `test_reviewer` einsetzen.
- **UI:** Bei relevanten React-, Zustand-, Playback- oder Accessibility-Änderungen zusätzlich
  `ui_reviewer` einsetzen.
- Höchstens drei Reviewer parallel starten. Schreibende Subagenten nicht für den Review
  verwenden. Ist Subagent-Delegation nicht verfügbar, dieselben Prüffragen in getrennten,
  fokussierten Selbstreviews beantworten und die Einschränkung melden.

Von jedem Reviewer nur priorisierte, umsetzbare Findings verlangen: Schweregrad, Datei und Zeile,
betroffenes Verhalten, konkrete Evidenz oder Reproduktion und gegebenenfalls die fehlende
Testabdeckung. Stilhinweise ohne Fehlerrisiko verwerfen.

## 6. Findings verifizieren und einarbeiten

1. Jedes Finding selbst anhand von Code, SPEC und Tests prüfen. Review-Ergebnisse nicht blind
   übernehmen.
2. Findings als `bestätigt`, `widerlegt` oder `bewusst zurückgestellt` einordnen. Zurückstellungen
   begründen und keine sachfremde Scope-Erweiterung vornehmen.
3. Bestätigte Probleme möglichst zuerst durch Reproduktion oder Test absichern, dann minimal
   beheben.
4. Nach Korrekturen alle betroffenen Checks und die anwendbare Definition of Done erneut
   ausführen. Nur bei substanziellen Review-Korrekturen einen gezielten zweiten Review anfordern.

## 7. Task abschließen und übergeben

1. Den Task erst für den finalen PR-Diff auf `done` setzen, wenn alle Akzeptanzkriterien erfüllt,
   alle erforderlichen Checks grün und alle bestätigten Findings bearbeitet sind. Dieser Status
   wird auf der gemeinsamen Roadmap erst mit dem Merge verbindlich.
2. Neu entblockte Folgetasks im selben finalen Diff auf `ready` setzen und die Tabelle in
   `docs/backlog/ROADMAP.md` synchronisieren. Keinen Folgetask vom ungemergten Task-Branch aus
   beginnen.
3. Einen Conventional Commit erstellen.
4. Ohne ausdrückliche Freigabe weder pushen noch einen Pull Request öffnen.
5. Dem Benutzer knapp das Ergebnis, die wesentlichen Änderungen, ausgeführte Checks mit Status,
   die Behandlung der Review-Findings, den bis zum Merge vorläufigen Roadmap-Status und
   verbleibende Risiken nennen.
