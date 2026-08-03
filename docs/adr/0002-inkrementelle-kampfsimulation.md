# ADR-0002: Inkrementelle Kampfsimulation ohne Rundenlimit

- **Status:** Akzeptiert
- **Datum:** 2026-07-25
- **Betrifft:** SPEC.md §1, §1.1, §5; AGENTS.md §5; Feature-Ordner `src/features/combat/`

---

## Kontext

Die SPEC beschreibt den Kampf als **deterministisch** und **render-unabhängig** (Simulation ≠
Rendering, AGENTS.md §5), ließ aber zwei Punkte offen:

1. **Terminierung:** Kann ein Kampf „hängen", wenn das Team zu schwach ist, die Gegner in
   vertretbarer Zeit zu besiegen, aber genug Sustain/Regeneration hat, um nicht zu sterben?
2. **Wann wird gerechnet?** Der ursprüngliche Wortlaut („vollständig simuliert und **danach**
   abgespielt") legte nahe, den **gesamten** Kampf vor dem ersten Frame durchzurechnen.

Randbedingungen:

- Schaden/Health laufen über **break_eternity.js** (AGENTS.md §5) — Werte können astronomisch groß
  werden.
- **Catch-up ist Pflicht** (AGENTS.md §5): Ein gedrosselter/minimierter Tab muss beim Wiederöffnen
  fehlende Runden **ohne Animation** nachrechnen. **Offline-Progress** ist ein Non-Goal.
- **Determinismus ist Pflicht:** gleicher Seed + Input ⇒ exakt gleicher Verlauf (seedbarer PRNG).
- Ziel: **keine spürbare Wartezeit** beim Betreten eines Floors.

Zentrale Beobachtung zur Terminierung: Gegner haben **keine Heilung** (§1.3) und
Charakterangriffe treffen **immer voll** mit positivem Schaden (§2.2); jeder lebende Charakter
erreicht stets ein Ziel. Die **Gegner-Gesamt-Health sinkt daher monoton** → ein echter,
unendlicher Deadlock ist ausgeschlossen. Möglich bleibt nur der **pathologisch lange** Kampf
(winziger Schaden gegen sehr hohe Gegner-Health), der endlich ist, aber viele Runden dauern kann.

## Betrachtete Alternativen

**Frage 1 — Wann rechnen?**

- **Option A — Vorab-Komplettberechnung:** Ganzen Kampf simulieren, dann abspielen.
  - _Pro:_ Ausgang sofort bekannt.
  - _Contra:_ Bei sehr langen Kämpfen spürbarer Vorab-Hänger beim Floor-Einstieg; der Ausgang wird
    vor Kampfende gar nicht benötigt.
- **Option B — Rein live an Render-Frames gekoppelt:** Anzeige = Rechnung.
  - _Pro:_ kein Vorab-Wait; Spieler kann selbst abbrechen.
  - _Contra:_ **bricht Catch-up** — im gedrosselten/Hintergrund-Tab stoppen die Frames und damit
    der Kampf. Für ein Idle-Game disqualifizierend.
- **Option C — Inkrementelle/Lazy-Simulation (reine „Zustand → nächste Runde"-Funktion):** Die
  Engine erzeugt Runden schrittweise auf Abruf; dasselbe Schrittwerk treibt Playback (ein Schritt
  pro Takt) und Catch-up (Schritte ohne Animation).
  - _Pro:_ kein Vorab-Wait (nur die nächste Runde wird gerechnet); Determinismus und Catch-up
    bleiben erhalten; manueller Abbruch fällt natürlich ab.
  - _Contra:_ Ausgang nicht im Voraus bekannt — für Attrition (§4.4) aber erst am Kampfende nötig,
    also kein realer Verlust.

**Frage 2 — Braucht es ein Rundenlimit als Sicherheitsnetz?**

- **Option D — Hartes Rundenlimit `R_max` → Niederlage:** Nach `R_max` Runden ohne Sieg gilt der
  Kampf als verloren.
  - _Pro:_ deterministische Obergrenze.
  - _Contra:_ zusätzlicher Balancing-Parameter; könnte legitime, sehr lange Builds fälschlich am
    Cap scheitern lassen; unter Option C **technisch nicht nötig** (siehe Entscheidung).
- **Option E — Kein Rundenlimit:** Kampf endet nur durch Sieg, Wipe oder manuellen Abbruch.
  - _Pro:_ kein künstlicher Cap; keine Gefahr, legitime Builds abzuschneiden; ein Parameter weniger.
  - _Contra:_ verlässt sich darauf, dass die Ausführung von sich aus nicht durchdreht — was unter
    Option C gegeben ist.

## Entscheidung

Wir kombinieren **Option C + Option E: inkrementelle Simulation, kein Rundenlimit.**

- **Inkrementelle Simulation:** Die Kampf-Engine ist eine reine, deterministische
  „Zustand → nächste Runde"-Funktion. Der Kampf wird **nicht vorab vollständig** durchgerechnet;
  Runden entstehen **schrittweise auf Abruf**. **Dasselbe Schrittwerk** treibt Playback (eine Runde
  pro Anzeige-Takt) und Catch-up (Runden ohne Animation im Schnelldurchlauf). Der Kampfausgang wird
  erst mit der letzten Runde festgestellt.
- **Kein Rundenlimit:** Ein Kampf endet ausschließlich durch **Sieg**, **Wipe** oder **manuellen
  Abbruch**.

Begründung: Option C liefert die gewünschte „Null-Wartezeit" **ohne** die Catch-up-Zusage (§5) zu
brechen, an der Option B scheitert, und **ohne** den Vorab-Hänger von Option A. Ein Rundenlimit
(Option D) ist unter Option C überflüssig: Die Simulation ist **an Echtzeit gebunden** (eine Runde
pro Takt — auch der Catch-up rechnet nur so viele Runden nach, wie real vergangene Zeit hergibt,
nicht die gesamte Kampflänge), kann also nie in einer Endlosschleife durchdrehen; und da jeder Kampf
ohnehin endlich ist (monoton fallende Gegner-Health), gibt es keinen Zustand, aus dem ein Cap retten
müsste. Den seltenen pathologisch langen Kampf beendet der Spieler per **manuellem Abbruch** — mit
voller Information, statt durch eine willkürliche Grenze abgeschnitten zu werden.

## Konsequenzen

- **Positiv:** Kein Vorab-Wait beim Floor-Einstieg; Determinismus und Catch-up bleiben unangetastet;
  kein künstlicher Cap, der legitime lange Builds abschneiden könnte; ein Balancing-Parameter
  weniger; manueller Abbruch (§1.1) fügt sich nahtlos in das schrittweise Modell.
- **Negativ / Kompromisse:** Der Ausgang steht nicht vorab fest (für aktuelle Anforderungen
  irrelevant); ein sehr zäher Kampf läuft weiter, bis der Spieler eingreift — die Beendigung liegt
  bewusst beim Spieler statt bei einer automatischen Regel.
- **Folgt daraus:** AGENTS.md §5 um die inkrementelle Ausführung ergänzt; SPEC.md §1 (Grundmodell),
  §1.1 (Endbedingungen, „kein Rundenlimit") und §5 (inkrementelle Simulation) entsprechend
  formuliert.
