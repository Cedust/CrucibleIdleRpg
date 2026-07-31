# SPEC — Simulation & Zeitverhalten (§5)

> Teil der [SPEC](../SPEC.md). Verbindliche Regeln für Playback, Catch-up, Seeds
> und den Umgang mit dem laufenden Kampfzustand.
> Verwandt: [Kampf](COMBAT.md) · [Persistenz](PERSISTENCE.md)

---

## 5. Simulation & Zeitverhalten (verbindlich)

Diese Punkte sind bereits durch [AGENTS.md](../../AGENTS.md) §5 festgelegt und hier als
Spec-Kontext gespiegelt:

- **Simulation ≠ Rendering:** Die Kampf-Engine ist **reine, deterministische Logik**
  ohne Bezug zu Timern, DOM oder Echtzeit. Das Playback spielt die simulierten Runden
  mit visueller Verzögerung ab.
- **Inkrementelle Simulation:** Der Kampf wird **nicht vorab vollständig** durchgerechnet;
  die Engine erzeugt Runden **schrittweise auf Abruf** (reine „Zustand → nächste Runde"-Funktion).
  **Dasselbe Schrittwerk** treibt beide Modi: das Playback (eine Runde pro Anzeige-Takt) und den
  Catch-up (Runden ohne Animation im Schnelldurchlauf). Der Kampfausgang steht erst mit der letzten
  Runde fest und wird vorher **nicht benötigt** — die Attrition
  ([§4.4](PROGRESSION.md#44-checkpoints-wipe--abbruch)) nutzt die Health am Kampfende.
  Begründung: [ADR 0002](../adr/0002-inkrementelle-kampfsimulation.md).
- **Determinismus:** gleicher Seed + gleicher Input ⇒ exakt gleicher Verlauf.
- **Kein Offline-Progress:** Tab geschlossen ⇒ kein Fortschritt.

### 5.1 Playback — Takt und Geschwindigkeit

- **Anzeigeeinheit ist der Takt: ein Akteur am Zug.** Pro Takt rückt die Markierung in der
  Zugreihenfolge einen Eintrag weiter und im Kampf-Log erscheint **ein Eintrag** — der
  vollständige Zug als Block (Grundtreffer, Multi-Hit-Kette, Splash, ausgelöste Counter),
  nicht als Einzelzeilen.
- **Grundtakt: 1000 ms pro Akteur.** Eine Runde dauert damit so lange, wie sie Akteure hat.
- **Stufen** ([§4.4](PROGRESSION.md#44-checkpoints-wipe--abbruch)): **Pause** ab Spielstart,
  **2×** pro vollendetem Dungeon. Die Einstellung liegt im Save.
- Die Geschwindigkeit betrifft **ausschließlich die Anzeige**. Der Kampfverlauf ist durch den
  Seed festgelegt und bei jeder Stufe identisch — es gibt keinen Balancing-Effekt und keinen
  Exploit.

### 5.2 Zeitverhalten & Catch-up

- **Tragend ist ein Zeit-Akkumulator**, nicht die Page Visibility API: Jeder Anzeige-Takt
  rechnet aus der real vergangenen Zeit, wie viele Takte fällig sind, und führt entsprechend
  viele Schritte aus. Ein gedrosselter Tab feuert selten und holt bei jedem Feuern einen Batch
  nach — das Verhalten ist damit von sich aus korrekt.
- Die **Page Visibility API** liefert nur zwei Zusätze: sofortiges Aufholen beim Sichtbarwerden
  (statt bis zum nächsten Feuern zu warten) und das **Unterdrücken der Animation** während des
  Batches.
- **Deckel: Der Catch-up holt höchstens 5 Minuten real vergangener Zeit nach**; darüber
  hinausgehende Zeit **verfällt**, der Kampf läuft ab dort normal weiter. Damit bleibt „kein
  Offline-Progress" auch bei einem über Nacht minimierten Tab gewahrt.
- Ein Catch-up-Batch arbeitet in einem **Zeitbudget pro Frame** und gibt dazwischen an den
  Browser ab, damit die UI reagiert. Ein Rundenzähler wäre der falsche Maßstab, weil eine Runde
  gegen zwei Gegner ein Bruchteil einer Runde gegen sechs kostet.
- Während des Catch-up werden Belohnungen regulär pro Floor committet
  ([§4.2](PROGRESSION.md#42-belohnungen-aus-einem-sieg)); ein **Wipe**
  beendet den Batch sofort. Danach wird die Anzeige auf den Endzustand synchronisiert.

### 5.3 Seeds und Zufalls-Ströme

Der Zufall ist hierarchisch aus einem Save-Seed abgeleitet:

```
saveSeed              einmal bei Anlage des Spielstands erzeugt, im Save persistiert
└─ runSeed            = derive(saveSeed, dungeonId, runCounter)
   └─ floorSeed       = derive(runSeed, floorIndex)
      ├─ combat       Kampfverlauf (§2.1)
      ├─ init         Gegner-Initiative zu Kampfbeginn (§1.1)
      └─ loot         Drops (§4.2/§4.5)
```

- **Getrennte Ströme sind verbindlich.** Bei einem gemeinsamen Strom würde jede Änderung an der
  Kampfformel alle Loot-Ergebnisse verschieben, weil sich die Zahl der Züge davor ändert — die
  Testsuiten wären dann gegenseitig gekoppelt.
- **`floorSeed` als eigene Stufe** erlaubt es, einen einzelnen Floor im Test zu reproduzieren,
  ohne die vorherigen Floors mitzusimulieren. Ein Bug-Report ist das Tupel
  `(saveSeed, dungeonId, runCounter, floorIndex)`.
- **`runCounter`** ist ein monoton steigender, **beim Run-Start persistierter** Zähler. Daraus
  folgt beides: Beim **Farmen** würfelt jeder Durchlauf frisch, und **Save-Scumming ist
  unmöglich** — ein Reload liefert denselben Zähler und damit exakt denselben Verlauf.
- Die Label der Ströme sind Teil des Determinismus und liegen als Konstanten an einer Stelle.

### 5.4 Kampfzustand und Reload

- **Der laufende Kampfzustand wird nie serialisiert** — weder Health, Floor-Index,
  Pending-Queue noch PRNG-Zustand. Das folgt aus
  [§4.4](PROGRESSION.md#44-checkpoints-wipe--abbruch) (Fortschritt innerhalb eines Dungeons wird
  nicht gespeichert, ein Dungeon startet immer bei Floor 1).
- **Ein Reload oder Tab-Schließen beendet den laufenden Run**, gleichwertig zum manuellen
  Verlassen. **Bereits committete Belohnungen bleiben erhalten**
  ([§4.2](PROGRESSION.md#42-belohnungen-aus-einem-sieg)).
