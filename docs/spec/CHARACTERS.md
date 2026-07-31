# SPEC — Team & Charaktere (§3)

> Teil der [SPEC](../SPEC.md). Verbindliche Regeln für Team, Stats, Attribute,
> Skilltree, Ausrüstung und Signatur-Skills.
> Verwandt: [Kampf](COMBAT.md) · [Ausrüstung, Loot & Handwerk](CRAFTING.md)

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
  und erzwingen eine Prüfung ([AGENTS.md](../../AGENTS.md) §9). Besiegte Charaktere fallen aus
  Initiative-Reihenfolge und Schadensverteilung heraus.

### 3.0 Stats

Die drei zentralen Kampfwerte **Attack, Defense, Health** sind **Derived Stats** — sie werden
nicht direkt vergeben, sondern aus **drei Quellen mit je eigener Kurve** zusammengesetzt:

| Derived Stat | Baseline (Level, §3.3) | + Attribut (§3.1) | + Core-Stat (Gear/Gems) |
| ------------ | ---------------------- | ----------------- | ----------------------- |
| **Attack**   | Baseline-Kurve         | **Ferocity**      | **Might**               |
| **Defense**  | Baseline-Kurve         | **Resilience**    | **Toughness**           |
| **Health**   | Baseline-Kurve         | **Vigor**         | **Vitality**            |

Jede Quelle skaliert über eine **eigene Kurve** (Werte = Balancing, `src/game/`;
Begründung: [BALANCING §3](../BALANCING.md)).

Jeder Charakter hat Stats in folgenden Kategorien:

| Kategorie     | Stats                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Core**      | Might, Toughness, Vitality                                                                                                 |
| **Derived**   | Attack, Defense, Health                                                                                                    |
| **Offensive** | Crit Chance, Crit Damage, Multi Hit Chance, Multi Hit Damage, Splash Chance, Splash Damage, Counter Chance, Counter Damage |
| **Defensive** | Barrier, Block Chance, Evasion, Regeneration                                                                               |
| **Utility**   | Initiative, Multi Hit Chain, Splash Radius                                                                                 |

