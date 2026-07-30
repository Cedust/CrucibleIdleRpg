# BALANCING.md — Crucible Idle RPG

> **Zweck dieser Datei:** die **Balancing-Philosophie** und die konkreten Zahlen-,
> Kosten- und Wachstumskurven dokumentieren — also **welche Werte** gelten und
> **warum** sie so gewählt sind.
>
> Abgrenzung zu den Nachbardateien:
>
> - [SPEC.md](SPEC.md) beschreibt die **Struktur** der Formeln („wie wird gerechnet").
> - **BALANCING.md** (diese Datei) beschreibt die **Zahlen darin** und ihre Begründung.
> - Die **umgesetzten Werte** leben als deklarativer, typisierter Content unter
>   `src/game/` (siehe [../AGENTS.md](../AGENTS.md) §4) — **nicht** hier. Diese Datei
>   ist Prosa/Begründung, kein zweiter Quellcode.
>
> Alle Werte laufen über native `number` — die Achsen sind gedeckelt, die Spitzenwerte bleiben
> weit unter `Number.MAX_SAFE_INTEGER` (AGENTS.md §5, ADR-0004).
> Interne Doku ist **Deutsch** (AGENTS.md §1).

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
Charaktere** (Struktur der Formeln: SPEC §2; Rohwerte: `src/game/`):

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
Gegner-Angriff** (SPEC §2.3): Bei sechs Gegnern greift sie sechsmal pro Runde, bei zwei nur
zweimal. Viele schwache Gegner werden von Defense also stark gekontert, wenige starke gehen an
ihr vorbei. Beim Entwerfen der Formationen darauf achten, dass „sechs Gegner" nicht versehentlich
leichter wird als „zwei Gegner".

**Kurven als Tabellen, nicht als Laufzeit-Formeln.** Die exponentiellen Kurven (Item-Level,
Gegner-Health) werden als **vorberechnete Werte je Stufe** im Content abgelegt statt zur Laufzeit
über `Math.pow` gerechnet. `Math.pow` ist zwischen JS-Engines nicht bit-identisch garantiert und
würde das Determinismus-Versprechen (SPEC §5.3) über Browser hinweg aufweichen. Nebeneffekt: die
Kurven sind im Editor lesbar und diffbar.

## 3. Wachstumsquellen (woher die Zahlen kommen)

Die drei zentralen Werte **Attack, Defense, Health** sind **Derived Stats** aus drei Quellen mit je
eigener Kurve: **Baseline** (Level) + **Attribut** + **Core-Stat** (SPEC §3.0). Die eigenen Kurven
je Quelle sind der Hebel, um die (gedeckelte) Level-Up-Achse gegen die Gear-Achse auszubalancieren.

- **Attack (Derived, exp.):** Baseline (Level) + **Ferocity** (Attribut) + **Might** (Core-Stat aus
  **Ausrüstung-Innate** + **Emerald**-Gems) + optional **Crucible/Smelting Flames**. Ausrüstung = Hauptmotor.
- **Defense / Health (Derived, linear):** Baseline (Level) + **Resilience/Vigor** (Attribut) +
  **Toughness/Vitality** (Core-Stat aus Innate + Emerald-Gems) + optional **Crucible/Smelting Flames**.
- **Offensiv-Multiplikatoren** (Crit/Multi/Splash/Counter): **Skilltree-Zweige** (§3.2) +
  **Amber**/**Ruby**-Gems (§4.5) — Chance soft-capped bei 100 %, Damage ohne Soft-Cap (SPEC §3.1/§3.2).
  Jeder erzeugte Treffer bemisst sich am **rohen Grundschaden** und würfelt seinen eigenen Crit
  (SPEC §2.1) — die Zweige addieren sich also, statt sich gegenseitig zu multiplizieren. Die
  Multiplikation findet **innerhalb** eines Zweigs statt (z. B. Multi Hit Chance × Chain).
- **Heilung:** **Regeneration** ist die **einzige** Heilquelle, bis das Rune-System freigeschaltet
  ist (SPEC §2.6). Ihre Kurve trägt damit allein, wie viel Attrition ein Run verzeiht — bei
  flachem Wert und linear wachsender Health muss sie über Sapphire-Gems mitwachsen.
- **Feinschliff:** Skilltree-Knoten (Verhalten/Trigger) und Crucible-Trees.

> **Leitplanke:** Ausrüstung = Hauptmotor, Level/Crucible = garantiertes Grundgerüst. Beim
> Tuning darauf achten, dass ein loot-unabhängiger Sockel existiert (sonst hängt die gesamte
> Kurve an der Loot-Varianz).

## 4. Ökonomie-Anker

- **Crystals (Crucible):** endliche Ressource — **351** gesamt (285 normal + 36 elite + 30 boss),
  nur beim Erstsieg. Ein voll gestufter Node kostet **15** (1+2+3+4+5). ⇒ Der Crucible ist
  **bewusst knapp**; nicht alles ist gleichzeitig maximierbar (Priorisierungs-Entscheidung).
- **Gold:** laufende Währung (Respecs für Attribute/Skills/Crucible, Blacksmith/Jeweler). Muss so
  fließen, dass **Experimentieren** (Respec) erschwinglich bleibt, ohne Entscheidungen zu
  entwerten.
- **XP:** Pool pro Floor, Basisanteil je Charakter + individueller Rest (Schlüssel offen —
  Kandidat: verursachter Schaden).
- **Gems (Amber/Ruby/Sapphire/Emerald/Diamond):** Loot-Hauptressource _und_ Level-Fodder (SPEC §4.5).
  Pool-Größen: Amber 4, Ruby 4, Sapphire 4, Emerald 3 → die Trefferchance auf den Ziel-Affix beim
  Inlay liegt für drei der vier Fodder-Farben bei 25 %.
  Der Drop-Strom teilt sich auf **vier** Fodder-Farben (Amber/Ruby/Sapphire/Emerald) — Drop-Raten je
  Floor-Tiefe und die **Aufleveln-Fodder-Kurve** (jedes Gem-Level braucht mehr) müssen so liegen, dass
  keine Farbe zum Grind-Wall wird (Leitplanke §1). Diamond bewusst knapp (Elite/Boss ab Akt 2) und
  durch `floor(Item-Level / 50)` Prismatic-Sockel natürlich limitiert. Da das Item-Level bei **+100**
  cappt, tragen die Gems den **Endgame-Min-Max** — Tiefe der Gem-Achse geht hier vor Schlankheit.
- **Cinder:** der **einzige** harte Fortschrittsriegel — ohne Cinder steht die Gold-Achse am
  Seltenheits-Cap. Dreifacher Sink: **Refine** (1/3/6/10 = **20 pro Item** × 18 Items = **360**),
  **Brand** und **Re-Brand**. Quellen: Boss 1/Kill garantiert (farmbar) + Elite-Bonus-Chance, in
  **Akt 2 & 3 erhöht**. Muss so liegen, dass der Riegel den Rhythmus taktet, ohne zur Wand zu werden.
- **Sigils:** Sammel- **und** Tiefen-Achse (Level 1–5, auf Level 5 aus dem Pool). Pool-Größe
  **unter 18** (Slot-Zahl), damit der Verteilungsdruck bleibt. Das **Gewicht unbekannter Sigils** im
  Wurf tunt die Sammel-Geschwindigkeit; **Re-Brand-Kosten** entscheiden, ob das Neuverteilen ein
  laufender Hebel oder ein Luxus ist (Ziel: laufender Hebel).
- **Runedust:** späte Endgame-Ressource (Drop erst ab dem `Rune Grimoire`-Node, SPEC §4.6) mit zwei
  **gestaffelten** Sinks: solange das Level-Cap 1 ist, zieht **Inscribe** allen Dust (Entdeckung);
  mit steigendem `Rune Mastery`-Node übernimmt **Etch** (Investition). Beide Sinks sind **endlich**
  (17 Runen × Cap 5) — der Dust-Strom muss so liegen, dass die Entdeckungsphase nicht in einen Grind
  kippt (Leitplanke §1) und der Katalog gegen Spielende **etwa vollständig** ist.

## 5. Offene Balancing-Fragen / Tuning-Notizen

- [ ] **Derived-Stat-Kurven je Quelle** (SPEC §3.0): Baseline (Level), Attribut-Betrag je
      Ferocity/Resilience/Vigor-Punkt und Core-Stat-Kurve (Might/Toughness/Vitality →
      Attack/Defense/Health) — so normalisieren, dass beide Achsen über die ganze Kurve relevant
      bleiben (der eigentliche Sinn der eigenen Kurve je Quelle).
- [ ] Baseline-Kurvenform der Derived Stats (Attack exp., Health/Defense linear).
- [ ] Gegner-Kurven pro Akt/Dungeon/Floor (Health exp., Attack/Accuracy linear) + Elite/Boss-
      Multiplikatoren.
- [ ] Bulwark-Prozentwerte (Tank/Melee-Beitrag) und Mitigation-`m` je Node-Stufe.
- [ ] **Mindestanteil des Defense-Bodens** (SPEC §2.3, Schritt 4; Vorschlag 10 %): Der Wert
      entscheidet, wie stark Defense maximal wirkt (Boden 10 % ⇒ höchstens 90 % Reduktion) und
      damit, ob Attrition in jedem Zahlenregime greift. Zusammen mit der Formations-Leitplanke
      (§2) prüfen.
- [ ] **Rally-Anteil je Node-Stufe** (SPEC §4.4): Prozent der Max-Health beim Aufstehen an der
      Floor-Grenze. Klein halten, sonst entsteht ein Sprung, bei dem Sterben besser ist als
      knappes Überleben. Beachten: Die Floor-Kurven müssen **mit und ohne** Rally spielbar sein
      (gleiche Lage wie bei Mitigation).
- [ ] **Regeneration-Kurve** (flacher Wert): einzige Heilquelle vor dem Endgame (§3), muss gegen
      linear wachsende Health über Sapphire-Gems mitwachsen.
- [ ] XP-Verteilungsschlüssel; Gold-Drop- und Respec-Kosten-Kurven.
- [ ] Waffen-Damage-Range-Breiten je Seltenheit (einmal pro Angriff gewürfelt, SPEC §2.1).
- [ ] **Multi-Hit-Werte:** _Multi Hit Damage_ als Anteil des rohen Grundschadens, _Multi Hit
      Chance_ und die Chain-Stufen. Chance und Chain multiplizieren sich (SPEC §3.2) — die
      Erwartungswerte über den Zweig hinweg durchrechnen, damit ein voll ausgebautes Tempest
      nicht die anderen drei Zweige entwertet.
- [ ] **Grundtakt und 2×** (SPEC §5.1): 1000 ms pro Akteur ist als Lesegeschwindigkeit gesetzt,
      aber der klassische Playtest-Regler — gegen die Dauer eines 20-Floor-Runs prüfen.
- [ ] **Item-Level-Kurve (Cap +100):** Innate-Value je `+n` (Might exp., Toughness/Vitality/Initiative
      linear?), Verteilung der 100 Stufen.
- [ ] **Cinder-Ökonomie (vollständig durchrechnen):** Refine-Kette **1/3/6/10** gegen den Gesamt-Sink
      (18 Slots × 20 = **360** + Brand + Re-Brand). Elite-Cinder-Drop-Chance als **monoton mit
      globaler Floor-Tiefe** steigende Kurve (kein Akt-Reset; Boss stets 100 %/Kill) plus die
      **Erhöhung in Akt 2 & 3**. Brand- und Re-Brand-Kosten festlegen.
- [ ] **Item-Level-Caps je Seltenheit** (+20/+40/+60/+80/+100) und **Sockel-Zahlen** (0/1/2/3/4)
      gegen die Temper-Gold-Kurve prüfen: Liegen die Landmarken (20/40/50/60/80/100) angenehm im
      Spielverlauf, oder verschiebt die Exponentialkurve die späten Stufen zu weit nach hinten?
- [ ] **Sigils:** Pool-Größe (< 18), **Mindesttiefen** je Sigil, Drop-Chance je Encounter-Typ,
      **Gewicht unbekannter Sigils** im Wurf, **Level-Skalierung des Implicits** (1→5).
- [ ] **Gem-Value-Ranges** je Pool-Affix + Range-Anhebung pro Gem-Level (relative Position bleibt).
- [ ] **Gem-Targeting:** Amber (4 Chance), Ruby (4 Damage) und Sapphire (4 Defensive) → je 25 %
      Chance auf den Ziel-Stat beim Sockeln, Emerald (3 Core) → 33 %; Reroll-Kosten (Gold) so tunen,
      dass Ziel-Treffer erschwinglich bleibt.
- [ ] **Gem-Drop-Raten** & Aufleveln-Fodder-Kurve (Grind-Wall-Vermeidung); Diamond-Drop-Rate.
- [ ] **Prismatic/Diamond-Effekte** (Meta-Multiplikatoren) + **Glass-Cannon-Check** (Attack-exp
      vs. Defense-linear; nötigenfalls Sockel-Typ-Split oder Gegner-Accuracy-Kurve als Sicherheitsgurt).
- [ ] **Blacksmith/Jeweler-Gold-Kosten** (Temper, Refine, Brand, Inlay, Recut, Attune) — Refine und
      Brand zusätzlich in **Cinder**.
- [ ] **Runen-Katalog** (SPEC §4.6): 17 Einträge (6 Trigger / 6 Effect / 5 Modifier) mit
      **Mindesttiefe** und **Level-Skalierung** je Stufe; Dauer-Werte für Empower/Mark/Lingering,
      Chain-Zielzahl je Modifier-Level, Bezugs-Stat von Surge.
- [ ] **Rune-Wirkstärke gegen die Zahlen-Achsen:** Da ein Rite **max. 1×/Runde** auslöst, muss die
      Magnitude **prozentual/skalierend** sein, damit Runen im Late-Game nicht verpuffen — ohne dass
      sie die Gem-Achse als Endgame-Min-Max verdrängen.
- [ ] **Runedust:** Drop-Kurve je Encounter-Typ ab der Freischalttiefe, **Inscribe**-Kosten je
      Kategorie und **Etch**-Kostenkurve (Level 1→5).
- [ ] **Trigger-Verlässlichkeit:** Alle sechs Trigger hängen an einer Chance (`OnCrit`,
      `OnMultiHit`, `OnSplash`, `OnCounter` an Offensiv-Stats; `OnBlock`, `OnEvade` an
      Defensiv-Stats) — es gibt keinen deterministischen. Die Auslöse-Häufigkeiten so gegeneinander
      abwägen, dass kein Trigger unabhängig vom Build die beste Wahl ist.

---

## Verweise

- Formel-Struktur → [SPEC.md](SPEC.md)
- Vision & Pillars → [DESIGN.md](DESIGN.md)
- Begriffe → [GLOSSARY.md](GLOSSARY.md)
- Content-Konvention (`src/game/`) → [../AGENTS.md](../AGENTS.md) §4
