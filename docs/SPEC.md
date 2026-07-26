# SPEC.md — Crucible Idle RPG

> **Zweck dieser Datei:** präzise, umsetzbare Mechanik-Regeln, Formeln und Zustände.
> Beantwortet **„Wie verhält sich das Spiel exakt?"**. Vision & Begründungen stehen
> in [DESIGN.md](DESIGN.md), Begriffe in [GLOSSARY.md](GLOSSARY.md), technische
> Konventionen in [../AGENTS.md](../AGENTS.md).
>
> Diese Datei beschreibt das **Verhalten**, nicht die **Balancing-Zahlen** —
> konkrete Kurven, Kosten und Werte gehören als deklarativer Content unter
> `src/game/` (siehe AGENTS.md §4). Offene Punkte sind mit `TODO` markiert.

---

## 1. Kampf — Grundmodell

- Kampf ist **rundenbasiert** zwischen **eigenem Team** (drei Charaktere, §3) und einer
  **Gegnerformation** (bis zu sechs Gegner, §1.3).
- Der Kampf ist **deterministisch** und **render-unabhängig** simuliert: Die Engine erzeugt
  die Runden **schrittweise auf Abruf** (eine reine „Zustand → nächste Runde"-Funktion), das
  Rendering spielt sie Runde für Runde **ab** — Simulation ≠ Rendering (siehe §5).
- Ergebnis eines Kampfes ist **Sieg** (alle Gegner besiegt) oder **Niederlage/Wipe**
  (alle Charaktere besiegt). Ein Sieg erzeugt eine **Belohnung** (einziger
  Fortschrittsweg, siehe DESIGN §2).
- Es gibt **keine aktiven, vom Spieler ausgelösten Fähigkeiten** im Kampf. Der Kampf
  läuft vollständig automatisch ab; der Spieler beeinflusst ihn ausschließlich **vor**
  dem Kampf über Charakter-Builds und Ausrüstung. (Die Architektur bleibt für spätere
  aktive Eingriffe offen, DESIGN-Pillar 4 — aktuell nicht umgesetzt.)

### 1.1 Rundenablauf

Ein Kampf besteht aus **Runden**. In jeder Runde handelt **jeder lebende Akteur**
(Charaktere **und** Gegner) **genau einmal**.

**Reihenfolge (Initiative):**

- Alle lebenden Akteure handeln **absteigend nach Initiative**.
- **Charaktere** haben einen festen Initiative-Wert (Stat, §3).
- **Gegner** haben eine **Initiative-Range**; ihr konkreter Wert wird **einmalig zu
  Kampfbeginn** per PRNG innerhalb der Range gewürfelt und bleibt für den restlichen
  Kampf fix.
- **Bei Gleichstand handelt der Gegner zuerst.**
- Die Reihenfolge ist damit für den gesamten Kampf stabil (nur unterbrochen durch
  ausscheidende Akteure).

**Ablauf einer Runde:**

1. **Rundenbeginn:** Für jeden lebenden Charakter wird die **Barrier** neu gesetzt
   (Höhe = Barrier-Stat). Nicht verbrauchte Barrier der Vorrunde **verfällt** — Barrier
   **stackt nicht** über Runden.
2. **Aktionen** in Initiative-Reihenfolge:
   - **Charakter am Zug:** ein Basisangriff auf sein priorisiertes Ziel (§1.2), inklusive
     der Offensiv-Procs (§2.1). **Direkt nach der eigenen Handlung** heilt die
     **Regeneration** den Charakter.
   - **Gegner am Zug:** ein Angriff gegen das **gesamte Team** (Team-weit, verteilt über
     die Schadenspipeline §2.3). Gegner wählen **keine** Einzelziele. Ein durch
     **Suppression** (Quinns Signatur-Skill, §3.5) **gestaggerter** Gegner **setzt seine
     Aktion aus** (handelt in dieser Runde nicht).
3. **Rundenende:** keine gesonderten Effekte (Regeneration triggert pro Akteur, nicht am
   Rundenende; Barrier verfällt implizit beim Neu-Setzen zu Rundenbeginn).

**Abbruch-/Endbedingungen:**

- **Sieg:** alle Gegner besiegt.
- **Niederlage/Wipe:** alle Charaktere besiegt → Kampf endet ohne Belohnung (siehe §4.4).
- **Manueller Abbruch:** Der Spieler kann einen laufenden Kampf jederzeit abbrechen
  (verlässt den Dungeon, keine Belohnung für den laufenden Floor, §4.4).
- **Kein Rundenlimit.** Ein Kampf endet ausschließlich durch **Sieg**, **Wipe** oder **manuellen
  Abbruch** — es gibt keinen automatischen Runden-Cap. Ein unentscheidbarer Deadlock ist dennoch
  ausgeschlossen: Gegner haben keine Heilung und Charakterangriffe verursachen stets vollen,
  positiven Schaden (§2.2), die Gegner-Gesamt-Health sinkt also **monoton** → jeder Kampf ist in
  **endlicher** Rundenzahl entschieden. Die inkrementelle Simulation rechnet zudem nur **eine Runde
  pro Anzeige-Takt** (auch im Catch-up an Echtzeit gebunden, §5), sodass auch ein sehr langer Kampf
  die Anwendung nie blockiert; einen zäh laufenden Kampf beendet der Spieler per manuellem Abbruch.

### 1.2 Zielauswahl

**Gegner → Team (bewusste Asymmetrie):**

- Gegner wählen **kein** Einzelziel. Jeder Gegner-Angriff richtet sich gegen das
  **gesamte Team** und wird über die Schadenspipeline (§2.3) auf die Charaktere verteilt.

**Charakter → Gegner:**

- Charaktere greifen **immer genau einen** Gegner an (plus mögliche Splash-Nebenziele, §2.1).
- **Tank- & Melee-Charakter:** können **nur die Frontline** angreifen, solange dort Gegner
  leben. Ein **Taunt** zwingt sie, einen **lebenden gegnerischen Tank vorrangig**
  anzugreifen.
- **Ranged-Charakter:** umgeht den Taunt und kann die **Backline von Beginn an** anvisieren,
  zahlt dafür aber einen laufenden **Bulwark-Malus** (§2.4), solange Frontline-Gegner leben.
- **Priorisierung innerhalb der wählbaren Ziele:** Gegner mit der **höchsten Initiative
  zuerst**.

### 1.3 Gegnerformation

- Gegner stehen in einer **2×3-Formation**: zwei **Lanes** (Frontline, Backline) mit je
  **drei Slots** → **maximal sechs Gegner** pro Kampf.
- **Rollen:** **Tank** und **Melee** stehen in der **Frontline**, **Ranged** in der
  **Backline**. **Maximal ein Tank-Gegner** pro Kampf.
- Gegner-Stats: **Health, Attack, Accuracy, Initiative** (nur diese vier). Gegner haben
  **keine** Defense und **keine** Evasion → Charakter-Angriffe treffen immer und werden
  nicht gemindert (§2.2).
- Die **Frontline schützt die Backline** (Bulwark, §2.4).

---

## 2. Kampfwerte & Formeln

> Formeln beschreiben die **Struktur** der Berechnung. Die einzelnen
> **Faktoren/Konstanten** stammen aus dem Balancing-Content (`src/game/`, siehe
> [BALANCING.md](BALANCING.md)).

### 2.1 Charakter-Zug (ausgehender Schaden)

Ein Charakter macht pro Zug **einen Basisangriff**. Reihenfolge der Procs:

1. **Basisschaden**
   `Schaden = Attack × Waffen-Damage-Range` — die Damage-Range ist ein pro Treffer per
   **PRNG** gewürfelter Faktor im Waffenintervall (z. B. 90 %–110 %).
2. **Crit** — mit _Crit Chance_ wird auf einen kritischen Treffer geprüft; bei Erfolg
   `× Crit Damage`-Multiplikator.
3. **Multi Hit** — mit _Multi Hit Chance_ wird auf einen Zusatztreffer **auf dasselbe Ziel**
   geprüft; bei Erfolg erneut, bis zu **_Multi Hit Chain_-mal in Folge**, endet beim ersten
   Fehlwurf. Jeder Zusatztreffer verursacht _Multi Hit Damage_ (Anteil des Trefferschadens).
4. **Splash** — mit _Splash Chance_ trifft der Angriff zusätzlich bis zu _Splash Radius_
   **Nebenziele**. _Splash Damage_ ist ein **prozentualer Anteil des tatsächlich verursachten
   Schadens** (Bulwark-Malus ist darin bereits enthalten und wird so indirekt vererbt).
   Auswahl der Nebenziele: **gleiche Lane zuerst**, dann reguläre Priorisierung (§1.2, höchste
   Initiative zuerst).
5. **Counter** — **rein reaktiv**: Wird ein Charakter selbst getroffen, löst er mit
   _Counter Chance_ **sofort** (außerhalb der Initiative-Reihenfolge) einen Gegenangriff mit
   _Counter Damage_ aus. Ein **geblockter** Treffer ist ein Treffer → löst Counter aus; ein
   **ausgewichener** (Evasion) Treffer nicht.

- **Per-Hit-Crit (optionaler Skilltree-Knoten):** Standardmäßig wird der Crit-Wurf einmal auf
  den Grundtreffer angewandt. Ein freischaltbarer Skill-Knoten lässt **jeden einzelnen Hit**
  (Grund-, Multi-, Splash-Treffer) separat auf Crit prüfen.
- **Sustain:** Ein Charakter mit _Sustain_ heilt sich **pro getroffenem Gegner** um seinen Sustain-Wert.
- **Regeneration:** heilt den Charakter **direkt nach dessen eigener Handlung** (§1.1).

### 2.2 Treffermodell

- **Charakter → Gegner:** trifft **immer** und **voll** (Gegner haben keine Evasion/Defense).
- **Gegner → Charakter:** pro Charakter wird **Gegner-Accuracy gegen Charakter-Evasion**
  gewürfelt (§2.3, Schritt 2). _Accuracy_ wächst linear mit der Floor-Tiefe (BALANCING).

### 2.3 Eingehender Schaden (Schadenspipeline)

Ein einzelner Gegner-Angriff der Stärke `S` trifft das **ganze Team** und durchläuft je
Charakter folgende Pipeline (Reihenfolge verbindlich):

1. **Basis-Verteilung.** `S` wird gleichmäßig auf die **lebenden** Charaktere verteilt:
   `Tick = S / (#lebende Charaktere)`.
   - **Mitigation** (Korvins Signatur-Skill, §3.5) modifiziert diese
     Verteilung: Ein Anteil `m` des DD-Ticks wird auf den **Tank** umgeleitet.
     - **Tank lebt & Mitigation aktiv:** jeder lebende DD erhält `Tick × (1 − m)`; der Tank
       erhält `Tick + (#lebende DDs) × Tick × m`. → Summe bleibt exakt `S`.
     - **Ohne Mitigation / Tank tot:** jeder lebende Charakter trägt seinen eigenen `Tick`;
       kein Umleitungsziel.
2. **Evasion** (pro Charakter). Miss-Roll _Gegner-Accuracy_ gegen _Evasion_. Bei Ausweichen:
   **0 Schaden**, **kein Counter**.
3. **Block** (pro Charakter). Mit _Block Chance_ → `Schaden × (1 − Block%)` (partielle
   Reduktion um einen festen %-Wert; **nicht** all-or-nothing). Ein geblockter Treffer bleibt
   ein Treffer → **löst Counter aus**.
4. **Defense** (pro Charakter). **Flacher** Abzug (durch _Armor_ erhöht). Block wirkt **vor**
   Defense: das % greift auf den rohen Schwung, die flache Rüstung zieht danach fix ab.
5. **Barrier** (pro Charakter). Absorbiert den verbleibenden (bereits abgemilderten) Schaden,
   bevor Health reduziert wird.
6. **Health** (pro Charakter). Wird um den Restschaden reduziert.

### 2.4 Bulwark (Deckung der Backline)

- Solange **Frontline-Gegner leben**, erleiden **Backline-Gegner** reduzierten Schaden
  (Bulwark-Malus auf eingehenden Schaden).
- Der Malus ist **additiv pro Frontline-Gegnertyp** (Tank trägt mehr bei als Melee). Konkrete
  Prozentwerte = Balancing (`src/game/`, BALANCING §). Ein Cap ist bei den vorgesehenen
  Werten nicht nötig.
- Fällt die Frontline vollständig, entfällt der Bulwark-Malus.
- **Sunder** (Rhayas Signatur-Skill, §3.5) baut den Bulwark-Beitrag einzelner
  Frontline-Gegner **während des Kampfes** ab (siehe dort).

### 2.5 Feststehende Regeln

- **Aller Zufall** in diesen Formeln (Treffer, Crit, Multi Hit, Splash, Counter,
  Damage-Range, Gegner-Initiative) läuft über den **seedbaren PRNG** — **kein**
  `Math.random()` (AGENTS.md §5, §14).
- Werte, die `Number.MAX_SAFE_INTEGER` überschreiten können (Schaden, Health, Ressourcen),
  werden über **break_eternity.js** geführt, nicht über native `number` (AGENTS.md §5).

---

## 3. Team

- **Teamgröße:** genau **drei feste, namentliche Charaktere**, ab Start verfügbar (keine
  Freischaltung, keine Rekrutierung, kein Austausch).

  | Rolle  | Name   | Sex        |
  | ------ | ------ | ---------- |
  | Tank   | Korvin | Male       |
  | Melee  | Rhaya  | Female     |
  | Ranged | Quinn  | Non-Binary |

- **Leitprinzip — keine charakterexklusiven Stats.** Alle Stats sind für alle Charaktere
  verfügbar. Etwas, das nur für einen Archetyp sinnvoll ist (z. B. Mitigation), wird als
  charaktergebundener **Signatur-Skill** (§3.5) gekapselt, nicht als Stat.
- **Umgang mit besiegten Slots:** Index-Zugriffe auf Team-/Gegner-Slots liefern `| undefined`
  und erzwingen eine Prüfung (AGENTS.md §9). Besiegte Charaktere fallen aus Initiative-
  Reihenfolge und Schadensverteilung heraus.

### 3.0 Stats

Jeder Charakter hat Stats in vier Kategorien:

| Kategorie     | Stats                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Core**      | Health, Attack, Defense                                                                                                    |
| **Offensive** | Crit Chance, Crit Damage, Multi Hit Chance, Multi Hit Damage, Splash Chance, Splash Damage, Counter Chance, Counter Damage |
| **Defensive** | Armor, Barrier, Block Chance, Evasion, Sustain, Regeneration                                                               |
| **Utility**   | Initiative, Multi Hit Chain, Splash Radius                                                                                 |

- **Core:** _Health_ = Lebenspunkte; _Attack_ = Grundschaden; _Defense_ = flache Schadens-
  reduktion (§2.3, Schritt 4).
- **Offensive:** paarweise **Chance + Damage** je Muster (Crit, Multi Hit, Splash, Counter);
  Wirkung siehe §2.1. Die vier Paare sind an die vier **Skilltree-Zweige** gekoppelt (§3.2).
- **Defensive:** _Armor_ erhöht _Defense_; _Barrier_ = temporärer, pro Runde neu gesetzter
  Absorptionsschild; _Block Chance_ = partielle Reduktion (§2.3, Schritt 3);
  _Evasion_ = Ausweichchance gegen Accuracy (§2.3, Schritt 2); _Sustain_ =
  flache Heilung beim Anrichten von Schaden; _Regeneration_ = Heilung nach eigener Handlung.
- **Utility:** _Initiative_ = Zugreihenfolge; _Multi Hit Chain_ = maximale Multi-Hit-Kettenlänge;
  _Splash Radius_ = Anzahl Nebenziele (Lane-übergreifend).

### 3.1 Attribute (Level-Up-Progression)

Jeder Charakter hat drei Attribute. Sie verteilen das **Core-Wachstum**: Jeder Punkt hebt
direkt einen der drei Core-Stats. Zweck: Jedes Level-Up ist eine aktive, selbstgewählte
Gewichtung zwischen **Offense, Verteidigung und Überleben** — besonders relevant durch die
**Attrition** (keine Heilung zwischen Floors, §4.4).

| Attribut (EN)  | Gekoppelter Core-Stat |
| -------------- | --------------------- |
| **Ferocity**   | Attack                |
| **Resilience** | Defense               |
| **Vigor**      | Health                |

**Mechanik**

- 1 Punkt **addiert** einen **festen Betrag** auf den gekoppelten Core-Stat (additiv/linear;
  konkrete Werte = Balancing, `src/game/`). Der Zuwachs ist konstant pro Punkt, unabhängig vom
  aktuellen Wert.
- Die Attribut-Zuwächse liegen **über** dem automatischen Baseline-Wachstum (§3.3) — die
  Baseline sichert einen spielbaren Sockel, die Attribute setzen die Gewichtung.

**Progression**

- **100 Punkte pro Charakter** (Level 1 = 1 Punkt, dann +1 je Level bis 100).
- Alle Charaktere starten als **identische Blank Slates** (keine Affinitäten).
- **Frei verteilbar** (suboptimale Builds erlaubt), **Respec gegen Gold** (analog Skillpunkte).

### 3.2 Charakter-Skilltree

- Jeder Charakter hat einen Skilltree mit **vier Zweigen** — je ein Zweig pro offensivem
  Schadensmuster. Alle drei Charaktere teilen **dieselbe** Zweig-Struktur; Distinktheit kommt
  aus der Rolle (§1.2) und den charaktergebundenen Signatur-Skills im Crucible (§3.5/§4.3).

  | Zweig         | Schadens-Muster            | Gekoppelte Stats                                      |
  | ------------- | -------------------------- | ----------------------------------------------------- |
  | **Finesse**   | Crit (Einzeltreffer)       | Crit Chance + Crit Damage                             |
  | **Tempest**   | Multi-Hit (**ein** Ziel)   | Multi Hit Chance + Multi Hit Damage + Multi Hit Chain |
  | **Dominance** | Splash (**mehrere** Ziele) | Splash Chance + Splash Damage + Splash Radius         |
  | **Valor**     | Counter (Vergeltung)       | Counter Chance + Counter Damage                       |

- Jeder Zweig enthält **Stat-Knoten** (die gekoppelten Werte-Boosts) und
  **Verhaltens-Knoten** (z. B. **Per-Hit-Crit**, Chain-/Radius-Erweiterungen).
- **Chance**-Stats haben einen **Soft-Cap bei 100 %** (Überschuss verpufft), **Damage**-Stats
  skalieren **unbegrenzt** → ein Zweig wird nie wertlos. Die gekoppelten Stats sind selbst
  **Multiplikatoren** auf den exponentiellen Base-Schaden (skalierungsstabil).
- **Skillpunkte:** **1 pro Level** (→ 100 gesamt), frei im gesamten Baum verteilbar. **Respec
  gegen Gold.**

### 3.3 Charakterlevel

- Jeder Charakter hat ein **Level**; Maximallevel **100** (Erhöhung durch XP, §4.2).
- **Ein Level-Up bewirkt dreierlei:**
  1. **Automatisches Core-Baseline-Wachstum** (Health/Attack/Defense nach fester Kurve,
     BALANCING) — der spielbare Sockel, auf den die Attribute aufsetzen.
  2. **+1 Attributpunkt** (Core-Gewichtung, §3.1).
  3. **+1 Skillpunkt** (Offensiv-Zweige, §3.2).

### 3.4 Ausrüstung

- Jeder Charakter trägt Ausrüstung in **sechs Slots**. Jeder Slot hat einen **Innate-Affix** —
  einen festen Basis-Stat, der mit dem **Item-Level** skaliert (§4.5):

  | Slot          | Item-Typ (rollenspezifisch)                                        | Innate-Affix                       |
  | ------------- | ------------------------------------------------------------------ | ---------------------------------- |
  | **Main Hand** | Waffe (alle Charaktere) — trägt **Damage-Range**                   | **Damage**                         |
  | **Off Hand**  | Rhaya/Quinn: Dolch/Köcher → **Damage**; Korvin: Schild → **Armor** | **Damage** (DD) / **Armor** (Tank) |
  | **Head**      | Helm                                                               | **Armor**                          |
  | **Chest**     | Rüstung                                                            | **Armor**                          |
  | **Legs**      | Beinschutz                                                         | **Armor**                          |
  | **Feet**      | Schuhe                                                             | **Initiative**                     |

- Item-Typen sind **item-typ-rollenspezifisch** (Schild nur Korvin usw.); die getragenen **Stats
  bleiben universell** (kein charakterexklusiver Stat, §3).
- **Waffen** haben zusätzlich eine prozentuale **Damage-Range**, die den Grundschaden moduliert (§2.1).
- Ausrüstung ist der **Hauptmotor** des Fortschritts (Loot & Handwerk, §4.5).

**Item-Anatomie (drei Schichten).** Jedes Item trägt seine Werte auf drei getrennten Ebenen —
diese Trennung ist das Fundament des Loot-/Handwerk-Loops (§4.5):

1. **Basis** — Item-Typ + Slot (z. B. „Schwert / Main Hand", „Schild / Off Hand"). Legt den
   **Innate-Affix** (Tabelle oben) und die Slot-Rolle fest. **Reguläre Basen werden beim
   Blacksmith gecraftet** (§4.5) — sie droppen **nicht**; nur **Uniques** droppen (Elite/Boss).
2. **Item-Level** (`+n`, **exponentielle Basis-Power**) — skaliert den **Innate-Value**; **endlos**
   hochstufbar beim **Blacksmith** gegen Gold. Das persistente Item „wächst mit" — der **planbare**
   Träger der Incremental-Kurve. Ein gedropptes **Unique** kann floor-skaliert **vorgelevelt**
   erscheinen (§4.5, Wechsel-Glätter). Item-Level hebt zusätzlich die **Seltenheit**
   (bis **Legendary**, §4.5).
3. **Sockel & Gems** (**Min-Max-Achse**) — die **Seltenheit** (EN: _Rarity_) bestimmt die **Anzahl
   der Sockel**; in jeden Sockel steckt man einen **Gem** aus dem **Gem-Bestand** (Ressourcen-Zähler,
   kein Inventar), der einen zufälligen Affix aus seinem **Farb-Pool** rollt (seed-PRNG). Dies ist
   die eigentliche **Loot-Jagd**. Details: §4.5.

- **Gems sind am Item gebunden:** Ein gesockelter (und im Sockel gelevelter) Gem bleibt im Item —
  auch bei Nichtbenutzung „friert" er dort ein (kein Verlust). Nur aktives **Ersetzen** zerstört ihn.
- **Kein erzwungener Item-Wechsel:** Item-Level **und** Sockel-Investment leben auf **demselben**
  behaltenen Item. Ein Umstieg lohnt sich nur über eine höhere **Seltenheit** (mehr Sockel), ein
  **Unique** (Implicit + Prismatic-Slot) oder einen anderen **Basis-Typ** — und **Uniques droppen
  mit vorgesockelten Gems** (§4.5), sodass ein Umstieg nicht bei null beginnt.

<!-- TODO (spätere Runde, §4.5): Amulet-Slot (Sonderrolle) und Runen (Masterwork-Endgame).
     Bewusst separate Interview-Runde. -->

### 3.5 Signatur-Skills

Jeder der drei Charaktere besitzt **genau einen** Signatur-Skill, der (anders als ein
Stat-Knoten) in einen **globalen Kampf-Hebel** eingreift und das Spielgeschehen verändert.
Jeder Skill belegt einen eigenen, sonst unberührten Hebel; kein Signatur-Skill hebt die
eigene Rollen-Penalty (Taunt/Bulwark/Frontline-Lock) auf. Zusammen bilden sie eine Kette:
**halten → aufbrechen → verwerten & Zeit kaufen**.

| Charakter      | Signatur-Skill        | Angegriffener Hebel        | Wirkrichtung        |
| -------------- | --------------------- | -------------------------- | ------------------- |
| Korvin (Tank)  | **Mitigation** (§3.2) | Schadensverteilung (§2.3)  | defensiv, Umleitung |
| Rhaya (Melee)  | **Sunder**            | Bulwark / Formation (§2.4) | offensiv-enabling   |
| Quinn (Ranged) | **Suppression**       | Zug-Ökonomie (§1.1)        | präventiv-defensiv  |

Alle drei sind **charaktergebundene Crucible-Knoten** (§4.3) mit **Level 1–5**; der
Node-Maxlevel wirkt als **natürlicher Cap** (kein künstlicher Cap nötig). Vor Freischaltung
existiert der Effekt nicht. Aller Zufall bleibt deterministisch über den seedbaren PRNG (§2.5)
— die Skills führen **keinen** Zusatz-RNG ein.

#### Mitigation (Korvin, Tank)

- Siehe §2.3 (Schadenspipeline, Schritt 1). Leitet einen Anteil `m` des DD-Ticks
  auf den Tank um; `m` steigt mit dem Node-Level.

#### Sunder (Rhaya, Melee) — Bulwark-Bruch

- Rhayas Treffer auf einen **Frontline-Gegner** reduzieren dessen **Bulwark-Beitrag** (§2.4).
  Der Abbau ist **kumulativ pro Ziel** und gilt **nur für die Dauer des laufenden Kampfes** —
  es gibt **keinen Übertrag** zwischen Floors (Formationen stehen pro Floor neu).
- Wandelt Rhayas erzwungenen **Frontline-Lock + Taunt** (§1.2) in Team-Utility: Sie reißt die
  Deckung ein → der eingehende Schaden auf die **Backline** steigt und damit Quinns Wirkung.
  Der **Taunt** zwingt Rhaya vorrangig auf den gegnerischen Tank — der den **größten**
  Bulwark-Anteil trägt (§2.4) und damit das lohnendste Sunder-Ziel ist.
- **Node-Skalierung (Level 1–5):** steigender Bulwark-Abbau pro Treffer und/oder höheres
  Abbau-Cap pro Ziel. Konkrete Werte = Balancing (`src/game/`, BALANCING).

#### Suppression (Quinn, Ranged) — Stagger / Aktionsentzug

- Quinns Treffer bauen auf dem getroffenen Gegner **Stagger-Stacks** auf. Erreicht der
  Stack-Zähler eine **Schwelle**, wird der Gegner **gestaggert** und **setzt seine nächste
  Aktion aus** (§1.1) → weniger team-weit eingehender Schaden (§2.3).
- Quinn umgeht den Taunt und trifft die **Backline von Beginn an** (§1.2) → sie kann gezielt
  den gefährlichsten Ranged-Gegner (höchste Initiative, handelt zuerst) stummschalten.
- **Immunitäts-Fenster (kein Dauer-Lock):** Nach einem ausgelösten Stagger müssen sich die
  Stacks des Ziels erst über **X Runden abbauen**, bevor derselbe Gegner erneut gestaggert
  werden kann. Der Stack-Zähler ist rein deterministisch.
- **Node-Skalierung (Level 1–5):** niedrigere Stagger-Schwelle und/oder längerer Aussetzer.
  Konkrete Werte (Schwelle, Abbau-Rate `X`, Aussetz-Dauer) = Balancing (`src/game/`).

<!-- TODO (Balancing): Sunder — Abbau-Betrag pro Treffer & Cap pro Ziel. Suppression —
     Stagger-Schwelle, Stack-Abbau-Rate `X` (Runden bis erneut staggerbar), Aussetz-Dauer. -->

---

## 4. Fortschritt & Belohnungen

### 4.1 Struktur: Akte, Dungeons, Floors

- **3 Akte** × **5 Dungeons** × **20 Floors** = **300 Floors**.
- Notation: `A<Akt>-<Dungeon>-<Floor>` (Floor zweistellig), z. B. `A1-4-20`.
- Ein **Floor** ist ein Kampf gegen eine Gegnerformation (2–6 Gegner, §1.3).
- **Elite-Floor:** Floor 20 der Dungeons 1–4 eines Akts. **Boss-Floor:** Floor 20 des
  **letzten** Dungeons eines Akts.
  - Akt-Bosse: _The Ashen Warden_ (A1), _The Emberbound Sovereign_ (A2), _The Gilded Empress_ (A3).
- **Ramp-Up:** Die volle Gegnervielfalt wird **einmal im ersten Dungeon eines Akts** in vier
  Phasen eingeführt: (1) nur eine Lane, wenige Gegner → (2) beide Lanes, wenige → (3) beide
  Lanes, mehrere → (4) beide Lanes, mehrere inkl. Tank-Gegner.
- Abgeschlossene Dungeons können jederzeit **wiederholt** werden (Farmen von XP/Gold).

### 4.2 Belohnungen aus einem Sieg

1. **XP** → Charakterlevel (§3.3). Pro Floor entsteht ein **XP-Pool** (abhängig von Floor &
   Gegnerzahl), der auf die drei Charaktere verteilt wird: ein **Basisanteil** je Charakter,
   der Rest **individuell**.
   <!-- TODO: Verteilungsschlüssel des Rests (Kandidat: nach verursachtem Schaden). -->
2. **Gold** — globale Währung (Respecs, Crafting/Enchant, Node-Respec).
3. **Crystals** — globale Währung für den **Crucible** (§4.3). **Nur beim allerersten Sieg**
   eines Floors:
   - Normal = 1, Elite = 3, Boss = 10.
   - Gesamt im Spiel: 285 (normal) + 36 (elite) + 30 (boss) = **351 Crystals**.
4. **Gems & Uniques** (Loot-Motor, §4.5) — jeder Sieg speist den Handwerk-Loop:
   - **Gems** (Hauptdrop) — **Amber** & **Sapphire** als Sockel-Bestückung _und_ Level-Fodder;
     nach Floor-Tiefe (Akt/Dungeon/Floor) gestaffelt. **Diamond** (Prismatic) nur bei Elite/Boss.
   - **Uniques** (nur Elite/Boss) — komplette Items mit vordefinierter Affix-Identität, floor-skaliert
     **vorgelevelt** & **vorgesockelt** (§4.5). **Reguläre Item-Basen droppen nicht** — sie werden
     beim **Blacksmith** gecraftet.
   - **Seedbasiert & wiederholbar:** Drops laufen über den seedbaren PRNG (§2.5); beim **Farmen**
     würfelt **jeder Durchlauf neu** (neuer Seed pro Run, §4.5/§5) → der Jagd-Reiz bleibt beim
     Wiederholen erhalten.

### 4.3 Crucible (globaler Skilltree)

- Der **Crucible** ist ein weitgehend **globaler, charakterübergreifender** Skilltree. Der
  Spieler „schmilzt" **Crystals** ein, um **permanente** Verbesserungen freizuschalten.
- Zusätzlich beherbergt der Crucible die **charaktergebundenen Signatur-Skills** (§3.5) —
  spielverändernde, an je einen Charakter gebundene Unlocks. Sie folgen dem Standard-Node-Modell
  (Level 1–5), sind aber dem jeweiligen Charakter zugeordnet statt global wirksam.
- Vier Trees (Schmiede-Wortfeld):

  | Tree             | Fokus                                                                            |
  | ---------------- | -------------------------------------------------------------------------------- |
  | **Anvil Sparks** | Freischalten von Inhalten (Blacksmith, Enchanter, Ausrüstungsslots, Checkpoints) |
  | **Tempering**    | Stat-Boosts der Charaktere                                                       |
  | **Refining**     | Economy-Boosts (Gold-Drop, XP-Gewinn, Rabatte bei Blacksmith/Enchanter)          |
  | **Masterwork**   | Endgame-Systeme (z. B. Runen)                                                    |

- Manche Nodes sind **stufbar** (max. **5 Level**), Kosten **linear steigend** (Level `n` = `n`
  Crystals; 1+2+3+4+5 = 15 Crystals für einen voll gestuften Node).
- **Respec gegen Gold.**

### 4.4 Checkpoints, Wipe & Abbruch

- **Keine Heilung zwischen Floors:** Innerhalb einer Auto-Progression-Kette wird Health
  mitgeschleppt (Attrition) — Defensiv-Stats und Sustain/Regeneration werden dadurch relevant.
  <!-- Bewusste Entscheidung; nach Playtesting revidierbar. -->
- **Auto-Progression:** Der Spieler startet Kämpfe zunächst **einzeln**; ein Anvil-Sparks-Node
  schaltet das **automatische Starten** des nächsten Floors frei. Am **Dungeon-Ende** ist ein
  manueller Neustart nötig (keine automatische Dungeon-Kette). **Keine Geschwindigkeitssteuerung.**
- **Wipe oder manuelles Verlassen:** Man verlässt den **kompletten** Dungeon. **Bereits
  erhaltene Belohnungen bleiben erhalten** (keine Penalty außer entgangenem Floor-Reward).
- **Fortschritt innerhalb eines Dungeons wird nicht gespeichert** — ein Dungeon startet
  **immer bei Floor 1**.
- **Checkpoint = Menge freigeschalteter Dungeon-Einstiege** (Dungeon-Granularität, jeweils
  Floor 1). Beim Wiederbetreten **wählt** der Spieler frei einen freigeschalteten Dungeon.
  - **Default pro Akt:** Dungeon 1, Floor 1 (`A<Akt>-1-01`).
  - **Anvil-Sparks-Nodes** schalten spätere Dungeon-Einstiege frei (sobald ein Dungeon einmal
    komplett war) → kein Rückfall an den Aktanfang.

### 4.5 Ausrüstung, Loot & Handwerk (Kern-Loop)

Der Ausbau der Ausrüstung ist der **Hauptmotor** des Fortschritts (BALANCING §3). Er ruht auf
**zwei bewusst getrennten Achsen**, die auf die zwei Handwerker abbilden — die exponentielle
Basis-Power ist **planbar**, die Varianz-Jagd liegt auf den **Gems**:

| Achse                    | Träger am Item (§3.4)      | Station        | Zufall    | Reiz                         |
| ------------------------ | -------------------------- | -------------- | --------- | ---------------------------- |
| **Exponentielle Power**  | Item-Level (`+n`) → Innate | **Blacksmith** | keiner    | „numbers go big", planbar    |
| **Min-Max / Sidegrades** | Sockel + **Gems**          | **Enchanter**  | seed-PRNG | Loot-Jagd, Build-Optimierung |

Alle Handwerks-Aktionen (Blacksmith **und** Enchanter) kosten grundsätzlich **Gold**.

#### Seltenheit & Sockel

- Jedes Item hat eine **Seltenheit** (EN: _Rarity_): **Common → Magic → Rare → Legendary → Unique**.
  Die Seltenheit bestimmt die **Anzahl der Sockel**:

  | Seltenheit    | Normale Sockel | Prismatic-Slot             | Herkunft                |
  | ------------- | -------------- | -------------------------- | ----------------------- |
  | **Common**    | 1              | —                          | Drop / Blacksmith       |
  | **Magic**     | 2              | —                          | Drop / Blacksmith       |
  | **Rare**      | 3              | —                          | Drop / Blacksmith       |
  | **Legendary** | 4              | —                          | Drop / Blacksmith       |
  | **Unique**    | 4              | **1** (nur Prismatic-Gems) | **nur Elite/Boss-Drop** |

- **Common → Legendary** ist per Blacksmith **hochstufbar** (Aufstieg = +1 Sockel). **Unique** ist
  **nicht** hochstufbar erreichbar — es **droppt exklusiv** bei Elite-/Boss-Gegnern, trägt einen
  festen **Implicit** (§3.4) und den zusätzlichen **Prismatic-Slot**.

#### Drop-Modell (seedbasiert)

- Kämpfe droppen **Gems** (Farb-Fodder: Amber/Sapphire; **Diamond** nur Elite/Boss) und — **nur bei
  Elite/Boss** — **Uniques**. **Reguläre Item-Basen droppen nicht**; sie entstehen beim Blacksmith.
- **Aller Loot-Zufall** läuft über den **seedbaren PRNG** (§2.5) — reproduzierbar, testbar, kein
  Save-Scumming. **Determinismus gilt innerhalb eines Runs**; beim **Farmen** eines geschafften
  Dungeons würfelt **jeder Durchlauf mit neuem Seed** (frische Drops pro Run).
- **Uniques** kommen mit **vordefinierten Affix-Identitäten** (nur die _Values_ werden gewürfelt) →
  jedes Unique hat eine **wiedererkennbare Identität**, bleibt aber veränderbar. Sie droppen
  **floor-skaliert vorgelevelt** (tiefer = höher) und bereits **vorgesockelt** (zufällige Gems,
  austauschbar); nur der **Prismatic-Slot** ist leer → ein Umstieg beginnt nicht bei `+0`
  (**Wechsel-Glätter**, §3.4).

#### Blacksmith (exponentielle Basis-Power)

- **Craften:** die **einzige Quelle** regulärer Item-Basen (reguläre Basen droppen nicht).
  Rezepte/Materialien = TODO.
- **Aufwerten (Upgrade):** hebt das **Item-Level** (`+n`) → skaliert den **Innate-Value** (§3.4).
  **Endlos** stufbar → das persistente Item trägt die Incremental-Kurve. Kein RNG. Item-Level hebt
  zugleich die **Seltenheit** (bis Legendary, +1 Sockel je Stufe).

#### Enchanter (Gems / Min-Max-Jagd)

- **Sockeln:** verbraucht **1 Gem** der Farbe aus dem **Bestand** (Ressourcen-Zähler, kein Inventar)
  und setzt ihn in einen Sockel; dabei wird ein **zufälliger Affix** aus dem **Farb-Pool** gerollt,
  mit einer **Value-Range** — der konkrete Wert fällt beim Sockeln (seed-PRNG). Ein bereits belegter
  Sockel wird **überschrieben** (der alte, gebundene Gem ist **verloren**, §3.4).
- **Gem aufleveln** (im Sockel, **gedeckelt durch die Item-Seltenheit**): hebt die **Value-Range**; die
  **relative Position** in der vorherigen Range bleibt erhalten. Aufleveln kostet **Gems gleicher
  Farbe** als Fodder — **jedes Level braucht mehr** (→ Fodder-Sink).
- **Value rerollen:** würfelt den Wert innerhalb der aktuellen Range neu.
- **Gem-Farben** (Farb-Pools = Stat-Kategorien, §3.0):

  | Gem                 | Kategorie | Pool                                                                                         | Sockel                 |
  | ------------------- | --------- | -------------------------------------------------------------------------------------------- | ---------------------- |
  | **Amber** (Gold)    | Offensive | Crit/Multi/Splash/Counter — je Chance + Damage (8)                                           | normal                 |
  | **Sapphire** (Cyan) | Defensive | Barrier, Block Chance, Sustain, Regeneration, Evasion (5)                                    | normal                 |
  | **Diamond**         | Prismatic | item-lokale **Meta-Multiplikatoren** (z. B. _+X % all gem effects_, _+Y % Sapphire-Effekte_) | **nur Prismatic-Slot** |

- **Amber & Sapphire** sind die einzigen regulär gefarmten Gems (zwei Fodder-Farben, schlanke
  Ökonomie); **Diamond** ist der seltene Elite/Boss-Chase. Base-Stats (Health/Attack/Defense),
  Multi Hit Chain & Splash Radius (Skilltree) sowie Initiative (Innate Feet + Crucible) haben
  **keine** Gem-Quelle. Konkrete Pool-Gewichte, Value-Ranges, Aufleveln-Kosten und Diamond-Effekte
  = Balancing (`src/game/`, BALANCING).

#### Noch offen (bewusst separate Interview-Runde — Endgame/Masterwork)

- **Amulet-Slot** mit Sonderrolle (eigener Innate? eigene Gem-Regeln?).
- **Runen-System** (evtl. ins Amulet gesockelt) — Anbindung an **Masterwork** (§4.3).
- **Prismatic/Diamond-Effekte im Detail** (welche Meta-Multiplikatoren, Node-artige Sammlung).
- **Unique-Katalog:** konkrete Uniques (Namen, vordefinierte Affix-Identitäten, Implicits).
- **Craft-Rezepte & Materialien** (womit werden Basen gecraftet?).

### 4.6 Prestige

- **Kein Prestige-System** geplant. Das feste Drei-Charakter-Team und der Fokus auf deren
  Ausbau tragen die Langzeitmotivation; ein Reset-Loop ist bewusst kein Ziel.

---

## 5. Simulation & Zeitverhalten (verbindlich)

Diese Punkte sind bereits durch AGENTS.md §5 festgelegt und hier als Spec-Kontext gespiegelt:

- **Simulation ≠ Rendering:** Die Kampf-Engine ist **reine, deterministische Logik**
  ohne Bezug zu Timern, DOM oder Echtzeit. Das Playback spielt die simulierten Runden
  mit visueller Verzögerung ab.
- **Inkrementelle Simulation:** Der Kampf wird **nicht vorab vollständig** durchgerechnet;
  die Engine erzeugt Runden **schrittweise auf Abruf** (reine „Zustand → nächste Runde"-Funktion).
  **Dasselbe Schrittwerk** treibt beide Modi: das Playback (eine Runde pro Anzeige-Takt) und den
  Catch-up (Runden ohne Animation im Schnelldurchlauf). Ergebnis: **keine Wartezeit** beim
  Floor-Einstieg (es wird nur die jeweils nächste Runde gerechnet), bei erhaltenem Determinismus
  und Catch-up. Der Kampfausgang steht erst mit der letzten Runde fest — er wird vorher nicht
  benötigt (Attrition §4.4 nutzt die Health am Kampfende).
- **Determinismus:** gleicher Seed + gleicher Input ⇒ exakt gleicher Verlauf.
- **Catch-up:** Tab minimiert/gedrosselt ⇒ beim Wiederöffnen werden fehlende Runden
  **ohne Animation** nachgerechnet (Page Visibility API), danach Anzeige synchronisiert.
- **Kein Offline-Progress:** Tab geschlossen ⇒ kein Fortschritt.
- **Loot ist ebenfalls seedbasiert:** Gem- und Item-Drops (§4.2/§4.5) laufen über denselben
  seedbaren PRNG wie der Kampf. Der Determinismus gilt **innerhalb eines Runs**; beim **Farmen**
  erhält jeder Durchlauf einen **neuen Seed** (bewusst frische Drops, kein Save-Scumming).

---

## 6. Persistenz (Save-Verhalten)

Festgelegt durch AGENTS.md §7, hier als Verhaltens-Referenz:

- Save in **`localStorage`** mit **Versionsfeld** und **Migrations-Mechanismus**,
  Zugriff nur über den **`SavePort`-Adapter**.
- Beim **Laden** Validierung gegen ein **Zod-Schema** (pro Save-Version eines).
- Bei Validierungsfehler: **kontrollierter Fallback** (Migration oder definierter
  Reset auf Default) — **kein** Absturz mit korruptem State.

**Zu spezifizieren:**

- [ ] Welche Felder umfasst der Save (Save-State-Form pro Version)? Mindestens: pro Charakter
      Level/XP/Attribut- & Skillpunkte-Verteilung/**getragene Ausrüstung**, Crucible-Node-Stände,
      Gold, **Gem-Bestände** (Amber/Sapphire/Diamond), **Inventar** (Items mit Basis + Item-Level +
      Seltenheit + gesockelten Gems inkl. deren Level/Value, §3.4/§4.5), freigeschaltete Checkpoints,
      höchster erreichter Floor, erste-Sieg-Flags (Crystals).
- [ ] Auslöser für ein Speichern (nach Reward? in Intervallen?).

---

## 7. Verweise

- Vision & Design-Begründungen → [DESIGN.md](DESIGN.md)
- Balancing-Philosophie & Kurven → [BALANCING.md](BALANCING.md)
- Verbindliche Begriffe → [GLOSSARY.md](GLOSSARY.md)
- Technischer Leitfaden für Agenten → [../AGENTS.md](../AGENTS.md)
