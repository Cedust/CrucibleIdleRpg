# SPEC — Persistenz (§6, Save-Verhalten)

> Teil der [SPEC](../SPEC.md). Verbindliche Regeln für Speicher-Auslöser und Save-Inhalt.
> Verwandt: [Simulation & Zeitverhalten](SIMULATION.md) ·
> [Fortschritt & Belohnungen](PROGRESSION.md)

---

## 6. Persistenz (Save-Verhalten)

Festgelegt durch [AGENTS.md](../../AGENTS.md) §7, hier als Verhaltens-Referenz:

- Save in **`localStorage`** mit **Versionsfeld** und **Migrations-Mechanismus**,
  Zugriff nur über den **`SavePort`-Adapter**.
- Beim **Laden** Validierung gegen ein **Zod-Schema** (pro Save-Version eines).
- Bei Validierungsfehler: **kontrollierter Fallback** (Migration oder definierter
  Reset auf Default) — **kein** Absturz mit korruptem State.

**Speicher-Auslöser (festgelegt):**

- **Nach jedem Floor-Sieg** — die Belohnungen werden pro Floor committet
  ([§4.2](PROGRESSION.md#42-belohnungen-aus-einem-sieg)).
- **Beim Start eines Runs** — der `runCounter` muss vor dem ersten Kampf persistiert sein,
  sonst greift die Anti-Save-Scumming-Zusicherung aus
  [§5.3](SIMULATION.md#53-seeds-und-zufalls-ströme) nicht.
- **Kein** Speichern des laufenden Kampfzustands
  ([§5.4](SIMULATION.md#54-kampfzustand-und-reload)).

**Save-Inhalt (Stand der Festlegungen):**

- Global: **Save-Version**, **`saveSeed`**, **`runCounter`**, **Playback-Geschwindigkeit**
  ([§5.1](SIMULATION.md#51-playback--takt-und-geschwindigkeit)).
- Pro Charakter: Level, XP, Attribut- und Skillpunkte-Verteilung.
- Pro freigeschaltetem **Slot** das Item (Basis + Item-Level + Seltenheit + gesockelte Gems
  inkl. Level/Value + gebrandetes Sigil, [§3.4](CHARACTERS.md#34-ausrüstung) /
  [§4.5](CRAFTING.md#45-ausrüstung-loot--handwerk-kern-loop)). Die **Main Hand** ist ab Start
  belegt ([§3.4](CHARACTERS.md#34-ausrüstung)).
- Crucible-Node-Stände; Gold, **Cinder**, **Gem-Bestände** (Amber/Ruby/Sapphire/Emerald/Diamond).
- **Sigil Codex** (bekannte Sigils mit Level).
- **Runedust**, **Rune Grimoire** (bekannte Runen mit Level) und pro Charakter der **Rite** auf
  dem **Talisman** (gesockelte Trigger-/Effect-/Modifier-Rune,
  [§4.6](RUNES.md#46-runen-endgame--masterwork)).
- Freigeschaltete Checkpoints, **pro Dungeon ein Vollendet-Flag** (schaltet 2× frei,
  [§4.4](PROGRESSION.md#44-checkpoints-wipe--abbruch)), höchster erreichter Floor,
  **Erstsieg-Flags** je Floor (Crystals,
  [§4.2](PROGRESSION.md#42-belohnungen-aus-einem-sieg)).

**Zu spezifizieren:**

- [ ] Die konkrete Feldstruktur je Save-Version (Zod-Schema-Form) samt Migrationspfad.
