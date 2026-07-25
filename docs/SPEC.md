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
- Der Kampf wird **vollständig simuliert** (deterministisch) und danach vom
  Rendering Runde für Runde **abgespielt** — Simulation ≠ Rendering (siehe §5).
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
     die Schadenspipeline §2.3). Gegner wählen **keine** Einzelziele.
3. **Rundenende:** keine gesonderten Effekte (Regeneration triggert pro Akteur, nicht am
   Rundenende; Barrier verfällt implizit beim Neu-Setzen zu Rundenbeginn).

**Abbruch-/Endbedingungen:**

- **Sieg:** alle Gegner besiegt.
- **Niederlage/Wipe:** alle Charaktere besiegt → Kampf endet ohne Belohnung (siehe §4.4).
- **Manueller Abbruch:** Der Spieler kann einen laufenden Kampf jederzeit abbrechen
  (verlässt den Dungeon, keine Belohnung für den laufenden Floor, §4.4).
- **Kein Rundenlimit** vorgesehen.

<!-- TODO: Verhalten bei extrem langen Kämpfen (Zeit-/Rundencap als Sicherheitsnetz?) offen. -->

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
   - **Mitigation** (freigeschalteter **Tank-Skill** — siehe §3) modifiziert diese
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

  | Rolle  | Name   | Anmerkung                             |
  | ------ | ------ | ------------------------------------- |
  | Tank   | Korvin | Signatur-Skill: **Mitigation** (§3.2) |
  | Melee  | Rhaya  | Frontline-DD                          |
  | Ranged | Quinn  | Backline-DD, umgeht Taunt (Bulwark)   |

- **Leitprinzip — keine charakterexklusiven Stats.** Alle Stats sind für alle Charaktere
  verfügbar. Etwas, das nur für einen Archetyp sinnvoll ist (z. B. Mitigation), wird als
  **Skill** im jeweiligen Skilltree gekapselt, nicht als Stat.
- **Umgang mit besiegten Slots:** Index-Zugriffe auf Team-/Gegner-Slots liefern `| undefined`
  und erzwingen eine Prüfung (AGENTS.md §9). Besiegte Charaktere fallen aus Initiative-
  Reihenfolge und Schadensverteilung heraus.

### 3.0 Stats

Jeder Charakter hat Stats in vier Kategorien:

| Kategorie     | Stats                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Core**      | Health, Attack, Defense                                                                                                    |
| **Offensive** | Crit Chance, Crit Damage, Multi Hit Chance, Multi Hit Damage, Splash Chance, Splash Damage, Counter Chance, Counter Damage |
| **Defensive** | Armor, Barrier, Block Chance, Sustain, Regeneration                                                                        |
| **Utility**   | Initiative, Evasion, Multi Hit Chain, Splash Radius                                                                        |

- **Core:** _Health_ = Lebenspunkte; _Attack_ = Grundschaden; _Defense_ = flache Schadens-
  reduktion (§2.3, Schritt 4).
- **Offensive:** paarweise **Chance + Damage** je Muster (Crit, Multi Hit, Splash, Counter);
  Wirkung siehe §2.1. Die vier Paare sind an die vier **Attribute** gekoppelt (§3.1).
- **Defensive:** _Armor_ erhöht _Defense_; _Barrier_ = temporärer, pro Runde neu gesetzter
  Absorptionsschild; _Block Chance_ = partielle Reduktion (§2.3, Schritt 3); _Sustain_ =
  flache Heilung beim Anrichten von Schaden; _Regeneration_ = Heilung nach eigener Handlung.
- **Utility:** _Initiative_ = Zugreihenfolge; _Evasion_ = Ausweichchance gegen Accuracy;
  _Multi Hit Chain_ = maximale Multi-Hit-Kettenlänge; _Splash Radius_ = Anzahl Nebenziele
  (Lane-übergreifend).

### 3.1 Attribute (Level-Up-Progression)

Jeder Charakter hat vier **rein offensive** Attribute.
Zweck: Jedes Level-Up ist eine aktive, selbstgewählte Verstärkung ("welche Art Offense").

| Attribut (EN) | Schadens-Muster            | Gekoppelte Stats                    |
| ------------- | -------------------------- | ----------------------------------- |
| **Finesse**   | Crit (Einzeltreffer)       | Crit Chance + Crit Damage           |
| **Tempest**   | Multi-Hit (**ein** Ziel)   | Multi Hit Chance + Multi Hit Damage |
| **Dominance** | Splash (**mehrere** Ziele) | Splash Chance + Splash Damage       |
| **Valor**     | Counter (Vergeltung)       | Counter Chance + Counter Damage     |

**Mechanik**

- 1 Punkt **addiert** einen **festen Prozentpunkt-Betrag** auf **beide** gekoppelten Stats
  (additiv/linear — z. B. +0,5 pp Chance und +10 pp Damage; konkrete Werte = Balancing,
  `src/game/`). Kein multiplikatives Stacking: Der Zuwachs ist konstant pro Punkt, unabhängig
  vom aktuellen Wert.
- Skalierungsstabil, weil die gekoppelten Stats selbst **Multiplikatoren** auf den
  exponentiellen Base-Schaden sind.
- **Chance** hat einen **Soft-Cap bei 100 %** (Überschuss verpufft), **Damage** skaliert
  **unbegrenzt** → ein Attribut wird nie wertlos.
