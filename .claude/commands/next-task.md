---
description: Nächsten ready-Task aus der ROADMAP abarbeiten (optional: Task-Nummer)
argument-hint: "[Task-Nummer, z. B. 005]"
---

Starte Task $ARGUMENTS aus `docs/backlog/ROADMAP.md`. Ohne Angabe einer Nummer: den
nächsten `ready`-Task.

1. Lies `AGENTS.md` und `docs/backlog/README.md`.
2. Wähle den Task — ohne Angabe den obersten `ready`-Eintrag des aktiven Meilensteins in
   `ROADMAP.md`. Prüfe, dass seine Abhängigkeiten auf `done` stehen, und lies die
   Task-Datei unter `docs/backlog/tasks/`.
3. Lies alle unter „Verbindliche Spec-Anker" verlinkten Spec-Abschnitte, bevor du Code
   schreibst. Bei Widerspruch zwischen Task und SPEC gilt die SPEC.
4. Setze den Task auf `in progress` und arbeite ihn ab — von unten nach oben: reine Logik
   mit Unit-Tests, dann Store, dann UI. Jedes Akzeptanzkriterium wird durch einen Test
   oder eine prüfbare Änderung gedeckt.
5. Fehlt eine Regel: nicht erfinden. Eintrag in `docs/backlog/OPEN_ISSUES.md`, Task auf
   `blocked`, und melde dich bei mir.
6. Definition of Done (`AGENTS.md` §11) abarbeiten, bis alles grün ist.
7. Status pflegen: Task auf `done`, freigewordene Folge-Tasks auf `ready`, Tabelle in
   `ROADMAP.md` angleichen.
8. Conventional Commit. Kein Push, kein PR ohne meine Freigabe.

Zeig mir vor Schritt 4 kurz, welchen Task du gewählt hast und wie du ihn schneidest.
