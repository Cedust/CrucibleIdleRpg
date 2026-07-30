# DESIGN.md — Crucible Idle RPG

> **Zweck dieser Datei:** Vision, Design-Pillars und Player Experience.
> Beantwortet **„Warum bauen wir das so?"** und **„Wie soll es sich anfühlen?"**.
> Präzise Regeln und Formeln stehen in [SPEC.md](SPEC.md); verbindliche Begriffe
> in [GLOSSARY.md](GLOSSARY.md). Technische Arbeits-Konventionen in
> [../AGENTS.md](../AGENTS.md).
>
> Interne Doku ist **Deutsch**, Spieltexte (UI + Content) **Englisch** (siehe AGENTS.md §1).

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
   ein (Auto-Battle, SPEC §1).
3. **Sieg ⇒ Belohnung:** XP (Level), Gold, beim Erstsieg Crystals.
4. **Zwischen den Kämpfen optimieren:** Attribute & Skilltree beim Level-Up; Ausrüstung nach dem
   **Stamm-Modell** — der **Blacksmith** treibt das Item-Level (planbare Power) und daran hängend
   **Seltenheit** (Kapazität) und **Brand** (Sigil-Implicit), der **Jeweler** die **Gems**
   (Min-Max-Loot-Jagd); dazu der globale **Crucible**-Baum.
5. **Stärkeres Team ⇒ tiefere Floors ⇒** zurück zu 1. Der „Numbers-go-big"-Effekt (Attack von
   10 → 10.000 → 100.000.000) trägt die Motivation.

**Wodurch entsteht Spannung, obwohl der Kampf automatisch läuft?**

- **Attrition statt Einzelkampf:** Es gibt **keine Heilung zwischen Floors** (SPEC §4.4). Ein
  Dungeon ist ein Überlebens-Run — jeder Floor knabbert an der Health. Die Frage ist nicht
  „gewinne ich diesen Kampf?", sondern „**wie tief trägt mein Build, bevor das Team fällt?**".
- **Build-Entscheidung als eigentliches Gameplay:** Die Spannung liegt **vor** dem Kampf, in
  der Optimierung (Offense-Attribute vs. Defensiv-/Sustain-Ausbau, Zielprioritäten über
  Formation/Taunt/Bulwark, Tank-Mitigation als Power-Spike).
- **Wipe & Checkpoint:** Ein Wipe wirft auf den Dungeon-/Akt-Checkpoint zurück (Rewards
  bleiben) — ein sanfter, kein bestrafender Rückschlag, der zum Nachbessern einlädt.

**Lesbarkeit einer Runde:** Klare, sichtbare Zug-Reihenfolge (Initiative), erkennbare Procs
(Crit/Multi/Splash/Counter) und ein verständlicher Schadensfluss (Team-Verteilung → Block →
Defense → Barrier → Health) — auch bei großen Zahlen.

> Prestige/Reset ist **bewusst kein Ziel** (festes Team; siehe §5 und SPEC §4.6).

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
(„gilded"). Nur **Dark Mode**, eigene UI-Primitives (siehe Pillar 5, AGENTS.md §8).

**Charakterdynamik.** Warmes **Found-Family-Feeling** im Trio (Korvin ruhig-beschützend, Rhaya
heißblütig-impulsiv, Quinn trocken-analytisch) — emotionale Bindung an ein festes Team statt an
austauschbare Einheiten.

**Ton der Spieltexte.** In-universe, heroisch-edel und geheimnisvoll, **aber immer eindeutig**:
kurz und atmosphärisch statt trocken-technisch, nie missverständlich. (Spieltexte **Englisch**,
AGENTS.md §1.)

- **Idle-Anspruch:** Das Spiel läuft angenehm nebenbei, belohnt aber Aufmerksamkeit
  in Schlüsselmomenten (Build-Anpassung, Wipe-Vermeidung).
- **Lesbarkeit:** Der Kampfverlauf muss auf einen Blick verständlich bleiben, auch bei
  großen Zahlen (siehe SPEC — Zahlformatierung).

---

## 5. Bewusste Nicht-Ziele (Design-Perspektive)

Diese Entscheidungen sind **bewusst** getroffen — nicht implementieren, auch nicht
„aus Best-Practice-Reflex". (Technische Liste: [AGENTS.md §13](../AGENTS.md).)

- **Kein Endlos-Treadmill:** Alle Progressions-Achsen sind **endlich** — Charakterlevel,
  Attribut- und Skillpunkte (je 100) sowie Item-Level (`+100`) enden an einem Cap. Das Spiel ist
  bewusst ein abschließbares, endliches Erlebnis (~30–50 h), kein unendlicher Zahlen-Treadmill.
  Der Endgame-Min-Max lebt danach auf der **Gem-Achse** (Jeweler) und dem **Verteilen der Sigils**
  über die Slots (Re-Brand).
- **Kein Offline-Progress:** Tab geschlossen ⇒ kein Fortschritt. Nur ein
  **Catch-up** bei minimiertem/gedrosseltem Tab.
- **Keine passive Idle-Ressourcengenerierung** außerhalb des Kampfes.
- **Kein Router / keine URL-adressierbaren Views** — Ansichtswechsel über State.
- **Kein Light-/System-Theme** — nur Dark Mode.

---

## 6. Verweise

- Präzise Mechanik & Formeln → [SPEC.md](SPEC.md)
- Verbindliche Begriffe → [GLOSSARY.md](GLOSSARY.md)
- Technischer Leitfaden für Agenten → [../AGENTS.md](../AGENTS.md)
