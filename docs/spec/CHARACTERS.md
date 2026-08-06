# SPEC — Team & Charaktere

> Teil der [SPEC](../spec/README.md): Team, Stats, Attribute, Level und Signatur-Skills.
> Verwandt: [Weapon Mastery](WEAPON-MASTERY.md) · [Kampf](COMBAT-RUN.md) ·
> [Items, Loot & Handwerk](ITEMS.md)

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
  ([AGENTS.md](../../AGENTS.md)). Besiegte Charaktere fallen aus
  Initiative-Reihenfolge und Schadensverteilung heraus.

---

## 2. Stats

Die drei zentralen Kampfwerte **Attack, Defense, Health** sind **Derived Stats**. Sie besitzen
feste Startquellen und werden mit Attribut- und Crucible-Ebenen multipliziert:

```
Attack  = (Weapon Base Damage + Might) × Ferocity-Ebene × Crucible-Ebene
Defense = (Start-Defense + Toughness + Mastery-Defense) × Resilience-Ebene × Crucible-Ebene
Health  = (Start-Health + Vitality) × Vigor-Ebene × Crucible-Ebene
```

| Charakter | Start-Defense | Start-Health | Weapon Base Damage |
| --------- | ------------: | -----------: | -----------------: |
| Korvin    |             5 |          320 |                 14 |
| Rhaya     |             3 |          220 |                 18 |
| Quinn     |             3 |          200 |                 20 |

