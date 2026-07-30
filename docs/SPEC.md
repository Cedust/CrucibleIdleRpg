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
4. **Defense** (pro Charakter). **Flacher** Abzug (_Defense_ ist ein Derived Stat, gespeist u. a.
   aus _Toughness_, §3.0). Block wirkt **vor** Defense: das % greift auf den rohen Schwung, die
   flache Rüstung zieht danach fix ab.
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

Die drei zentralen Kampfwerte **Attack, Defense, Health** sind **Derived Stats** — sie werden
nicht direkt vergeben, sondern aus **drei Quellen mit je eigener Kurve** zusammengesetzt:

| Derived Stat | Baseline (Level, §3.3) | + Attribut (§3.1) | + Core-Stat (Gear/Gems) |
| ------------ | ---------------------- | ----------------- | ----------------------- |
| **Attack**   | Baseline-Kurve         | **Ferocity**      | **Might**               |
| **Defense**  | Baseline-Kurve         | **Resilience**    | **Toughness**           |
| **Health**   | Baseline-Kurve         | **Vigor**         | **Vitality**            |

Jede Quelle skaliert über eine **eigene Kurve** (Werte = Balancing, `src/game/`), sodass sich der
Beitrag der (gedeckelten) Level-Up-Achse und der Gear-Achse unabhängig austarieren lässt.

Jeder Charakter hat Stats in folgenden Kategorien:

| Kategorie     | Stats                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Core**      | Might, Toughness, Vitality                                                                                                 |
| **Derived**   | Attack, Defense, Health                                                                                                    |
| **Offensive** | Crit Chance, Crit Damage, Multi Hit Chance, Multi Hit Damage, Splash Chance, Splash Damage, Counter Chance, Counter Damage |
| **Defensive** | Barrier, Block Chance, Evasion, Sustain, Regeneration                                                                      |
| **Utility**   | Initiative, Multi Hit Chain, Splash Radius                                                                                 |

- **Core (Primär):** _Might_ speist _Attack_, _Toughness_ speist _Defense_, _Vitality_ speist
  _Health_ (je über eine eigene Kurve). Core-Stats stammen aus **Item-Innate** (§3.4) und
  **Emerald-Gems** (§4.5).
- **Derived:** _Attack_ = Grundschaden; _Defense_ = flache Schadensreduktion (§2.3, Schritt 4);
  _Health_ = Lebenspunkte. Zusammensetzung siehe Tabelle oben.
- **Offensive:** paarweise **Chance + Damage** je Muster (Crit, Multi Hit, Splash, Counter);
  Wirkung siehe §2.1. Die vier Paare sind an die vier **Skilltree-Zweige** gekoppelt (§3.2).
- **Defensive:** _Barrier_ = temporärer, pro Runde neu gesetzter Absorptionsschild; _Block Chance_
  = partielle Reduktion (§2.3, Schritt 3); _Evasion_ = Ausweichchance gegen Accuracy (§2.3,
  Schritt 2); _Sustain_ = flache Heilung beim Anrichten von Schaden; _Regeneration_ = Heilung nach
  eigener Handlung.
- **Utility:** _Initiative_ = Zugreihenfolge; _Multi Hit Chain_ = maximale Multi-Hit-Kettenlänge;
  _Splash Radius_ = Anzahl Nebenziele (Lane-übergreifend).

### 3.1 Attribute (Level-Up-Progression)

Jeder Charakter hat drei Attribute. Sie sind **eine der drei Quellen der Derived Stats** (§3.0):
Jeder Punkt hebt über eine eigene Kurve direkt einen der drei Derived Stats. Zweck: Jedes Level-Up
ist eine aktive, selbstgewählte Gewichtung zwischen **Offense, Verteidigung und Überleben** —
besonders relevant durch die **Attrition** (keine Heilung zwischen Floors, §4.4).

| Attribut (EN)  | Gekoppelter Derived Stat |
| -------------- | ------------------------ |
| **Ferocity**   | Attack                   |
| **Resilience** | Defense                  |
| **Vigor**      | Health                   |

**Mechanik**

