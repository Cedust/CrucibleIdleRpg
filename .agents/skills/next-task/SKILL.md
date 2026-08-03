---
name: next-task
description: Einen Task aus docs/backlog/ROADMAP.md token-sparend, spezifikationsgeleitet und testgestützt umsetzen. Verwenden, wenn der Benutzer den nächsten Roadmap-Task oder einen bestimmten beziehungsweise bereits laufenden Task starten, fortsetzen oder abschließen möchte.
---

# Roadmap-Task lean umsetzen

Den angeforderten Task aus `docs/backlog/ROADMAP.md` in kleinen, prüfbaren Schnitten umsetzen.
Der Default ist token-sparend: nur die Quellen, Dateien, Checks und Reviews einbeziehen, die
für den konkreten Diff und sein Risiko nötig sind. Einen laufenden Task fortsetzen, bevor neue
Arbeit begonnen wird.

## 1. Auftrag klären

1. Task auswählen: eine genannte Tasknummer verwenden; bei Formulierungen wie „aktueller
   Task“, „fortsetzen“ oder „abschließen“ den passenden `in progress`-Task verwenden. Ohne Nummer
   oder laufenden Task den ersten `ready`-Eintrag des aktiven Milestones wählen. Bei mehreren
   laufenden Tasks nicht raten, sondern eine eindeutige Auswahl anfordern. Alle Abhängigkeiten
   auf `done` prüfen und die zugehörige Datei unter `docs/backlog/tasks/` lesen.
2. Nur bei echten Roadmap-Tasks `docs/backlog/ROADMAP.md`, die Task-Datei und nötige Ausschnitte
   aus `docs/backlog/README.md` lesen. Kleine Ad-hoc-Korrekturen nicht künstlich als
   Roadmap-Arbeit behandeln.
3. `AGENTS.md` und verlinkte SPEC-Anker nicht routinemäßig vollständig neu lesen. Öffne nur die
   Abschnitte, die der Task oder der Diff berührt. Bei Widersprüchen der SPEC folgen.
4. Kurz `git status --short` prüfen. Taskfremde Änderungen nicht überschreiben und nicht in den
   Task hineinziehen. Eine vollständige Ausgangs-Commit-Klassifikation ist nur nötig, wenn bereits
   relevante Änderungen vorhanden sind oder ein Subagent-Review vorbereitet wird.
5. Akzeptanzkriterien in beobachtbare Ergebnisse übersetzen und dem Benutzer knapp Task,
   Umsetzungsschnitt, Teststrategie und Review-Stufe nennen.

## 2. Review-Stufe festlegen

- **Lean** ist der Normalfall für kleine Doku-, Content-, Styling-, UI-, Store- oder
  Refactoring-Änderungen ohne Spielregel-, Persistenz-, Simulation- oder gemeinsame
  Architekturwirkung. Kein Subagent; fokussierter Selbstreview und passende Checks genügen.
- **Standard** gilt für neue oder geänderte Spiellogik. Relevante SPEC-Anker lesen,
  deterministische Tests ergänzen und genau einen `correctness_reviewer` einsetzen, sofern der
  Diff nicht trivial ist.
- **High-Risk** gilt für Determinismus, Timer, Persistenz, Migrationen, Security oder
  querschnittliche React-/Zustand-/Playback-Risiken. Zusätzlich zum `correctness_reviewer`
  höchstens einen fachlich passenden zweiten Reviewer einsetzen: `test_reviewer` für Regeln,
  Tests und Zeitverhalten, `ui_reviewer` für React-, Zustand-, Playback- oder
  Accessibility-Risiken.
- Reviews immer begründen. Wenn Subagent-Delegation nicht verfügbar ist, dieselben Prüffragen in
  einem fokussierten Selbstreview beantworten und die Einschränkung melden.

## 3. Teststrategie wählen

- Bei einem Bugfix zuerst einen Regressionstest schreiben, wenn das ohne unverhältnismäßigen
  Aufwand möglich ist.
- Bei neuer oder geänderter Spiellogik deterministische Verhaltenstests aus SPEC und
  Akzeptanzkriterien ableiten. Zufall mit festem Seed oder gestelltem PRNG prüfen.
- Bei UI-Verhalten aus Benutzersicht testen. Playwright nur für kritische Ende-zu-Ende-Flows oder
  wenn ein manueller Browser-Smoke-Test nicht reicht.
- Bei reinen Doku-, Formatierungs-, Styling- oder mechanischen Refactoring-Änderungen kein
  künstliches TDD erzwingen; stattdessen den passenden statischen oder visuellen Nachweis planen.
