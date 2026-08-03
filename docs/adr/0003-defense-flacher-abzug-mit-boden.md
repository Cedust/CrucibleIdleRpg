# ADR-0003: Defense als flacher Abzug mit prozentualem Boden

- **Status:** Abgelöst durch [ADR-0008](0008-defense-ratio-mitigation.md)
- **Datum:** 2026-07-30
- **Betrifft:** SPEC.md §2.3 (Schritt 4); BALANCING.md §2, §5; Feature-Ordner `src/features/combat/`

---

## Kontext

Die Schadenspipeline (SPEC §2.3) zieht **Defense** als **flachen** Wert vom eingehenden Tick ab.
Was passiert, wenn Defense den Tick übersteigt, war nicht definiert — und die Lücke ist scharf,
weil auf der eingehenden Seite kein Zufall mehr liegt: Die Gegner-Angriffsstärke `S` ist flat
(`S` = Attack, ohne Streuung), gewürfelt wird nur Evasion und Block. Die Klemmregel entscheidet
damit nicht über Streuung, sondern über ein **Regime**.

Das strukturelle Risiko: Laut BALANCING §2 wachsen **Charakter-Defense linear** und
**Gegner-Attack linear**. Zwei lineare Kurven im Rennen sind instabil — die mit der größeren
Steigung gewinnt dauerhaft:

- Gewinnt Defense, sinkt der eingehende Schaden auf **0**. Die **Attrition** (SPEC §4.4), also der
  Kern der Spannung laut DESIGN §3, verschwindet vollständig.
- Gewinnt Gegner-Attack, wird Defense zum toten Stat.

Es gibt keinen Selbstkorrektur-Mechanismus. Rechnerisch: Bei flachem Abzug ist die effektive
Health `Health / (Tick − Defense)` — eine **Hyperbel**, die explodiert, sobald Defense sich dem
Tick nähert.

Randbedingung, die den Fall von den üblichen Vergleichsspielen unterscheidet: **Alle Achsen in
Crucible sind gedeckelt.** Defense speist sich aus Baseline (Level ≤ 100) + Resilience (≤ 100
Punkte) + Toughness (Item-Level ≤ `+100`, Gem-Level gedeckelt); Gegner-Attack endet bei Floor 300.
Es gibt keine unbegrenzte Skalierung und kein Prestige (SPEC §4.7) — die Matrix ist eine endliche,
handgeschriebene Tabelle mit bekanntem Endpunkt.

## Betrachtete Alternativen

- **Option A — Klemmen bei 0.** Kein Zusatzparameter.
  - _Pro:_ einfachste Regel.
  - _Contra:_ erlaubt das Unverwundbarkeits-Regime; Attrition kann vollständig ausfallen.
- **Option B — Absolutes Minimum (z. B. „mindestens 1 Schaden").**
  - _Pro:_ verhindert die formale Division durch Null.
  - _Contra:_ wirkungslos. Charakter-Health wächst linear; 1 Schaden pro Tick ist über einen
    Dungeon hinweg praktisch Unverwundbarkeit. Die Untergrenze muss mit der Bedrohung mitwachsen.
- **Option C — Prozentualer Boden: `max(nachBlock × Mindestanteil, nachBlock − Defense)`.**
  - _Pro:_ entschärft das Zwei-Kurven-Rennen dauerhaft — der Worst Case ist ein Spieler am Boden,
    der weiterhin Schaden nimmt. Attrition greift in jedem Regime; Defense bleibt bis zum Boden
    immer nützlich (bei 10 % also höchstens 90 % Reduktion). Ein einzelner Balancing-Wert. Die
    flache Lesbarkeit („Defense 90 zieht 90 ab") bleibt erhalten.
  - _Contra:_ ein Parameter mehr; Defense kann das Problem eingehenden Schadens nie allein lösen.
- **Option D — Ratio-Formel `Defense / (Defense + K)` (Branchenstandard).** LoL/Dota nutzen ein
  festes `K`, WoW und Diablo 3/4 koppeln `K` an das Angreifer-Level, Path of Exile an die
  Trefferhöhe.
  - _Pro:_ mathematisch stabil. Die effektive Health ist `Health × (1 + Defense/K)` — **linear** in
    Defense, jeder Punkt ist konstant viel wert. Mit `K ∝ Tick` ist der Schutz invariant unter
    proportionaler Skalierung und braucht **keinen** Klemmwert.
  - _Contra:_ schlechter lesbar („Defense 90 reduziert gegen diesen Gegner um 31 %, gegen den
    daneben um 28 %") und damit gegen DESIGN §3 („verständlicher Schadensfluss"). Farmen alter
    Dungeons wird nicht von selbst trivial, sondern muss über den Health-Vorsprung kommen. Und das
    Instabilitäts-Argument, das für sie spricht, verliert in einem **gedeckelten** System seine
    Schärfe: Dort ist die Hyperbel eine Tuning-Aufgabe mit ausrechenbarem Worst Case, keine
    Bruchstelle.

## Entscheidung

Wir nutzen **Option C: flacher Abzug mit prozentualem Boden.**

```
nachDefense = max(nachBlock × Mindestanteil, nachBlock − Defense)
```

Der Mindestanteil ist ein Balancing-Wert (Startvorschlag **10 %**).

Begründung gegenüber Option D: Die Lesbarkeit des flachen Abzugs passt zum ausdrücklichen
Anspruch, den Schadensfluss auf einen Blick verständlich zu halten, und die Trivialität alter
Dungeons beim Farmen ergibt sich von selbst (Endgame-Defense trifft dort überall den Boden). Das
Hauptargument für Option D — Instabilität bei unbegrenzter Skalierung — greift hier nicht, weil
jede Achse cappt.

**Auflage:** Pipeline-Schritt 4 wird als **eigene, testbare Funktion** gekapselt, damit ein
Wechsel auf Option D ein Eingriff an einer Stelle bleibt.

**Revisions-Auslöser:** Zeigt das Playtesting, dass Defense zwischen Gott-Stat und totem Stat
pendelt, wird auf `Defense / (Defense + c × Tick)` gewechselt (neuer ADR).

## Konsequenzen

- **Positiv:** Attrition ist in jedem Zahlenregime wirksam; Defense ist nie wertlos und nie
  absolut; die Balancing-Kurven müssen sich nicht auf Messers Schneide treffen; die UI kann den
  Abzug als schlichte Zahl zeigen; alte Dungeons laufen beim Farmen von selbst durch.
- **Negativ / Kompromisse:** Ein zusätzlicher Balancing-Parameter. Defense allein kann den
  eingehenden Schaden nie beherrschen — Barrier, Evasion und Regeneration bleiben notwendig
  (beabsichtigt). Der Wechsel auf die Ratio-Form bleibt eine offene Rückfalloption statt einer
  von Anfang an stabilen Formel.
- **Folgt daraus:** Ein **Nebeneffekt** ist explizit zu beachten und in BALANCING §2 als
  Leitplanke vermerkt: Die Pipeline läuft **pro Gegner-Angriff**, Defense wird also so oft
  abgezogen, wie Gegner in der Runde handeln. Formationen aus vielen schwachen Gegnern werden
  dadurch stark von Defense gekontert, Formationen aus wenigen starken gehen an ihr vorbei — beim
  Formationsdesign darf „sechs Gegner" nicht versehentlich leichter werden als „zwei Gegner".
  SPEC §2.3 (Schritt 4) und BALANCING §5 wurden entsprechend ergänzt.