- Alle übrigen Stats (Core-, Defensive- & Utility-Stats) sind **nicht** an Attribute gekoppelt.

**Progression**

- **100 Punkte pro Charakter** (Level 1 = 1 Punkt, dann +1 je Level bis 100).
- Alle Charaktere starten als **identische Blank Slates** (keine Affinitäten).
- **Frei verteilbar** (suboptimale Builds erlaubt), **Respec gegen Gold** (analog Skillpunkte).

### 3.2 Charakter-Skilltree

- Jeder Charakter hat einen **eigenen Skilltree** mit **mehreren Pfaden** (unterschiedlicher
  Fokus/Spielstil).
- Knoten sind sowohl **Stat-Knoten** (passive Werte-Boosts) als auch
  **Verhaltens-/Trigger-Knoten** (z. B. „Mitigation" für den Tank, „Stagger als Skill",
  „Chance to Cast X", „Per-Hit-Crit").
- **Skillpunkte:** analog zu Attributpunkten **1 pro Level** (→ 100 gesamt), frei im gesamten
  Baum verteilbar. **Respec gegen Gold.**
- **Mitigation** ist der Signatur-Skill des Tanks (Korvin): vor Freischaltung existiert **keine**
  Umleitung; als Node mit Stufen (Level 1–5) steigt der Umleitungsanteil `m` — der Node-Maxlevel
  wirkt als **natürlicher Cap** (kein künstlicher Cap nötig).

### 3.3 Charakterlevel

- Jeder Charakter hat ein **Level**; Maximallevel **100** (Erhöhung durch XP, §4.2).
- **Ein Level-Up bewirkt dreierlei:**
  1. **Automatisches Core-Stat-Wachstum** (Health/Attack/Defense nach fester Kurve, BALANCING).
  2. **+1 Attributpunkt** (offensiv, §3.1).
  3. **+1 Skillpunkt** (§3.2).

### 3.4 Ausrüstung

- Jeder Charakter trägt Ausrüstung, die Stats verbessert. Slots:
  - **Main Hand** — **Signature Slot** (Weapon für DDs, Shield für Tank)
  - **Head**, **Chest**, **Legs**, **Feet**
- **Waffen** haben eine prozentuale **Damage-Range**, die den Grundschaden moduliert (§2.1).
- Ausrüstung ist einer der **Hauptmotoren** des Fortschritts (Crafting/Upgrades, §4.5).

<!-- TODO (spätere Runde): Item-Stats im Detail, Amulet-Slot (Sonderrolle), Edelstein-/Sockel-
     System, Runen, Blacksmith/Enchanter/Cube. Siehe §4.5. -->

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

### 4.3 Crucible (globaler Skilltree)

- Der **Crucible** ist ein **globaler, charakterübergreifender** Skilltree. Der Spieler
  „schmilzt" **Crystals** ein, um **permanente** Verbesserungen freizuschalten.
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

### 4.5 Wirtschaft & Ausbau-Systeme (noch offen)

Diese Systeme sind angedacht, aber **noch nicht spezifiziert** (spätere Interview-Runde):

- **Ausrüstungsitems:** Seltenheiten (Common, Magic, Rare, Epic, Legendary); Stats hinzufügen/
  verbessern/entfernen; **Amulet-Slot** mit Sonderrolle.
- **Blacksmith:** Herstellen, Aufwerten, Zerlegen von Items.
- **Enchanter:** Verzaubern (zusätzliche Effekte).
- **Sockel-/Edelstein-System** (evtl. **Cube** als Sockel-Station).
- **Runen-System** (evtl. mit dem Amulet kombiniert: Runen ins Amulet sockeln) — Endgame,
  Anbindung an Masterwork.

### 4.6 Prestige

- **Kein Prestige-System** geplant. Das feste Drei-Charakter-Team und der Fokus auf deren
  Ausbau tragen die Langzeitmotivation; ein Reset-Loop ist bewusst kein Ziel.

---

## 5. Simulation & Zeitverhalten (verbindlich)

Diese Punkte sind bereits durch AGENTS.md §5 festgelegt und hier als Spec-Kontext gespiegelt:

- **Simulation ≠ Rendering:** Die Kampf-Engine ist **reine, deterministische Logik**
  ohne Bezug zu Timern, DOM oder Echtzeit. Das Playback spielt die simulierten Runden
  mit visueller Verzögerung ab.
- **Determinismus:** gleicher Seed + gleicher Input ⇒ exakt gleicher Verlauf.
- **Catch-up:** Tab minimiert/gedrosselt ⇒ beim Wiederöffnen werden fehlende Runden
  **ohne Animation** nachgerechnet (Page Visibility API), danach Anzeige synchronisiert.
- **Kein Offline-Progress:** Tab geschlossen ⇒ kein Fortschritt.

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
      Level/XP/Attribut- & Skillpunkte-Verteilung/Ausrüstung, Crucible-Node-Stände, Gold,
      freigeschaltete Checkpoints, höchster erreichter Floor, erste-Sieg-Flags (Crystals).
- [ ] Auslöser für ein Speichern (nach Reward? in Intervallen?).

---

## 7. Verweise

- Vision & Design-Begründungen → [DESIGN.md](DESIGN.md)
- Balancing-Philosophie & Kurven → [BALANCING.md](BALANCING.md)
- Verbindliche Begriffe → [GLOSSARY.md](GLOSSARY.md)
- Technischer Leitfaden für Agenten → [../AGENTS.md](../AGENTS.md)
