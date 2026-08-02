# BALANCING.md — Crucible Idle RPG

> **Zweck:** Balancing-Philosophie und die Begründung der Kurven — „warum diese Kurve, dieser
> Wert?". Diese Datei ist Prosa/Begründung, kein zweiter Quellcode: die **umgesetzten Werte**
> leben als typisierter Content unter `src/game/`
> ([AGENTS.md §4](../AGENTS.md#4-content--balancing)), die **Struktur** der Formeln in der
> [SPEC](SPEC.md). Einordnung der Doku-Dateien: [README.md](README.md#1-landkarte).

---

## 1. Balancing-Philosophie

- **Zielspielzeit:** **~30–50 h** aktives Spielen für die 300 Floors (grober Anker für alle
  Kurven).
- **„Bewusster Grind, kein Grind-Wall":** Wiederholen von Dungeons (XP/Gold-Farmen) ist ein
  **eingeplanter** Teil des Fortschritts — aber niemand soll **tagelang** einen Dungeon farmen
  müssen, nur um den nächsten zu bestehen. Ein „einfaches Durchlaufen" ohne Optimierung soll
  ebenfalls **nicht** möglich sein.
- **Lesbare Zahlen, spürbare Spikes:** Der Zahlenraum ist komprimiert — Attack startet
  zweistellig und endet fünfstellig, der größte Wert im Spiel (Boss-eHP) bleibt im einstelligen
  Millionenbereich ([ADR 0007](adr/0007-zwei-geometrische-wachstumsachsen.md)). Das
  Progressionsgefühl tragen **klumpige Power-Spikes** (Refine-Stufen, Verhaltens-Knoten,
  Signatur- und Runen-Unlocks) und die sichtbaren Procs. Flache Content-Werte (Barrier,
  Regeneration, Sigil-Beträge) bleiben dadurch über Akte hinweg spürbar und autorierbar —
  ohne den Attrition-Anspruch (kein Heilen zwischen Floors) zu untergraben.

## 2. Kern-Wachstumsachsen

Alle Zahlenkurven des Spiels erben ihre Steigung von genau **zwei geometrischen Achsen**
(konstanter Prozent-Zuwachs pro Floor; Entscheidung:
[ADR 0007](adr/0007-zwei-geometrische-wachstumsachsen.md)). Geometrisch, weil der **relative**
Druck damit auf jeder Tiefe gleich bleibt — Attrition und Farm-Ertrag fühlen sich auf Floor 280
an wie auf Floor 40. Struktur der Formeln:
[Kampfwerte & Formeln](spec/COMBAT.md#2-kampfwerte--formeln); Rohwerte: `src/game/`.

| Achse              | Zuwachs pro Floor (Ziel) | über 300 Floors | Mitglieder                                                                                |
| ------------------ | ------------------------ | --------------- | ----------------------------------------------------------------------------------------- |
| **Offense-Rennen** | ~+3 %                    | ×~5.000         | Gegner-Health; Attack-Quellen (Baseline, Might aus Innate + Emeralds); Gold-/XP-Einkommen |
| **Defense-Rennen** | ~+1,8 %                  | ×~200           | Gegner-Attack `S`; Health-/Defense-Quellen (Vitality, Toughness), Regeneration, Barrier   |

- Die **steile Offense-Achse** trägt das Wachstumsgefühl, die **flache Defense-Achse** hält das
  Team verwundbar — die Attrition bleibt über das ganze Spiel die Kernspannung.
- **Gegner-Accuracy** steigt als gedeckelte Rampe mit der Tiefe (Trefferchance-Formel:
  [Treffermodell](spec/COMBAT.md#22-treffermodell)).
- **Chance-Stats gehören keiner Achse an:** Alles mit Cap (Crit/Multi/Splash/Counter/Block
  Chance, Evasion) wächst über endliche Budgets (Skillpunkte, Gem-Slots). Damage-Stats ohne
  Cap bilden den **Proc-Multiplikator** des Team-Schadens (~×4 übers Spiel), begrenzt durch
  den endlichen Content-Vorrat (Skilltree, Amber/Ruby, Diamonds/Runen) statt durch einen
  Soft-Cap.

**Wichtig — keine Floor-Skalierung der Charaktere:** Charakterwerte wachsen **nicht** mit der
Floor-Tiefe, sondern nur über die eigenen Quellen (unten). Die Gegner skalieren rein über
**Akt/Dungeon/Floor** (kein separates „Gegnerlevel").

**Leitplanke — Achsen-Trennung.** Offensive Magnituden skalieren ausschließlich aus Attack,
defensive ausschließlich aus defensiven Quellen (verbindlich:
[Feststehende Regeln](spec/COMBAT.md#25-feststehende-regeln)). Ein Effekt, der zwischen den
Achsen konvertiert (Lifesteal: Offense → Heilung; Reflekt: erlittener Schaden → Gegner-Health),
skaliert zwangsläufig mit der falschen Achse und wird über die Spielzeit übermächtig oder
wertlos. Jede Stat-, Sigil-, Diamond- und Runen-Idee ist gegen diese Regel zu prüfen.

**Leitplanke — Tuning gegen Korridore.** Getunt wird gegen zwei Kenngrößen:

- **TTK** (Runden bis zum Floor-Sieg) bei Par-Ausbau: normaler Floor 4–6, Elite 8–12,
  Akt-Boss 15–25. **Elite-/Boss-eHP wird direkt aus dem TTK-Ziel abgeleitet**
  (`eHP = Ziel-Runden × Par-Team-Schaden pro Runde`), nicht als fester Kurven-Multiplikator —
  Bosse bleiben damit gegen jede spätere Kurvenänderung stabil.
- **Netto-Attrition:** Der über einen 20-Floor-Run summierte Netto-Health-Verlust liegt bei
  Par-Ausbau bei ~60–80 % des Pools. Sustain (Barrier + Regeneration) deckt den erwarteten
  Durchlass höchstens etwa zur Hälfte — darüber kippt das System binär in „unsterblich oder
  blutet", und die Run-Tiefen-Frage verliert ihre Spannung.

**Leitplanke — Formationsgröße ist defensiv neutral.** Die Mitigation ist proportional
([ADR 0008](adr/0008-defense-ratio-mitigation.md)); die defensive Schwere einer Formation hängt
allein an der **Summe `S` pro Runde**. Die Gegnerzahl ist damit frei für offensive Textur
(Splash-Nebenziele, Counter-Auslöser).

**Leitplanke — mindestens zwei Gegner-Aktionen pro Runde.** Zwei der vier Skilltree-Zweige
skalieren mit der Gegnerzahl ([Charakter-Skilltree](spec/CHARACTERS.md#4-charakter-skilltree)):
Der Dominance-Ertrag hängt an der Zahl lebender Nebenziele, der Valor-Ertrag an der Zahl der
Gegner-Angriffe — bei sechs Gegnern entstehen bis zu 18 Counter-Würfe pro Runde, bei einem Gegner
drei. Ein Pflicht-Encounter mit einem einzelnen Gegner setzt damit zwei Zweige auf Nebenrolle.
Jeder Pflicht-Encounter — **Boss-Floors eingeschlossen** — trägt deshalb mindestens **zwei
Gegner-Aktionen pro Runde**; unter dem Ein-Zug-pro-Akteur-Modell
([Rundenablauf](spec/COMBAT.md#11-rundenablauf)) heißt das: Boss plus Adds, bei Bedarf
nachrückend. Der konkrete Formationsentwurf ist Content.

**Kurven als Tabellen, nicht als Laufzeit-Formeln.** Die geometrischen Kurven (Item-Level,
Gegner-Health) werden als **vorberechnete Werte je Stufe** im Content abgelegt statt zur Laufzeit
über `Math.pow` gerechnet. `Math.pow` ist zwischen JS-Engines nicht bit-identisch garantiert und
würde das Determinismus-Versprechen ([Seeds und Zufalls-Ströme](spec/SIMULATION.md#4-seeds-und-zufalls-ströme)) über Browser hinweg aufweichen. Nebeneffekt: die
Kurven sind im Editor lesbar und diffbar.

## 3. Wachstumsquellen (woher die Zahlen kommen)

Die drei zentralen Werte **Attack, Defense, Health** sind **Derived Stats** aus multiplikativ
geschichteten Quellen: `(Baseline + Core-Stat) × Attribut-% × Crucible-%`
([Stats](spec/CHARACTERS.md#2-stats)). Die %-Ebenen halten die gedeckelte Level-Up- und
Crucible-Achse über die gesamte Gear-Kurve relevant — jeder Attributpunkt ist auf Level 5 und
auf Level 100 gleich viel wert.

- **Attack (Offense-Achse):** Basis aus Baseline (Level) + **Might** (Core-Stat aus
  **Ausrüstung-Innate** + **Emerald**-Gems), multipliziert mit **Ferocity**- und
  **Crucible/Smelting-Flames**-Prozenten. Ausrüstung = Hauptmotor.
- **Defense / Health (Defense-Achse):** Basis aus Baseline (Level) + **Toughness/Vitality**
  (Core-Stat aus Innate + Emerald-Gems), multipliziert mit **Resilience/Vigor**- und
  Crucible-Prozenten. Defense wirkt als proportionale Mitigation und hebt die effektive Health
  linear pro Punkt
  ([Schadenspipeline](spec/COMBAT.md#23-eingehender-schaden-schadenspipeline), Schritt 4) —
  Health ist der rohe Puffer, Defense der eHP-Multiplikator, beide bleiben dadurch getrennt
  fühlbare Hebel.
- **Offensiv-Multiplikatoren** (Crit/Multi/Splash/Counter): **Skilltree-Zweige**
  ([Charakter-Skilltree](spec/CHARACTERS.md#4-charakter-skilltree)) +
  **Amber**/**Ruby**-Gems ([Jeweler](spec/ITEMS.md#8-jeweler--inlay-attune--recut)) — Chance
  soft-capped bei 100 %, Damage ohne Soft-Cap.
  Jeder erzeugte Treffer bemisst sich am **rohen Grundschaden** und würfelt seinen eigenen Crit
  ([Charakter-Zug](spec/COMBAT.md#21-charakter-zug-ausgehender-schaden)) — die Zweige addieren sich also, statt sich gegenseitig zu multiplizieren. Die
  Multiplikation findet **innerhalb** eines Zweigs statt.

- **Heilung:** **Regeneration** ist die **einzige** Heilquelle, bis das Rune-System freigeschaltet
  ist ([Heilung](spec/COMBAT.md#26-heilung--grenzen-und-auslösung)). Ihre Kurve trägt damit allein, wie viel Attrition ein Run verzeiht — bei
  flachem Wert muss sie über Sapphire-Gems mit der Health-Kurve mitwachsen; ihr Deckel gegen
  den erwarteten Durchlass steht in [§2](#2-kern-wachstumsachsen).
- **Feinschliff:** Skilltree-Knoten (Verhalten/Trigger) und Crucible-Trees.

**Warum _Crit Damage_ ohne Soft-Cap bleibt.** Der Ausstoß eines Zuges ist
`Grundschaden × [1 + Multi-Anteil + Splash-Anteil] × Crit-Faktor`
([Charakter-Zug](spec/COMBAT.md#21-charakter-zug-ausgehender-schaden)): Die Generator-Anteile
addieren sich in der Klammer, der Crit-Faktor multipliziert die Summe und wirkt zusätzlich auf den
Counter. Der feste Summand `1` (der Grundtreffer) verschafft Crit einen Vorsprung, solange die
Generator-Anteile klein sind — bei Anteilen um `0,7` bringt ein verdoppelter Crit-Faktor `+100 %`,
ein verdoppelter Generator-Anteil `+58 %`. Der Vorsprung schmilzt mit dem Ausbaustand: bei
Anteilen um `3` stehen `+100 %` gegen `+75 %`. Tempest und Dominance sind deshalb als **Produkt
dreier wachsender Stats** gebaut ([Charakter-Skilltree](spec/CHARACTERS.md#4-charakter-skilltree),
[ADR-0006](adr/0006-multi-hit-kette-garantierte-laenge.md)) und erreichen diesen Bereich. Der
Ausgleich liegt damit in den Zweig-Kurven; die verbleibende Frühspiel-Asymmetrie wird über die
Punktekosten der ersten Finesse-Knoten getragen. Beim Tuning ist der Ausstoß daher über den
**gesamten** Ausbaupfad zu prüfen, nicht nur am Endpunkt.

> **Leitplanke:** Ausrüstung = Hauptmotor, Level/Crucible = garantiertes Grundgerüst. Beim
> Tuning darauf achten, dass ein loot-unabhängiger Sockel existiert (sonst hängt die gesamte
> Kurve an der Loot-Varianz).

## 4. Ökonomie-Anker

- **Crystals (Crucible):** endliche Ressource — **351** gesamt (285 normal + 36 elite + 30 boss),
  nur beim Erstsieg. Ein voll gestufter Node kostet 15 (1+2+3+4+5). ⇒ Der Crucible ist
  **bewusst knapp**; nicht alles ist gleichzeitig maximierbar (Priorisierungs-Entscheidung).
- **Gold:** laufende Währung (Respecs für Attribute/Skills/Crucible, Blacksmith/Jeweler). Muss so
  fließen, dass Experimentieren (Respec) erschwinglich bleibt, ohne Entscheidungen zu
  entwerten.
- **XP:** Pool pro Floor, Basisanteil je Charakter + individueller Rest (Schlüssel offen —
  Kandidat: verursachter Schaden).
- **Gems (Amber/Ruby/Sapphire/Emerald/Diamond):** Loot-Hauptressource _und_ Level-Fodder
  ([Items, Loot & Handwerk](spec/ITEMS.md)).
  Pool-Größen: Amber 4, Ruby 4, Sapphire 4, Emerald 3 → die Trefferchance auf den Ziel-Affix beim
  Inlay liegt für drei der vier Fodder-Farben bei 25 %.
  Der Drop-Strom teilt sich auf vier Fodder-Farben (Amber/Ruby/Sapphire/Emerald) — Drop-Raten je
  Floor-Tiefe und die Aufleveln-Fodder-Kurve (jedes Gem-Level braucht mehr) müssen so liegen, dass
  keine Farbe zum Grind-Wall wird (Leitplanke [§1](#1-balancing-philosophie)). Diamond bewusst
  knapp (Elite/Boss ab Akt 2) und
  durch `floor(Item-Level / 50)` Prismatic-Sockel natürlich limitiert. Da das Item-Level bei `+100`
  cappt, tragen die Gems den **Endgame-Min-Max** — Tiefe der Gem-Achse geht hier vor Schlankheit.
- **Cinder:** der **einzige harte Fortschrittsriegel** — ohne Cinder steht die Gold-Achse am
  Seltenheits-Cap. Dreifacher Sink: Refine (1/3/6/10 = 20 pro Item × 18 Items = **360**),
  Brand und Re-Brand. Quellen: Boss 1/Kill garantiert (farmbar) + Elite-Bonus-Chance, in
  Akt 2 & 3 erhöht. Muss so liegen, dass der Riegel den Rhythmus taktet, ohne zur Wand zu werden.
- **Sigils:** Sammel- **und** Tiefen-Achse (Level 1–5, auf Level 5 aus dem Pool). Pool-Größe
  **unter 18** (Slot-Zahl), damit der Verteilungsdruck bleibt. Das Gewicht unbekannter Sigils im
  Wurf tunt die Sammel-Geschwindigkeit; die Re-Brand-Kosten entscheiden, ob das Neuverteilen ein
  laufender Hebel oder ein Luxus ist (Ziel: laufender Hebel).
- **Runedust:** späte Endgame-Ressource (Drop erst ab dem `Rune Grimoire`-Node,
  [Runen](spec/RUNES.md)) mit zwei **gestaffelten** Sinks: solange das Level-Cap 1 ist, zieht
  Inscribe allen Dust (Entdeckung); mit steigendem `Rune Mastery`-Node übernimmt Etch
  (Investition). Beide Sinks sind **endlich**
  (17 Runen × Cap 5) — der Dust-Strom muss so liegen, dass die Entdeckungsphase nicht in einen Grind
  kippt (Leitplanke [§1](#1-balancing-philosophie)) und der Katalog gegen Spielende
  etwa vollständig ist.

## 5. Offene Fragen

Noch nicht entschiedene Tuning-Werte und Kurven stehen in
[docs/backlog/OPEN_ISSUES.md](backlog/OPEN_ISSUES.md) — bewusst getrennt, damit in dieser Datei
ausschließlich Entschiedenes steht. Nichts von dort ist verbindlich.
