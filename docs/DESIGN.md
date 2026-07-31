# DESIGN.md — Crucible Idle RPG

> **Zweck:** Vision, Design-Pillars und Player Experience — „Warum bauen wir das so?" und
> „Wie soll es sich anfühlen?". Einordnung der Doku-Dateien: [README.md](README.md#1-landkarte).

---

## 1. Vision in einem Satz

Crucible Idle RPG ist ein **client-only Idle-/Incremental-Browsergame**, in dem
**aller Fortschritt ausschließlich aus rundenbasierten Auto-Battle-Kämpfen** zwischen
dem eigenen Team und Gegnern entsteht.

---

## 2. Design-Pillars

Die Pillars sind die obersten Leitplanken. Jede Feature-Entscheidung wird an ihnen gemessen.

1. **Kampf ist der einzige Motor des Fortschritts.**
   Belohnungen kommen nur aus Kampfergebnissen. Es gibt **keine** passive
   Ressourcen-Idle-Schicht außerhalb des Kampfes.

2. **Der Kampf wird miterlebt, nicht nur berechnet.**
   Kämpfe werden **live Runde für Runde** abgespielt und vom Spieler mitverfolgt —
   nicht als sofortiges Ergebnis ausgewürfelt.

3. **Determinismus vor Bequemlichkeit.**
   Gleicher Seed + gleicher Input ⇒ exakt gleicher Kampfverlauf. Das ist die
   Grundlage für Nachvollziehbarkeit, Testbarkeit, Catch-up und spätere Replays.

4. **Offen für aktives Eingreifen.**
   Der Kampf startet als reines Auto-Battle, die Architektur bleibt aber bewusst
   offen für spätere Mechaniken, mit denen der Spieler **aktiv in den Kampf eingreift**.

5. **Eigenständiger Look, volle Kontrolle.**
   Nur Dark Mode, eigene UI-Primitives statt Komponentenbibliothek — das Spiel soll
   wie ein eigenständiges Produkt wirken, nicht wie ein Framework-Default.

---

## 3. Player Experience — der Kern-Loop

Das Spiel ist ein **Idle-/Incremental Dungeon-Crawler** mit einem **festen Trio**
(Korvin/Tank, Rhaya/Melee, Quinn/Ranged). Der Spieler kämpft sich **Floor für Floor**
durch Dungeons; **aller Fortschritt** kommt aus gewonnenen Auto-Battles.

**Der Loop:**

1. **Dungeon/Floor wählen und Kampf starten.** (Später per Crucible-Node auto-fortschreitend
   innerhalb eines Dungeons.)
