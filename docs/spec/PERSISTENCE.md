# SPEC — Persistenz (Save-Verhalten)

> Teil der [SPEC](../SPEC.md): wann gespeichert wird und was im Save liegt.
> Der technische Aufbau — `localStorage`, `SavePort`-Adapter, Versionsfeld,
> Migrations-Mechanismus und Zod-Validierung beim Laden — steht in
> [AGENTS.md §7](../../AGENTS.md).
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
- Pro Charakter: Level, XP, Attribut- und Skillpunkte-Verteilung.
- Pro freigeschaltetem **Slot** das Item — die fünf Schichten aus
  [Item-Anatomie](ITEMS.md#2-item-anatomie-fünf-schichten) (Basis + Item-Level + Seltenheit +
  gesockelte Gems inkl. Level/Value + gebrandetes Sigil). Die **Main Hand** ist ab Start belegt
  ([Slots, Basen & Innate-Affixe](ITEMS.md#1-slots-basen--innate-affixe)).
- Crucible-Node-Stände; Gold, Cinder, Gem-Bestände (Amber/Ruby/Sapphire/Emerald/Diamond).
- **Sigil Codex** (bekannte Sigils mit Level).
- Runedust, **Rune Grimoire** (bekannte Runen mit Level) und pro Charakter der **Rite** auf
  dem **Talisman** (gesockelte Trigger-/Effect-/Modifier-Rune, [Runen](RUNES.md)).
- Freigeschaltete Checkpoints, **pro Dungeon ein Vollendet-Flag** (schaltet 2× frei,
  [Checkpoints, Wipe & Abbruch](PROGRESSION.md#4-checkpoints-wipe--abbruch)), höchster
  erreichter Floor, **Erstsieg-Flags** je Floor (Crystals,
  [Belohnungen aus einem Sieg](PROGRESSION.md#2-belohnungen-aus-einem-sieg)).

<!-- TODO (Spec): konkrete Feldstruktur je Save-Version (Zod-Schema-Form) samt Migrationspfad —
     siehe docs/backlog/OPEN_ISSUES.md, Abschnitt „Offene Spec-Punkte". -->