Waffenprofile und Mastery-Defense stehen in
[Weapon Mastery](WEAPON-MASTERY.md#2-waffenprofile-und-derived-stats). Attribut- und
Crucible-Ebene sind Prozent-Multiplikatoren; konkrete Kurven liegen im Balancing-Content unter
`src/game/`.

Jeder Charakter hat Stats in folgenden Kategorien:

| Kategorie     | Stats                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Core**      | Might, Toughness, Vitality                                                                                                 |
| **Derived**   | Attack, Defense, Health                                                                                                    |
| **Offensive** | Crit Chance, Crit Damage, Multi Hit Chance, Multi Hit Damage, Splash Chance, Splash Damage, Counter Chance, Counter Damage |
| **Defensive** | Barrier, Block Chance, Evasion, Regeneration                                                                               |
| **Utility**   | Initiative, Multi Hit Chain, Multi Hit Chain Factor, Splash Radius                                                         |

- **Core (Primär):** _Might_ speist _Attack_, _Toughness_ speist _Defense_, _Vitality_ speist
  _Health_. Toughness und Vitality stammen aus **Item-Innates**
  ([Slots, Basen & Innate-Affixe](ITEMS.md#1-slots-basen--innate-affixe)); alle drei Core-Stats
  können aus **Emerald-Gems** stammen ([Jeweler](ITEMS.md#8-jeweler--inlay-attune--recut)).
- **Derived:** _Attack_ = Grundschaden; _Defense_ = proportionale Mitigation
  ([Schadenspipeline](DAMAGE-SYSTEM.md#13-eingehender-schaden-schadenspipeline), Schritt 4);
  _Health_ = Lebenspunkte. Zusammensetzung siehe Tabelle oben.
- **Offensive:** paarweise **Chance + Damage** je Muster (Crit, Multi Hit, Splash, Counter);
  Wirkung siehe [Charakter-Zug](DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden). Die vier
  Paare sind an die gemeinsamen [Weapon-Mastery-Disciplines](WEAPON-MASTERY.md#4-gemeinsame-disciplines)
  gekoppelt.
- **Defensive:** _Barrier_ = temporärer, pro Runde neu gesetzter Absorptionsschild; _Block Chance_
  = partielle Reduktion ([Schadenspipeline](DAMAGE-SYSTEM.md#13-eingehender-schaden-schadenspipeline), Schritt 3);
  _Evasion_ = Ausweichchance gegen Accuracy
  ([Schadenspipeline](DAMAGE-SYSTEM.md#13-eingehender-schaden-schadenspipeline), Schritt 2);
  _Regeneration_ = flache Heilung nach eigener Handlung
  ([Heilung](DAMAGE-SYSTEM.md#16-heilung--grenzen-und-auslösung)) und bis zur
  Freischaltung des Rune-Systems ([Runen](RUNES.md)) die **einzige Heilquelle** im Spiel.
- **Utility:** _Initiative_ = Zugreihenfolge; _Multi Hit Chain_ = Länge der Multi-Hit-Kette;
  _Multi Hit Chain Factor_ = Abklingfaktor je Kettenstufe, echt unter 100 %
  ([Charakter-Zug](DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden), Schritt 3);
  _Splash Radius_ = Anzahl Nebenziele (Lane-übergreifend).

---

## 3. Attribute (Level-Up-Progression)

Jeder Charakter hat drei Attribute. Sie sind **eine der drei Quellen der Derived Stats**
([§2](#2-stats)): Jeder Punkt hebt über eine eigene Kurve direkt einen der drei Derived Stats
(Design-Absicht: [DESIGN §3.2](../DESIGN.md#3-player-experience--der-kern-loop)).

| Attribut (EN)  | Gekoppelter Derived Stat |
| -------------- | ------------------------ |
| **Ferocity**   | Attack                   |
| **Resilience** | Defense                  |
| **Vigor**      | Health                   |

**Mechanik**

- 1 Punkt hebt den gekoppelten Derived Stat um **exakt 1,25 %** — die %-Ebene der
  Zusammensetzung ([§2](#2-stats)). 100 Punkte ergeben damit +125 %; der relative Zuwachs pro
  Punkt ist auf jeder Ausbaustufe gleich viel wert.
- Die %-Ebene multipliziert auf feste Startwerte, Weapon Base Damage, Core-Stats und
  Mastery-Defense. Attribute setzen damit dauerhaft die persönliche Gewichtung.

**Progression**

- **100 Punkte pro Charakter** (Level 1 = 1 Punkt, dann +1 je Level bis 100).
- Alle Charaktere starten als **identische Blank Slates** (keine Affinitäten).
- **Frei verteilbar** (suboptimale Builds erlaubt), **separater Respec gegen Gold**.

---

## 4. Weapon Mastery

Jeder Charakter entwickelt seine permanente Signaturwaffe über fünf Disciplines und einen
gemeinsamen Pool aus 100 Mastery Points. Die vollständigen Waffenprofile, Node-Kataloge,
Voraussetzungen, Capstone-Regeln und Respecs stehen ausschließlich in
[Weapon Mastery](WEAPON-MASTERY.md).

---

## 5. Charakterlevel

- Jeder Charakter hat ein **Level**; Maximallevel **100** (Erhöhung durch XP,
  [Belohnungen aus einem Sieg](PROGRESSION.md#2-belohnungen-aus-einem-sieg)).
- Level 1 → 2 benötigt 75 XP; jede weitere Anforderung wächst um 9 %. Die 99 gerundeten Werte
  bis Level 100 liegen als vorberechnete Tabelle im Game-Content, ohne Laufzeitpotenzierung.
- Bei Level 100 werden weitere XP verworfen; der Rest-XP-Zähler steht dort immer auf 0.
- **Ein Level-Up bewirkt genau zweierlei:**
  1. **+1 Attributpunkt** ([§3](#3-attribute-level-up-progression)).
  2. **+1 Mastery Point** ([Weapon Mastery](WEAPON-MASTERY.md#3-mastery-points-ranks-und-node-regeln)).
- Attack, Defense und Health besitzen **kein automatisches Levelwachstum**.

---

## 6. Ausrüstung

- Jeder Charakter trägt Armor in genau **vier Slots**: Head, Chest, Legs und Feet.
- **Das Item ist der Slot.** Ein Item begleitet seinen Slot über das ganze Spiel; es gibt
  **kein Item-Inventar** und **keinen Item-Tausch**.
- Main Hand und Off Hand existieren nicht. Signaturwaffen gehören zu
  [Weapon Mastery](WEAPON-MASTERY.md#1-grundmodell-und-abgrenzung) und interagieren nicht mit
  Item-Systemen.
- Runen laufen über den **Talisman** ([Runen](RUNES.md)), der kein Ausrüstungs-Slot ist.
- Welche Slots es gibt, wie sie freigeschaltet werden, welchen Innate-Affix sie tragen und
  wie ein Item wächst, steht in [Items, Loot & Handwerk](ITEMS.md).

---

## 7. Signatur-Skills

Jeder der drei Charaktere besitzt **genau einen** Signatur-Skill, der (anders als ein
Stat-Knoten) in einen **globalen Kampf-Hebel** eingreift. Er ist die Kapselungsform für
Archetyp-Spezifisches ([§1](#1-team),
[ADR-0001](../adr/0001-keine-charakterexklusiven-stats.md)).

| Charakter      | Signatur-Skill                                               | Angegriffener Hebel                                                                               | Wirkrichtung          |
| -------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | --------------------- |
| Korvin (Tank)  | **[Mitigation](SIGNATURES.md#11-mitigation-korvin-tank)**    | Schadensverteilung ([Schadenspipeline](DAMAGE-SYSTEM.md#13-eingehender-schaden-schadenspipeline)) | defensiv, Umleitung   |
| Rhaya (Melee)  | **[Sunder](SIGNATURES.md#12-sunder-rhaya-melee)**            | Bulwark / Formation ([Bulwark](DAMAGE-SYSTEM.md#14-bulwark-deckung-der-backline))                 | offensiv-enabling     |
| Quinn (Ranged) | **[Suppression](SIGNATURES.md#13-suppression-quinn-ranged)** | Zug-Ökonomie ([Rundenablauf](COMBAT-RUN.md#11-rundenablauf))                                      | präventiv, Zeitgewinn |

- **Die Kampfwirkung der drei Skills steht in
  [Signatur-Skills (Kampfwirkung)](SIGNATURES.md#1-signatur-skills-kampfwirkung)** — Formeln,
  Caps, Test-Vektoren.
- Alle drei sind **charaktergebundene Crucible-Knoten**
  ([Crucible](PROGRESSION.md#3-crucible-globaler-skilltree)) mit **Level 1–5**; der
  Node-Maxlevel wirkt als **natürlicher Cap** (kein künstlicher Cap nötig). Vor Freischaltung
  existiert der Effekt nicht.
- Design-Absicht: [DESIGN §3.1](../DESIGN.md#3-player-experience--der-kern-loop).