2. **Kampf läuft automatisch**, Runde für Runde mitverfolgt — der Spieler greift **nicht**
   ein (Auto-Battle, [Kampf — Grundmodell](spec/COMBAT.md#1-kampf--grundmodell)).
3. **Sieg ⇒ Belohnung:** XP (Level), Gold, beim Erstsieg Crystals.
4. **Zwischen den Kämpfen optimieren:** Attribute & Skilltree beim Level-Up; Ausrüstung nach dem
   **Stamm-Modell** — der Blacksmith treibt das Item-Level (planbare Power) und daran hängend
   Seltenheit (Kapazität) und Brand (Sigil-Implicit), der Jeweler die Gems
   (Min-Max-Loot-Jagd); dazu der globale Crucible-Baum und im Endgame die Runen — die
   einzige Achse, die dem Kampf **neues Verhalten** hinzufügt statt größerer Zahlen ([Runen](spec/RUNES.md)).
5. **Stärkeres Team ⇒ tiefere Floors ⇒** zurück zu 1. Der „Numbers-go-big"-Effekt (Attack von
   10 → 10.000 → 100.000.000) trägt die Motivation.

**Wodurch entsteht Spannung, obwohl der Kampf automatisch läuft?**

- **Attrition statt Einzelkampf:** Es gibt **keine Heilung zwischen Floors**
  ([Checkpoints, Wipe & Abbruch](spec/PROGRESSION.md#4-checkpoints-wipe--abbruch)). Ein
  Dungeon ist ein Überlebens-Run — jeder Floor knabbert an der Health, und ein gefallener
  Charakter bleibt für den restlichen Run gefallen. Die Frage ist nicht „gewinne ich diesen
  Kampf?", sondern „**wie tief trägt mein Build, bevor das Team fällt?**".
- **Der Run ist eine versiegelte Wette:** Während eines Dungeons lässt sich nichts optimieren
  ([Checkpoints, Wipe & Abbruch](spec/PROGRESSION.md#4-checkpoints-wipe--abbruch)) — Punkte und
  Drops laufen sichtbar auf, anfassen darf man sie erst danach. Der Build, mit dem man eintritt,
  ist der Build, mit dem man es zu Ende bringt.
- **Build-Entscheidung als eigentliches Gameplay:** Die Spannung liegt **vor** dem Kampf, in
  der Optimierung (Offense-Attribute vs. Defensiv-Ausbau, Zielprioritäten über
  Formation/Taunt/Bulwark, Tank-Mitigation als Power-Spike).
- **Wipe & Checkpoint:** Ein Wipe wirft auf den Dungeon-/Akt-Checkpoint zurück (Rewards
  bleiben) — ein sanfter, kein bestrafender Rückschlag, der zum Nachbessern einlädt.

**Lesbarkeit einer Runde:** Klare, sichtbare Zug-Reihenfolge (Initiative), erkennbare Procs
(Crit/Multi/Splash/Counter) und ein verständlicher Schadensfluss (Team-Verteilung → Block →
Defense → Barrier → Health) — auch bei großen Zahlen. Getaktet wird pro **Akteur**, nicht pro
Runde: ein Zug, ein Log-Block, eine Sekunde Lesezeit
([Playback](spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit)). Pause gibt es von Anfang
an; 2× verdient man sich pro Dungeon, weil dieselben Floors später gefarmt werden.

> Prestige/Reset ist **bewusst kein Ziel** (festes Team; siehe
> [§5](#5-bewusste-nicht-ziele-design-perspektive) und
> [Prestige](spec/PROGRESSION.md#5-prestige)).

### 3.1 Rollen mit Preis — und die Signatur-Skills, die ihn verwerten

- **Jede Rolle bekommt ihre Fähigkeit gegen eine feste Penalty.** Korvin und Rhaya sind an die
  Frontline gebunden und werden vom Taunt gezogen; Quinn erreicht die Backline von Beginn an,
  zahlt dafür aber laufend den Bulwark-Malus. Die Penalty **ist** die Identität der Rolle — kein
  Signatur-Skill hebt die eigene Penalty auf ([Zielauswahl](spec/COMBAT.md#12-zielauswahl),
  [Signatur-Skills](spec/COMBAT.md#3-signatur-skills-kampfwirkung)).
- **Die drei Signatur-Skills bilden eine Kette: halten → aufbrechen → verwerten & Zeit kaufen.**
  Mitigation hält das Team am Leben, Sunder reißt die Deckung der Backline ein, Suppression
  verwertet den entstehenden Durchsatz, indem sie Gegnerzüge nach hinten schiebt — ein Kill vor
  dem verschobenen Zug löscht ihn.
- **Sunder dreht Rhayas Nachteil ins Positive.** Der Taunt zwingt sie auf den gegnerischen Tank —
  genau den Gegner, der den größten Bulwark-Anteil trägt. Der erzwungene Zielzwang wird damit zur
  Team-Utility.
- **Suppression begrenzt sich selbst.** Der Effekt wächst mit der Formationsgröße: gegen sechs
  Gegner eine volle Umsortierung, gegen zwei fast wirkungslos. Kein künstlicher Cap nötig.
- **Drei Hebel, keine Kopplung.** Die Skills greifen an Schadensverteilung, Formation und
  Zug-Ökonomie an und hängen rechnerisch nicht aneinander — sie verstärken sich im Spiel, ohne
  sich in der Formel zu verketten.

### 3.2 Build-Entscheidungen, die sich unterscheiden sollen

Dieser Abschnitt begründet, **warum** die Mechanik so geschnitten ist. Die Regeln und Zahlen selbst
stehen in der Spec (Links jeweils am Ende der Punkte).

- **Level-Up ist eine Gewichtung, keine Belohnung.** Jeder Punkt geht entweder in Offense,
  Verteidigung oder Überleben. Durch die Attrition ist das eine echte Wette statt einer freien
  Zugabe. → [Attribute](spec/CHARACTERS.md#3-attribute-level-up-progression)
- **Knoten multiplizieren sich innerhalb eines Zweigs, statt sich zu addieren.** Das erzeugt eine
  **Reihenfolge**-Entscheidung im Zweig statt beliebiger Punkte-Streuung: In Tempest entscheidet
  der _Multi Hit Chain Factor_, was ein Chain-Knoten wert ist — bei niedrigem Faktor klingt die
  Kette so schnell ab, dass die hinteren Stufen kaum tragen. Der Zusammenhang ist im Kampflog
  ablesbar, weil jede ausgelöste Kette in voller Länge mit fallenden Zahlen erscheint.
  → [Charakter-Skilltree](spec/CHARACTERS.md#4-charakter-skilltree)
- **Die Crit-Erweiterungen sitzen im Zweig des Generators.** So zieht jeder Zweig aus eigener Kraft
  zu Finesse hin, statt Finesse für jeden Build zur Pflicht zu machen.
  → [Charakter-Skilltree](spec/CHARACTERS.md#4-charakter-skilltree)
- **Chance-Stats sind soft-capped, Damage-Stats nicht.** Kein Zweig wird dadurch je wertlos, und
  kein Investment fühlt sich verschwendet an. → [Charakter-Skilltree](spec/CHARACTERS.md#4-charakter-skilltree)
- **Die Gem-Pools sind absichtlich klein und Chance von Damage getrennt.** Kleinere Pools machen
  den Loot zielgerichteter, und ein reiner Damage-Pool bleibt wertvoll, wenn die Chancen am
  Soft-Cap liegen. → [Jeweler](spec/ITEMS.md#8-jeweler--inlay-attune--recut)
- **Am Ende der Item-Achse steht ein Chase, kein Plateau.** Die Prismatic-Sockel liegen so weit
  oben auf der Item-Level-Kurve, dass ein voll ausgebautes Item mit beiden Diamonds der stärkste
  Min-Max-Träger des Spiels bleibt. → [Prismatic-Sockel](spec/ITEMS.md#4-prismatic-sockel)
- **Talisman und Runic Focus sind charakterweise gestaffelt.** Wer zuerst seinen Rite bzw.
  Modifier-Slot bekommt, ist genau die Priorisierungsfrage, für die der Crucible da ist.
  → [Masterwork-Nodes](spec/RUNES.md#8-masterwork-nodes)

---

## 4. Zielgefühl & Tonalität

**Setting — „Crucible of Ashes".** Ein infernalischer Abstieg durch die Ruinen eines einst
prächtigen Imperiums, das nun von dämonischen Mächten überrannt ist. Drei Akte:
_The Ashen Depths_ → _The Ember Foundry_ → _The Forgotten Citadel_. Eine **lose Story** wird
über Akte, Dungeons und kurze Charakter-Dialoge erzählt — Fokus bleibt aber klar auf **Gameplay
und Fortschritt**.

**Stimmung — „Gilded Ruins".** Hochfantasy, von Heldentum und altem Geheimnis durchzogen —
edel, geheimnisvoll, aber **nie hoffnungslos**. Bewusst **nicht zu dunkel, nicht zu hell**.

**Visuelle Richtung.** Zwischen **Diablo** (schwere, gemeißelte Steinarchitektur, gedämpftes
Licht) und **World of Warcraft** (warme Heroik, klare Lesbarkeit). Amber/Gold als Akzent
(„gilded"). Nur **Dark Mode**, eigene UI-Primitives (siehe Pillar 5,
[AGENTS.md §8](../AGENTS.md#8-ui-styling--accessibility)).

**Charakterdynamik.** Warmes **Found-Family-Feeling** im Trio (Korvin ruhig-beschützend, Rhaya
heißblütig-impulsiv, Quinn trocken-analytisch) — emotionale Bindung an ein festes Team statt an
austauschbare Einheiten.

**Ton der Spieltexte.** In-universe, heroisch-edel und geheimnisvoll, **aber immer eindeutig**:
kurz und atmosphärisch statt trocken-technisch, nie missverständlich. (Spieltexte **Englisch**,
[AGENTS.md §1](../AGENTS.md#1-projektüberblick).)

- **Idle-Anspruch:** Das Spiel läuft angenehm nebenbei, belohnt aber Aufmerksamkeit
  in Schlüsselmomenten (Build-Anpassung, Wipe-Vermeidung).
- **Lesbarkeit:** Der Kampfverlauf muss auf einen Blick verständlich bleiben, auch bei
  großen Zahlen ([AGENTS.md §5](../AGENTS.md#5-architektur-des-game-loops), Zahlformatierung).

---

## 5. Bewusste Nicht-Ziele (Design-Perspektive)

Diese Entscheidungen sind **bewusst** getroffen — nicht implementieren, auch nicht
„aus Best-Practice-Reflex". (Technische Liste:
[AGENTS.md §13](../AGENTS.md#13-non-goals-bewusst-nicht-umsetzen).)

- **Kein Endlos-Treadmill:** Alle Progressions-Achsen sind **endlich** — Charakterlevel,
  Attribut- und Skillpunkte sowie Item-Level enden an einem Cap (Werte:
  [Attribute](spec/CHARACTERS.md#3-attribute-level-up-progression),
  [Charakterlevel](spec/CHARACTERS.md#5-charakterlevel),
  [Seltenheit, Sockel & Level-Cap](spec/ITEMS.md#3-seltenheit-sockel--level-cap)). Das Spiel ist
  bewusst ein abschließbares, endliches Erlebnis (~30–50 h), kein unendlicher Zahlen-Treadmill.
  Der Endgame-Min-Max lebt danach auf der Gem-Achse (Jeweler), dem Verteilen der Sigils
  über die Slots (Re-Brand) und dem Kombinieren der Runen (Rites, [Runen](spec/RUNES.md)) —
  letzteres als **kostenloses** Umsockeln, also reines Tüfteln ohne Ressourcen-Reue.
- **Kein Offline-Progress:** Tab geschlossen ⇒ kein Fortschritt. Nur ein
  Catch-up bei minimiertem/gedrosseltem Tab.
- **Keine passive Idle-Ressourcengenerierung** außerhalb des Kampfes.
- **Kein Runden-Cap im Kampf:** Ein Kampf endet durch Sieg, Wipe oder manuellen Abbruch. Ein Cap
  wäre ein verstecktes Balancing-Instrument; die Endlichkeit garantiert stattdessen die **monoton
  sinkende Gegner-Health** ([Rundenablauf](spec/COMBAT.md#11-rundenablauf)). Einen zäh laufenden
  Kampf beendet der Spieler selbst.
- **Kein Frust-RNG bei der Entdeckung:** Inscribe zieht ausschließlich noch **unbekannte**
  Runen — ein Kartenstapel, kein Automat. Keine Duplikate, keine Pech-Serien, jeder Zug ist
  Fortschritt ([Rune-Grimoire-Aktionen](spec/RUNES.md#7-rune-grimoire-aktionen)). Dieselbe Logik
  trägt den garantierten ersten Sigil-Drop.
- **Kein Router / keine URL-adressierbaren Views** — Ansichtswechsel über State.
- **Kein Light-/System-Theme** — nur Dark Mode.
