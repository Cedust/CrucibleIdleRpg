---
name: next-task
description: Einen Task aus docs/backlog/ROADMAP.md spezifikationsgeleitet und testgestützt umsetzen. Verwenden, wenn der Benutzer den nächsten Roadmap-Task oder einen bestimmten beziehungsweise bereits laufenden Task starten, fortsetzen oder abschließen möchte.
---

# Roadmap-Task lean umsetzen

Den angeforderten Task aus `docs/backlog/ROADMAP.md` in kleinen, prüfbaren Schnitten umsetzen.
Einen laufenden Task fortsetzen, bevor neue Arbeit begonnen wird.

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
   Umsetzungsschnitt und Teststrategie nennen.

## 2. Teststrategie wählen

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

## 3. Implementieren

1. Bei echten Roadmap-Tasks den Task auf `in progress` setzen, wenn er nicht bereits läuft. Bei
   Ad-hoc-Korrekturen oder sehr kleinen Workflow-Änderungen kann die Statuspflege entfallen.
2. In kleinen, prüfbaren Schnitten arbeiten: reine Logik und Unit-Tests, danach Store und
   Integration, zuletzt UI.
3. Für testpflichtige Logik den engsten sinnvollen Red-Green-Refactor-Zyklus verwenden.
4. Jedes Akzeptanzkriterium durch einen Test, einen statischen Check oder einen nachvollziehbaren
   manuellen Nachweis abdecken.
5. Fehlende Regeln nicht erfinden. Stattdessen einen Eintrag in
   `docs/backlog/OPEN_ISSUES.md` anlegen, den Task auf `blocked` setzen und den Blocker melden.

## 4. Validieren

1. Den Diff gegen Task, relevante SPEC-Anker, Architekturregeln und unbeabsichtigte
   Nebenänderungen prüfen.
2. Die anwendbare Definition of Done ausführen.
3. Fehlgeschlagene Checks beheben oder als nachweislich vorbestehend melden; nicht verschweigen.

## 5. Abschließen

1. Bei Roadmap-Tasks den Task nur dann für den finalen Diff auf `done` setzen, wenn alle
   Akzeptanzkriterien erfüllt und alle erforderlichen Checks grün sind. Dieser Status wird erst mit dem Merge verbindlich.
2. Neu entblockte Folgetasks nur bei echten Roadmap-Tasks im selben finalen Diff auf `ready`
   setzen und `docs/backlog/ROADMAP.md` synchronisieren. Keinen Folgetask vom ungemergten
   Task-Branch aus beginnen.
3. Nur auf ausdrücklichen Auftrag einen Conventional Commit erstellen.
4. Ohne ausdrückliche Freigabe weder committen, pushen noch einen Pull Request öffnen.
5. Dem Benutzer knapp das Ergebnis, die wesentlichen Änderungen, ausgeführte Checks mit Status, den Roadmap-Status falls
   relevant und verbleibende Risiken nennen.
