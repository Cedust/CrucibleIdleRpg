# SPEC — Items, Loot & Handwerk

> Teil der [SPEC](../spec/README.md): Slots, Item-Anatomie, Seltenheit, Sockel, Gems, Sigils und die
> Handwerks-Stationen. **Wohnort aller item-bezogenen Regeln.**
> Verwandt: [Team & Charaktere](CHARACTERS.md) · [Fortschritt & Belohnungen](PROGRESSION.md)

Der Ausbau der Armor ist eine dauerhafte Progressionsachse neben Attributen, Weapon Mastery und
Crucible ([BALANCING §3](../spec/BALANCE.md#1-wachstum-und-zahlenraum)).

---

## 1. Slots, Basen & Innate-Affixe

- Jeder Charakter trägt Armor in **vier Slots** ([Ausrüstung](CHARACTERS.md#6-ausrüstung)).
  Ein Slot wird über den Crucible (Anvil Sparks,
  [Crucible](PROGRESSION.md#3-crucible-globaler-skilltree)) gegen Relic Shards freigeschaltet;
  dabei entsteht die rollenspezifische **Basis** als `Common +1` und bleibt dem Slot für das
  ganze Spiel erhalten. **Item-Basen droppen nicht.**
- Main Hand und Off Hand existieren nicht. Die permanenten Signaturwaffen sind keine Items und
  besitzen weder die fünf Item-Schichten noch Handwerks-Interaktionen
  ([Weapon Mastery](WEAPON-MASTERY.md#1-grundmodell-und-abgrenzung)).
- Alle vier Armor-Slots sowie Blacksmith und Jeweler sind Anvil-Sparks-Unlocks.
- Jeder Slot hat einen **Innate-Affix** — einen festen Basis-Stat, der mit dem **Item-Level**
  skaliert ([§2](#2-item-anatomie-fünf-schichten)):

  | Slot      | Item-Typ   | Innate-Affix   |
  | --------- | ---------- | -------------- |
  | **Head**  | Helm       | **Vitality**   |
  | **Chest** | Rüstung    | **Toughness**  |
  | **Legs**  | Beinschutz | **Toughness**  |
  | **Feet**  | Schuhe     | **Initiative** |

- Die getragenen Stats bleiben universell (kein charakterexklusiver Stat,
  [Team](CHARACTERS.md#1-team)). Might besitzt keinen festen Armor-Innate und stammt aus
  Emerald-Gems.

## 2. Item-Anatomie (fünf Schichten)

Jedes Item trägt seine Werte auf fünf getrennten Schichten. Schicht 1 steht mit dem Slot fest
([§1](#1-slots-basen--innate-affixe)), die Schichten 2–5 sind der Handwerk-Loop und unten
verbindlich beschrieben. Es gilt ein **Stamm-Modell**: das **Item-Level** ist der Stamm, an dem
die drei übrigen Handwerks-Schichten hängen.

| #   | Schicht                 | Was sie trägt                                | Rolle im Stamm-Modell  | Entsteht durch            | Kosten            | Zufall    |
| --- | ----------------------- | -------------------------------------------- | ---------------------- | ------------------------- | ----------------- | --------- |
| 1   | **Basis**               | Item-Typ + Slot, **Innate-Affix**            | —                      | Freischalten des Slots    | Relic Shards      | keiner    |
| 2   | **Item-Level** (`+n`)   | skaliert den **Innate-Value**                | **Stamm: Basis-Power** | **Blacksmith** Temper     | Gold              | keiner    |
| 3   | **Seltenheit**          | Sockelzahl, Gem-Level-Cap, Item-Level-Cap    | **Ast: Kapazität**     | **Blacksmith** Masterwork | Cinder + Gold     | keiner    |
| 4   | **Gems in den Sockeln** | je ein gerollter Affix mit Value             | **Ast: Min-Max**       | **Jeweler**               | Gold + Gem-Fodder | seed-PRNG |
| 5   | **Imprint**             | Affix eines **Sigils**, den kein Gem liefert | **Ast: Identität**     | **Blacksmith** Brand      | Cinder + Gold     | keiner    |

- **Schicht 2 ist die geometrisch wachsende Basis-Power** und der **planbare** Träger der
  Progressions-Kurve — das persistente Item „wächst mit".
- **Schicht 4 ist die Min-Max-Achse** und damit die eigentliche Loot-Jagd: Der Affix eines
  Gems wird beim Einsetzen gewürfelt.
- **Schicht 5 ist die Identitäts-Achse:** Ein Imprint verstärkt einen Gem-Stat prozentual oder
  hebt einen gem-freien Stat ([§5](#5-sigils--sigil-codex)).
- Alle Handwerks-Aktionen kosten Gold; Masterwork und Brand zusätzlich Cinder. Der
  **einzige Zufall im Handwerk** liegt beim Jeweler — die drei Blacksmith-Aktionen sind
  vollständig planbar.

## 3. Seltenheit, Sockel & Level-Cap

Die **Seltenheit** (EN: _Rarity_) ist der **Master-Regler** eines Armor-Items und bestimmt drei Dinge:
**Sockelzahl**, **Gem-Level-Cap** (siehe Jeweler) und **Item-Level-Cap**.

Weapon Mastery Ranks sind keine Seltenheit; Waffen verwenden diese Tabelle nicht.

| Seltenheit    | Normale Sockel | Item-Level-Cap | Cinder für das Masterwork **auf** diese Stufe |
| ------------- | -------------- | -------------- | --------------------------------------------- |
| **Common**    | 0              | **+20**        | — (Startzustand)                              |
| **Magic**     | 1              | **+40**        | 1                                             |
| **Rare**      | 2              | **+60**        | 3                                             |
| **Epic**      | 3              | **+80**        | 6                                             |
| **Legendary** | 4              | **+100**       | 10                                            |

- Die Seltenheit deckelt das Item-Level **nach oben**. Gehoben wird sie per **Masterwork**
  (siehe Blacksmith); ein Masterwork ist **jederzeit** möglich, sobald Cinder vorhanden ist — es gibt
  **keine Mindestlevel-Regel**. Der Rhythmus entsteht allein aus der Cinder-Knappheit
  ([BALANCING §3](../BALANCING.md#3-ökonomische-absicht)).
- Ein frisch freigeschalteter Slot startet als **`Common +1` ohne Sockel**; der erste Sockel
  entsteht mit dem ersten **Masterwork**.
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
  **Imprint-Identität**, eine feste **Quelle** ([§6](#6-drops-gems-cinder--sigils)) und eine
  **Slot(-Typ)-Bindung**.
- Das **Imprint** kommt per Brand (siehe Blacksmith) auf ein Item **ab Magic**; seine Stärke
  skaliert mit dem Sigil-Level.
- Jedes Sigil ist **teamweit genau einmal aktiv** und nur auf seinem gebundenen Slot(-Typ)
  einsetzbar. Der Katalog umfasst **18 Sigils** bei **12 Armor-Slots** (4 Slots × 3 Charaktere) →
  ein Teil des Katalogs bleibt dauerhaft inaktiv, die Auswahl ist die Entscheidung des Spielers.
- **Ein Imprint verstärkt einen Stat, den ein Gem liefert, ausschließlich prozentual.** Gem-freie
  Stats ([§8](#8-jeweler--inlay-attune--recut)) hebt ein Imprint auch flach. Damit bleiben Gems
  die Quelle der Werte und Imprints deren Multiplikator.
- **Anzeige:** Im Sigil Codex und im Drop trägt ein Sigil das Präfix `Sigil of`. Als Imprint auf
  einem Item steht der Name **ohne Präfix** — das Item trägt das Imprint, nicht das Sigil.
- **Verdeckte Codex-Einträge zeigen nur einen Platzhalter:** Der Spieler sieht, wie viele Sigils
  ein Akt umfasst. Die Ansicht rendert die Einträge **freigeschalteter Akte**.

### 5.1 Katalog

Alle 18 Sigils. Die **Quelle** ist der Floor, der genau dieses Sigil droppt; `A?-D5-20` ist der
Akt-Boss. Konkrete Imprint-Werte je Sigil-Level = Balancing (`src/game/sigils/`).

| Quelle     | `Sigil of …`               | Imprint                                              | Slot-Bindung      |
| ---------- | -------------------------- | ---------------------------------------------------- | ----------------- |
| `A1-D1-20` | **Tempered Edge**          | `%` Weapon Base Damage                               | Chest, Legs       |
| `A1-D2-20` | **Kindled Blood**          | `%` Regeneration                                     | Head, Chest       |
| `A1-D3-20` | **Narrowed Fate**          | schiebt die **untere** Damage-Range-Grenze nach oben | Head, Feet        |
| `A1-D4-20` | **Forged Ward**            | `%` Barrier                                          | Chest, Legs       |
| `A1-D5-20` | **Warden's Bastion**       | `pp` Block-Reduktion                                 | Chest, Legs, Feet |
| `A2-D1-20` | **Burning Sentence**       | `%` Crit Damage                                      | Head, Chest       |
| `A2-D2-20` | **Stormchain**             | `%` Multi Hit Damage                                 | Legs, Feet        |
| `A2-D3-20` | **Molten Wake**            | `%` Splash Damage                                    | Chest, Legs       |
| `A2-D4-20` | **Answered Steel**         | `%` Counter Damage                                   | Head, Feet        |
| `A2-D5-20` | **Saint's Last Testament** | `%` Multi Hit + Splash + Counter Damage              | alle vier         |
| `A3-D1-20` | **Gilded Force**           | `%` auf den **Might**-Anteil an Attack               | Head, Chest       |
| `A3-D2-20` | **Gilded Aegis**           | `%` auf den **Toughness**-Anteil an Defense          | Chest, Legs       |
| `A3-D3-20` | **Gilded Lifeblood**       | `%` auf den **Vitality**-Anteil an Health            | Head, Legs        |
| `A3-D4-20` | **Imperial Advance**       | `%` Initiative                                       | Head, Feet        |
| `A3-D5-20` | **Empress's Ferocity**     | `%` auf die **Ferocity**-Effektivität                | Head, Chest       |
| `A3-D5-20` | **Empress's Resilience**   | `%` auf die **Resilience**-Effektivität              | Chest, Legs       |
| `A3-D5-20` | **Empress's Vigor**        | `%` auf die **Vigor**-Effektivität                   | Legs, Feet        |
| `A3-D5-20` | **Empress's Mandate**      | `%` auf alle drei Attribut-Effektivitäten            | alle vier         |

- **Slot-Bindung folgt der Anatomie:** Head = Wahrnehmung und Vorausschau, Chest = Kern und
  Deckung, Legs = Stand und Wucht, Feet = Bewegung und Reaktion. Boss-Sigils binden breiter.
- **Breitband gegen Spezialist:** Ein Ein-Kanal-Sigil ist die volle Stärke seines Kanals, die
  beiden Breitband-Sigils (`Saint's Last Testament`, `Empress's Mandate`) liefern **je Kanal einen
  Bruchteil** davon. Damit ist das breite Sigil in Summe stark und in keinem Build das Optimum
  ([BALANCING §1](../BALANCING.md#1-zielbild)).
- **`Burning Sentence` verstärkt den Bonus-Anteil:**
  `Crit Damage = 100 % + (Crit Damage − 100 %) × (1 + Imprint)`. Crit Damage ist ein
  Gesamt-Multiplikator mit Neutralpunkt 100 % ([Stats](CHARACTERS.md#2-stats)); die Formel setzt
  das Sigil damit auf denselben Neutralpunkt wie seine drei anteilsbasierten Geschwister.
- **`Warden's Bastion` hebt die Block-Reduktion**, eine globale Konstante der Schadenspipeline
  ([Eingehender Schaden](DAMAGE-SYSTEM.md#13-eingehender-schaden-schadenspipeline)) und keinen
  Gem-Stat. Wie jeder chance-artige Wert ist sie bei **100 %** gedeckelt.
- **Die Attribut-Sigils des Akt-3-Bosses** heben die Effektivität von Ferocity, Resilience und
  Vigor ([Attribute](CHARACTERS.md#3-attribute-level-up-progression)) — sie vergeben keine
  Attributpunkte.

## 6. Drops: Gems, Cinder & Sigils

Verbindlicher Wohnort der Drop-Regeln dieser drei Ressourcen. Was ein Sieg **sonst** noch
ausschüttet (XP, Gold, Relic Shards), steht in
[Belohnungen aus einem Sieg](PROGRESSION.md#2-belohnungen-aus-einem-sieg); **Runewords** in
[Runewords (Drop)](RUNES.md#6-runewords-drop).

| Ressource                              | Quelle               | Bedingung                                                                                                                            |
| -------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Gems** (Amber/Ruby/Sapphire/Emerald) | alle Gegner          | Hauptdrop, nach Floor-Tiefe (Akt/Dungeon/Floor) gestaffelt                                                                           |
| **Diamond**                            | Elite & Boss         | **ab Akt 2**                                                                                                                         |
| **Cinder**                             | Boss                 | **garantiert 1 pro Kill** (100 %, jeder Durchlauf)                                                                                   |
| **Cinder**                             | Elite (Dungeons 1–4) | Bonus mit einer Chance, die **monoton mit der globalen Floor-Tiefe** steigt (kein Akt-Reset); Ausschüttung steigt in Akt 2 und Akt 3 |
| **Sigils**                             | Elite & Boss         | ab dem ersten Elite-Floor `A1-D1-20`; jede Quelle droppt **ihr eigenes** Sigil, der **erste Kill einer Quelle ist garantiert**       |

- **Eine Quelle, ein Sigil:** Jeder Elite- und Boss-Floor ist die Quelle **genau eines** Sigils
  ([Katalog](#51-katalog)). Der **Akt-3-Boss** ist die Quelle von **vier** Sigils. Die Tiefe eines
  Sigils ist damit seine Quelle.
- **Erster Kill garantiert, danach Chance:** Der erste Sieg über eine Quelle schreibt ihr Sigil
  auf **Level 1** in den Sigil Codex. Jeder weitere Sieg hebt es mit einer **flachen Chance** um
  **+1 Level** — dieselbe Chance auf allen Leveln, ohne Pity-Zähler (Chance = Balancing).
  **Level 5 erschöpft die Quelle:** sie droppt kein Sigil mehr.
- **Akt-3-Boss:** Der erste Kill schreibt garantiert `Sigil of Empress's Mandate` ein. Jeder
  weitere Kill würfelt zuerst die Chance, dann die Auswahl unter seinen vier Sigils; **unbekannte
  Sigils sind höher gewichtet** (Gewicht = Balancing), Sigils auf Level 5 verlassen die Auswahl.
  Dies ist die einzige Stelle, an der ein Wurf zwischen mehreren Sigils wählt.
- Aller Loot-Zufall läuft über den **`loot`-Strom** des seedbaren PRNG
  ([Feststehende Regeln](DAMAGE-SYSTEM.md#15-feststehende-regeln),
  [Seeds und Zufalls-Ströme](SIMULATION.md#4-seeds-und-zufalls-ströme)); garantierte Drops sind
  RNG-frei.

## 7. Blacksmith — Temper, Masterwork & Brand

Verbindlicher Wohnort der drei Blacksmith-Aktionen. Alle drei sind **RNG-frei**.

- **Temper (Item-Level):** hebt das **Item-Level** um eine Stufe bis zum **Seltenheits-Cap** →
  skaliert den **Innate-Value** ([§1](#1-slots-basen--innate-affixe)). Kosten: Gold.
- **Masterwork (Seltenheit):** hebt die **Seltenheit** um eine Stufe → +1 Sockel, höheres Gem-Cap,
  höheres Item-Level-Cap. Kosten: **Cinder** nach der Seltenheits-Tabelle oben (konkrete Werte =
  Balancing) plus **Gold**.
- **Brand (Imprint):** überträgt das Imprint eines bekannten **Sigils** auf ein Item **ab
  Magic**-Seltenheit auf dem gebundenen Slot-Typ ([§5](#5-sigils--sigil-codex)).
  Kosten: **Cinder** plus **Gold**.
  - **Re-Brand** überschreibt einen bestehenden Brand und kostet **deutlich weniger** als der
    Erst-Brand (Kostenziel: [BALANCING §3](../BALANCING.md#3-ökonomische-absicht)).

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
  Trennung: [DESIGN §3.2](../DESIGN.md#3-player-experience--der-kern-loop).

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
  Weapon-/Startwerten, Core, Attributen und Crucible, [Stats](CHARACTERS.md#2-stats)),
  **Multi Hit Chain**, **Multi Hit Chain Factor**, **Splash Radius**, **Precision** sowie
  **Weapon Base Damage** und die **Damage Range** ([Weapon Mastery](WEAPON-MASTERY.md)) und
  **Initiative** (Innate Feet + Crucible + charakterindividuelle Weapon-Node).
- Konkrete Pool-Gewichte, Value-Ranges, Aufleveln-Kosten und Diamond-Effekte = Balancing
  (`src/game/`, [BALANCING §3](../BALANCING.md#3-ökonomische-absicht)).

<!-- TODO (Spec): Prismatic/Diamond-Effekte —
     siehe docs/backlog/OPEN_ISSUES.md, Abschnitt „Offene Spec-Punkte". -->
