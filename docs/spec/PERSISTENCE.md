# SPEC — Persistenz (Save-Verhalten)

> Teil der [SPEC](../spec/README.md): wann gespeichert wird und was im Save liegt.
> Der technische Aufbau — `localStorage`, `SavePort`-Adapter, Versionsfeld
> und Zod-Validierung beim Laden — steht in [AGENTS.md](../../AGENTS.md).
> Verwandt: [Simulation & Zeitverhalten](SIMULATION.md) · [Fortschritt & Belohnungen](PROGRESSION.md)

---

## 1. Speicher-Auslöser

- **Nach jedem Floor-Sieg** — die Belohnungen werden pro Floor committet
  ([Belohnungen aus einem Sieg](PROGRESSION.md#2-belohnungen-aus-einem-sieg)).
- **Beim Start eines Runs** — der `runCounter` muss vor dem ersten Kampf persistiert sein,
  sonst greift die Anti-Save-Scumming-Zusicherung aus
  [Seeds und Zufalls-Ströme](SIMULATION.md#4-seeds-und-zufalls-ströme) nicht.
- **Kein** Speichern des laufenden Kampfzustands
  ([Kampfzustand und Reload](SIMULATION.md#5-kampfzustand-und-reload)).

## 2. Save-Inhalt

- Global: Save-Version, `saveSeed`, `runCounter`, Playback-Geschwindigkeit
  ([Playback](SIMULATION.md#2-playback--takt-und-geschwindigkeit)).
- Pro Charakter: Level, Rest-XP, freie und verteilte Attributpunkte sowie freie Mastery Points
  und Node-Ränge jeder Weapon-Mastery-Discipline
  ([Weapon Mastery](WEAPON-MASTERY.md#8-persistenz-und-laufzeitzustand)).
- Pro freigeschaltetem **Slot** das Item — die fünf Schichten aus
  [Item-Anatomie](ITEMS.md#2-item-anatomie-fünf-schichten) (Basis + Item-Level + Seltenheit +
  gesockelte Gems inkl. Level/Value + gebrandetes Sigil). Es existieren ausschließlich die vier
  Armor-Slots Head, Chest, Legs und Feet
  ([Slots, Basen & Innate-Affixe](ITEMS.md#1-slots-basen--innate-affixe)).
- **Crucible-Node-Ränge** je Node-ID über alle drei Trees hinweg, einschließlich der
  charaktergebundenen Signatur-Skills ([Crucible](PROGRESSION.md#3-crucible-globaler-skilltree)).
  Die Ränge sind die alleinige Wahrheit: freigeschaltete Dungeon-Einstiege, Ausrüstungsslots und
  Systeme werden aus `anvil.*` abgeleitet, nicht getrennt gespeichert. Ein Respec ändert nur diese
  Ränge und den Relic-Shard-Bestand.
- Gold, Cinder, Gem-Bestände (Amber/Ruby/Sapphire/Emerald/Diamond).
- **Sigil Codex** (bekannte Sigils mit Level).
- Runedust, **Rune Grimoire** (bekannte Runen mit Level) und pro Charakter der **Rite** auf
  dem **Talisman** (gesockelte Trigger-/Effect-/Modifier-Rune, [Runen](RUNES.md)).
- **Pro Dungeon ein Vollendet-Flag** (schaltet 2× frei und ist Kaufvoraussetzung der Waystones,
  [Checkpoints, Wipe & Abbruch](PROGRESSION.md#4-checkpoints-wipe--abbruch)), höchster
  erreichter Floor, **Erstsieg-Flags** je Floor (Relic Shards,
  [Belohnungen aus einem Sieg](PROGRESSION.md#2-belohnungen-aus-einem-sieg)). Die Menge der
  freigeschalteten Checkpoints selbst ist abgeleitet: `A1-D1` plus ein Einstieg je Rang von
  `anvil.waystones`.
- Kein Feld für einen aktiven Run oder Pending-Currency: Der laufende Run ist ausschließlich
  Laufzeit-Zustand. Ein Reload verwirft ihn, lädt die normale Auswahl und erhält alle davor
  committeten Belohnungen.

### 2.1 Migrationen im Pre-Release

Während der Pre-Release-Entwicklung existiert genau ein aktuelles Save-Schema. Schemaänderungen
ersetzen Basissave, Schema und Tests atomar; ein Speicherstand in einem anderen Format fällt beim
Laden kontrolliert auf den Default zurück. Eine Migration entsteht nur, wenn eine Spec oder ein
Task sie ausdrücklich fordert. Das Versionsfeld bleibt im Pre-Release konstant `1`; es wird erst
mit einem Release relevant.

### 2.2 Aktuelles Pre-Release-Schema

Das aktuelle Schema — die [Crucible-Save-Version](#23-crucible-save-version) — enthält den
implementierten Teil des [Save-Inhalts](#2-save-inhalt):

```text
version: 1
saveSeed: uint32
runCounter: nichtnegative Ganzzahl
playbackSpeed: 1 | 2
characters:
  korvin | rhaya | quinn:
    level: Ganzzahl 1–100
    xp: nichtnegative Ganzzahl
    freeAttributePoints: nichtnegative Ganzzahl
    attributePoints:
      ferocity | resilience | vigor: nichtnegative Ganzzahl
    freeMasteryPoints: nichtnegative Ganzzahl
    masteryRanks: Node-ID → Rang 1–5
currencies:
  gold: nichtnegative Ganzzahl
  relicShards: nichtnegative Ganzzahl
  cinder: nichtnegative Ganzzahl
gems:
  amber | ruby | sapphire | emerald | diamond: nichtnegative Ganzzahl
armor:
  korvin | rhaya | quinn:
    Chest | Legs | Head | Feet: nur kanonische Common-+1-Basen der aus anvil.armory abgeleiteten Slots
firstVictories: FloorId[]
crucible: Node-ID → Rang 1–5, gegen den Crucible-Katalog validiert
completedDungeons:
  A1-D1 … A1-D5: boolean
```

Frei plus verteilte Attributpunkte sowie frei plus investierte Mastery-Punkte entsprechen dem
Charakterlevel; Mastery-Ränge werden gegen den Node-Katalog der Discipline validiert
([Weapon Mastery](WEAPON-MASTERY.md#8-persistenz-und-laufzeitzustand)).

### 2.3 Crucible-Save-Version

Die Crucible-Save-Version ergänzt das Schema um die Node-Ränge und entfernt das gespeicherte
Checkpoint-Feld, weil die Einstiege aus `anvil.waystones` folgen
([Anvil Sparks](PROGRESSION.md#31-anvil-sparks)). Sie folgt
[Migrationen im Pre-Release](#21-migrationen-im-pre-release): Basissave, Schema und Tests
wechseln atomar, das Versionsfeld bleibt `1`.

Das Schema validiert die Node-Ränge gegen den Katalog aus
[Crucible](PROGRESSION.md#3-crucible-globaler-skilltree): unbekannte IDs, Ränge über dem Maximum
und verletzte Voraussetzungen sind ungültige Speicherstände.
