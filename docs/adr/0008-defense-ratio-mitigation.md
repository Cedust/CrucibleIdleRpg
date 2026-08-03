# ADR-0008: Defense als Ratio-Mitigation mit globaler Konstante

- **Status:** Akzeptiert (ersetzt [ADR-0003](0003-defense-flacher-abzug-mit-boden.md))
- **Datum:** 2026-08-02
- **Betrifft:** spec/COMBAT.md §2.3 (Schritt 4); BALANCING.md §2; GLOSSARY.md

---

## Kontext

ADR-0003 legte Defense als flachen Abzug mit prozentualem Boden fest — begründet mit der
Lesbarkeit („Defense 90 zieht 90 ab") und damit, dass die Instabilität flacher Abzüge in einem
gedeckelten System eine ausrechenbare Tuning-Aufgabe sei. Der ADR benannte selbst den
Revisions-Auslöser: Pendelt Defense zwischen Gott-Stat und totem Stat, wird auf die Ratio-Form
gewechselt.

Mit dem Achsen-Modell aus [ADR-0007](0007-zwei-geometrische-wachstumsachsen.md) überspannt der
eingehende Schaden ×~200 bei geometrischem Verlauf. Über diese Range hat der flache Abzug zwei
Klippen, zwischen denen der spielbare Korridor schmal ist und pro Floor wandert:

- **Zu viel Defense:** jeder Treffer klemmt am Mindestanteil-Boden — jeder weitere
  Toughness-Punkt ist wertlos (verletzt DESIGN §3.2: „kein Investment fühlt sich verschwendet
  an").
- **Zu wenig Defense:** der Abzug ist gegen den gewachsenen Angriff Rauschen.

Dazu erzwingt der Abzug **pro Gegner-Angriff** eine permanente Formations-Leitplanke: Viele
schwache Gegner werden von Defense mehrfach gekontert, wenige starke gehen an ihr vorbei —
jede Formation musste gegen den Defense-Korridor ihrer Tiefe geprüft werden. Der Boden-Parameter
und die Leitplanke sind Kompensationen für die Formel, kein Design-Gewinn.

## Betrachtete Alternativen

- **Option A — flacher Abzug mit Boden (Status quo, ADR-0003).**
  - _Pro:_ Abzug als schlichte Zahl anzeigbar; Anti-Schwarm-Textur.
  - _Contra:_ Klippen und wandernder Korridor (oben); ein Kompensations-Parameter
    (Mindestanteil); dauerhafte Formations-Leitplanke.
- **Option B — Ratio-Formel mit tiefen-skaliertem `K` (z. B. `K ∝ Tick`).**
  - _Pro:_ Mitigation bei Par-Ausbau konstant; branchenüblich (WoW, Diablo).
  - _Contra:_ zweite bewegte Kurve; Defense-Investment entwertet sich still mit der Tiefe
    („dieselbe Rüstung schützt tiefer schlechter") und ist damit schwerer lesbar als ein
    globales `K`.
- **Option C — Ratio-Formel mit globaler Konstante `K`.**
  - _Pro:_ mathematisch stabil ohne Klemmwert — die Mitigation nähert sich 100 %, erreicht sie
    nie; die effektive Health ist `Health × (1 + Defense/K)`, jeder Punkt ist konstant viel
    wert (keine Klippen); die Mitigation ist als wachsende Prozentzahl eine sichtbare
    Fortschritts-Achse; ein einziger Balancing-Wert; Defense-Anzeigen bleiben drei- bis
    vierstellig.
  - _Contra:_ der Abzug ist keine schlichte Zahl mehr — die UI zeigt stattdessen den
    Mitigations-Prozentwert; die Anti-Schwarm-Textur des flachen Abzugs entfällt.

## Entscheidung

Wir nutzen **Option C: Ratio-Mitigation mit globaler Defense-Konstante `K`.**

```
nachDefense = nachBlock × K / (K + Defense)
```

`K` ist ein Balancing-Wert (`src/game/`). Die Mitigation ist proportional und unabhängig von
Trefferhöhe und Gegnerzahl; Defense liegt als Quelle auf der Defense-Achse (ADR-0007).

Die Lesbarkeits-Anforderung aus DESIGN §3 trägt die UI über den Mitigations-Prozentwert
(„Defense 400 ⇒ 67 % Reduktion"); die Anti-Schwarm-Rolle liegt offensiv bei Splash und Counter,
die mit der Gegnerzahl skalieren.

Die Auflage aus ADR-0003 bleibt bestehen: Pipeline-Schritt 4 ist eine eigene, testbare Funktion.

## Konsequenzen

- **Positiv:** Kein Unverwundbarkeits- und kein Toter-Stat-Regime möglich; der
  Mindestanteil-Parameter entfällt; die Formationsgröße ist defensiv neutral — das defensive
  Formations-Budget ist allein die Summe `S` pro Runde, die Leitplanke „Formationsgröße gegen
  Defense" aus BALANCING §2 entfällt; alte Dungeons trivialisiert der eHP- und
  Kill-Speed-Vorsprung.
- **Negativ / Kompromisse:** Der Schadensfluss zeigt einen Prozentfaktor statt eines flachen
  Abzugs; Defense verliert die Sonderrolle gegen viele kleine Treffer.
- **Folgt daraus:** spec/COMBAT.md §2.3 (Schritt 4) samt Test-Vektor und BALANCING §2 wurden
  aktualisiert; ADR-0003 erhält den Status „Abgelöst durch ADR-0008".