- 1 Punkt **addiert** einen **festen Betrag** auf den gekoppelten Derived Stat (additiv/linear;
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
  haben **keinen Soft-Cap** (Zuwachs verpufft nie) → ein Zweig wird nie wertlos. Die gekoppelten
  Stats sind selbst **Multiplikatoren** auf den Base-Schaden (skalierungsstabil).
- **Skillpunkte:** **1 pro Level** (→ 100 gesamt), frei im gesamten Baum verteilbar. **Respec
  gegen Gold.**

### 3.3 Charakterlevel

- Jeder Charakter hat ein **Level**; Maximallevel **100** (Erhöhung durch XP, §4.2).
- **Ein Level-Up bewirkt dreierlei:**
  1. **Automatisches Baseline-Wachstum der Derived Stats** (Attack/Defense/Health nach fester
     Kurve, BALANCING) — der spielbare Sockel, auf den Attribute und Core-Stats aufsetzen (§3.0).
  2. **+1 Attributpunkt** (Core-Gewichtung, §3.1).
  3. **+1 Skillpunkt** (Offensiv-Zweige, §3.2).

### 3.4 Ausrüstung

- Jeder Charakter trägt Ausrüstung in **sechs Slots**. Ein Slot wird über den **Crucible**
  (Anvil Sparks, §4.3) gegen **Crystals** freigeschaltet; dabei entsteht die rollenspezifische
  **Basis** als **`Common +1`** und bleibt dem Slot für das ganze Spiel erhalten.
- Jeder Slot hat einen **Innate-Affix** — einen festen Basis-Stat, der mit dem **Item-Level**
  skaliert (§4.5):

  | Slot          | Item-Typ (rollenspezifisch)                                           | Innate-Affix                          |
  | ------------- | --------------------------------------------------------------------- | ------------------------------------- |
  | **Main Hand** | Waffe (alle Charaktere) — trägt **Damage-Range**                      | **Might**                             |
  | **Off Hand**  | Rhaya/Quinn: Dolch/Köcher → **Might**; Korvin: Schild → **Toughness** | **Might** (DD) / **Toughness** (Tank) |
  | **Head**      | Helm                                                                  | **Vitality**                          |
  | **Chest**     | Rüstung                                                               | **Toughness**                         |
  | **Legs**      | Beinschutz                                                            | **Toughness**                         |
  | **Feet**      | Schuhe                                                                | **Initiative**                        |

- Item-Typen sind **item-typ-rollenspezifisch** (Schild nur Korvin usw.); die getragenen **Stats
  bleiben universell** (kein charakterexklusiver Stat, §3).
- **Waffen** haben zusätzlich eine prozentuale **Damage-Range**, die den Grundschaden moduliert (§2.1).
- Ausrüstung ist der **Hauptmotor** des Fortschritts (Loot & Handwerk, §4.5).

**Item-Anatomie (vier Schichten).** Jedes Item trägt seine Werte auf vier getrennten Ebenen —
Schicht 1 steht mit dem Slot fest, die Schichten 2–4 sind der Handwerk-Loop (§4.5):

1. **Basis** — Item-Typ + Slot (z. B. „Schwert / Main Hand", „Schild / Off Hand"). Legt den
   **Innate-Affix** (Tabelle oben) und die Slot-Rolle fest. Entsteht beim Freischalten des Slots.
2. **Item-Level** (`+n`, **exponentielle Basis-Power**) — skaliert den **Innate-Value**; per
   **Temper** beim Blacksmith gegen Gold gehoben. Das erreichbare Maximum ergibt sich aus der
   **Seltenheit** (Schicht 3), das absolute Maximum ist **`+100`**. Bei **`+50`** und **`+100`**
   trägt das Item je einen **Prismatic-Sockel** (§4.5). Das persistente Item „wächst mit" — der
   **planbare** Träger der Incremental-Kurve.
3. **Seltenheit & Sockel** (**Min-Max-Achse**) — die **Seltenheit** (EN: _Rarity_) ist der
   **Master-Regler**: sie bestimmt die **Anzahl der Sockel** (Breite), das **Gem-Level-Cap**
   (Höhe) **und** das **Item-Level-Cap** (§4.5). In jeden Sockel steckt man einen **Gem** aus dem
   **Gem-Bestand** (Ressourcen-Zähler, kein Inventar), der einen zufälligen Affix aus seinem
   **Farb-Pool** rollt (seed-PRNG). Dies ist die eigentliche **Loot-Jagd**. Gesteigert per
   **Refine** beim Blacksmith gegen **Cinder** + Gold (§4.5).
4. **Implicit** — ein **Legendary**-Item nimmt per **Brand** (Blacksmith) das **Implicit** eines
   **Sigils** auf: ein Affix, den kein Gem liefert, skalierend mit dem **Sigil-Level** (§4.5).
   Der Brand ist überschreibbar (**Re-Brand**).

- **Gems sind am Item gebunden:** Ein gesockelter (und im Sockel gelevelter) Gem bleibt im Item —
  auch bei Nichtbenutzung „friert" er dort ein (kein Verlust). Nur aktives **Ersetzen** zerstört ihn.
- **Ein Item begleitet seinen Slot über das ganze Spiel.** Item-Level, Sockel-Investment und Brand
  leben auf **demselben** Item; es gibt **kein Item-Inventar** und **keinen Item-Tausch**. Das Item
  **ist** der Slot.

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
- Notation: `A<Akt>-D<Dungeon>-<Floor>` (Floor zweistellig), z. B. `A1-D4-20`.
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
2. **Gold** — globale Währung (Respecs, Blacksmith/Jeweler, Node-Respec).
3. **Crystals** — globale Währung für den **Crucible** (§4.3). **Nur beim allerersten Sieg**
   eines Floors:
   - Normal = 1, Elite = 3, Boss = 10.
   - Gesamt im Spiel: 285 (normal) + 36 (elite) + 30 (boss) = **351 Crystals**.
4. **Gems, Cinder & Sigils** (Loot-Motor, §4.5) — jeder Sieg speist den Handwerk-Loop:
   - **Gems** (Hauptdrop) — **Amber**, **Ruby**, **Sapphire** & **Emerald** als Sockel-Bestückung
     _und_ Level-Fodder; nach Floor-Tiefe (Akt/Dungeon/Floor) gestaffelt. **Diamond** (Prismatic)
     bei Elite/Boss **ab Akt 2**.
   - **Cinder** (Kapazitäts- & Identitäts-Währung, §4.5) — **Bosse droppen garantiert 1 Cinder pro
     Kill** (100 %, jeder Durchlauf). **Elite-Gegner** (Dungeons 1–4) droppen Cinder als **Bonus**
     mit einer **Chance, die monoton mit der globalen Floor-Tiefe steigt** (kein Akt-Reset). Die
     Ausschüttung **steigt in Akt 2 und Akt 3**. Cinder finanziert **Refine** (Seltenheit) und
     **Brand** (Sigil-Implicit).
   - **Sigils** (Elite/Boss, ab dem ersten Elite-Floor `A1-D1-20`) — Einträge im **Kompendium** mit
     **Level 1–5**, Grundlage des **Brand** (§4.5). Der **erste Sigil-Drop eines Spielstands ist
     garantiert**.
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

  | Tree                | Fokus                                                                          |
  | ------------------- | ------------------------------------------------------------------------------ |
  | **Anvil Sparks**    | Freischalten von Inhalten (Blacksmith, Jeweler, Ausrüstungsslots, Checkpoints) |
  | **Smelting Flames** | Stat-Boosts der Charaktere                                                     |
  | **Molten Cast**     | Economy-Boosts (Gold-Drop, XP-Gewinn, Rabatte bei Blacksmith/Jeweler)          |
  | **Masterwork**      | Endgame-Systeme (z. B. Runen)                                                  |

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

Der Ausbau der Ausrüstung ist der **Hauptmotor** des Fortschritts (BALANCING §3). Er folgt einem
**Stamm-Modell**: das **Item-Level** ist der Stamm, an dem drei Äste hängen.

| Ebene                  | Träger am Item (§3.4)                       | Station               | Kosten            | Zufall    |
| ---------------------- | ------------------------------------------- | --------------------- | ----------------- | --------- |
| **Stamm: Basis-Power** | Item-Level (`+n`) → Innate                  | **Blacksmith** Temper | Gold              | keiner    |
| **Ast: Kapazität**     | Seltenheit → Sockelzahl, Gem-Cap, Level-Cap | **Blacksmith** Refine | Cinder + Gold     | keiner    |
| **Ast: Identität**     | Implicit aus einem **Sigil**                | **Blacksmith** Brand  | Cinder + Gold     | keiner    |
| **Ast: Min-Max**       | Sockel + **Gems**                           | **Jeweler**           | Gold + Gem-Fodder | seed-PRNG |

Alle Handwerks-Aktionen kosten **Gold**; **Refine** und **Brand** zusätzlich **Cinder**. Der einzige
Zufall im Handwerk liegt beim **Jeweler** — die drei Blacksmith-Aktionen sind vollständig planbar.

#### Seltenheit, Sockel & Level-Cap

- Jedes Item hat eine **Seltenheit** (EN: _Rarity_): **Common → Magic → Rare → Epic → Legendary**.
  Sie ist der **Master-Regler** und bestimmt drei Dinge: **Sockelzahl**, **Gem-Level-Cap** (siehe
  Jeweler) und **Item-Level-Cap**.

  | Seltenheit    | Normale Sockel | Item-Level-Cap | Cinder für den Refine **auf** diese Stufe |
  | ------------- | -------------- | -------------- | ----------------------------------------- |
  | **Common**    | 0              | **+20**        | — (Startzustand)                          |
  | **Magic**     | 1              | **+40**        | 1                                         |
  | **Rare**      | 2              | **+60**        | 3                                         |
  | **Epic**      | 3              | **+80**        | 6                                         |
  | **Legendary** | 4              | **+100**       | 10                                        |

- **Refine** hebt die Seltenheit um **eine Stufe**. **Kein RNG**, Kosten in **Cinder**
  (eskalierend **1/3/6/10**, konkrete Werte = Balancing) plus Gold.
- Die Seltenheit deckelt das Item-Level **nach oben**. Ein Refine ist **jederzeit** möglich, sobald
  Cinder vorhanden ist — der Wechselrhythmus zwischen Temper und Refine entsteht aus der
  **Cinder-Knappheit**, nicht aus einer Mindestlevel-Regel.
- Ein frisch freigeschalteter Slot startet als **`Common +1` ohne Sockel**; der erste Sockel
  entsteht mit dem ersten **Refine**.
- Landmarken auf einem Item:

  ```
  +20 → Magic (1. Sockel)      +60 → Epic (3. Sockel)
  +40 → Rare  (2. Sockel)      +80 → Legendary (4. Sockel)
  +50 → Prismatic-Sockel 1    +100 → Prismatic-Sockel 2
  ```

#### Prismatic-Sockel

- `Prismatic-Sockel = floor(Item-Level / 50)` → einer bei **`+50`**, ein zweiter bei **`+100`**.
- Nimmt ausschließlich **Diamond**-Gems auf (item-lokale Meta-Multiplikatoren, siehe Jeweler).
  **Diamonds droppen ab Akt 2.**
- Unabhängig von Seltenheit und Brand. Ein Item mit **zwei Diamonds** ist der stärkste
  Min-Max-Träger des Spiels.

#### Sigils, Kompendium & Brand

- Ein **Sigil** ist ein Eintrag im **Kompendium** mit **Level 1–5** — ein binärer Wissensstand plus
  Level, **kein Bestand und kein Inventar**. Jedes Sigil trägt eine **vordefinierte
  Implicit-Identität**, eine **Mindesttiefe** und eine **Slot(-Typ)-Bindung**.
- **Quellen** (ab dem ersten Elite-Floor `A1-D1-20`; der **erste Sigil-Drop eines Spielstands ist
  garantiert**):
  - **Elite-Gegner** würfeln aus einem **tiefen-gestaffelten Pool** — ein Sigil ist erst ab seiner
    **Mindesttiefe** ziehbar, der Pool wächst also mit dem Fortschritt.
  - **Jeder Akt-Boss** droppt beim **ersten Kill** garantiert sein **festes, namentliches
    Signatur-Sigil**. Bei Wiederholungen würfelt er wie ein Elite aus dem **obersten Tier** —
    inklusive des eigenen Signatur-Sigils als Level-Up-Kandidat.
- **Drop-Fortschritt:** ein **unbekanntes** Sigil wird auf **Level 1** ins Kompendium
  eingeschrieben, ein **bekanntes** um **+1 Level** gehoben. **Unbekannte Sigils sind im Wurf höher
  gewichtet** (Gewicht = Balancing).
- **Ein Sigil auf Level 5 verlässt den Drop-Pool.** Sind alle Sigils auf Level 5, droppen keine
  Sigils mehr.
- **Brand** überträgt das **Implicit** eines bekannten Sigils auf ein **Legendary**-Item. Die Stärke
  des Implicits skaliert mit dem **Sigil-Level**.
- Jedes Sigil ist **teamweit genau einmal aktiv** und nur auf seinem gebundenen **Slot(-Typ)**
  einsetzbar. Die **Pool-Größe liegt unter 18** (Zahl der Slots) → es tragen nie alle Slots ein Sigil.
- **Re-Brand** überschreibt den Brand eines Items und kostet **deutlich weniger** als der
  Erst-Brand → das Neuverteilen der Sigils bleibt über das ganze Spiel ein aktiver Hebel.

#### Drop-Modell (seedbasiert)

- Kämpfe droppen **Gems** (Farb-Fodder: Amber/Ruby/Sapphire/Emerald; **Diamond** bei Elite/Boss ab
  **Akt 2**), **Cinder** (Boss garantiert 1/Kill, Elite als tiefen-skalierter Bonus, in Akt 2 & 3
  erhöht) und **Sigils** (Elite/Boss, § oben). **Item-Basen droppen nicht** — sie entstehen beim
  Freischalten des Slots (§3.4).
- **Aller Loot-Zufall** läuft über den **seedbaren PRNG** (§2.5) — reproduzierbar, testbar, kein
  Save-Scumming. **Determinismus gilt innerhalb eines Runs**; beim **Farmen** eines geschafften
  Dungeons würfelt **jeder Durchlauf mit neuem Seed** (frische Drops pro Run).

#### Blacksmith (Stamm, Kapazität & Identität)

- **Temper (Item-Level):** hebt das **Item-Level** um eine Stufe bis zum **Seltenheits-Cap** →
  skaliert den **Innate-Value** (§3.4). Kein RNG, Kosten in **Gold**.
- **Refine (Seltenheit):** hebt die **Seltenheit** um eine Stufe (+1 Sockel, höheres Gem-Cap,
  höheres Item-Level-Cap). Kein RNG, Kosten in **Cinder** (1/3/6/10) plus Gold.
- **Brand (Implicit):** überträgt das Implicit eines bekannten **Sigils** auf ein **Legendary**-Item.
  Kein RNG, Kosten in **Cinder** plus Gold, überschreibbar per **Re-Brand**.

#### Jeweler (Gems / Min-Max-Jagd)

- **Inlay:** verbraucht **1 Gem** der Farbe aus dem **Bestand** (Ressourcen-Zähler, kein Inventar)
  und setzt ihn in einen Sockel; dabei wird ein **zufälliger Affix** aus dem **Farb-Pool** gerollt,
  mit einer **Value-Range** — der konkrete Wert fällt beim **Inlay** (seed-PRNG). Ein bereits belegter
  Sockel wird **überschrieben** (der alte, gebundene Gem ist **verloren**, §3.4).
- **Attune** (Gem aufleveln, im Sockel, **gedeckelt durch die Item-Seltenheit**): hebt die **Value-Range**; die
  **relative Position** in der vorherigen Range bleibt erhalten. Kostet **Gems gleicher
  Farbe** als Fodder — **jedes Level braucht mehr** (→ Fodder-Sink).
- **Recut (Value-Reroll):** würfelt den Wert eines gesockelten Gems innerhalb seiner aktuellen
  Range neu (seed-PRNG).
- **Gem-Farben** (Farb-Pools entlang der Stat-Kategorien, §3.0). Die Offensiv-Pools sind bewusst in
  **Chance** (Amber) und **Damage** (Ruby) getrennt — kleinere Pools erhöhen die Trefferchance auf
  den gewünschten Stat beim **Inlay**, und ein reiner **Damage**-Pool bleibt auch dann wertvoll, wenn
  die Chancen bereits am Soft-Cap liegen (§3.2):

  | Gem                 | Kategorie          | Pool                                                                                         | Sockel                 |
  | ------------------- | ------------------ | -------------------------------------------------------------------------------------------- | ---------------------- |
  | **Amber** (Gold)    | Offensive – Chance | Crit/Multi/Splash/Counter **Chance** (4)                                                     | normal                 |
  | **Ruby** (Rot)      | Offensive – Damage | Crit/Multi/Splash/Counter **Damage** (4)                                                     | normal                 |
  | **Sapphire** (Cyan) | Defensive          | Barrier, Block Chance, Sustain, Regeneration, Evasion (5)                                    | normal                 |
  | **Emerald** (Grün)  | Core               | Might, Toughness, Vitality (3)                                                               | normal                 |
  | **Diamond** (Weiß)  | Prismatic          | item-lokale **Meta-Multiplikatoren** (z. B. _+X % all gem effects_, _+Y % Sapphire-Effekte_) | **nur Prismatic-Slot** |

- **Amber, Ruby, Sapphire & Emerald** sind die regulär gefarmten Fodder-Farben; **Diamond** ist der
  seltene Elite/Boss-Chase **ab Akt 2**. Die **Derived Stats** (Attack/Defense/Health) haben **keine** direkte
  Gem-Quelle (sie ergeben sich aus Core/Attribut/Baseline, §3.0); ebenso wenig Multi Hit Chain &
  Splash Radius (Skilltree) sowie Initiative (Innate Feet + Crucible). Konkrete Pool-Gewichte,
  Value-Ranges, Aufleveln-Kosten und Diamond-Effekte = Balancing (`src/game/`, BALANCING).

#### Noch offen (bewusst separate Interview-Runde — Endgame/Masterwork)

- **Amulet-Slot** mit Sonderrolle (Kandidat: **Prismatic-nativ** — das „Diamond-Item").
- **Runen-System** (evtl. ins Amulet gesockelt) — Anbindung an **Masterwork** (§4.3).
- **Prismatic/Diamond-Effekte im Detail** (welche Meta-Multiplikatoren, Node-artige Sammlung).
- **Sigil-Katalog:** konkrete Sigils (Namen, Implicit-Identitäten, Mindesttiefe, Slot-Bindung,
  Level-Skalierung des Implicits) sowie die drei namentlichen **Boss-Signatur-Sigils**.
- **Implicit-Abgrenzung:** welche Effekt-Klassen ein Implicit trägt, die kein Gem-Affix liefert.

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
      Level/XP/Attribut- & Skillpunkte-Verteilung; pro freigeschaltetem **Slot** das Item
      (Basis + Item-Level + Seltenheit + gesockelte Gems inkl. Level/Value + gebrandetes Sigil,
      §3.4/§4.5); Crucible-Node-Stände; Gold, **Cinder**, **Gem-Bestände**
      (Amber/Ruby/Sapphire/Emerald/Diamond); **Kompendium** (bekannte Sigils mit Level);
      freigeschaltete Checkpoints, höchster erreichter Floor, erste-Sieg-Flags (Crystals).
- [ ] Auslöser für ein Speichern (nach Reward? in Intervallen?).

---

## 7. Verweise

- Vision & Design-Begründungen → [DESIGN.md](DESIGN.md)
- Balancing-Philosophie & Kurven → [BALANCING.md](BALANCING.md)
- Verbindliche Begriffe → [GLOSSARY.md](GLOSSARY.md)
- Technischer Leitfaden für Agenten → [../AGENTS.md](../AGENTS.md)
