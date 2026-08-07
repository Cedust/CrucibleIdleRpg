# SPEC — Schadenssystem

> Verbindlich: ausgehender und eingehender Schaden, Procs, Bulwark und Heilung.
> Verwandt: [Kampfablauf](COMBAT-RUN.md) · [Weapon Mastery](WEAPON-MASTERY.md) ·
> [Signatur-Skills](SIGNATURES.md) · [Balance](BALANCE.md)

---

## 1. Kampfwerte & Formeln

> Formeln beschreiben die **Struktur** der Berechnung. Die einzelnen
> Faktoren/Konstanten stammen aus dem Balancing-Content (`src/game/`, siehe
> [BALANCE §1](BALANCE.md#1-wachstum-und-zahlenraum)).

### 1.1 Charakter-Zug (ausgehender Schaden)

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
  **seinen eigenen** Crit-Wurf, sofern die zugehörige Mastery-Node freigeschaltet ist
  ([Weapon Mastery](WEAPON-MASTERY.md#4-gemeinsame-disciplines)). Crit wird dadurch pro Treffer
  **genau einmal** gezählt; es gibt keine Vererbung von Multiplikatoren zwischen Treffern.
  Multi Hit und Splash beziehen sich auf den Grundschaden **des Zuges**; der reaktive Counter
  würfelt seinen eigenen (unten).

**Ablauf eines Zuges:**

1. **Precision und roher Grundschaden.** Zuerst wird einmal gegen die Weapon Precision
   gewürfelt ([Clean/Glancing](WEAPON-MASTERY.md#21-precision-clean-hit-und-glancing-blow)).
   Danach wird Range immer gezogen.
   - Clean Hit: `Grundschaden = Attack × gewürfelte Weapon Range`.
   - Glancing Blow: `Grundschaden = Attack × MIN RNG`; der Range-Wurf wird ignoriert und kein
     Treffer dieses Angriffs darf critten.
     Alle in diesem Zug erzeugten Treffer bemessen sich an diesem einen Rohschaden.
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

   Der _Multi Hit Chain Factor_ ist **echt kleiner als 100 %** und wird bei 90 % geklemmt. Der
   erste Treffer verwendet wegen `Factor^(1−1)` immer 100 %. Jeder Clean-Kettentreffer würfelt
   bei freigeschaltetem Converging Strikes seinen eigenen Crit.

   Chain Hits werden nacheinander erzeugt und angewandt, nicht als unveränderliche Trefferliste
   vorab gebaut. Dadurch kann Relentless Pursuit nach dem Tod des aktuellen Ziels für jeden noch
   ausstehenden Original- oder Storm-Surge-Hit das nächste legale Ziel bestimmen. Storm Surge
   darf höchstens zwei Hits anhängen; Bonus-Hits erzeugen keine weiteren Bonus-Hits. Die
   Treffererzeugung bleibt damit endlich.

4. **Splash** — mit _Splash Chance_ trifft der Angriff zusätzlich bis zu _Splash Radius_
   **Nebenziele**. _Splash Damage_ ist ein Anteil des **rohen Grundschadens**; jeder
   Splash-Treffer würfelt seinen eigenen Crit. Auswahl der Nebenziele: **gleiche Lane zuerst**,
   dann reguläre Priorisierung ([§1.2](COMBAT-RUN.md#12-zielauswahl), höchste Initiative zuerst).
5. **Counter** — **rein reaktiv** und kein Teil des eigenen Zuges: Wird ein Charakter
   getroffen, löst er mit _Counter Chance_ einen Gegenangriff mit _Counter Damage_ aus (Anteil
   eines **eigens gewürfelten** Grundschadens, eigener Crit-Wurf). Details unten.

Auf **jeden** so erzeugten Treffer wird anschließend der **Bulwark-Malus seines eigenen Ziels**
angewandt ([§1.4](#14-bulwark-deckung-der-backline)). Als letzter Schritt greift in Runde 1
**Ambush** ([Ambush](SIGNATURES.md#21-ambush-nach-sunder)) auf den finalen Wert.

**PRNG-Zugreihenfolge (verbindlich, [§1.5](#15-feststehende-regeln)):** `Precision` →
`Damage-Range` → bei Clean `Crit (Grundtreffer)` → `Multi Hit Chance` → bei Clean und
freigeschaltetem Converging Strikes je Kettentreffer `Crit (Multi Hit)` → `Splash Chance` →
bei Clean und freigeschalteter Critical Mass je Nebenziel `Crit (Splash)`. Bei Glancing
entfallen alle Crit-Würfe, nicht aber Generator-Chance-Würfe. Die Kettenlänge steht mit dem
einen Multi-Hit-Chance-Wurf fest. Mastery-Verhalten darf zusätzliche, endlich begrenzte Treffer
und die dafür ausdrücklich definierten Crit-Würfe anhängen
([Node-Katalog](WEAPON-MASTERY.md#4-gemeinsame-disciplines)).

**Rechenbeispiel (Test-Vektor).** Die Eingangswerte sind frei gewählt, nicht Balancing —
verbindlich ist die **Struktur**: Zugreihenfolge, Bezug auf den rohen Grundschaden und der
Crit-Wurf pro Treffer.

```
Gegeben: Attack 100, Precision 75 %, Damage-Range 90–110 %,
         Crit Chance 25 %, Crit Damage 200 %,
         Multi Hit Chance 40 %, Multi Hit Damage 50 %, Multi Hit Chain 2,
         Multi Hit Chain Factor 60 %,
         Splash Chance 30 %, Splash Damage 40 %, Splash Radius 1,
         Multi-Hit- und Splash-Crit-Knoten freigeschaltet, Bulwark-Malus 0 %

PRNG-Züge (combat-Strom) in dieser Reihenfolge:
  1. Precision         → 0.50 < 0.75  ⇒ Clean Hit
  2. Damage-Range      → 1.05         ⇒ roher Grundschaden = 100 × 1.05 = 105
  3. Crit Grundtreffer → 0.10 < 0.25  ⇒ Treffer A = 105 × 2.0 = 210
  4. Multi Hit Chance  → 0.22 < 0.40  ⇒ Kette in voller Länge: 2 Kettentreffer
  5. Crit Kette 1      → 0.80 ≥ 0.25  ⇒ Treffer B = 105 × 0.5 = 52.5
  6. Crit Kette 2      → 0.15 < 0.25  ⇒ Treffer C = 105 × 0.5 × 0.6 × 2.0 = 63
  7. Splash Chance     → 0.11 < 0.30  ⇒ 1 Nebenziel
  8. Crit Splash       → 0.05 < 0.25  ⇒ Treffer D = 105 × 0.4 × 2.0 = 84

Ergebnis: Primärziel 210 + 52.5 + 63 = 325.5   Nebenziel 84
```

Was der Vektor absichert: Precision wird vor Range gezogen; Treffer B und C bemessen sich an
`105`, **nicht** an den gecritteten `210` (kein vererbter Multiplikator); die Kettenlänge steht
nach dem einen Multi-Hit-Wurf fest,
weitere `Multi Hit Chance`-Würfe gibt es nicht; Treffer C trägt den Chain Factor **einmal**
(`0.6^1`), während Treffer B ihn nicht trägt (`0.6^0`); der Splash-Crit findet statt, obwohl der
Grundtreffer bereits gecrittet hat.

**Counter im Detail:**

- **Ziel:** der **auslösende Gegner** — unabhängig von Frontline-Lock und Taunt
  ([Zielauswahl](COMBAT-RUN.md#12-zielauswahl)). Der Counter ist damit der einzige Weg für Tank und Melee, die
  Backline zu erreichen.
- **Schaden:** Der Counter würfelt eigene Precision und Range wie ein regulärer Angriff. Daraus
  entsteht ein Flat-Hit
  (`Grundschaden × Counter Damage`) — **kein** Multi Hit, **kein** Splash, da Generatoren einander
  nicht auslösen. Glancing verwendet MIN RNG und darf nicht critten; Clean Counter dürfen mit
  Vengeful Edge critten.
- **PRNG-Zugreihenfolge (verbindlich, [§1.5](#15-feststehende-regeln)):** je Charakter, der von
  diesem Gegner-Angriff getroffen wurde, in **Slot-Reihenfolge**:
  `Counter Chance` → bei Erfolg `Precision` → `Damage-Range` → bei Clean und freigeschaltetem
  Vengeful Edge `Counter Crit`. Guarded Reprisal darf den Chance-Wurf ausdrücklich überspringen;
  Perfect Riposte darf ihn nach Evasion ergänzen. Ein Charakter countert pro Gegner-Angriff
  höchstens einmal.
- **Bulwark gilt** — der Counter ignoriert die Deckung nicht.
- **Auslösung:** Ein geblockter Treffer ist ein Treffer → normaler Counter-Wurf; ein
  ausgewichener Treffer löst nur mit Perfect Riposte einen Counter-Wurf aus.
- **Zeitpunkt:** gesammelt **nach** Abschluss der Team-Pipeline in **Slot-Reihenfolge**
  ([Rundenablauf](COMBAT-RUN.md#11-rundenablauf)), damit ein Counter die noch laufende Schadensverteilung nicht
  beeinflusst.
- Eine Counter-Rekursion ist strukturell unmöglich: Nur Charaktere countern, und nur Gegner
  verursachen Schaden an Charakteren.

**Regeneration:** heilt den Charakter **direkt nach dessen eigener Handlung**
([Rundenablauf](COMBAT-RUN.md#11-rundenablauf)); einmal pro Handlung, unabhängig von der Trefferzahl. Grenzen der
Heilung: [§1.6](#16-heilung--grenzen-und-auslösung).

### 1.2 Treffermodell

- **Charakter → Gegner:** trifft **immer** und **voll** (Gegner haben keine Evasion/Defense).
- **Gegner → Charakter:** pro Charakter wird die **Trefferchance** gewürfelt
  ([§1.3](#13-eingehender-schaden-schadenspipeline), Schritt 2):

  ```
  Trefferchance = Accuracy × (1 − Menace) × (1 − Evasion)
  ```

  _Accuracy_ steigt mit der Floor-Tiefe
  ([BALANCE §1](BALANCE.md#1-wachstum-und-zahlenraum)); _Evasion_ wirkt als Faktor und
  behält damit auf jeder Tiefe ihren relativen Wert. **Menace**
  ([Menace](SIGNATURES.md#22-menace-nach-mitigation)) senkt die Accuracy relativ **vor** Evasion,
  solange Korvin bei Angriffsbeginn lebt; ohne den Node ist der Faktor `1`.

### 1.3 Eingehender Schaden (Schadenspipeline)

Ein einzelner Gegner-Angriff der Stärke `S` trifft das **ganze Team** und durchläuft je
Charakter folgende Pipeline (Reihenfolge verbindlich).

**`S` = Attack des Gegners** — flat, ohne Streuung. Gegner haben **keine** Damage-Range; der
Zufall auf der eingehenden Seite liegt ausschließlich bei Evasion (Schritt 2) und Block
(Schritt 3). `S` ist ein **team-weiter** Schwung, kein Wert pro Charakter — ein sterbender
Charakter **erhöht** damit den Tick der Überlebenden.

1. **Basis-Verteilung.** `S` wird gleichmäßig auf die **lebenden** Charaktere verteilt:
   `Tick = S / (#lebende Charaktere)`.
   - **Mitigation** ([Mitigation](SIGNATURES.md#11-mitigation-korvin-tank)) modifiziert diese Verteilung: Ein
     Anteil `m` des DD-Ticks wird auf den **Tank** umgeleitet.
     - **Tank lebt & Mitigation aktiv:** jeder lebende DD erhält `Tick × (1 − m)`; der Tank
       erhält `Tick + (#lebende DDs) × Tick × m`. → Summe bleibt exakt `S`.
     - **Ohne Mitigation / Tank tot:** jeder lebende Charakter trägt seinen eigenen `Tick`;
       kein Umleitungsziel.
2. **Evasion** (pro Charakter). Miss-Roll gegen die **Trefferchance**
   ([§1.2](#12-treffermodell)). Bei Ausweichen: **0 Schaden**, **kein Counter**.
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

### 1.4 Bulwark (Deckung der Backline)

- Solange **Frontline-Gegner leben**, erleiden **Backline-Gegner** reduzierten Schaden
  (Bulwark-Malus auf eingehenden Schaden).
- Jeder lebende Frontline-Gegner trägt einen **eigenen Beitrag** `bᵢ` (Tank trägt mehr bei als
  Melee). Die Beiträge stapeln **multiplikativ**:

  ```
  Bulwark-Malus = 1 − Π (1 − bᵢ)     über alle lebenden Frontline-Gegner
  ```

  Der Malus bleibt damit strukturell unter 100 %, und jeder Frontline-Gegner hebt die effektive
  Health der Backline um denselben Faktor. Konkrete `bᵢ` = Balancing (`src/game/`,
  [BALANCE §1](BALANCE.md#1-wachstum-und-zahlenraum)).

- Der Malus wird **pro Treffer und Ziel** angewandt
  ([§1.1](#11-charakter-zug-ausgehender-schaden)) — jeder Grund-, Multi-, Splash- und
  Counter-Treffer bekommt den Malus des Gegners, den er trifft.
- Fällt die Frontline vollständig, entfällt der Bulwark-Malus.
- **Sunder** ([Sunder](SIGNATURES.md#12-sunder-rhaya-melee)) senkt das `bᵢ` einzelner Frontline-Gegner
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

### 1.5 Feststehende Regeln

- **Aller Zufall** in diesen Formeln (Treffer, Crit, Multi Hit, Splash, Counter,
  Damage-Range, Gegner-Initiative) läuft über den **seedbaren PRNG** — **kein**
  `Math.random()` ([AGENTS.md](../../AGENTS.md),
  [§14](../../AGENTS.md)). Die **Ziehreihenfolge** ist Teil der Spezifikation
  ([§1.1](#11-charakter-zug-ausgehender-schaden)); Kampf, Gegner-Initiative und Loot laufen über
  **getrennte Ströme** ([Seeds und Zufalls-Ströme](SIMULATION.md#4-seeds-und-zufalls-ströme)).
- Alle Werte laufen über native `number`. Die Achsen sind gedeckelt (Level 100, Item-Level
  `+100`, kein Prestige), die Spitzenwerte bleiben weit unter `Number.MAX_SAFE_INTEGER`
  ([AGENTS.md](../../AGENTS.md)).
- **Achsen-Trennung:** Offensive Schadens-Magnituden skalieren ausschließlich aus **Attack**,
  defensive Magnituden (Heilung, Absorption, Reduktion) ausschließlich aus defensiven Quellen.
  Kein Stat und kein Effekt konvertiert zwischen den Achsen — insbesondere kein Lifesteal
  („X % des verursachten Schadens als Heilung") und kein Schadensreflekt („X % des erlittenen
  Schadens als Gegner-Schaden"). Begründung:
  [BALANCE §1](BALANCE.md#1-wachstum-und-zahlenraum),
  [ADR 0007](../adr/0007-zwei-geometrische-wachstumsachsen.md).
- Die Engine emittiert **Kampf-Events** (Crit, Multi Hit, Splash, Counter, Block, Rundenbeginn, …)
  in einer **deterministisch festen Reihenfolge**. Sie sind die Anbindung der Rune-Trigger
  ([Runen](RUNES.md)) und die Grundlage des Playbacks
  ([Simulation & Zeitverhalten](SIMULATION.md#1-grundmodell-verbindlich)) und unterliegen denselben
  Determinismus-Regeln wie der übrige Kampf.

### 1.6 Heilung — Grenzen und Auslösung

Heilquellen sind **Regeneration** (Stat, [Stats](CHARACTERS.md#2-stats)) und im Endgame der
Rune-Effect `Heal` ([Runen](RUNES.md)).

- **Obergrenze:** Heilung nie über die maximale Health hinaus; **Überheilung verfällt** ohne
  Ersatzeffekt.
- **Besiegte Charaktere sind nicht heilbar** — auch nicht durch einen team-weiten Rune-Heal.
  Aufstehen geschieht ausschließlich per **Rally** an der Floor-Grenze
  ([Checkpoints, Wipe & Abbruch](PROGRESSION.md#4-checkpoints-wipe--abbruch)).
- **Regeneration ist ein flacher Wert**, kein Anteil der Max-Health, und triggert **einmal**
  pro eigener Handlung ([Rundenablauf](COMBAT-RUN.md#11-rundenablauf)).
- **Barrier** ist ein Pool: Der Rune-Effect `Barrier` **addiert** auf den vorhandenen Rest.
  Der Reset zu Rundenbeginn ([Rundenablauf](COMBAT-RUN.md#11-rundenablauf)) erfasst ihn mit — Rune-Barrier verfällt
  also ebenso.
- **Zwischen Floors wird nicht geheilt**
  ([Checkpoints, Wipe & Abbruch](PROGRESSION.md#4-checkpoints-wipe--abbruch)).
