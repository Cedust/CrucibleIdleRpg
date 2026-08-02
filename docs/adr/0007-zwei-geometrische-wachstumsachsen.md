# ADR-0007: Zwei geometrische Wachstumsachsen im komprimierten Zahlenraum

- **Status:** Akzeptiert
- **Datum:** 2026-08-02
- **Betrifft:** BALANCING.md §1–§3; DESIGN.md §3; spec/CHARACTERS.md §2–§3; spec/COMBAT.md
  §2.2/§2.5; SPEC.md (Invarianten); AGENTS.md §5

---

## Kontext

Das bisherige Zahlenmodell mischte Kurvenformen: Charakter-Attack und Gegner-Health
exponentiell (Zielbild „Attack 10 → 100.000.000", also ×10⁷), Charakter-Health, Gegner-Attack
und Accuracy linear. Attributpunkte addierten einen festen Betrag pro Punkt.

Drei strukturelle Probleme:

1. **Lineare Kurven verlieren relativ.** Bei `A(f) = a₀ + k·f` fällt die relative Steigung wie
   `1/f` — der Floor-zu-Floor-Druck sinkt von ~3 % (früh) auf ~0,3 % (spät). Die Attrition,
   laut DESIGN §3 der Kern der Spannung, flacht damit genau im Endgame ab; Runs werden nach
   hinten leichter statt enger.
2. **Flat-additive Quellen sterben neben exponentiellen.** 100 Attributpunkte mit festem Betrag
   pro Punkt konvergieren gegen eine ×10⁶-Gear-Kurve auf 0 % Beitrag — nach Akt 1 ist jeder
   Punkt Rauschen. Dasselbe gilt für jeden flachen Content-Wert (Barrier, Regeneration,
   Sigil-Beträge): Gegen ×10⁷ muss ausnahmslos alles prozentual oder auf Exponentialtabellen
   formuliert werden.
3. **Die Explosion bezahlt nichts.** Die drei Jobs einer 10⁷-Kurve in Idle-Games —
   Unendlichkeits-Illusion, Prestige-Fallhöhe, Zahlen-Spektakel — greifen hier nicht: Das Spiel
   ist endlich (300 Floors, Caps, kein Prestige), und der Kampf wird laut Pillar live
   mitverfolgt, wo 9–11-stellige Treffer die Lesbarkeit kosten. Das Spektakel des Spiels sind
   die sichtbaren Procs, nicht die Stellenzahl.

Balance lebt in Verhältnissen (Rundenzahl, Attrition pro Floor, relative Wachstumsraten), nicht
in Größenordnungen — die Gesamthöhe der Kurven ist frei wählbar.

## Betrachtete Alternativen

- **Option A — Status quo: exponentiell/linear gemischt, Zielbild ×10⁷.**
  - _Pro:_ Genre-Konvention; große Zahlen als eigener Reiz.
  - _Contra:_ alle drei Probleme oben; Anzeige braucht Suffix-Formatierung (`1.2B`);
    Test-Vektoren sind nicht mehr im Kopf nachrechenbar.
- **Option B — zwei geometrische Achsen, explosiver Zahlenraum (Offense ×10⁷).**
  - _Pro:_ repariert Problem 1; behält das Zahlen-Spektakel.
  - _Contra:_ Probleme 2 und 3 bleiben vollständig bestehen.
- **Option C — zwei geometrische Achsen, komprimierter Zahlenraum (Offense ×~5.000,
  Defense ×~200).**
  - _Pro:_ konstanter relativer Druck auf jeder Tiefe; flache Content-Werte bleiben über Akte
    spürbar und autorierbar; der größte Wert im Spiel (Boss-eHP) bleibt im einstelligen
    Millionenbereich und mit Tausendertrennzeichen darstellbar; Attack startet zweistellig
    (Charakter-Health dreistellig, 100–350) und endet fünfstellig.
  - _Contra:_ Einzelschritte sind prozentual kleiner (Item-Level ~+3 % statt +6,5 %) — Gefahr
    eines „alles ist +3 %"-Gefühls; der Anforderungs-Spread innerhalb eines Runs sinkt von
    ×2,8 auf ×~1,7 (weichere Dramaturgie).

## Entscheidung

Wir nutzen **Option C**. Das Modell besteht aus fünf Bausteinen:

1. **Zwei geometrische Achsen.** Jede Zahlenkurve des Spiels erbt ihre Steigung von genau einer
   Achse: **Offense-Rennen** (Team-Schaden vs. Gegner-Health, ~+3 %/Floor, ×~5.000 über
   300 Floors) und **Defense-Rennen** (Gegner-Attack vs. Team-Überleben, ~+1,8 %/Floor, ×~200).
   Die steile Offense-Achse trägt das Wachstumsgefühl, die flache Defense-Achse hält die
   Attrition auf jeder Tiefe eng.
2. **Multiplikative Quellen-Schichtung.** Derived Stats entstehen als
   `(Baseline + Core-Stat) × (1 + Attribut-%) × (1 + Crucible-%)`. Attributpunkte geben einen
   festen **Prozentsatz** pro Punkt und bleiben damit über die gesamte Kurve gleich viel wert.
3. **Gedeckelte Stats liegen auf Budgets, nicht auf Achsen.** Chance-Stats (Soft-Cap 100 %)
   wachsen über endliche Punkte/Gem-Slots; Damage-Stats ohne Cap bilden den
   Proc-Multiplikator des Team-Schadens (~×4 übers Spiel), begrenzt durch endlichen
   Content-Vorrat statt durch einen Soft-Cap.
4. **Achsen-Trennung als Invariante.** Offensive Magnituden skalieren ausschließlich aus
   Attack, defensive ausschließlich aus defensiven Quellen. Effekte, die konvertieren
   (Lifesteal: Offense → Heilung; Reflekt: erlittener Schaden → Gegner-Health), skalieren
   zwangsläufig mit der falschen Achse und werden übermächtig oder wertlos.
5. **Tuning gegen Korridore.** Elite-/Boss-eHP wird aus Ziel-Rundenzahlen abgeleitet
   (`eHP = Ziel-Runden × Par-Team-Schaden`), Floor-Kurven gegen die Kenngrößen TTK und
   Netto-Attrition pro Run.

Das Progressionsgefühl tragen bewusst **klumpige Spikes** — Refine-Stufen, Verhaltens-Knoten,
Signatur- und Runen-Unlocks — sowie die sichtbaren Procs; die Stellenzahl trägt es nicht mehr.

## Konsequenzen

- **Positiv:** Attrition und Farm-Ertrag fühlen sich auf Floor 280 an wie auf Floor 40; alle
  Progressionsquellen bleiben bis zum Cap relevant; flache Werte sind wieder legitimer Content;
  die UI kommt ohne Zahlen-Suffixe aus; Test-Vektoren bleiben nachrechenbar; die Headroom-Lage
  von ADR-0004 (native `number`) entspannt sich weiter (Spitzenwerte ~10⁶–10⁷).
- **Negativ / Kompromisse:** Der Reiz sehr großer Zahlen entfällt; einzelne Zuwächse sind
  prozentual klein und brauchen die Spike-Struktur als Gegengewicht; die Run-Dramaturgie ist
  weicher und muss im Playtesting gegen den Floor-Exponenten geprüft werden.
- **Folgt daraus:** BALANCING §1–§3 (Philosophie, Achsen, Quellen, Korridore), DESIGN §3
  (Kern-Loop), CHARACTERS §2–§3 (Zusammensetzung, Attribute), COMBAT §2.2/§2.5 und die
  SPEC-Invarianten wurden entsprechend aktualisiert. Die Defense-Formel wechselt im Zuge
  desselben Modells auf Ratio-Mitigation (ADR-0008).