- **Core (Primär):** _Might_ speist _Attack_, _Toughness_ speist _Defense_, _Vitality_ speist
  _Health_ (je über eine eigene Kurve). Core-Stats stammen aus **Item-Innate** (§3.4) und
  **Emerald-Gems** ([§4.5](CRAFTING.md#45-ausrüstung-loot--handwerk-kern-loop)).
- **Derived:** _Attack_ = Grundschaden; _Defense_ = flache Schadensreduktion
  ([§2.3](COMBAT.md#23-eingehender-schaden-schadenspipeline), Schritt 4);
  _Health_ = Lebenspunkte. Zusammensetzung siehe Tabelle oben.
- **Offensive:** paarweise **Chance + Damage** je Muster (Crit, Multi Hit, Splash, Counter);
  Wirkung siehe [§2.1](COMBAT.md#21-charakter-zug-ausgehender-schaden). Die vier Paare sind an
  die vier **Skilltree-Zweige** gekoppelt (§3.2).
- **Defensive:** _Barrier_ = temporärer, pro Runde neu gesetzter Absorptionsschild; _Block Chance_
  = partielle Reduktion ([§2.3](COMBAT.md#23-eingehender-schaden-schadenspipeline), Schritt 3);
  _Evasion_ = Ausweichchance gegen Accuracy
  ([§2.3](COMBAT.md#23-eingehender-schaden-schadenspipeline), Schritt 2);
  _Regeneration_ = flache Heilung nach eigener Handlung
  ([§2.6](COMBAT.md#26-heilung--grenzen-und-auslösung)) und bis zur
  Freischaltung des Rune-Systems ([§4.6](RUNES.md#46-runen-endgame--masterwork)) die
  **einzige Heilquelle** im Spiel.
- **Utility:** _Initiative_ = Zugreihenfolge; _Multi Hit Chain_ = maximale Multi-Hit-Kettenlänge;
  _Splash Radius_ = Anzahl Nebenziele (Lane-übergreifend).

### 3.1 Attribute (Level-Up-Progression)

Jeder Charakter hat drei Attribute. Sie sind **eine der drei Quellen der Derived Stats** (§3.0):
Jeder Punkt hebt über eine eigene Kurve direkt einen der drei Derived Stats
(Design-Absicht: [DESIGN §3.2](../DESIGN.md)).

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
  aus der Rolle ([§1.2](COMBAT.md#12-zielauswahl)) und den charaktergebundenen Signatur-Skills
  im Crucible (§3.5 / [§4.3](PROGRESSION.md#43-crucible-globaler-skilltree)).

  | Zweig         | Schadens-Muster            | Gekoppelte Stats                                      |
  | ------------- | -------------------------- | ----------------------------------------------------- |
  | **Finesse**   | Crit (Einzeltreffer)       | Crit Chance + Crit Damage                             |
  | **Tempest**   | Multi-Hit (**ein** Ziel)   | Multi Hit Chance + Multi Hit Damage + Multi Hit Chain |
  | **Dominance** | Splash (**mehrere** Ziele) | Splash Chance + Splash Damage + Splash Radius         |
  | **Valor**     | Counter (Vergeltung)       | Counter Chance + Counter Damage                       |

- Jeder Zweig enthält **Stat-Knoten** (die gekoppelten Werte-Boosts) und
  **Verhaltens-Knoten** (Chain-/Radius-Erweiterungen und die Crit-Erweiterungen unten).
- **Crit-Erweiterungen.** Standardmäßig wird der Crit-Wurf nur auf den **Grundtreffer**
  angewandt. Je ein Knoten erweitert ihn auf eine Trefferklasse — und zwar im Zweig des
  **Generators**, nicht in Finesse:

  | Knoten                           | Zweig         |
  | -------------------------------- | ------------- |
  | Multi-Hit-Treffer können critten | **Tempest**   |
  | Splash-Treffer können critten    | **Dominance** |
  | Counter-Treffer können critten   | **Valor**     |

- **Innerhalb eines Zweigs multiplizieren sich die Knoten**, statt sich zu addieren (z. B. in
  Tempest _Multi Hit Chance_ × _Multi Hit Chain_).
- **Chance**-Stats haben einen **Soft-Cap bei 100 %** (Überschuss verpufft), **Damage**-Stats
  haben **keinen Soft-Cap** (Zuwachs verpufft nie). Die gekoppelten Stats sind selbst
  **Multiplikatoren** auf den Base-Schaden (skalierungsstabil).
- Design-Absicht hinter der Zweig-Struktur, der Knoten-Multiplikation und der Platzierung der
  Crit-Erweiterungen: [DESIGN §3.2](../DESIGN.md).
- **Skillpunkte:** **1 pro Level** (→ 100 gesamt), frei im gesamten Baum verteilbar. **Respec
  gegen Gold.**

### 3.3 Charakterlevel

- Jeder Charakter hat ein **Level**; Maximallevel **100** (Erhöhung durch XP,
  [§4.2](PROGRESSION.md#42-belohnungen-aus-einem-sieg)).
- **Ein Level-Up bewirkt dreierlei:**
  1. **Automatisches Baseline-Wachstum der Derived Stats** (Attack/Defense/Health nach fester
     Kurve, BALANCING) — der spielbare Sockel, auf den Attribute und Core-Stats aufsetzen (§3.0).
  2. **+1 Attributpunkt** (Core-Gewichtung, §3.1).
  3. **+1 Skillpunkt** (Offensiv-Zweige, §3.2).

### 3.4 Ausrüstung

- Jeder Charakter trägt Ausrüstung in **sechs Slots**. Ein Slot wird über den **Crucible**
  (Anvil Sparks, [§4.3](PROGRESSION.md#43-crucible-globaler-skilltree)) gegen **Crystals**
  freigeschaltet; dabei entsteht die rollenspezifische **Basis** als **`Common +1`** und bleibt
  dem Slot für das ganze Spiel erhalten.
- **Ausnahme — die Main Hand ist bei allen drei Charakteren ab Spielstart freigeschaltet**
  (ebenfalls als `Common +1`). Ohne Waffe gäbe es keine **Damage-Range** und damit keinen
  definierten Grundschaden ([§2.1](COMBAT.md#21-charakter-zug-ausgehender-schaden)); ein
  Sonderfall für unbewaffnete Charaktere entfällt so.
  Die übrigen fünf Slots sowie **Blacksmith** und **Jeweler** sind Anvil-Sparks-Unlocks.
- Jeder Slot hat einen **Innate-Affix** — einen festen Basis-Stat, der mit dem **Item-Level**
  skaliert ([§4.5](CRAFTING.md#45-ausrüstung-loot--handwerk-kern-loop)):

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
- **Waffen** haben zusätzlich eine prozentuale **Damage-Range**, die den Grundschaden moduliert
  ([§2.1](COMBAT.md#21-charakter-zug-ausgehender-schaden)).
- Ausrüstung ist der **Hauptmotor** des Fortschritts (Loot & Handwerk,
  [§4.5](CRAFTING.md#45-ausrüstung-loot--handwerk-kern-loop)).

**Item-Anatomie (vier Schichten).** Jedes Item trägt seine Werte auf vier getrennten Ebenen.
Schicht 1 steht mit dem Slot fest; die Schichten 2–4 sind der Handwerk-Loop und in
[§4.5](CRAFTING.md#45-ausrüstung-loot--handwerk-kern-loop) verbindlich beschrieben.

| #   | Schicht                 | Was sie trägt                                                      | Entsteht durch                        |
| --- | ----------------------- | ------------------------------------------------------------------ | ------------------------------------- |
| 1   | **Basis**               | Item-Typ + Slot, **Innate-Affix** (Tabelle oben)                   | Freischalten des Slots                |
| 2   | **Item-Level** (`+n`)   | skaliert den **Innate-Value**                                      | **Temper** (Blacksmith)               |
| 3   | **Seltenheit & Sockel** | Sockelzahl, Gem-Level-Cap, Item-Level-Cap; **Gems** in den Sockeln | **Refine** (Blacksmith) + **Jeweler** |
| 4   | **Implicit**            | Affix eines **Sigils**, den kein Gem liefert                       | **Brand** (Blacksmith, nur Legendary) |

- Schicht 2 ist die **exponentielle Basis-Power** und der **planbare** Träger der
  Incremental-Kurve — das persistente Item „wächst mit".
- Schicht 3 ist die **Min-Max-Achse** und damit die eigentliche **Loot-Jagd**: Der Affix eines
  Gems wird beim Einsetzen gewürfelt (seed-PRNG).

- **Gems sind am Item gebunden:** Ein gesockelter (und im Sockel gelevelter) Gem bleibt im Item —
  auch bei Nichtbenutzung „friert" er dort ein (kein Verlust). Nur aktives **Ersetzen** zerstört ihn.
- **Ein Item begleitet seinen Slot über das ganze Spiel.** Item-Level, Sockel-Investment und Brand
  leben auf **demselben** Item; es gibt **kein Item-Inventar** und **keinen Item-Tausch**. Das Item
  **ist** der Slot.
- **Sechs Slots, abschließend.** Runen laufen über den **Talisman**
  ([§4.6](RUNES.md#46-runen-endgame--masterwork)), der **kein Ausrüstungs-Slot** ist.

### 3.5 Signatur-Skills

Jeder der drei Charaktere besitzt **genau einen** Signatur-Skill, der (anders als ein
Stat-Knoten) in einen **globalen Kampf-Hebel** eingreift. Jeder Skill belegt einen eigenen,
sonst unberührten Hebel; **kein Signatur-Skill hebt die eigene Rollen-Penalty**
(Taunt/Bulwark/Frontline-Lock) auf. Design-Absicht: [DESIGN §3.1](../DESIGN.md).

| Charakter      | Signatur-Skill        | Angegriffener Hebel                                                            | Wirkrichtung          |
| -------------- | --------------------- | ------------------------------------------------------------------------------ | --------------------- |
| Korvin (Tank)  | **Mitigation** (§3.2) | Schadensverteilung ([§2.3](COMBAT.md#23-eingehender-schaden-schadenspipeline)) | defensiv, Umleitung   |
| Rhaya (Melee)  | **Sunder**            | Bulwark / Formation ([§2.4](COMBAT.md#24-bulwark-deckung-der-backline))        | offensiv-enabling     |
| Quinn (Ranged) | **Suppression**       | Zug-Ökonomie ([§1.1](COMBAT.md#11-rundenablauf))                               | präventiv, Zeitgewinn |

Alle drei sind **charaktergebundene Crucible-Knoten**
([§4.3](PROGRESSION.md#43-crucible-globaler-skilltree)) mit **Level 1–5**; der
Node-Maxlevel wirkt als **natürlicher Cap** (kein künstlicher Cap nötig). Vor Freischaltung
existiert der Effekt nicht. Aller Zufall bleibt deterministisch über den seedbaren PRNG
([§2.5](COMBAT.md#25-feststehende-regeln)) — die Skills führen **keinen** Zusatz-RNG ein.

#### Mitigation (Korvin, Tank)

- Siehe [§2.3](COMBAT.md#23-eingehender-schaden-schadenspipeline) (Schadenspipeline, Schritt 1).
  Leitet einen Anteil `m` des DD-Ticks auf den Tank um; `m` steigt mit dem Node-Level.

#### Sunder (Rhaya, Melee) — Bulwark-Bruch

- Rhayas Treffer auf einen **Frontline-Gegner** reduzieren dessen **Bulwark-Beitrag**
  ([§2.4](COMBAT.md#24-bulwark-deckung-der-backline)).
  Der Abbau ist **kumulativ pro Ziel** und gilt **nur für die Dauer des laufenden Kampfes** —
  es gibt **keinen Übertrag** zwischen Floors (Formationen stehen pro Floor neu).
- **Node-Skalierung (Level 1–5):** steigender Bulwark-Abbau pro Treffer und/oder höheres
  Abbau-Cap pro Ziel. Konkrete Werte = Balancing (`src/game/`, BALANCING).

#### Suppression (Quinn, Ranged) — Zugverschiebung

- Quinns Treffer verschiebt die **noch offene Aktion** des getroffenen Gegners um `L` Plätze
  **nach hinten** in der **Pending-Queue** der laufenden Runde
  ([§1.1](COMBAT.md#11-rundenablauf); `L` = Node-Level 1–5, ein Platz pro Level).
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
  Runde). Damit ist auch **Multi Hit**
  ([§2.1](COMBAT.md#21-charakter-zug-ausgehender-schaden)) abgedeckt — der erste Treffer
  verschiebt, alle weiteren um `0`. **Splash**-Nebenziele werden **nicht** verschoben;
  Suppression wirkt ausschließlich auf das **primäre Ziel**.
- **Counter** ([§2.1](COMBAT.md#21-charakter-zug-ausgehender-schaden)) suppresst strukturell nie:
  Ein Counter trifft immer einen Gegner, der gerade gehandelt hat und damit nicht mehr in der
  Pending-Queue steht.
- **Zeitpunkt:** nach dem vollständigen Angriff (Grundtreffer, Multi-Hit-Kette, Splash) — sofern
  das Primärziel noch **lebt**, noch **nicht gehandelt** hat und in dieser Runde noch **nicht
  supprimiert** wurde.
- Wirkt nur auf **Gegner**; die Reihenfolge der eigenen Charaktere bleibt unberührt.
- **Der Delay hängt nicht am Schaden** — Quinns **Bulwark-Malus**
  ([§2.4](COMBAT.md#24-bulwark-deckung-der-backline)) mindert die Verschiebung nicht.
- **Turn Skip** entsteht ausschließlich über den **Kill**: stirbt das Ziel vor seinem
  verschobenen Slot, ist seine Aktion endgültig verloren.
- Design-Absicht (Zusammenspiel mit Sunder, selbstregulierende Skalierung):
  [DESIGN §3.1](../DESIGN.md).

<!-- TODO (Balancing): Sunder — Abbau-Betrag pro Treffer & Cap pro Ziel. -->
