# SPEC — Fortschritt & Belohnungen (§4.1–§4.4, §4.7)

> Teil der [SPEC](../SPEC.md). Verbindliche Regeln für Struktur, Belohnungen,
> Crucible, Checkpoints und Prestige.
> Verwandt: [Ausrüstung, Loot & Handwerk](CRAFTING.md) · [Runen](RUNES.md) ·
> [Persistenz](PERSISTENCE.md)

---

## 4. Fortschritt & Belohnungen

### 4.1 Struktur: Akte, Dungeons, Floors

- **3 Akte** × **5 Dungeons** × **20 Floors** = **300 Floors**.
- Notation: `A<Akt>-D<Dungeon>-<Floor>` (Floor zweistellig), z. B. `A1-D4-20`.
- Ein **Floor** ist ein Kampf gegen eine Gegnerformation (2–6 Gegner,
  [§1.3](COMBAT.md#13-gegnerformation)).
- **Elite-Floor:** Floor 20 der Dungeons 1–4 eines Akts. **Boss-Floor:** Floor 20 des
  **letzten** Dungeons eines Akts.
  - Akt-Bosse: _The Ashen Warden_ (A1), _The Emberbound Sovereign_ (A2), _The Gilded Empress_ (A3).
- **Ramp-Up:** Die volle Gegnervielfalt wird **einmal im ersten Dungeon eines Akts** in vier
  Phasen eingeführt: (1) nur eine Lane, wenige Gegner → (2) beide Lanes, wenige → (3) beide
  Lanes, mehrere → (4) beide Lanes, mehrere inkl. Tank-Gegner.
- Abgeschlossene Dungeons können jederzeit **wiederholt** werden (Farmen von XP/Gold).

### 4.2 Belohnungen aus einem Sieg

**Belohnungen werden pro Floor-Sieg in den Speicherstand committet**
([§6](PERSISTENCE.md#6-persistenz-save-verhalten)) — nicht erst am
Run-Ende. Ein Absturz oder Reload kostet damit den laufenden Run
([§5](SIMULATION.md#5-simulation--zeitverhalten-verbindlich)), aber nichts Verdientes.
Verfügbar zum **Ausgeben** werden sie erst nach dem Run (§4.4).

1. **XP** → Charakterlevel ([§3.3](CHARACTERS.md#33-charakterlevel)). Pro Floor entsteht ein
   **XP-Pool** (abhängig von Floor & Gegnerzahl), der auf die drei Charaktere verteilt wird: ein
   **Basisanteil** je Charakter, der Rest **individuell**.
   <!-- TODO: Verteilungsschlüssel des Rests (Kandidat: nach verursachtem Schaden). -->
2. **Gold** — globale Währung (Respecs, Blacksmith/Jeweler, Node-Respec).
3. **Crystals** — globale Währung für den **Crucible** (§4.3). **Nur beim allerersten Sieg**
   eines Floors:
   - Normal = 1, Elite = 3, Boss = 10.
   - Gesamt im Spiel: 285 (normal) + 36 (elite) + 30 (boss) = **351 Crystals**.
4. **Loot** — jeder Sieg speist den Handwerk-Loop. Die Drop-Regeln stehen bei der Ressource,
   nicht hier:
   - **Gems, Cinder & Sigils** → [§4.5, Abschnitt „Drops"](CRAFTING.md#drops-gems-cinder--sigils)
   - **Runedust** → [§4.6, Abschnitt „Runedust"](RUNES.md#runedust-drop)

Der Zufall in den Belohnungen läuft über den `loot`-Strom; beim **Farmen** würfelt jeder
Durchlauf mit neuem Seed, der Jagd-Reiz bleibt also erhalten
([§5.3](SIMULATION.md#53-seeds-und-zufalls-ströme)).

### 4.3 Crucible (globaler Skilltree)

- Der **Crucible** ist ein weitgehend **globaler, charakterübergreifender** Skilltree. Der
  Spieler „schmilzt" **Crystals** ein, um **permanente** Verbesserungen freizuschalten.
- Zusätzlich beherbergt der Crucible die **charaktergebundenen Signatur-Skills**
  ([§3.5](CHARACTERS.md#35-signatur-skills)) —
  spielverändernde, an je einen Charakter gebundene Unlocks. Sie folgen dem Standard-Node-Modell
  (Level 1–5), sind aber dem jeweiligen Charakter zugeordnet statt global wirksam.
- Vier Trees (Schmiede-Wortfeld):

  | Tree                | Fokus                                                                          |
  | ------------------- | ------------------------------------------------------------------------------ |
  | **Anvil Sparks**    | Freischalten von Inhalten (Blacksmith, Jeweler, Ausrüstungsslots, Checkpoints) |
  | **Smelting Flames** | Stat-Boosts der Charaktere                                                     |
  | **Molten Cast**     | Economy-Boosts (Gold-Drop, XP-Gewinn, Rabatte bei Blacksmith/Jeweler)          |
  | **Masterwork**      | Endgame-Systeme (**Runen**, [§4.6](RUNES.md#46-runen-endgame--masterwork))     |

- Manche Nodes sind **stufbar** (max. **5 Level**), Kosten **linear steigend** (Level `n` = `n`
  Crystals; 1+2+3+4+5 = 15 Crystals für einen voll gestuften Node).
- **Respec gegen Gold.**

### 4.4 Checkpoints, Wipe & Abbruch

- **Keine Heilung zwischen Floors:** Innerhalb einer Auto-Progression-Kette wird Health
  mitgeschleppt (Attrition) — Defensiv-Stats und Regeneration werden dadurch relevant.
  <!-- Bewusste Entscheidung; nach Playtesting revidierbar. -->
- **Tod gilt für den restlichen Run.** Ein besiegter Charakter bleibt besiegt und ist nicht
  heilbar ([§2.6](COMBAT.md#26-heilung--grenzen-und-auslösung)).
  - **Rally** (Crucible-Node, Level 1–5) ist die einzige Ausnahme: Ein gefallener Charakter steht
    beim **Betreten des nächsten Floors** mit einem Anteil seiner Max-Health wieder auf (Wert =
    Balancing, Leitplanke: [BALANCING §5](../BALANCING.md)). Vor der Freischaltung existiert der
    Effekt nicht.
- **Health- und Tod-Zustand gelten nur innerhalb einer Run-Kette.** Ein Dungeon-Neustart beginnt
  mit **vollem Team und voller Health**.
- **Auto-Progression:** Der Spieler startet Kämpfe zunächst **einzeln**; ein Anvil-Sparks-Node
  schaltet das **automatische Starten** des nächsten Floors frei. Am **Dungeon-Ende** ist ein
  manueller Neustart nötig (keine automatische Dungeon-Kette).
- **Geschwindigkeit des Playbacks** (Anzeige, ohne Einfluss auf den Kampfausgang,
  [§5](SIMULATION.md#5-simulation--zeitverhalten-verbindlich)):
  - **Pause** ist **ab Spielstart** verfügbar.
  - **2×** wird **pro Dungeon** freigeschaltet, sobald dieser Dungeon einmal vollendet wurde.
  - Kein Zurückspulen.
- **Optimierung ist während eines Runs gesperrt.** Solange der Spieler in einem Dungeon ist,
  lassen sich keine Attribut- oder Skillpunkte setzen, kein Blacksmith, Jeweler oder Crucible
  benutzen und keine Respecs durchführen. Punkte und Ressourcen laufen sichtbar auf und werden
  mit dem Ende des Runs verfügbar. Die Sperre schließt insbesondere aus, dass ein Level-Up mitten
  im Dungeon die Attrition über einen Vigor-Zuwachs aushebelt (Design-Absicht:
  [DESIGN §3](../DESIGN.md)).
- **Wipe oder manuelles Verlassen:** Man verlässt den **kompletten** Dungeon. **Bereits
  erhaltene Belohnungen bleiben erhalten** (keine Penalty außer entgangenem Floor-Reward).
- **Fortschritt innerhalb eines Dungeons wird nicht gespeichert** — ein Dungeon startet
  **immer bei Floor 1**.
- **Checkpoint = Menge freigeschalteter Dungeon-Einstiege** (Dungeon-Granularität, jeweils
  Floor 1). Beim Wiederbetreten **wählt** der Spieler frei einen freigeschalteten Dungeon.
  - **Default pro Akt:** Dungeon 1, Floor 1 (`A<Akt>-1-01`).
  - **Anvil-Sparks-Nodes** schalten spätere Dungeon-Einstiege frei (sobald ein Dungeon einmal
    komplett war) → kein Rückfall an den Aktanfang.

### 4.7 Prestige

- **Kein Prestige-System** geplant. Das feste Drei-Charakter-Team und der Fokus auf deren
  Ausbau tragen die Langzeitmotivation; ein Reset-Loop ist bewusst kein Ziel.
