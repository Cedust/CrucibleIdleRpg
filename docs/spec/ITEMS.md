# SPEC — Items, Loot & Handwerk

> Teil der [SPEC](../SPEC.md): Slots, Item-Anatomie, Seltenheit, Sockel, Gems, Sigils und die
> Handwerks-Stationen. **Wohnort aller item-bezogenen Regeln.**
> Verwandt: [Team & Charaktere](CHARACTERS.md) · [Fortschritt & Belohnungen](PROGRESSION.md)

Der Ausbau der Ausrüstung ist der **Hauptmotor** des Fortschritts
([BALANCING §3](../BALANCING.md#3-wachstumsquellen-woher-die-zahlen-kommen)).

---

## 1. Slots, Basen & Innate-Affixe

- Jeder Charakter trägt Ausrüstung in **sechs Slots** ([Ausrüstung](CHARACTERS.md#6-ausrüstung)).
  Ein Slot wird über den Crucible (Anvil Sparks,
  [Crucible](PROGRESSION.md#3-crucible-globaler-skilltree)) gegen Crystals freigeschaltet;
  dabei entsteht die rollenspezifische **Basis** als `Common +1` und bleibt dem Slot für das
  ganze Spiel erhalten. **Item-Basen droppen nicht.**
- **Ausnahme — die Main Hand ist bei allen drei Charakteren ab Spielstart freigeschaltet**
  (ebenfalls als `Common +1`). Ohne Waffe gäbe es keine Damage-Range und damit keinen
  definierten Grundschaden ([Charakter-Zug](COMBAT.md#21-charakter-zug-ausgehender-schaden)); ein
  Sonderfall für unbewaffnete Charaktere entfällt so.
  Die übrigen fünf Slots sowie Blacksmith und Jeweler sind Anvil-Sparks-Unlocks.
- Jeder Slot hat einen **Innate-Affix** — einen festen Basis-Stat, der mit dem **Item-Level**
  skaliert ([§2](#2-item-anatomie-fünf-schichten)):

  | Slot          | Item-Typ (rollenspezifisch)                                           | Innate-Affix                          |
  | ------------- | --------------------------------------------------------------------- | ------------------------------------- |
  | **Main Hand** | Waffe (alle Charaktere) — trägt **Damage-Range**                      | **Might**                             |
  | **Off Hand**  | Rhaya/Quinn: Dolch/Köcher → **Might**; Korvin: Schild → **Toughness** | **Might** (DD) / **Toughness** (Tank) |
  | **Head**      | Helm                                                                  | **Vitality**                          |
  | **Chest**     | Rüstung                                                               | **Toughness**                         |
  | **Legs**      | Beinschutz                                                            | **Toughness**                         |
  | **Feet**      | Schuhe                                                                | **Initiative**                        |

- Item-Typen sind **rollenspezifisch** (Schild nur Korvin usw.); die getragenen **Stats bleiben
  universell** (kein charakterexklusiver Stat, [Team](CHARACTERS.md#1-team)).
- Waffen haben zusätzlich eine prozentuale **Damage-Range**, die den Grundschaden moduliert
  ([Charakter-Zug](COMBAT.md#21-charakter-zug-ausgehender-schaden)).

## 2. Item-Anatomie (fünf Schichten)

Jedes Item trägt seine Werte auf fünf getrennten Schichten. Schicht 1 steht mit dem Slot fest
([§1](#1-slots-basen--innate-affixe)), die Schichten 2–5 sind der Handwerk-Loop und unten
verbindlich beschrieben. Es gilt ein **Stamm-Modell**: das **Item-Level** ist der Stamm, an dem
die drei übrigen Handwerks-Schichten hängen.

| #   | Schicht                 | Was sie trägt                                | Rolle im Stamm-Modell  | Entsteht durch         | Kosten            | Zufall    |
| --- | ----------------------- | -------------------------------------------- | ---------------------- | ---------------------- | ----------------- | --------- |
| 1   | **Basis**               | Item-Typ + Slot, **Innate-Affix**            | —                      | Freischalten des Slots | Crystals          | keiner    |
| 2   | **Item-Level** (`+n`)   | skaliert den **Innate-Value**                | **Stamm: Basis-Power** | **Blacksmith** Temper  | Gold              | keiner    |
| 3   | **Seltenheit**          | Sockelzahl, Gem-Level-Cap, Item-Level-Cap    | **Ast: Kapazität**     | **Blacksmith** Refine  | Cinder + Gold     | keiner    |
| 4   | **Gems in den Sockeln** | je ein gerollter Affix mit Value             | **Ast: Min-Max**       | **Jeweler**            | Gold + Gem-Fodder | seed-PRNG |
| 5   | **Implicit**            | Affix eines **Sigils**, den kein Gem liefert | **Ast: Identität**     | **Blacksmith** Brand   | Cinder + Gold     | keiner    |

- **Schicht 2 ist die exponentielle Basis-Power** und der **planbare** Träger der
  Incremental-Kurve — das persistente Item „wächst mit".
- **Schicht 4 ist die Min-Max-Achse** und damit die eigentliche Loot-Jagd: Der Affix eines
  Gems wird beim Einsetzen gewürfelt.
- Alle Handwerks-Aktionen kosten Gold; Refine und Brand zusätzlich Cinder. Der
  **einzige Zufall im Handwerk** liegt beim Jeweler — die drei Blacksmith-Aktionen sind
  vollständig planbar.

## 3. Seltenheit, Sockel & Level-Cap

Die **Seltenheit** (EN: _Rarity_) ist der **Master-Regler** eines Items und bestimmt drei Dinge:
**Sockelzahl**, **Gem-Level-Cap** (siehe Jeweler) und **Item-Level-Cap**.

| Seltenheit    | Normale Sockel | Item-Level-Cap | Cinder für den Refine **auf** diese Stufe |
| ------------- | -------------- | -------------- | ----------------------------------------- |
| **Common**    | 0              | **+20**        | — (Startzustand)                          |
| **Magic**     | 1              | **+40**        | 1                                         |
| **Rare**      | 2              | **+60**        | 3                                         |
| **Epic**      | 3              | **+80**        | 6                                         |
| **Legendary** | 4              | **+100**       | 10                                        |

- Die Seltenheit deckelt das Item-Level **nach oben**. Gehoben wird sie per **Refine**
  (siehe Blacksmith); ein Refine ist **jederzeit** möglich, sobald Cinder vorhanden ist — es gibt
  **keine Mindestlevel-Regel**. Der Rhythmus entsteht allein aus der Cinder-Knappheit
  ([BALANCING §4](../BALANCING.md#4-ökonomie-anker)).
- Ein frisch freigeschalteter Slot startet als **`Common +1` ohne Sockel**; der erste Sockel
  entsteht mit dem ersten **Refine**.
- Landmarken auf einem Item (abgeleitet aus der Tabelle oben und der Prismatic-Formel unten):

  ```
  +20 → Magic (1. Sockel)      +60 → Epic (3. Sockel)
  +40 → Rare  (2. Sockel)      +80 → Legendary (4. Sockel)
  +50 → Prismatic-Sockel 1    +100 → Prismatic-Sockel 2
  ```

## 4. Prismatic-Sockel

- `Prismatic-Sockel = floor(Item-Level / 50)` → einer bei **`+50`**, ein zweiter bei **`+100`**.
- Nimmt ausschließlich **Diamond**-Gems auf (item-lokale Meta-Multiplikatoren, siehe Jeweler).
- Unabhängig von Seltenheit und Brand.

## 5. Sigils & Sigil Codex

- Ein **Sigil** ist ein Eintrag im **Sigil Codex** mit Level 1–5 — ein binärer Wissensstand plus
  Level, **kein Bestand und kein Inventar**. Jedes Sigil trägt eine vordefinierte
  Implicit-Identität, eine **Mindesttiefe** und eine **Slot(-Typ)-Bindung**.
- Das **Implicit** kommt per Brand (siehe Blacksmith) auf ein **Legendary**-Item; seine Stärke
  skaliert mit dem Sigil-Level.
- Jedes Sigil ist **teamweit genau einmal aktiv** und nur auf seinem gebundenen Slot(-Typ)
  einsetzbar. Die **Pool-Größe liegt unter 18** (Zahl der Slots) → es tragen nie alle Slots ein Sigil.

## 6. Drops: Gems, Cinder & Sigils

Verbindlicher Wohnort der Drop-Regeln dieser drei Ressourcen. Was ein Sieg **sonst** noch
ausschüttet (XP, Gold, Crystals), steht in
[Belohnungen aus einem Sieg](PROGRESSION.md#2-belohnungen-aus-einem-sieg); **Runedust** in
[Runedust (Drop)](RUNES.md#6-runedust-drop).

| Ressource                              | Quelle               | Bedingung                                                                                                                            |
| -------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Gems** (Amber/Ruby/Sapphire/Emerald) | alle Gegner          | Hauptdrop, nach Floor-Tiefe (Akt/Dungeon/Floor) gestaffelt                                                                           |
| **Diamond**                            | Elite & Boss         | **ab Akt 2**                                                                                                                         |
| **Cinder**                             | Boss                 | **garantiert 1 pro Kill** (100 %, jeder Durchlauf)                                                                                   |
| **Cinder**                             | Elite (Dungeons 1–4) | Bonus mit einer Chance, die **monoton mit der globalen Floor-Tiefe** steigt (kein Akt-Reset); Ausschüttung steigt in Akt 2 und Akt 3 |
| **Sigils**                             | Elite & Boss         | ab dem ersten Elite-Floor `A1-D1-20`; der **erste Sigil-Drop eines Spielstands ist garantiert**                                      |

- **Sigil-Pool:** Elite-Gegner würfeln aus einem **tiefen-gestaffelten Pool** — ein Sigil ist
  erst ab seiner **Mindesttiefe** ziehbar, der Pool wächst also mit dem Fortschritt.
  Jeder Akt-Boss droppt beim **ersten Kill** garantiert sein festes, namentliches
  Signatur-Sigil; bei Wiederholungen würfelt er wie ein Elite aus dem **obersten Tier** —
  inklusive des eigenen Signatur-Sigils als Level-Up-Kandidat.
- **Sigil-Drop-Fortschritt:** ein **unbekanntes** Sigil wird auf Level 1 in den Sigil Codex
  eingeschrieben, ein **bekanntes** um +1 Level gehoben. Unbekannte Sigils sind im Wurf höher
  gewichtet (Gewicht = Balancing). **Ein Sigil auf Level 5 verlässt den Drop-Pool**; sind alle
  Sigils auf Level 5, droppen keine Sigils mehr.
- Aller Loot-Zufall läuft über den **`loot`-Strom** des seedbaren PRNG
  ([Feststehende Regeln](COMBAT.md#25-feststehende-regeln),
  [Seeds und Zufalls-Ströme](SIMULATION.md#4-seeds-und-zufalls-ströme)).

## 7. Blacksmith — Temper, Refine & Brand

Verbindlicher Wohnort der drei Blacksmith-Aktionen. Alle drei sind **RNG-frei**.

- **Temper (Item-Level):** hebt das **Item-Level** um eine Stufe bis zum **Seltenheits-Cap** →
  skaliert den **Innate-Value** ([§1](#1-slots-basen--innate-affixe)). Kosten: Gold.
- **Refine (Seltenheit):** hebt die **Seltenheit** um eine Stufe → +1 Sockel, höheres Gem-Cap,
  höheres Item-Level-Cap. Kosten: **Cinder** nach der Seltenheits-Tabelle oben (konkrete Werte =
  Balancing) plus **Gold**.
- **Brand (Implicit):** überträgt das Implicit eines bekannten **Sigils** auf ein **Legendary**-Item.
  Kosten: **Cinder** plus **Gold**.
  - **Re-Brand** überschreibt einen bestehenden Brand und kostet **deutlich weniger** als der
    Erst-Brand (Kostenziel: [BALANCING §4](../BALANCING.md#4-ökonomie-anker)).

## 8. Jeweler — Inlay, Attune & Recut

Verbindlicher Wohnort der Gem-Aktionen und der Gem-Farb-Pools. Hier liegt der **einzige Zufall
im Handwerk**.

- **Gems sind am Item gebunden:** Ein gesockelter (und im Sockel gelevelter) Gem bleibt im Item —
  auch bei Nichtbenutzung „friert" er dort ein (kein Verlust). Nur aktives Ersetzen zerstört ihn.
- **Inlay:** verbraucht 1 Gem der Farbe aus dem Bestand (Ressourcen-Zähler, kein Inventar)
  und setzt ihn in einen Sockel; dabei wird ein **zufälliger Affix** aus dem Farb-Pool gerollt,
  mit einer **Value-Range** — der konkrete Wert fällt beim Inlay (seed-PRNG). Ein bereits belegter
  Sockel wird **überschrieben** (der alte, gebundene Gem ist verloren).
- **Attune** (Gem aufleveln, im Sockel, **gedeckelt durch die Item-Seltenheit**): hebt die
  Value-Range; die **relative Position** in der vorherigen Range bleibt erhalten. Kostet Gems
  gleicher Farbe als Fodder — **jedes Level braucht mehr** (→ Fodder-Sink).
- **Recut (Value-Reroll):** würfelt den Wert eines gesockelten Gems innerhalb seiner aktuellen
  Range neu (seed-PRNG).
- **Gem-Farben** — Farb-Pools entlang der Stat-Kategorien ([Stats](CHARACTERS.md#2-stats)), die
  Offensiv-Pools getrennt in **Chance** (Amber) und **Damage** (Ruby). Design-Absicht dieser
  Trennung: [DESIGN §3.2](../DESIGN.md#32-build-entscheidungen-die-sich-unterscheiden-sollen).

  | Gem                 | Kategorie          | Pool                                                                                         | Sockel                 |
  | ------------------- | ------------------ | -------------------------------------------------------------------------------------------- | ---------------------- |
  | **Amber** (Gold)    | Offensive – Chance | Crit/Multi/Splash/Counter **Chance** (4)                                                     | normal                 |
  | **Ruby** (Rot)      | Offensive – Damage | Crit/Multi/Splash/Counter **Damage** (4)                                                     | normal                 |
  | **Sapphire** (Blau) | Defensive          | Barrier, Block Chance, Evasion, Regeneration (4)                                             | normal                 |
  | **Emerald** (Grün)  | Core               | Might, Toughness, Vitality (3)                                                               | normal                 |
  | **Diamond** (Weiß)  | Prismatic          | item-lokale **Meta-Multiplikatoren** (z. B. _+X % all gem effects_, _+Y % Sapphire-Effekte_) | **nur Prismatic-Slot** |

- **Amber, Ruby, Sapphire & Emerald** sind die regulär gefarmten Fodder-Farben; **Diamond** ist der
  seltene Elite/Boss-Chase (Drop-Bedingungen: [§6](#6-drops-gems-cinder--sigils)).
- **Ohne Gem-Quelle:** die **Derived Stats** (Attack/Defense/Health — sie ergeben sich aus
  Core/Attribut/Baseline, [Stats](CHARACTERS.md#2-stats)), **Multi Hit Chain**, **Multi Hit Chain
  Factor** und **Splash Radius** (Skilltree) sowie **Initiative** (Innate Feet + Crucible).
- Konkrete Pool-Gewichte, Value-Ranges, Aufleveln-Kosten und Diamond-Effekte = Balancing
  (`src/game/`, [BALANCING §4](../BALANCING.md#4-ökonomie-anker)).

<!-- TODO (Spec): Prismatic/Diamond-Effekte, Sigil-Katalog und Implicit-Abgrenzung —
     siehe docs/backlog/OPEN_ISSUES.md, Abschnitt „Offene Spec-Punkte". -->
