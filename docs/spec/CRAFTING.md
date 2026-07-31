# SPEC — Ausrüstung, Loot & Handwerk (§4.5)

> Teil der [SPEC](../SPEC.md). Verbindliche Regeln für den Kern-Loop aus Item-Level,
> Seltenheit, Sockeln, Gems, Sigils und den Handwerks-Stationen.
> Diese Datei ist der **Wohnort** der Drop-Regeln für **Gems, Cinder und Sigils** sowie
> aller **Blacksmith-** und **Jeweler-Aktionen**.
> Verwandt: [Ausrüstung am Charakter (§3.4)](CHARACTERS.md#34-ausrüstung) ·
> [Fortschritt & Belohnungen](PROGRESSION.md)

---

## 4.5 Ausrüstung, Loot & Handwerk (Kern-Loop)

Der Ausbau der Ausrüstung ist der **Hauptmotor** des Fortschritts
([BALANCING §3](../BALANCING.md)). Er folgt einem
**Stamm-Modell**: das **Item-Level** ist der Stamm, an dem drei Äste hängen.

| Ebene                  | Träger am Item ([§3.4](CHARACTERS.md#34-ausrüstung)) | Station               | Kosten            | Zufall    |
| ---------------------- | ---------------------------------------------------- | --------------------- | ----------------- | --------- |
| **Stamm: Basis-Power** | Item-Level (`+n`) → Innate                           | **Blacksmith** Temper | Gold              | keiner    |
| **Ast: Kapazität**     | Seltenheit → Sockelzahl, Gem-Cap, Level-Cap          | **Blacksmith** Refine | Cinder + Gold     | keiner    |
| **Ast: Identität**     | Implicit aus einem **Sigil**                         | **Blacksmith** Brand  | Cinder + Gold     | keiner    |
| **Ast: Min-Max**       | Sockel + **Gems**                                    | **Jeweler**           | Gold + Gem-Fodder | seed-PRNG |

Alle Handwerks-Aktionen kosten **Gold**; **Refine** und **Brand** zusätzlich **Cinder**. Der einzige
Zufall im Handwerk liegt beim **Jeweler** — die drei Blacksmith-Aktionen sind vollständig planbar.

### Seltenheit, Sockel & Level-Cap

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
  ([BALANCING §4](../BALANCING.md)).
- Ein frisch freigeschalteter Slot startet als **`Common +1` ohne Sockel**; der erste Sockel
  entsteht mit dem ersten **Refine**.
- Landmarken auf einem Item (abgeleitet aus der Tabelle oben und der Prismatic-Formel unten):

  ```
  +20 → Magic (1. Sockel)      +60 → Epic (3. Sockel)
  +40 → Rare  (2. Sockel)      +80 → Legendary (4. Sockel)
  +50 → Prismatic-Sockel 1    +100 → Prismatic-Sockel 2
  ```

### Prismatic-Sockel

- `Prismatic-Sockel = floor(Item-Level / 50)` → einer bei **`+50`**, ein zweiter bei **`+100`**.
- Nimmt ausschließlich **Diamond**-Gems auf (item-lokale Meta-Multiplikatoren, siehe Jeweler).
- Unabhängig von Seltenheit und Brand.

### Sigils & Sigil Codex

- Ein **Sigil** ist ein Eintrag im **Sigil Codex** mit **Level 1–5** — ein binärer Wissensstand plus
  Level, **kein Bestand und kein Inventar**. Jedes Sigil trägt eine **vordefinierte
  Implicit-Identität**, eine **Mindesttiefe** und eine **Slot(-Typ)-Bindung**.
- Das **Implicit** kommt per **Brand** (siehe Blacksmith) auf ein **Legendary**-Item; seine Stärke
  skaliert mit dem **Sigil-Level**.
- Jedes Sigil ist **teamweit genau einmal aktiv** und nur auf seinem gebundenen **Slot(-Typ)**
  einsetzbar. Die **Pool-Größe liegt unter 18** (Zahl der Slots) → es tragen nie alle Slots ein Sigil.

### Drops: Gems, Cinder & Sigils

Verbindlicher Wohnort der Drop-Regeln dieser drei Ressourcen. Was ein Sieg **sonst** noch
ausschüttet (XP, Gold, Crystals), steht in
[§4.2](PROGRESSION.md#42-belohnungen-aus-einem-sieg); **Runedust** in
[§4.6](RUNES.md#46-runen-endgame--masterwork).

| Ressource                              | Quelle               | Bedingung                                                                                                                            |
| -------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Gems** (Amber/Ruby/Sapphire/Emerald) | alle Gegner          | Hauptdrop, nach Floor-Tiefe (Akt/Dungeon/Floor) gestaffelt                                                                           |
| **Diamond**                            | Elite & Boss         | **ab Akt 2**                                                                                                                         |
| **Cinder**                             | Boss                 | **garantiert 1 pro Kill** (100 %, jeder Durchlauf)                                                                                   |
| **Cinder**                             | Elite (Dungeons 1–4) | Bonus mit einer Chance, die **monoton mit der globalen Floor-Tiefe** steigt (kein Akt-Reset); Ausschüttung steigt in Akt 2 und Akt 3 |
| **Sigils**                             | Elite & Boss         | ab dem ersten Elite-Floor `A1-D1-20`; der **erste Sigil-Drop eines Spielstands ist garantiert**                                      |

- **Sigil-Pool:** **Elite-Gegner** würfeln aus einem **tiefen-gestaffelten Pool** — ein Sigil ist
  erst ab seiner **Mindesttiefe** ziehbar, der Pool wächst also mit dem Fortschritt.
  **Jeder Akt-Boss** droppt beim **ersten Kill** garantiert sein **festes, namentliches
  Signatur-Sigil**; bei Wiederholungen würfelt er wie ein Elite aus dem **obersten Tier** —
  inklusive des eigenen Signatur-Sigils als Level-Up-Kandidat.
- **Sigil-Drop-Fortschritt:** ein **unbekanntes** Sigil wird auf **Level 1** in den Sigil Codex
  eingeschrieben, ein **bekanntes** um **+1 Level** gehoben. **Unbekannte Sigils sind im Wurf höher
  gewichtet** (Gewicht = Balancing). **Ein Sigil auf Level 5 verlässt den Drop-Pool**; sind alle
  Sigils auf Level 5, droppen keine Sigils mehr.
- **Item-Basen droppen nicht** — sie entstehen beim Freischalten des Slots
  ([§3.4](CHARACTERS.md#34-ausrüstung)).
- Aller Loot-Zufall läuft über den **`loot`-Strom** des seedbaren PRNG
  ([§2.5](COMBAT.md#25-feststehende-regeln), [§5.3](SIMULATION.md#53-seeds-und-zufalls-ströme)).

### Blacksmith — Temper, Refine & Brand

Verbindlicher Wohnort der drei Blacksmith-Aktionen. Alle drei sind **RNG-frei**.

- **Temper (Item-Level):** hebt das **Item-Level** um eine Stufe bis zum **Seltenheits-Cap** →
  skaliert den **Innate-Value** ([§3.4](CHARACTERS.md#34-ausrüstung)). Kosten: **Gold**.
- **Refine (Seltenheit):** hebt die **Seltenheit** um eine Stufe → +1 Sockel, höheres Gem-Cap,
  höheres Item-Level-Cap. Kosten: **Cinder** nach der Seltenheits-Tabelle oben (konkrete Werte =
  Balancing) plus **Gold**.
- **Brand (Implicit):** überträgt das Implicit eines bekannten **Sigils** auf ein **Legendary**-Item.
  Kosten: **Cinder** plus **Gold**.
  - **Re-Brand** überschreibt einen bestehenden Brand und kostet **deutlich weniger** als der
    Erst-Brand (Kostenziel: [BALANCING §4](../BALANCING.md)).

### Jeweler — Inlay, Attune & Recut

Verbindlicher Wohnort der Gem-Aktionen und der Gem-Farb-Pools. Hier liegt der **einzige Zufall
im Handwerk**.

- **Inlay:** verbraucht **1 Gem** der Farbe aus dem **Bestand** (Ressourcen-Zähler, kein Inventar)
  und setzt ihn in einen Sockel; dabei wird ein **zufälliger Affix** aus dem **Farb-Pool** gerollt,
  mit einer **Value-Range** — der konkrete Wert fällt beim **Inlay** (seed-PRNG). Ein bereits belegter
  Sockel wird **überschrieben** (der alte, gebundene Gem ist **verloren**,
  [§3.4](CHARACTERS.md#34-ausrüstung)).
- **Attune** (Gem aufleveln, im Sockel, **gedeckelt durch die Item-Seltenheit**): hebt die **Value-Range**; die
  **relative Position** in der vorherigen Range bleibt erhalten. Kostet **Gems gleicher
  Farbe** als Fodder — **jedes Level braucht mehr** (→ Fodder-Sink).
- **Recut (Value-Reroll):** würfelt den Wert eines gesockelten Gems innerhalb seiner aktuellen
  Range neu (seed-PRNG).
- **Gem-Farben** — Farb-Pools entlang der Stat-Kategorien ([§3.0](CHARACTERS.md#30-stats)), die
  Offensiv-Pools getrennt in **Chance** (Amber) und **Damage** (Ruby). Design-Absicht dieser
  Trennung: [DESIGN §3.2](../DESIGN.md).

  | Gem                 | Kategorie          | Pool                                                                                         | Sockel                 |
  | ------------------- | ------------------ | -------------------------------------------------------------------------------------------- | ---------------------- |
  | **Amber** (Gold)    | Offensive – Chance | Crit/Multi/Splash/Counter **Chance** (4)                                                     | normal                 |
  | **Ruby** (Rot)      | Offensive – Damage | Crit/Multi/Splash/Counter **Damage** (4)                                                     | normal                 |
  | **Sapphire** (Cyan) | Defensive          | Barrier, Block Chance, Evasion, Regeneration (4)                                             | normal                 |
  | **Emerald** (Grün)  | Core               | Might, Toughness, Vitality (3)                                                               | normal                 |
  | **Diamond** (Weiß)  | Prismatic          | item-lokale **Meta-Multiplikatoren** (z. B. _+X % all gem effects_, _+Y % Sapphire-Effekte_) | **nur Prismatic-Slot** |

- **Amber, Ruby, Sapphire & Emerald** sind die regulär gefarmten Fodder-Farben; **Diamond** ist der
  seltene Elite/Boss-Chase (Drop-Bedingungen: Tabelle oben).
- **Ohne Gem-Quelle:** die **Derived Stats** (Attack/Defense/Health — sie ergeben sich aus
  Core/Attribut/Baseline, [§3.0](CHARACTERS.md#30-stats)), **Multi Hit Chain** und **Splash
  Radius** (Skilltree) sowie **Initiative** (Innate Feet + Crucible).
- Konkrete Pool-Gewichte, Value-Ranges, Aufleveln-Kosten und Diamond-Effekte = Balancing
  (`src/game/`, [BALANCING §4](../BALANCING.md)).

### Noch offen (bewusst separate Interview-Runde — Endgame/Masterwork)

- **Prismatic/Diamond-Effekte im Detail** (welche Meta-Multiplikatoren, Node-artige Sammlung).
- **Sigil-Katalog:** konkrete Sigils (Namen, Implicit-Identitäten, Mindesttiefe, Slot-Bindung,
  Level-Skalierung des Implicits) sowie die drei namentlichen **Boss-Signatur-Sigils**.
- **Implicit-Abgrenzung:** welche Effekt-Klassen ein Implicit trägt, die kein Gem-Affix liefert.
