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
- **Incremental-Fantasie:** Der Reiz ist „Numbers go big" (Attack 10 → 10.000 → 100.000.000)
  durch **Min-Maxing** von Stats und Ausrüstung. Die Kurven müssen diesen Sog tragen, ohne den
  Attrition-Anspruch (kein Heilen zwischen Floors) zu untergraben.

## 2. Kern-Wachstumsachsen

Zwei bewusst **getrennte** Skalierungs-Achsen halten den Fokus auf der **Offensive der
Charaktere** (Struktur der Formeln: [Kampfwerte & Formeln](spec/COMBAT.md#2-kampfwerte--formeln);
Rohwerte: `src/game/`):

| Größe                | Skalierung         | Absicht                                             |
| -------------------- | ------------------ | --------------------------------------------------- |
| **Charakter-Attack** | **exponentiell**   | trägt die Incremental-Fantasie                      |
| **Gegner-Health**    | **exponentiell**   | Gegengewicht zur Attack-Explosion                   |
| **Charakter-Health** | **linear**         | hält das Team verwundbar (Attrition bleibt spürbar) |
| **Gegner-Attack**    | **linear**         | Bedrohung wächst planbar, nicht explosiv            |
| **Gegner-Accuracy**  | **linear (Floor)** | erhöht Druck auf Evasion mit der Tiefe              |

**Wichtig — keine Floor-Skalierung der Charaktere:** Charakterwerte wachsen **nicht** mit der
Floor-Tiefe, sondern nur über die eigenen Quellen (unten). Die Gegner skalieren rein über
**Akt/Dungeon/Floor** (kein separates „Gegnerlevel").

**Leitplanke — Formationsgröße gegen Defense.** Defense ist ein flacher Abzug **pro
Gegner-Angriff** ([Schadenspipeline](spec/COMBAT.md#23-eingehender-schaden-schadenspipeline)): Bei sechs Gegnern greift sie sechsmal pro Runde, bei zwei nur
zweimal. Viele schwache Gegner werden von Defense also stark gekontert, wenige starke gehen an
ihr vorbei. Beim Entwerfen der Formationen darauf achten, dass „sechs Gegner" nicht versehentlich
leichter wird als „zwei Gegner".

**Leitplanke — mindestens zwei Gegner-Aktionen pro Runde.** Zwei der vier Skilltree-Zweige
skalieren mit der Gegnerzahl ([Charakter-Skilltree](spec/CHARACTERS.md#4-charakter-skilltree)):
Der Dominance-Ertrag hängt an der Zahl lebender Nebenziele, der Valor-Ertrag an der Zahl der
Gegner-Angriffe — bei sechs Gegnern entstehen bis zu 18 Counter-Würfe pro Runde, bei einem Gegner
drei. Ein Pflicht-Encounter mit einem einzelnen Gegner setzt damit zwei Zweige auf Nebenrolle.
Jeder Pflicht-Encounter — **Boss-Floors eingeschlossen** — trägt deshalb mindestens **zwei
Gegner-Aktionen pro Runde**; unter dem Ein-Zug-pro-Akteur-Modell
([Rundenablauf](spec/COMBAT.md#11-rundenablauf)) heißt das: Boss plus Adds, bei Bedarf
nachrückend. Der konkrete Formationsentwurf ist Content.

**Kurven als Tabellen, nicht als Laufzeit-Formeln.** Die exponentiellen Kurven (Item-Level,
Gegner-Health) werden als **vorberechnete Werte je Stufe** im Content abgelegt statt zur Laufzeit
über `Math.pow` gerechnet. `Math.pow` ist zwischen JS-Engines nicht bit-identisch garantiert und
würde das Determinismus-Versprechen ([Seeds und Zufalls-Ströme](spec/SIMULATION.md#4-seeds-und-zufalls-ströme)) über Browser hinweg aufweichen. Nebeneffekt: die
Kurven sind im Editor lesbar und diffbar.

## 3. Wachstumsquellen (woher die Zahlen kommen)

Die drei zentralen Werte **Attack, Defense, Health** sind **Derived Stats** aus drei Quellen mit je
eigener Kurve: **Baseline** (Level) + **Attribut** + **Core-Stat** ([Stats](spec/CHARACTERS.md#2-stats)). Die eigenen Kurven
je Quelle sind der Hebel, um die (gedeckelte) Level-Up-Achse gegen die Gear-Achse auszubalancieren.

- **Attack (Derived, exp.):** Baseline (Level) + **Ferocity** (Attribut) + **Might** (Core-Stat aus
  **Ausrüstung-Innate** + **Emerald**-Gems) + optional **Crucible/Smelting Flames**. Ausrüstung = Hauptmotor.
- **Defense / Health (Derived, linear):** Baseline (Level) + **Resilience/Vigor** (Attribut) +
  **Toughness/Vitality** (Core-Stat aus Innate + Emerald-Gems) + optional **Crucible/Smelting Flames**.
- **Offensiv-Multiplikatoren** (Crit/Multi/Splash/Counter): **Skilltree-Zweige**
  ([Charakter-Skilltree](spec/CHARACTERS.md#4-charakter-skilltree)) +
  **Amber**/**Ruby**-Gems ([Jeweler](spec/ITEMS.md#8-jeweler--inlay-attune--recut)) — Chance
  soft-capped bei 100 %, Damage ohne Soft-Cap.
  Jeder erzeugte Treffer bemisst sich am **rohen Grundschaden** und würfelt seinen eigenen Crit
  ([Charakter-Zug](spec/COMBAT.md#21-charakter-zug-ausgehender-schaden)) — die Zweige addieren sich also, statt sich gegenseitig zu multiplizieren. Die
  Multiplikation findet **innerhalb** eines Zweigs statt.

- **Heilung:** **Regeneration** ist die **einzige** Heilquelle, bis das Rune-System freigeschaltet
  ist ([Heilung](spec/COMBAT.md#26-heilung--grenzen-und-auslösung)). Ihre Kurve trägt damit allein, wie viel Attrition ein Run verzeiht — bei
  flachem Wert und linear wachsender Health muss sie über Sapphire-Gems mitwachsen.
- **Feinschliff:** Skilltree-Knoten (Verhalten/Trigger) und Crucible-Trees.

**Warum _Crit Damage_ ohne Soft-Cap bleibt.** Der Ausstoß eines Zuges ist
`Grundschaden × [1 + Multi-Anteil + Splash-Anteil] × Crit-Faktor`
([Charakter-Zug](spec/COMBAT.md#21-charakter-zug-ausgehender-schaden)): Die Generator-Anteile
addieren sich in der Klammer, der Crit-Faktor multipliziert die Summe und wirkt zusätzlich auf den
Counter. Der feste Summand `1` (der Grundtreffer) verschafft Crit einen Vorsprung, solange die
Generator-Anteile klein sind — bei Anteilen um `0,7` bringt ein verdoppelter Crit-Faktor `+100 %`,
ein verdoppelter Generator-Anteil `+58 %`. Der Vorsprung schmilzt mit dem Ausbaustand: bei
Anteilen um `10` stehen `+100 %` gegen `+95 %`. Tempest und Dominance sind deshalb als **Produkt
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