- Relevante bestehende Tests vor der Änderung nur ausführen, wenn eine Baseline den Task sichtbar
  entlastet. Vorbestehende Fehler ausdrücklich festhalten.

## 4. Implementieren

1. Bei echten Roadmap-Tasks den Task auf `in progress` setzen, wenn er nicht bereits läuft. Bei
   Ad-hoc-Korrekturen oder sehr kleinen Workflow-Änderungen kann die Statuspflege entfallen.
2. In kleinen, prüfbaren Schnitten arbeiten: reine Logik und Unit-Tests, danach Store und
   Integration, zuletzt UI.
3. Für testpflichtige Logik den engsten sinnvollen Red-Green-Refactor-Zyklus verwenden.
4. Jedes Akzeptanzkriterium durch einen Test, einen statischen Check oder einen nachvollziehbaren
   manuellen Nachweis abdecken.
5. Fehlende Regeln nicht erfinden. Stattdessen einen Eintrag in
   `docs/backlog/OPEN_ISSUES.md` anlegen, den Task auf `blocked` setzen und den Blocker melden.

## 5. Validieren

1. Den Diff gegen Task, relevante SPEC-Anker, Architekturregeln und unbeabsichtigte
   Nebenänderungen prüfen.
2. Die anwendbare Definition of Done aus `AGENTS.md` Abschnitt 11 ausführen. Für kleine Tickets
   zuerst die engsten passenden Checks laufen lassen; vollständige Suiten nur, wenn sie durch die
   Änderung, den Task oder ein Review-Finding gerechtfertigt sind.
3. Fehlgeschlagene Checks beheben oder als nachweislich vorbestehend melden; nicht verschweigen.

## 6. Review ausführen

Subagenten ausschließlich lesend einsetzen.

- Reviewer erst nach grünen fokussierten Tests und Selbstreview einsetzen. Der Review-Brief nennt
  nur betroffene Dateien, Akzeptanzkriterien, relevante SPEC-Anker und den exakten Diff-Umfang.
  Vollständige Grundlagenlektüre wird nicht erneut verlangt, soweit sie für den Diff nicht
  erforderlich ist.
- Schreibende Subagenten nicht für den Review verwenden. Ist Subagent-Delegation nicht verfügbar,
  dieselben Prüffragen in einem fokussierten Selbstreview beantworten und die Einschränkung
  melden.
- Nach kleinen Finding-Fixes genügen Selbstreview und die betroffenen Checks. Einen gezielten
  zweiten Review nur bei substanziellen Korrekturen an Architektur, Persistenz oder Simulation
  anfordern.

Von jedem Reviewer nur priorisierte, umsetzbare Findings verlangen: Schweregrad, Datei und Zeile,
betroffenes Verhalten, konkrete Evidenz oder Reproduktion und gegebenenfalls die fehlende
Testabdeckung. Stilhinweise ohne Fehlerrisiko verwerfen.

## 7. Findings behandeln

1. Jedes Finding selbst anhand von Code, SPEC und Tests prüfen. Review-Ergebnisse nicht blind
   übernehmen.
2. Findings als `bestätigt`, `widerlegt` oder `bewusst zurückgestellt` einordnen. Zurückstellungen
   begründen und keine sachfremde Scope-Erweiterung vornehmen.
3. Bestätigte Probleme möglichst zuerst durch Reproduktion oder Test absichern, dann minimal
   beheben.
4. Nach Korrekturen die betroffenen Checks erneut ausführen. Einen weiteren Review nur bei
   substanziellen Korrekturen an Architektur, Persistenz, Simulation oder deterministischem
   Verhalten anfordern.

## 8. Abschließen

1. Bei Roadmap-Tasks den Task nur dann für den finalen Diff auf `done` setzen, wenn alle
   Akzeptanzkriterien erfüllt, alle erforderlichen Checks grün und alle bestätigten Findings
   bearbeitet sind. Dieser Status wird erst mit dem Merge verbindlich.
2. Neu entblockte Folgetasks nur bei echten Roadmap-Tasks im selben finalen Diff auf `ready`
   setzen und `docs/backlog/ROADMAP.md` synchronisieren. Keinen Folgetask vom ungemergten
   Task-Branch aus beginnen.
3. Nur auf ausdrücklichen Auftrag einen Conventional Commit erstellen.
4. Ohne ausdrückliche Freigabe weder committen, pushen noch einen Pull Request öffnen.
5. Dem Benutzer knapp das Ergebnis, die wesentlichen Änderungen, ausgeführte Checks mit Status,
   die Review-Stufe, die Behandlung der Review-Findings, den Roadmap-Status falls relevant und
   verbleibende Risiken nennen.
