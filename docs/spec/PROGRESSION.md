# SPEC — Fortschritt & Belohnungen

> Teil der [Regelübersicht](README.md): Weltstruktur, Belohnungen, Crucible, Checkpoints und Prestige.
> Verwandt: [Items, Loot & Handwerk](ITEMS.md) · [Runen](RUNES.md) ·
> [Persistenz](PERSISTENCE.md)

---

## 1. Struktur: Akte, Dungeons, Floors

- **3 Akte × 5 Dungeons × 20 Floors = 300 Floors**.
- Notation: `A<Akt>-D<Dungeon>-<Floor>` (Floor zweistellig), z. B. `A1-D4-20`.
- Ein **Floor** ist ein Kampf gegen eine Gegnerformation (2–6 Gegner,
  [Gegnerformation](COMBAT-RUN.md#13-gegnerformation)).
- **Elite-Floor:** Floor 20 der Dungeons 1–4 eines Akts. **Boss-Floor:** Floor 20 des
  **letzten** Dungeons eines Akts.
  - Akt-Bosse: _The Ashen Warden_ (A1), _The Emberbound Sovereign_ (A2), _The Gilded Empress_ (A3).
- **Ramp-Up:** Die volle Gegnervielfalt wird **einmal im ersten Dungeon eines Akts** in vier
  Phasen eingeführt: (1) nur eine Lane, wenige Gegner → (2) beide Lanes, wenige → (3) beide
  Lanes, mehrere → (4) beide Lanes, mehrere inkl. Tank-Gegner.
- Abgeschlossene Dungeons können jederzeit **wiederholt** werden (Farmen von XP/Gold).

## 2. Belohnungen aus einem Sieg

**Belohnungen werden pro Floor-Sieg in den Speicherstand committet**
([Persistenz](PERSISTENCE.md)) — nicht erst am
Run-Ende. Ein Absturz oder Reload kostet damit den laufenden Run
([Simulation & Zeitverhalten](SIMULATION.md#1-grundmodell-verbindlich)), aber nichts Verdientes.
Verfügbar zum **Ausgeben** werden sie erst nach dem Run
([§4](#4-checkpoints-wipe--abbruch)).

1. **XP** → Charakterlevel ([Charakterlevel](CHARACTERS.md#5-charakterlevel)). Pro Gegner entsteht
   auf globalem Floor `f` ein XP-Wert von `12 × 1,03^(f − 1)`, auf ganze Vielfache von 4
   gerundet; die 300 Werte liegen als Tabelle im Game-Content vor. Der Floor-Pool ist dieser
   Wert mal Gegnerzahl. 75 % des Pools werden gleich verteilt (je Charakter garantiert 25 %),
   die übrigen 25 % proportional zum **effektiven Schaden**. Effektiver Schaden ist tatsächlich
   entfernte gegnerische Health nach Mitigation; Overkill zählt nicht und der Beitrag eines
   später besiegten Charakters bleibt erhalten. Ganzzahlige Reste werden per größtem Rest
   vergeben; Gleichstände rotieren anhand des globalen Floor-Index deterministisch.
2. **Gold** — globale Währung (Attribut- und Weapon-Mastery-Respecs,
   Blacksmith/Jeweler).
3. **Crystals** — globale Währung für den Crucible ([§3](#3-crucible-globaler-skilltree)).
   **Nur beim allerersten Sieg** eines Floors:
   - Normal = 1, Elite = 3, Boss = 10.
   - Gesamt im Spiel: 285 (normal) + 36 (elite) + 30 (boss) = **351 Crystals**.
4. **Loot** — jeder Sieg speist den Handwerk-Loop. Die Drop-Regeln stehen bei der Ressource,
   nicht hier:
   - **Gems, Cinder & Sigils** → [Drops: Gems, Cinder & Sigils](ITEMS.md#6-drops-gems-cinder--sigils)
   - **Runedust** → [Runedust (Drop)](RUNES.md#6-runedust-drop)

Der Zufall in den Belohnungen läuft über den `loot`-Strom; beim **Farmen** würfelt jeder
Durchlauf mit neuem Seed, der Jagd-Reiz bleibt also erhalten
([Seeds und Zufalls-Ströme](SIMULATION.md#4-seeds-und-zufalls-ströme)).

## 3. Crucible (globaler Skilltree)

- Der **Crucible** ist ein weitgehend **globaler, charakterübergreifender** Skilltree. Der
  Spieler „schmilzt" Crystals ein, um permanente Zugänge oder flexible Verbesserungen
  freizuschalten.
- Die **charaktergebundenen Signatur-Skills** ([Signatur-Skills](CHARACTERS.md#7-signatur-skills))
  liegen im Tree **Molten Cast** ([§3.3](#33-molten-cast)). Sie folgen dem Standard-Node-Modell mit
  Rang 1–5 und wirken auf je einen Charakter statt global.
- Vier Trees tragen vier getrennte Aufgaben:

  | Tree                | Fokus                                                          | Respec                    |
  | ------------------- | -------------------------------------------------------------- | ------------------------- |
  | **Anvil Sparks**    | permanente Zugänge, Checkpoints und Systemfreischaltungen      | keiner                    |
  | **Smelting Flames** | quantitative, globale Charakterwerte                           | vollständig und kostenlos |
  | **Molten Cast**     | qualitative Kampfregeln und charaktergebundene Signatur-Skills | vollständig und kostenlos |
  | **Masterwork**      | Endgame-Systeme (**Runen**, [Runen](RUNES.md))                 | Entscheidung folgt in M5  |

- Ein neuer Rang kostet genau so viele Crystals wie seine Rangnummer. Fünf Ränge kosten damit
  `1 + 2 + 3 + 4 + 5 = 15` Crystals, vier Ränge `10` und drei Ränge `6`.
- Ein Respec ist nur außerhalb eines Dungeon-Runs möglich. Er entfernt atomar alle Ränge des
  gewählten flexiblen Trees und erstattet exakt die darin investierten Crystals. Smelting und
  Molten werden unabhängig voneinander respecct; es gibt keine tree-übergreifenden
  Voraussetzungen.
- Der Crucible wirkt ausschließlich auf Zugänge, Charakterwerte und Kampfregeln. Gold-Drops,
  XP-Gewinn und Handwerkspreise bleiben unberührt; es gibt damit keinen verpflichtenden frühen
  Ertragspfad.

### 3.1 Anvil Sparks

| ID                 | Ränge | Wirkung                                        | Voraussetzung                | Verfügbarkeit |
| ------------------ | ----: | ---------------------------------------------- | ---------------------------- | ------------- |
| `anvil.waystones`  |     4 | A1-D2 / A1-D3 / A1-D4 / A1-D5                  | vorheriger Dungeon vollendet | M2            |
| `anvil.armory`     |     4 | Head / Chest / Legs / Feet für alle Charaktere | —                            | gesperrt, M3  |
| `anvil.blacksmith` |     1 | Blacksmith-System                              | Armory Rang 1                | gesperrt, M4  |
| `anvil.jeweler`    |     1 | Jeweler-System                                 | Armory Rang 1                | gesperrt, M4  |

`anvil.waystones` Rang `n` schaltet den Einstieg `A1-D<n+1>` frei. Der Kauf verlangt den
vollständigen Abschluss von `A1-D<n>`; der vorherige Waystone-Rang folgt bereits aus der
Rangfolge desselben Nodes. Ein neuer Einstieg entsteht ausschließlich über diesen Kauf: der
Dungeon-Abschluss ist die Voraussetzung, der Rang die Freischaltung. Alle Anvil-Käufe sind
dauerhaft und bleiben von jedem Respec unberührt.

### 3.2 Smelting Flames

Alle vier Nodes sind unabhängige Startnodes mit fünf Rängen:

| ID                    | Name       | Wirkung je Rang |
| --------------------- | ---------- | --------------- |
| `smelting.overpower`  | Overpower  | `+3 %` Attack   |
| `smelting.iron-skin`  | Iron Skin  | `+3 %` Defense  |
| `smelting.unyielding` | Unyielding | `+3 %` Health   |
| `smelting.quick-step` | Quick Step | `+1` Initiative |

Die Prozentwerte sind innerhalb der Crucible-Ebene additiv. Diese Ebene bleibt nach der
Derived-Stat-Formel multiplikativ zu den Basis- und Attributebenen
([Stats](CHARACTERS.md#2-stats)). Quick Step addiert seinen Rang auf die Initiative jedes
Charakters.

### 3.3 Molten Cast

Die vier Basisnodes sind unabhängige Startnodes mit fünf Rängen. Ihre vollständigen
Kampfwirkungen und Testvektoren stehen bei den
[Signatur- und Molten-Skills](SIGNATURES.md).

| ID                   | Name        | Rangwerte                                      | Verfügbarkeit |
| -------------------- | ----------- | ---------------------------------------------- | ------------- |
| `molten.mitigation`  | Mitigation  | `10/15/20/25/30 %` Umleitung                   | M2            |
| `molten.sunder`      | Sunder      | `2/4/6/8/10 pp` je Angriff, Cap `4/8/12/16/20` | M2            |
| `molten.suppression` | Suppression | `1/2/3/4/5` Queue-Plätze                       | M2            |
| `molten.rally`       | Rally       | `10/15/20/25/30 %` Max-Health                  | M2            |
| `molten.ambush`      | Ambush      | `5/10/15/20/25 %` Schaden in Runde 1           | M2, Folgetask |
| `molten.menace`      | Menace      | `2/4/6/8/10 %` weniger gegnerische Accuracy    | M2, Folgetask |
| `molten.momentum`    | Momentum    | Cap `1/2/3/4/5` Initiative                     | M2, Folgetask |
| `molten.second-wind` | Second Wind | `10/15/20/25/30 %` Max-Health                  | M2, Folgetask |

Mitigation, Sunder und Suppression sind die drei charaktergebundenen **Signatur-Skills**
([Signatur-Skills](CHARACTERS.md#7-signatur-skills)); Rally und die Vertiefungen wirken teamweit.

Die vier Vertiefungen benötigen jeweils mindestens Rang 1 ihres Basisnodes: Sunder → Ambush,
Mitigation → Menace, Suppression → Momentum und Rally → Second Wind. Sie sind bis zum
Molten-Folgetask sichtbar, aber nicht kaufbar.

### 3.4 Masterwork

Der Masterwork-Katalog bleibt bis M5 vollständig gesperrt. `Rune Grimoire` ist der Einstieg;
Talisman und Rune Mastery verlangen ihn. Runic Focus Rang `n` verlangt Talisman Rang `n`.

| ID                         | Ränge | Gesamtkosten | Wirkung                          |
| -------------------------- | ----: | -----------: | -------------------------------- |
| `masterwork.rune-grimoire` |     1 |            1 | Rune-System und Rune-Level-Cap 1 |
| `masterwork.talisman`      |     3 |            6 | Rite für Charakter 1 / 2 / 3     |
| `masterwork.runic-focus`   |     3 |            6 | Modifier für Charakter 1 / 2 / 3 |
| `masterwork.rune-mastery`  |     4 |           10 | Rune-Level-Cap 2 / 3 / 4 / 5     |

### 3.5 Kapazität

- Task 015 stellt `130` aktive Crystal-Kosten bereit: `10` Anvil, `60` Smelting und `60`
  Molten-Basis. Mit den vier Molten-Vertiefungen steigt die aktive Kapazität auf `190`.
- Akt 1 vergibt insgesamt `117` Crystals. Selbst nach einem Respec kann deshalb nicht alles
  gleichzeitig maximiert werden.

## 4. Checkpoints, Wipe & Abbruch

- **Keine Heilung zwischen Floors:** Innerhalb einer Auto-Progression-Kette wird Health
  mitgeschleppt (Attrition) — Defensiv-Stats und Regeneration werden dadurch relevant.
  <!-- Bewusste Entscheidung; nach Playtesting revidierbar. -->
- **Tod gilt für den restlichen Run.** Ein besiegter Charakter bleibt besiegt und ist nicht
  heilbar ([Heilung](DAMAGE-SYSTEM.md#16-heilung--grenzen-und-auslösung)).
  - **Rally** (`molten.rally`, [§3.3](#33-molten-cast)) ist die erste Ausnahme: Nach einem
    gewonnenen Floor stehen beim Betreten des Folgefloors **alle** Gefallenen mit
    `10/15/20/25/30 %` ihrer Max-Health gemäß Node-Rang auf. Rally kann nach einem erneuten Tod
    am nächsten erfolgreichen Floor-Übergang wieder wirken, aber nie nach Wipe, Verlassen oder am
    Dungeon-Ende. **Test-Vektor:** Rang 3 setzt einen Gefallenen mit `200` Max-Health auf `40`
    Health.
  - **Second Wind** (`molten.second-wind`) ist die zweite Ausnahme und folgt im
    Molten-Folgetask. Die Regel steht bei
    [Second Wind](SIGNATURES.md#24-second-wind-nach-rally).
- **Health- und Tod-Zustand gelten nur innerhalb einer Run-Kette.** Ein Dungeon-Neustart beginnt
  mit **vollem Team und voller Health**.
- **Auto-Progression:** Innerhalb eines aktiven Dungeon-Runs startet nach einem gespeicherten
  Floor-Sieg automatisch der nächste Floor desselben Dungeons. Am **Dungeon-Ende** ist ein
  manueller Abschluss nötig (keine automatische Dungeon-Kette).
- **Geschwindigkeit des Playbacks** (Anzeige, ohne Einfluss auf den Kampfausgang,
  [Simulation & Zeitverhalten](SIMULATION.md#1-grundmodell-verbindlich)):
  - **Pause** ist ab Spielstart verfügbar.
  - **2×** wird **pro Dungeon** freigeschaltet, sobald dieser Dungeon einmal vollendet wurde.
  - Kein Zurückspulen.
- **Optimierung ist während eines Runs gesperrt.** Solange der Spieler in einem Dungeon ist,
  lassen sich keine Attribut- oder Mastery Points setzen, kein Blacksmith, Jeweler oder Crucible
  benutzen und keine Respecs durchführen. Punkte und Ressourcen laufen sichtbar auf und werden
  mit dem Ende des Runs verfügbar. Die Sperre schließt insbesondere aus, dass ein Level-Up mitten
  im Dungeon die Attrition über einen Vigor-Zuwachs aushebelt (Design-Absicht:
  [DESIGN §3](../DESIGN.md#3-player-experience--der-kern-loop)).
- **Präsentationsgrenze:** Ein laufender Run belegt den Bereich der normalen Dungeon-View ohne
  Primärnavigation oder Ausgabefunktionen. Die Kopfzeile mit Ressourcen bleibt rein lesend
  sichtbar. Bereits pro Floor committete XP, Gold und Crystals dürfen dort sichtbar sein, sind
  aber erst nach Wipe, manuellem Verlassen oder dem Dungeon-Abschluss ausgebbar. Diese Grenze
  modelliert keinen separaten Pending-Bestand.
- **Wipe oder manuelles Verlassen:** Man verlässt den **kompletten** Dungeon. Bereits
  erhaltene Belohnungen bleiben erhalten (keine Penalty außer entgangenem Floor-Reward).
- **Fortschritt innerhalb eines Dungeons wird nicht gespeichert** — ein Dungeon startet
  **immer bei Floor 1**.
- **Checkpoint = Menge freigeschalteter Dungeon-Einstiege** (Dungeon-Granularität, jeweils
  Floor 1). Beim Wiederbetreten **wählt** der Spieler frei einen freigeschalteten Dungeon.
  - **Default pro Akt:** Dungeon 1, Floor 1 (`A<Akt>-1-01`).
  - **Anvil-Sparks-Waystones** schalten spätere Dungeon-Einstiege frei, nachdem der jeweils
    vorherige Dungeon vollständig abgeschlossen wurde → kein Rückfall an den Aktanfang.

## 5. Prestige

- **Kein Prestige-System** geplant. Das feste Drei-Charakter-Team und der Fokus auf deren
  Ausbau tragen die Langzeitmotivation; ein Reset-Loop ist bewusst kein Ziel.
