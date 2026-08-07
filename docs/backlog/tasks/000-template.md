# 000 — Vorlage (kein Arbeitsauftrag)

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Meilenstein**  | M?      |
| **Hängt ab von** | —       |

> Kopiervorlage für neue Tasks. Format und Status-Vokabular: [../README.md](../README.md#1-ein-task).

## Ziel

Ein Satz: was nach diesem Task funktioniert.

## Nicht-Ziel

Was ausdrücklich in einem späteren Task liegt — mit Verweis auf diesen, sobald er existiert.

## Verbindliche Spec-Anker

Je Zeile ein Link plus ein Halbsatz, was daraus gilt — Form:
`[Rundenablauf](../../spec/COMBAT-RUN.md#11-rundenablauf) — Initiative-Ordnung und Pending-Queue`.

Regeln werden hier verlinkt, nicht wiederholt. Fehlt eine Regel, wird sie nicht erfunden:
Eintrag nach [OPEN_ISSUES.md](../OPEN_ISSUES.md) und Status auf `blocked`.

## Akzeptanzkriterien

- [ ] prüfbare Aussage, eine pro Zeile
- [ ] Unit-Tests für neue Spiellogik ([AGENTS.md](../../../AGENTS.md))

## Betroffene Dateien

- `src/...` — erwarteter Umfang, als Orientierung

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
