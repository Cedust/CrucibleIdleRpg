# SPEC — Kampf

> Teil der [SPEC](../SPEC.md): Rundenablauf, Zielauswahl, Kampfwerte, Formeln und die
> Kampfwirkung der Signatur-Skills.
> Verwandt: [Team & Charaktere](CHARACTERS.md) · [Simulation & Zeitverhalten](SIMULATION.md)

---

## 1. Kampf — Grundmodell

- Kampf ist **rundenbasiert** zwischen eigenem Team (drei Charaktere,
  [Team](CHARACTERS.md#1-team)) und einer Gegnerformation (bis zu sechs Gegner,
  [§1.3](#13-gegnerformation)).
- Der Kampf ist **deterministisch** und render-unabhängig simuliert (Simulation ≠ Rendering,
  inkrementelle Ausführung: [Simulation & Zeitverhalten](SIMULATION.md#1-grundmodell-verbindlich)).
- Ergebnis eines Kampfes ist **Sieg** (alle Gegner besiegt) oder **Niederlage/Wipe**
  (alle Charaktere besiegt). Ein Sieg erzeugt eine Belohnung (einziger Fortschrittsweg, siehe
  [DESIGN §2](../DESIGN.md#2-design-pillars)).
- Es gibt **keine aktiven, vom Spieler ausgelösten Fähigkeiten** im Kampf. Der Kampf
  läuft vollständig automatisch ab; der Spieler beeinflusst ihn ausschließlich **vor**
  dem Kampf über Charakter-Builds und Ausrüstung. (Die Architektur bleibt für spätere
  aktive Eingriffe offen, DESIGN-Pillar 4 — aktuell nicht umgesetzt.)

### 1.1 Rundenablauf

Ein Kampf besteht aus **Runden**. In jeder Runde handelt jeder lebende Akteur
(Charaktere und Gegner) **genau einmal**.

**Reihenfolge (Initiative):**

- Alle lebenden Akteure handeln **absteigend nach Initiative**.
- Charaktere haben einen festen Initiative-Wert (Stat, [Team](CHARACTERS.md#1-team)).
- Gegner haben eine **Initiative-Range**; ihr konkreter Wert wird **einmalig zu
  Kampfbeginn** per PRNG innerhalb der Range gewürfelt und bleibt für den restlichen
  Kampf fix. Gewürfelt wird in **Formations-Index-Reihenfolge** (Frontline 1–3, dann
  Backline 1–3), damit die PRNG-Sequenz festliegt.
- Die Reihenfolge ist eine **totale Ordnung** in drei Stufen:
  1. höhere Initiative zuerst,
  2. bei Gleichstand **Gegner vor Charakter**,
  3. bei Gleichstand innerhalb einer Seite **niedrigerer Slot-Index** zuerst — Charaktere in
     Team-Reihenfolge (Korvin → Rhaya → Quinn, [Team](CHARACTERS.md#1-team)), Gegner in
     Formations-Index-Reihenfolge.
- Die Ordnung verbraucht **keinen** PRNG-Zug und ist damit für jeden Zustand eindeutig
  bestimmt.

**Zugreihenfolge als Pending-Queue:**

- Zu Rundenbeginn wird aus allen **lebenden** Akteuren eine nach obiger Ordnung sortierte
  Liste gebildet. Sie ist Teil des Kampfzustands.
- Ein Zug entnimmt das vorderste Element. Die Queue enthält damit stets nur noch
  **offene** Aktionen.
- Stirbt ein Akteur, wird er aus der Queue entfernt — seine Aktion entfällt.
- **Suppression** ([§3.3](#33-suppression-quinn-ranged)) ist die einzige Operation, die die
  Queue umsortiert: Sie verschiebt die noch offene Aktion eines Gegners **innerhalb der
  laufenden Runde** nach hinten.

**Ablauf einer Runde:**

1. **Rundenbeginn:** Für jeden lebenden Charakter wird die **Barrier** neu gesetzt
   (Höhe = Barrier-Stat). Nicht verbrauchte Barrier der Vorrunde **verfällt** — Barrier
   **stackt nicht** über Runden.
2. **Aktionen** in Initiative-Reihenfolge:
   - **Charakter am Zug:** ein Basisangriff auf sein priorisiertes Ziel
     ([§1.2](#12-zielauswahl)), inklusive der Offensiv-Procs
     ([§2.1](#21-charakter-zug-ausgehender-schaden)). **Direkt nach der eigenen Handlung**
     heilt die Regeneration den Charakter.
   - **Gegner am Zug:** ein Angriff gegen das **gesamte Team** (Team-weit, verteilt über die
     Schadenspipeline [§2.3](#23-eingehender-schaden-schadenspipeline)). Gegner wählen **keine**
     Einzelziele. **Nachdem** die Pipeline für **alle** Charaktere abgeschlossen ist, lösen die
     Counter aus ([§2.1](#21-charakter-zug-ausgehender-schaden)) — in **Slot-Reihenfolge**
     (Korvin → Rhaya → Quinn), nicht verschachtelt in die Verteilung.
   - **Suppression** ([§3.3](#33-suppression-quinn-ranged)) kann die noch offene Aktion eines
     Gegners **innerhalb der Runde nach hinten** verschieben — maximal bis an das Rundenende.
     Jeder lebende Gegner handelt weiterhin **genau einmal** pro Runde; eine Aktion entfällt
     ausschließlich, wenn der Gegner vor seinem verschobenen Zug stirbt.
3. **Rundenende:** keine gesonderten Effekte. Regeneration triggert pro Akteur, Barrier wird
   erst zu Rundenbeginn der Folgerunde angefasst (Schritt 1).

**Abbruch-/Endbedingungen:**

- **Sieg:** alle Gegner besiegt.
- **Niederlage/Wipe:** alle Charaktere besiegt → Kampf endet ohne Belohnung (siehe
  [Checkpoints, Wipe & Abbruch](PROGRESSION.md#4-checkpoints-wipe--abbruch)).
- **Manueller Abbruch:** Der Spieler kann einen laufenden Kampf jederzeit abbrechen
  (verlässt den Dungeon, keine Belohnung für den laufenden Floor,
  [Checkpoints, Wipe & Abbruch](PROGRESSION.md#4-checkpoints-wipe--abbruch)).
- **Kein Rundenlimit** — kein automatischer Runden-Cap.
  - **Endlichkeits-Zusicherung:** Gegner haben keine Heilung und Charakterangriffe verursachen
    stets vollen, positiven Schaden ([§2.2](#22-treffermodell)), die Gegner-Gesamt-Health sinkt
    also **monoton** → jeder Kampf ist in **endlicher** Rundenzahl entschieden. Diese Zusicherung
    darf kein Feature verletzen (siehe [Auslösung](RUNES.md#4-auslösung-verbindlich)).
  - **Kein Blockieren:** Es wird nur eine Runde pro Anzeige-Takt gerechnet, im Catch-up
    ebenfalls an Echtzeit gebunden ([Simulation & Zeitverhalten](SIMULATION.md#1-grundmodell-verbindlich)).

### 1.2 Zielauswahl

**Gegner → Team (bewusste Asymmetrie):**

- Gegner wählen **kein** Einzelziel. Jeder Gegner-Angriff richtet sich gegen das
  **gesamte Team** und wird über die Schadenspipeline
  ([§2.3](#23-eingehender-schaden-schadenspipeline)) auf die Charaktere verteilt.

**Charakter → Gegner:**

- Charaktere greifen **immer genau einen** Gegner an (plus mögliche Splash-Nebenziele,
  [§2.1](#21-charakter-zug-ausgehender-schaden)).
- **Tank- & Melee-Charakter:** können **nur die Frontline** angreifen, solange dort Gegner
  leben. Ein **Taunt** zwingt sie, einen lebenden gegnerischen Tank **vorrangig**
  anzugreifen.
- **Ranged-Charakter:** umgeht den Taunt und kann die **Backline von Beginn an** anvisieren,
  zahlt dafür aber einen laufenden **Bulwark-Malus** ([§2.4](#24-bulwark-deckung-der-backline)),
  solange Frontline-Gegner leben.
- **Priorisierung innerhalb der wählbaren Ziele:** Gegner mit der **höchsten Initiative
  zuerst**.

### 1.3 Gegnerformation

- Gegner stehen in einer **2×3-Formation**: zwei **Lanes** (Frontline, Backline) mit je
  drei Slots → **maximal sechs Gegner** pro Kampf.
- **Rollen:** Tank und Melee stehen in der **Frontline**, Ranged in der **Backline**.
  **Maximal ein Tank-Gegner** pro Kampf.
- Gegner-Stats: **Health, Attack, Accuracy, Initiative** (nur diese vier). Gegner haben
  **keine** Defense und **keine** Evasion → Charakter-Angriffe treffen immer und werden
  nicht gemindert ([§2.2](#22-treffermodell)).
- Die Frontline schützt die Backline (Bulwark, [§2.4](#24-bulwark-deckung-der-backline)).

---

## 2. Kampfwerte & Formeln

> Formeln beschreiben die **Struktur** der Berechnung. Die einzelnen
> Faktoren/Konstanten stammen aus dem Balancing-Content (`src/game/`, siehe
> [BALANCING §2](../BALANCING.md#2-kern-wachstumsachsen)).

### 2.1 Charakter-Zug (ausgehender Schaden)

Ein Charakter macht pro Zug **einen Basisangriff**.

**Grundregel — Modifikator vs. Generator.** Die vier Offensiv-Muster teilen sich in zwei Arten:

| Muster        | Art             | Wirkung                                     |
| ------------- | --------------- | ------------------------------------------- |
| **Crit**      | **Modifikator** | multipliziert einen Treffer, erzeugt keinen |
| **Multi Hit** | **Generator**   | erzeugt Treffer auf demselben Ziel          |
| **Splash**    | **Generator**   | erzeugt Treffer auf Nebenzielen             |
| **Counter**   | **Generator**   | erzeugt Treffer reaktiv                     |

Daraus folgen zwei verbindliche Regeln:

- **Generatoren lösen einander nie aus.** Ein Multi-Hit-Treffer splasht nicht, ein
  Splash-Treffer kettet nicht, ein Counter tut keins von beidem. Die Treffererzeugung ist damit
  ein Baum **fester Tiefe**.
- **Jeder erzeugte Treffer bemisst sich am rohen Grundschaden (vor Crit)** und würfelt
  **seinen eigenen** Crit-Wurf, sofern der zugehörige Skilltree-Knoten freigeschaltet ist
  ([Charakter-Skilltree](CHARACTERS.md#4-charakter-skilltree)). Crit wird dadurch pro Treffer
  **genau einmal** gezählt; es gibt keine Vererbung von Multiplikatoren zwischen Treffern.
  Multi Hit und Splash beziehen sich auf den Grundschaden **des Zuges**; der reaktive Counter
  würfelt seinen eigenen (unten).

**Ablauf eines Zuges:**

1. **Roher Grundschaden**
   `Grundschaden = Attack × Waffen-Damage-Range` — die Damage-Range ist ein **einmal pro
   Angriff** per PRNG gewürfelter Faktor im Waffenintervall (z. B. 90 %–110 %). Alle **in diesem
   Zug** erzeugten Treffer bemessen sich an diesem einen Wert.
2. **Crit (Grundtreffer)** — mit _Crit Chance_ wird geprüft; bei Erfolg `× Crit Damage`.
   _Crit Damage_ ist ein **Gesamt-Multiplikator**, kein Aufschlag: `200 %` bedeutet `× 2,0`,
   der neutrale Wert ist `100 %`.
3. **Multi Hit** — mit _Multi Hit Chance_ wird **einmal** auf eine Zusatztreffer-Kette **auf
   dasselbe Ziel** geprüft. Bei Erfolg entsteht die Kette in **voller Länge**: _Multi Hit Chain_
   Zusatztreffer. _Multi Hit Chain_ zählt ausschließlich die Zusatztreffer (Startwert **1**).

   Der erste Kettentreffer verursacht _Multi Hit Damage_ als Anteil des **rohen Grundschadens**,
   jeder weitere den _Multi Hit Chain Factor_-fachen Anteil seines Vorgängers — die Kette klingt
   also ab:

   ```
   Kettentreffer k  (k = 1 … Multi Hit Chain):
     Schaden = roher Grundschaden × Multi Hit Damage × Multi Hit Chain Factor^(k−1)
   ```

   Der _Multi Hit Chain Factor_ ist **echt kleiner als 100 %** (Wert = Balancing); der Wert wird
   auf diese Obergrenze geklemmt. Jeder Kettentreffer würfelt seinen eigenen Crit.

4. **Splash** — mit _Splash Chance_ trifft der Angriff zusätzlich bis zu _Splash Radius_
   **Nebenziele**. _Splash Damage_ ist ein Anteil des **rohen Grundschadens**; jeder
   Splash-Treffer würfelt seinen eigenen Crit. Auswahl der Nebenziele: **gleiche Lane zuerst**,
   dann reguläre Priorisierung ([§1.2](#12-zielauswahl), höchste Initiative zuerst).
5. **Counter** — **rein reaktiv** und kein Teil des eigenen Zuges: Wird ein Charakter
   getroffen, löst er mit _Counter Chance_ einen Gegenangriff mit _Counter Damage_ aus (Anteil
   eines **eigens gewürfelten** Grundschadens, eigener Crit-Wurf). Details unten.

Auf **jeden** so erzeugten Treffer wird anschließend der **Bulwark-Malus seines eigenen Ziels**
angewandt ([§2.4](#24-bulwark-deckung-der-backline)).

**PRNG-Zugreihenfolge (verbindlich, [§2.5](#25-feststehende-regeln)):** `Damage-Range` →
`Crit (Grundtreffer)` → `Multi Hit Chance` → je Kettentreffer `Crit (Multi Hit)` →
`Splash Chance` → je Nebenziel `Crit (Splash)`. Die Kettenlänge steht mit dem einen
`Multi Hit Chance`-Wurf fest; die Zahl der folgenden `Crit (Multi Hit)`-Würfe ist damit
_Multi Hit Chain_ oder `0`. Der Counter hat eine eigene Sequenz (unten).

**Rechenbeispiel (Test-Vektor).** Die Eingangswerte sind frei gewählt, nicht Balancing —
verbindlich ist die **Struktur**: Zugreihenfolge, Bezug auf den rohen Grundschaden und der
Crit-Wurf pro Treffer.

```
Gegeben: Attack 100, Damage-Range 90–110 %, Crit Chance 25 %, Crit Damage 200 %,
         Multi Hit Chance 40 %, Multi Hit Damage 50 %, Multi Hit Chain 2,
         Multi Hit Chain Factor 60 %,
         Splash Chance 30 %, Splash Damage 40 %, Splash Radius 1,
         Multi-Hit- und Splash-Crit-Knoten freigeschaltet, Bulwark-Malus 0 %

PRNG-Züge (combat-Strom) in dieser Reihenfolge:
  1. Damage-Range      → 1.05    ⇒ roher Grundschaden = 100 × 1.05 = 105
  2. Crit Grundtreffer → 0.10 < 0.25  ⇒ Treffer A = 105 × 2.0 = 210
  3. Multi Hit Chance  → 0.22 < 0.40  ⇒ Kette in voller Länge: 2 Kettentreffer
  4. Crit Kette 1      → 0.80 ≥ 0.25  ⇒ Treffer B = 105 × 0.5 = 52.5
  5. Crit Kette 2      → 0.15 < 0.25  ⇒ Treffer C = 105 × 0.5 × 0.6 × 2.0 = 63
  6. Splash Chance     → 0.11 < 0.30  ⇒ 1 Nebenziel
  7. Crit Splash       → 0.05 < 0.25  ⇒ Treffer D = 105 × 0.4 × 2.0 = 84

Ergebnis: Primärziel 210 + 52.5 + 63 = 325.5   Nebenziel 84
```

Was der Vektor absichert: Treffer B und C bemessen sich an `105`, **nicht** an den gecritteten
`210` (kein vererbter Multiplikator); die Kettenlänge steht nach dem einen Wurf in Zug 3 fest,
weitere `Multi Hit Chance`-Würfe gibt es nicht; Treffer C trägt den Chain Factor **einmal**
(`0.6^1`), während Treffer B ihn nicht trägt (`0.6^0`); Zug 7 findet statt, obwohl Zug 2 bereits
gecrittet hat (eigener Wurf pro Treffer).

**Counter im Detail:**

- **Ziel:** der **auslösende Gegner** — unabhängig von Frontline-Lock und Taunt
  ([§1.2](#12-zielauswahl)). Der Counter ist damit der einzige Weg für Tank und Melee, die
  Backline zu erreichen.
- **Schaden:** Der Counter würfelt seinen **eigenen** Grundschaden — `Attack × Waffen-Damage-Range`,
  neu gezogen wie bei einem regulären Angriff (Schritt 1 oben). Daraus ein Flat-Hit
  (`Grundschaden × Counter Damage`) — **kein** Multi Hit, **kein** Splash, da Generatoren einander
  nicht auslösen. Crit ist per Valor-Knoten möglich.
- **PRNG-Zugreihenfolge (verbindlich, [§2.5](#25-feststehende-regeln)):** je Charakter, der von
  diesem Gegner-Angriff getroffen wurde, in **Slot-Reihenfolge**:
  `Counter Chance` → bei Erfolg `Damage-Range` → bei freigeschaltetem Valor-Knoten `Counter Crit`.
  Ein Charakter countert pro Gegner-Angriff höchstens einmal, die Sequenz enthält je Charakter
  also höchstens diese drei Züge.
- **Bulwark gilt** — der Counter ignoriert die Deckung nicht.
- **Auslösung:** Ein geblockter Treffer ist ein Treffer → löst Counter aus; ein
  ausgewichener (Evasion) Treffer nicht.
- **Zeitpunkt:** gesammelt **nach** Abschluss der Team-Pipeline in **Slot-Reihenfolge**
  ([§1.1](#11-rundenablauf)), damit ein Counter die noch laufende Schadensverteilung nicht
  beeinflusst.
- Eine Counter-Rekursion ist strukturell unmöglich: Nur Charaktere countern, und nur Gegner
  verursachen Schaden an Charakteren.

**Regeneration:** heilt den Charakter **direkt nach dessen eigener Handlung**
([§1.1](#11-rundenablauf)); einmal pro Handlung, unabhängig von der Trefferzahl. Grenzen der
Heilung: [§2.6](#26-heilung--grenzen-und-auslösung).

### 2.2 Treffermodell

- **Charakter → Gegner:** trifft **immer** und **voll** (Gegner haben keine Evasion/Defense).
- **Gegner → Charakter:** pro Charakter wird die **Trefferchance** gewürfelt
  ([§2.3](#23-eingehender-schaden-schadenspipeline), Schritt 2):

  ```
  Trefferchance = Accuracy × (1 − Evasion)
  ```

  _Accuracy_ steigt mit der Floor-Tiefe
  ([BALANCING §2](../BALANCING.md#2-kern-wachstumsachsen)); _Evasion_ wirkt als Faktor und
  behält damit auf jeder Tiefe ihren relativen Wert.

### 2.3 Eingehender Schaden (Schadenspipeline)

Ein einzelner Gegner-Angriff der Stärke `S` trifft das **ganze Team** und durchläuft je
Charakter folgende Pipeline (Reihenfolge verbindlich).

**`S` = Attack des Gegners** — flat, ohne Streuung. Gegner haben **keine** Damage-Range; der
Zufall auf der eingehenden Seite liegt ausschließlich bei Evasion (Schritt 2) und Block
(Schritt 3). `S` ist ein **team-weiter** Schwung, kein Wert pro Charakter — ein sterbender
Charakter **erhöht** damit den Tick der Überlebenden.

1. **Basis-Verteilung.** `S` wird gleichmäßig auf die **lebenden** Charaktere verteilt:
   `Tick = S / (#lebende Charaktere)`.
   - **Mitigation** ([§3.1](#31-mitigation-korvin-tank)) modifiziert diese Verteilung: Ein
     Anteil `m` des DD-Ticks wird auf den **Tank** umgeleitet.
     - **Tank lebt & Mitigation aktiv:** jeder lebende DD erhält `Tick × (1 − m)`; der Tank
       erhält `Tick + (#lebende DDs) × Tick × m`. → Summe bleibt exakt `S`.
     - **Ohne Mitigation / Tank tot:** jeder lebende Charakter trägt seinen eigenen `Tick`;
       kein Umleitungsziel.
2. **Evasion** (pro Charakter). Miss-Roll gegen die **Trefferchance**
   ([§2.2](#22-treffermodell)). Bei Ausweichen: **0 Schaden**, **kein Counter**.
3. **Block** (pro Charakter). Mit _Block Chance_ → `Schaden × (1 − Block%)` (partielle
   Reduktion um einen festen %-Wert; **nicht** all-or-nothing). Ein geblockter Treffer bleibt
   ein Treffer → **löst Counter aus**.
4. **Defense** (pro Charakter). **Proportionale Mitigation** über die globale
   **Defense-Konstante** `K` (Wert = Balancing); _Defense_ ist ein Derived Stat, gespeist u. a.
   aus _Toughness_ ([Stats](CHARACTERS.md#2-stats)):

   ```
   nachDefense = nachBlock × K / (K + Defense)
   ```

   Die Mitigation bleibt strukturell unter 100 % — Defense drückt den Schaden **nie auf 0**,
   und jeder Defense-Punkt hebt die effektive Health um denselben Betrag
   (Begründung: [ADR 0008](../adr/0008-defense-ratio-mitigation.md)). Die Mitigation ist
   unabhängig von Trefferhöhe und Gegnerzahl.

5. **Barrier** (pro Charakter). Absorbiert den verbleibenden (bereits abgemilderten) Schaden,
   bevor Health reduziert wird.
6. **Health** (pro Charakter). Wird um den Restschaden reduziert.

**Rechenbeispiel (Test-Vektor).** Eingangswerte frei gewählt, nicht Balancing — verbindlich sind
die **Summen-Erhaltung** in Schritt 1 und die **Reihenfolge** Block → Defense → Barrier → Health.

```
Gegeben: S = 300, drei lebende Charaktere, Mitigation m = 0.3, Defense-Konstante K = 100

Schritt 1 — Verteilung:   Tick = 300 / 3 = 100
  Korvin (Tank): 100 + 2 × 100 × 0.3 = 160
  Rhaya  (DD):   100 × (1 − 0.3)     =  70
  Quinn  (DD):   100 × (1 − 0.3)     =  70
  Summe: 160 + 70 + 70 = 300 = S  ✓

Schritt 2–6 pro Charakter:
  Korvin — Evasion-Wurf trifft, Block-Wurf trifft (Block 40 %), Defense 140, Barrier 30
    Block:    160 × (1 − 0.40) = 96
    Defense:  96 × 100 / (100 + 140) = 40
    Barrier:  40 − 30 = 10 Rest → Health −10
    → Counter-Wurf findet statt (geblockt ist getroffen)

  Rhaya — Evasion-Wurf weicht aus
    → 0 Schaden, kein Counter-Wurf

  Quinn — Evasion-Wurf trifft, Block-Wurf verfehlt, Defense 25, Barrier 0
    Block:    70
    Defense:  70 × 100 / (100 + 25) = 56
    Barrier:  0 → Health −56
```

Was der Vektor absichert: Der Tank-Anteil ist ein **Zuschlag pro lebendem DD** (nicht `Tick × 3`);
die Mitigation greift auf den Wert **nach Block** (`96`, nicht `160`) und rechnet mit dem
Defense-Wert des jeweiligen Charakters; ein ausgewichener Treffer erzeugt keinen Counter, ein
geblockter schon. Sterben Rhaya und Quinn, verteilt der nächste Angriff dieselben `S = 300`
**vollständig** auf Korvin.

### 2.4 Bulwark (Deckung der Backline)

- Solange **Frontline-Gegner leben**, erleiden **Backline-Gegner** reduzierten Schaden
  (Bulwark-Malus auf eingehenden Schaden).
- Jeder lebende Frontline-Gegner trägt einen **eigenen Beitrag** `bᵢ` (Tank trägt mehr bei als
  Melee). Die Beiträge stapeln **multiplikativ**:

  ```
  Bulwark-Malus = 1 − Π (1 − bᵢ)     über alle lebenden Frontline-Gegner
  ```

  Der Malus bleibt damit strukturell unter 100 %, und jeder Frontline-Gegner hebt die effektive
  Health der Backline um denselben Faktor. Konkrete `bᵢ` = Balancing (`src/game/`,
  [BALANCING §2](../BALANCING.md#2-kern-wachstumsachsen)).

- Der Malus wird **pro Treffer und Ziel** angewandt
  ([§2.1](#21-charakter-zug-ausgehender-schaden)) — jeder Grund-, Multi-, Splash- und
  Counter-Treffer bekommt den Malus des Gegners, den er trifft.
- Fällt die Frontline vollständig, entfällt der Bulwark-Malus.
- **Sunder** ([§3.2](#32-sunder-rhaya-melee)) senkt das `bᵢ` einzelner Frontline-Gegner
  **während des Kampfes**.

**Rechenbeispiel (Test-Vektor).** Eingangswerte frei gewählt, nicht Balancing — verbindlich ist
die **multiplikative** Stapelung.

```
Gegeben: Frontline lebt mit Tank (b = 0.30) und zwei Melee (b = 0.15);
         ein Treffer von 1000 auf ein Backline-Ziel

  Malus   = 1 − 0.70 × 0.85 × 0.85 = 1 − 0.505750 = 0.494250
  Schaden = 1000 × 0.505750 = 505.75

Nach Sunder auf den Tank (b: 0.30 → 0.10):
  Malus   = 1 − 0.90 × 0.85 × 0.85 = 1 − 0.650250 = 0.349750
  Schaden = 1000 × 0.650250 = 650.25

Ein Melee stirbt (statt Sunder, Ausgangswerte):
  Malus   = 1 − 0.70 × 0.85 = 1 − 0.595000 = 0.405000
  Schaden = 1000 × 0.595000 = 595.00
```

Was der Vektor absichert: Die Beiträge werden **multipliziert**, nicht summiert (additiv wäre der
Malus `0.60` statt `0.494250`); der Wegfall eines Frontline-Gegners und die Absenkung seines `bᵢ`
wirken über dieselbe Formel; für jedes `bᵢ < 1` bleibt der Malus unter `100 %` und braucht daher
keinen Cap.

### 2.5 Feststehende Regeln

- **Aller Zufall** in diesen Formeln (Treffer, Crit, Multi Hit, Splash, Counter,
  Damage-Range, Gegner-Initiative) läuft über den **seedbaren PRNG** — **kein**
  `Math.random()` ([AGENTS.md §5](../../AGENTS.md#5-architektur-des-game-loops),
  [§14](../../AGENTS.md#14-do-not)). Die **Ziehreihenfolge** ist Teil der Spezifikation
  ([§2.1](#21-charakter-zug-ausgehender-schaden)); Kampf, Gegner-Initiative und Loot laufen über
  **getrennte Ströme** ([Seeds und Zufalls-Ströme](SIMULATION.md#4-seeds-und-zufalls-ströme)).
- Alle Werte laufen über native `number`. Die Achsen sind gedeckelt (Level 100, Item-Level
  `+100`, kein Prestige), die Spitzenwerte bleiben weit unter `Number.MAX_SAFE_INTEGER`
  ([AGENTS.md §5](../../AGENTS.md#5-architektur-des-game-loops)).
- **Achsen-Trennung:** Offensive Schadens-Magnituden skalieren ausschließlich aus **Attack**,
  defensive Magnituden (Heilung, Absorption, Reduktion) ausschließlich aus defensiven Quellen.
  Kein Stat und kein Effekt konvertiert zwischen den Achsen — insbesondere kein Lifesteal
  („X % des verursachten Schadens als Heilung") und kein Schadensreflekt („X % des erlittenen
  Schadens als Gegner-Schaden"). Begründung:
  [BALANCING §2](../BALANCING.md#2-kern-wachstumsachsen),
  [ADR 0007](../adr/0007-zwei-geometrische-wachstumsachsen.md).
- Die Engine emittiert **Kampf-Events** (Crit, Multi Hit, Splash, Counter, Block, Rundenbeginn, …)
  in einer **deterministisch festen Reihenfolge**. Sie sind die Anbindung der Rune-Trigger
  ([Runen](RUNES.md)) und die Grundlage des Playbacks
  ([Simulation & Zeitverhalten](SIMULATION.md#1-grundmodell-verbindlich)) und unterliegen denselben
  Determinismus-Regeln wie der übrige Kampf.

### 2.6 Heilung — Grenzen und Auslösung

Heilquellen sind **Regeneration** (Stat, [Stats](CHARACTERS.md#2-stats)) und im Endgame der
Rune-Effect `Heal` ([Runen](RUNES.md)).

- **Obergrenze:** Heilung nie über die maximale Health hinaus; **Überheilung verfällt** ohne
  Ersatzeffekt.
- **Besiegte Charaktere sind nicht heilbar** — auch nicht durch einen team-weiten Rune-Heal.
  Aufstehen geschieht ausschließlich per **Rally** an der Floor-Grenze
  ([Checkpoints, Wipe & Abbruch](PROGRESSION.md#4-checkpoints-wipe--abbruch)).
- **Regeneration ist ein flacher Wert**, kein Anteil der Max-Health, und triggert **einmal**
  pro eigener Handlung ([§1.1](#11-rundenablauf)).
- **Barrier** ist ein Pool: Der Rune-Effect `Barrier` **addiert** auf den vorhandenen Rest.
  Der Reset zu Rundenbeginn ([§1.1](#11-rundenablauf)) erfasst ihn mit — Rune-Barrier verfällt
  also ebenso.
- **Zwischen Floors wird nicht geheilt**
  ([Checkpoints, Wipe & Abbruch](PROGRESSION.md#4-checkpoints-wipe--abbruch)).

---

## 3. Signatur-Skills (Kampfwirkung)

**Verbindlicher Wohnort der Kampfwirkung der drei Signatur-Skills.** Wer welchen Skill hat und
wie er freigeschaltet wird, steht in [Signatur-Skills](CHARACTERS.md#7-signatur-skills);
Design-Absicht in
[DESIGN §3.1](../DESIGN.md#31-rollen-mit-preis--und-die-signatur-skills-die-ihn-verwerten).

- Jeder Skill belegt einen eigenen, sonst unberührten Kampf-Hebel: Schadensverteilung
  ([§2.3](#23-eingehender-schaden-schadenspipeline)), Bulwark/Formation
  ([§2.4](#24-bulwark-deckung-der-backline)) und Zug-Ökonomie ([§1.1](#11-rundenablauf)).
- **Kein Signatur-Skill hebt die eigene Rollen-Penalty auf** (Taunt/Bulwark/Frontline-Lock,
  [§1.2](#12-zielauswahl)).
- Vor Freischaltung des zugehörigen Crucible-Knotens existiert der Effekt nicht.
- Die Skills führen **keinen** Zusatz-RNG ein; aller Zufall bleibt beim seedbaren PRNG
  ([§2.5](#25-feststehende-regeln)).

### 3.1 Mitigation (Korvin, Tank)

- Leitet einen Anteil `m` des DD-Ticks auf den Tank um — Formel und Summen-Erhaltung in
  [§2.3](#23-eingehender-schaden-schadenspipeline), Schritt 1.
- `m` steigt mit dem Node-Level (1–5); konkrete Werte = Balancing (`src/game/`).

### 3.2 Sunder (Rhaya, Melee)

- Rhayas Treffer auf einen **Frontline-Gegner** reduzieren dessen **Bulwark-Beitrag** `bᵢ`
  ([§2.4](#24-bulwark-deckung-der-backline)).
- Der Abbau ist **kumulativ pro Ziel** und gilt **nur für die Dauer des laufenden Kampfes** —
  es gibt **keinen Übertrag** zwischen Floors (Formationen stehen pro Floor neu).
- **Node-Skalierung (Level 1–5):** steigender Bulwark-Abbau pro Treffer und/oder höheres
  Abbau-Cap pro Ziel. Konkrete Werte = Balancing (`src/game/`, BALANCING).

<!-- TODO (Balancing): Sunder — Abbau-Betrag pro Treffer & Cap pro Ziel. -->

### 3.3 Suppression (Quinn, Ranged)

- Quinns Treffer verschiebt die **noch offene Aktion** des getroffenen Gegners um `L` Plätze
  **nach hinten** in der **Pending-Queue** der laufenden Runde ([§1.1](#11-rundenablauf));
  `L` = Node-Level 1–5, ein Platz pro Level.
- **Operation** auf der Pending-Queue — `L` zählt in **offenen** Einträgen:

  ```
  idx = Position des Ziels in der Pending-Queue
  Queue.remove(idx)
  Queue.insert(min(idx + L, Queue.length))
  ```

  Die Aktion rutscht damit maximal an das Rundenende und **verfällt nie**. **Kein Übertrag** in
  die nächste Runde. Steht das Ziel bereits als Letztes oder hat es in dieser Runde schon
  gehandelt, ist die Verschiebung `0`.

- **Rechenbeispiel (Test-Vektor).** Node-Level `L = 2`; Quinn hat gerade gehandelt und dabei
  Gegner `E2` getroffen.

  ```
  Pending-Queue vor der Operation (Quinn bereits entnommen):
    [0] E2   [1] E1   [2] Rhaya   [3] E4   [4] Korvin

  idx = 0
  remove(0)          → [E1, Rhaya, E4, Korvin]
  insert(min(0+2, 4) = 2)  → [E1, Rhaya, E2, E4, Korvin]

  Randfall — Ziel steht schon hinten (idx = 3, L = 2):
    remove(3)        → [E1, Rhaya, E2, Korvin]
    insert(min(3+2, 4) = 4)  → [E1, Rhaya, E2, Korvin, E4]   ⇒ effektiv +1 statt +2
  ```

  Was der Vektor absichert: `L` zählt in **offenen** Einträgen (Quinn ist nicht mehr enthalten,
  Rhaya und Korvin zählen mit); `min(…, Queue.length)` **nach** dem `remove` klemmt die Position,
  die Aktion fällt nie heraus; ein zweiter Treffer auf `E2` in derselben Runde verschiebt `0`.

- **Cap: ein Gegner kann pro Runde höchstens einmal supprimiert werden** (Flag pro Ziel und
  Runde). Damit ist auch Multi Hit ([§2.1](#21-charakter-zug-ausgehender-schaden)) abgedeckt — der
  erste Treffer verschiebt, alle weiteren um `0`. **Splash**-Nebenziele werden **nicht**
  verschoben; Suppression wirkt ausschließlich auf das **primäre Ziel**.
- **Counter** ([§2.1](#21-charakter-zug-ausgehender-schaden)) suppresst strukturell nie:
  Ein Counter trifft immer einen Gegner, der gerade gehandelt hat und damit nicht mehr in der
  Pending-Queue steht.
- **Zeitpunkt:** nach dem vollständigen Angriff (Grundtreffer, Multi-Hit-Kette, Splash) — sofern
  das Primärziel noch **lebt**, noch **nicht gehandelt** hat und in dieser Runde noch **nicht
  supprimiert** wurde.
- Wirkt nur auf **Gegner**; die Reihenfolge der eigenen Charaktere bleibt unberührt.
- **Der Delay hängt nicht am Schaden** — Quinns Bulwark-Malus
  ([§2.4](#24-bulwark-deckung-der-backline)) mindert die Verschiebung nicht.
- **Turn Skip** entsteht ausschließlich über den **Kill**: stirbt das Ziel vor seinem
  verschobenen Slot, ist seine Aktion endgültig verloren.
