# SPEC — Team & Charaktere

> Teil der [SPEC](../SPEC.md): Team, Stats, Attribute, Skilltree und Signatur-Skills.
> Verwandt: [Kampf](COMBAT.md) · [Items, Loot & Handwerk](ITEMS.md)

---

## 1. Team

- **Teamgröße:** genau **drei feste, namentliche Charaktere**, ab Start verfügbar (keine
  Freischaltung, keine Rekrutierung, kein Austausch).

  | Rolle  | Name   | Sex        |
  | ------ | ------ | ---------- |
  | Tank   | Korvin | Male       |
  | Melee  | Rhaya  | Female     |
  | Ranged | Quinn  | Non-Binary |

- **Leitprinzip — keine charakterexklusiven Stats.** Alle Stats sind für alle Charaktere
  verfügbar. Etwas, das nur für einen Archetyp sinnvoll ist (z. B. Mitigation), wird als
  charaktergebundener **Signatur-Skill** ([§7](#7-signatur-skills)) gekapselt, nicht als Stat.
- **Umgang mit besiegten Slots:** Index-Zugriffe auf Team-/Gegner-Slots liefern `| undefined`
  und erzwingen eine Prüfung
  ([AGENTS.md §9](../../AGENTS.md#9-typescript-konfiguration)). Besiegte Charaktere fallen aus
  Initiative-Reihenfolge und Schadensverteilung heraus.

---

## 2. Stats

Die drei zentralen Kampfwerte **Attack, Defense, Health** sind **Derived Stats** — sie werden
nicht direkt vergeben, sondern aus **drei Quellen mit je eigener Kurve** zusammengesetzt:

| Derived Stat | Baseline ([§5](#5-charakterlevel)) | + Attribut ([§3](#3-attribute-level-up-progression)) | + Core-Stat (Gear/Gems) |
| ------------ | ---------------------------------- | ---------------------------------------------------- | ----------------------- |
| **Attack**   | Baseline-Kurve                     | **Ferocity**                                         | **Might**               |
| **Defense**  | Baseline-Kurve                     | **Resilience**                                       | **Toughness**           |
| **Health**   | Baseline-Kurve                     | **Vigor**                                            | **Vitality**            |

Jede Quelle skaliert über eine **eigene Kurve** (Werte = Balancing, `src/game/`;
Begründung: [BALANCING §3](../BALANCING.md#3-wachstumsquellen-woher-die-zahlen-kommen)).

Jeder Charakter hat Stats in folgenden Kategorien:

| Kategorie     | Stats                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Core**      | Might, Toughness, Vitality                                                                                                 |
| **Derived**   | Attack, Defense, Health                                                                                                    |
| **Offensive** | Crit Chance, Crit Damage, Multi Hit Chance, Multi Hit Damage, Splash Chance, Splash Damage, Counter Chance, Counter Damage |
| **Defensive** | Barrier, Block Chance, Evasion, Regeneration                                                                               |
| **Utility**   | Initiative, Multi Hit Chain, Splash Radius                                                                                 |

- **Core (Primär):** _Might_ speist _Attack_, _Toughness_ speist _Defense_, _Vitality_ speist
  _Health_ (je über eine eigene Kurve). Core-Stats stammen aus **Item-Innate**
  ([Slots, Basen & Innate-Affixe](ITEMS.md#1-slots-basen--innate-affixe)) und **Emerald-Gems**
  ([Jeweler](ITEMS.md#8-jeweler--inlay-attune--recut)).
- **Derived:** _Attack_ = Grundschaden; _Defense_ = flache Schadensreduktion
  ([Schadenspipeline](COMBAT.md#23-eingehender-schaden-schadenspipeline), Schritt 4);
  _Health_ = Lebenspunkte. Zusammensetzung siehe Tabelle oben.
- **Offensive:** paarweise **Chance + Damage** je Muster (Crit, Multi Hit, Splash, Counter);
  Wirkung siehe [Charakter-Zug](COMBAT.md#21-charakter-zug-ausgehender-schaden). Die vier Paare
  sind an die vier **Skilltree-Zweige** gekoppelt ([§4](#4-charakter-skilltree)).
- **Defensive:** _Barrier_ = temporärer, pro Runde neu gesetzter Absorptionsschild; _Block Chance_
  = partielle Reduktion ([Schadenspipeline](COMBAT.md#23-eingehender-schaden-schadenspipeline), Schritt 3);
  _Evasion_ = Ausweichchance gegen Accuracy
  ([Schadenspipeline](COMBAT.md#23-eingehender-schaden-schadenspipeline), Schritt 2);
  _Regeneration_ = flache Heilung nach eigener Handlung
  ([Heilung](COMBAT.md#26-heilung--grenzen-und-auslösung)) und bis zur
  Freischaltung des Rune-Systems ([Runen](RUNES.md)) die **einzige Heilquelle** im Spiel.
- **Utility:** _Initiative_ = Zugreihenfolge; _Multi Hit Chain_ = maximale Multi-Hit-Kettenlänge;
  _Splash Radius_ = Anzahl Nebenziele (Lane-übergreifend).

---

## 3. Attribute (Level-Up-Progression)

Jeder Charakter hat drei Attribute. Sie sind **eine der drei Quellen der Derived Stats**
([§2](#2-stats)): Jeder Punkt hebt über eine eigene Kurve direkt einen der drei Derived Stats
(Design-Absicht: [DESIGN §3.2](../DESIGN.md#32-build-entscheidungen-die-sich-unterscheiden-sollen)).

| Attribut (EN)  | Gekoppelter Derived Stat |
| -------------- | ------------------------ |
| **Ferocity**   | Attack                   |
| **Resilience** | Defense                  |
| **Vigor**      | Health                   |

**Mechanik**

- 1 Punkt **addiert** einen **festen Betrag** auf den gekoppelten Derived Stat (additiv/linear;
  konkrete Werte = Balancing, `src/game/`). Der Zuwachs ist konstant pro Punkt, unabhängig vom
  aktuellen Wert.
- Die Attribut-Zuwächse liegen **über** dem automatischen Baseline-Wachstum
  ([§5](#5-charakterlevel)) — die Baseline sichert einen spielbaren Sockel, die Attribute setzen
  die Gewichtung.

**Progression**

- **100 Punkte pro Charakter** (Level 1 = 1 Punkt, dann +1 je Level bis 100).
- Alle Charaktere starten als **identische Blank Slates** (keine Affinitäten).
- **Frei verteilbar** (suboptimale Builds erlaubt), **Respec gegen Gold** (analog Skillpunkte).

---

## 4. Charakter-Skilltree

- Jeder Charakter hat einen Skilltree mit **vier Zweigen** — je ein Zweig pro offensivem
  Schadensmuster. Alle drei Charaktere teilen **dieselbe** Zweig-Struktur; Distinktheit kommt
  aus der Rolle ([Zielauswahl](COMBAT.md#12-zielauswahl)) und den charaktergebundenen
  Signatur-Skills im Crucible ([§7](#7-signatur-skills) /
  [Crucible](PROGRESSION.md#3-crucible-globaler-skilltree)).

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
  Multiplikatoren auf den Base-Schaden (skalierungsstabil).
- Design-Absicht hinter der Zweig-Struktur, der Knoten-Multiplikation und der Platzierung der
  Crit-Erweiterungen: [DESIGN §3.2](../DESIGN.md#32-build-entscheidungen-die-sich-unterscheiden-sollen).
- **Skillpunkte:** **1 pro Level** (→ 100 gesamt), frei im gesamten Baum verteilbar. **Respec
  gegen Gold.**

---

## 5. Charakterlevel

- Jeder Charakter hat ein **Level**; Maximallevel **100** (Erhöhung durch XP,
  [Belohnungen aus einem Sieg](PROGRESSION.md#2-belohnungen-aus-einem-sieg)).
- **Ein Level-Up bewirkt dreierlei:**
  1. **Automatisches Baseline-Wachstum der Derived Stats** (Attack/Defense/Health nach fester
     Kurve, BALANCING) — der spielbare Sockel, auf den Attribute und Core-Stats aufsetzen
     ([§2](#2-stats)).
  2. **+1 Attributpunkt** (Core-Gewichtung, [§3](#3-attribute-level-up-progression)).
  3. **+1 Skillpunkt** (Offensiv-Zweige, [§4](#4-charakter-skilltree)).

---

## 6. Ausrüstung

- Jeder Charakter trägt Ausrüstung in **sechs Slots**. Ausrüstung ist der **Hauptmotor** des
  Fortschritts ([BALANCING §3](../BALANCING.md#3-wachstumsquellen-woher-die-zahlen-kommen)).
- **Das Item ist der Slot.** Ein Item begleitet seinen Slot über das ganze Spiel; es gibt
  **kein Item-Inventar** und **keinen Item-Tausch**.
- **Sechs Slots, abschließend.** Runen laufen über den **Talisman** ([Runen](RUNES.md)), der
  **kein Ausrüstungs-Slot** ist.
- Welche Slots es gibt, wie sie freigeschaltet werden, welchen Innate-Affix sie tragen und
  wie ein Item wächst, steht in [Items, Loot & Handwerk](ITEMS.md).

---

## 7. Signatur-Skills

Jeder der drei Charaktere besitzt **genau einen** Signatur-Skill, der (anders als ein
Stat-Knoten) in einen **globalen Kampf-Hebel** eingreift. Er ist die Kapselungsform für
Archetyp-Spezifisches ([§1](#1-team),
[ADR-0001](../adr/0001-keine-charakterexklusiven-stats.md)).

| Charakter      | Signatur-Skill                                           | Angegriffener Hebel                                                                        | Wirkrichtung          |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------- |
| Korvin (Tank)  | **[Mitigation](COMBAT.md#31-mitigation-korvin-tank)**    | Schadensverteilung ([Schadenspipeline](COMBAT.md#23-eingehender-schaden-schadenspipeline)) | defensiv, Umleitung   |
| Rhaya (Melee)  | **[Sunder](COMBAT.md#32-sunder-rhaya-melee)**            | Bulwark / Formation ([Bulwark](COMBAT.md#24-bulwark-deckung-der-backline))                 | offensiv-enabling     |
| Quinn (Ranged) | **[Suppression](COMBAT.md#33-suppression-quinn-ranged)** | Zug-Ökonomie ([Rundenablauf](COMBAT.md#11-rundenablauf))                                   | präventiv, Zeitgewinn |

- **Die Kampfwirkung der drei Skills steht in
  [Signatur-Skills (Kampfwirkung)](COMBAT.md#3-signatur-skills-kampfwirkung)** — Formeln,
  Caps, Test-Vektoren.
- Alle drei sind **charaktergebundene Crucible-Knoten**
  ([Crucible](PROGRESSION.md#3-crucible-globaler-skilltree)) mit **Level 1–5**; der
  Node-Maxlevel wirkt als **natürlicher Cap** (kein künstlicher Cap nötig). Vor Freischaltung
  existiert der Effekt nicht.
- Design-Absicht: [DESIGN §3.1](../DESIGN.md#31-rollen-mit-preis--und-die-signatur-skills-die-ihn-verwerten).
