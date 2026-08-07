# SPEC — Persistenz (Save-Verhalten)

> Teil der [SPEC](../spec/README.md): wann gespeichert wird und was im Save liegt.
> Der technische Aufbau — `localStorage`, `SavePort`-Adapter, Versionsfeld,
> Migrations-Mechanismus und Zod-Validierung beim Laden — steht in
> [AGENTS.md](../../AGENTS.md).
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
- **Crucible-Node-Ränge** je Node-ID über alle vier Trees hinweg, einschließlich der
  charaktergebundenen Signatur-Skills ([Crucible](PROGRESSION.md#3-crucible-globaler-skilltree)).
  Die Ränge sind die alleinige Wahrheit: freigeschaltete Dungeon-Einstiege, Ausrüstungsslots und
  Systeme werden aus `anvil.*` abgeleitet, nicht getrennt gespeichert. Ein Respec ändert nur diese
  Ränge und den Crystal-Bestand.
- Gold, Cinder, Gem-Bestände (Amber/Ruby/Sapphire/Emerald/Diamond).
- **Sigil Codex** (bekannte Sigils mit Level).
- Runedust, **Rune Grimoire** (bekannte Runen mit Level) und pro Charakter der **Rite** auf
  dem **Talisman** (gesockelte Trigger-/Effect-/Modifier-Rune, [Runen](RUNES.md)).
- **Pro Dungeon ein Vollendet-Flag** (schaltet 2× frei und ist Kaufvoraussetzung der Waystones,
  [Checkpoints, Wipe & Abbruch](PROGRESSION.md#4-checkpoints-wipe--abbruch)), höchster
  erreichter Floor, **Erstsieg-Flags** je Floor (Crystals,
  [Belohnungen aus einem Sieg](PROGRESSION.md#2-belohnungen-aus-einem-sieg)). Die Menge der
  freigeschalteten Checkpoints selbst ist abgeleitet: `A1-D1` plus ein Einstieg je Rang von
  `anvil.waystones`.
- Kein Feld für einen aktiven Run oder Pending-Currency: Der laufende Run ist ausschließlich
  Laufzeit-Zustand. Ein Reload verwirft ihn, lädt die normale Auswahl und erhält alle davor
  committeten Belohnungen.

### 2.1 Save v1 (M1)

Save v1 enthält den in M1 verfügbaren Teil des Speicherstands in dieser Struktur:

```text
version: 1
saveSeed: uint32
runCounter: nichtnegative Ganzzahl
playbackSpeed: 1 | 2
characters:
  korvin | rhaya | quinn:
    level: Ganzzahl 1–100
    xp: nichtnegative Ganzzahl
currencies:
  gold: nichtnegative Ganzzahl
  crystals: nichtnegative Ganzzahl
firstVictories: FloorId[]
```

v1 ist das erste Save-Format und hat keinen Vorgänger. Spätere persistierte Systeme aus
[Save-Inhalt](#2-save-inhalt) erweitern den Speicherstand über eine neue Version mit expliziter
Migration von v1.

### 2.2 Aktuelles Pre-Release-Schema

Das aktuelle Pre-Release-Schema enthält freie Punkte und die drei verteilten Attribute. Mit
Weapon Mastery werden die bisherigen Skillpunkt-Summen direkt durch `freeMasteryPoints` und
Node-Ränge ersetzt. Für diese Änderung wird keine Migration geschrieben: Vor Release bestehen
keine zu erhaltenden Spielstände; Basissave, Schema und Tests wechseln atomar auf das neue Modell.

### 2.3 Crucible-Save-Version

Die Crucible-Version ergänzt das Schema um die Node-Ränge und entfernt das gespeicherte
Checkpoint-Feld, weil die Einstiege nun aus `anvil.waystones` folgen
([Anvil Sparks](PROGRESSION.md#31-anvil-sparks)). Sie erhält ausdrücklich eine Migration:

- **Erhalten:** Vollendet-Flags, Erstsieg-Flags, höchster erreichter Floor, Währungen,
  Charakterlevel, XP, Attribut- und Mastery-Stände.
- **Zurückgesetzt:** die zugänglichen Dungeon-Einstiege auf ausschließlich `A1-D1`. Die
  Node-Ränge starten leer.
- **Folge:** Wer einen Dungeon bereits vollendet hat, erfüllt die Kaufvoraussetzung des
  zugehörigen Waystone-Rangs sofort und kann mehrere Ränge unmittelbar regulär nachkaufen.

Die Migration validiert die Node-Ränge gegen den Katalog aus
[Crucible](PROGRESSION.md#3-crucible-globaler-skilltree): unbekannte IDs, Ränge über dem Maximum
und verletzte Voraussetzungen sind ungültige Speicherstände.
