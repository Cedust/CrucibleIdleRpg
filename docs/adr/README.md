# Architecture Decision Records (ADR)

> **Zweck:** Entscheidungs-Logbuch. Ein ADR hält **eine** nennenswerte Entscheidung
> als **unveränderliche Momentaufnahme** fest — mit Kontext, betrachteten Alternativen
> und Konsequenzen. Interne Doku ist **Deutsch** (AGENTS.md §1).

---

## ADR vs. AGENTS.md — wer sagt was?

|          | [../../AGENTS.md](../../AGENTS.md)    | ADR                                           |
| -------- | ------------------------------------- | --------------------------------------------- |
| Frage    | „Was gilt **jetzt**?"                 | „Was haben wir **wann & warum** entschieden?" |
| Zeitform | Gegenwart, **lebend** (wird editiert) | Momentaufnahme, **unveränderlich**            |
| Gehalt   | die Regel                             | Kontext + Alternativen + Konsequenzen         |

**AGENTS.md ist die lebende Regel-Quelle.** ADRs erklären das _Warum dahinter_ und
bewahren verworfene Alternativen. Beide widersprechen sich nie: Ändert ein ADR eine
bestehende Regel, wird **die Regel in AGENTS.md aktualisiert** _und_ der ADR hält das
„vorher / nachher / warum" fest.

---

## Wann einen ADR schreiben?

Nur, wenn eine Entscheidung mindestens eines erfüllt:

- Sie hatte **echte Alternativen**, die man später nachvollziehen will.
- Sie ist **umstritten oder folgenreich**.
- Sie **kehrt eine frühere Entscheidung um** („warum kippen wir das?").

Unstrittige, gesetzte Konventionen gehören **nicht** ins ADR-Log — sie stehen in
AGENTS.md. ADRs sind für die **Zukunft**, nicht zum rückwirkenden Dokumentieren.

---

## Konventionen

- **Dateiname:** `NNNN-kurzer-titel.md` (fortlaufende Nummer, kebab-case),
  z. B. `0001-seedbarer-prng.md`.
- **Vorlage:** [0000-template.md](0000-template.md) kopieren, Nummer vergeben, ausfüllen.
- **Nummer `0000`** ist für die Vorlage reserviert; echte ADRs beginnen bei `0001`.
- Ein veröffentlichter ADR wird **nicht mehr inhaltlich editiert**. Änderung der
  Entscheidung ⇒ **neuer** ADR, der den alten via `Status: Ersetzt durch ADR-NNNN`
  ablöst; der alte bekommt `Status: Abgelöst durch ADR-NNNN`.

### Status-Werte

| Status                    | Bedeutung                              |
| ------------------------- | -------------------------------------- |
| `Vorgeschlagen`           | zur Diskussion, noch nicht beschlossen |
| `Akzeptiert`              | beschlossen und gültig                 |
| `Abgelöst durch ADR-NNNN` | durch einen neueren ADR ersetzt        |
| `Verworfen`               | doch nicht umgesetzt                   |

---

## Index

<!-- Neue ADRs hier eintragen: | NNNN | Titel | Status | -->

| Nr. | Titel             | Status |
| --- | ----------------- | ------ |
| –   | _noch keine ADRs_ | –      |
