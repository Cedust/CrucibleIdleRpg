# SPEC — Weapon Mastery

> Teil der [SPEC](README.md): charaktergebundene Waffen, Mastery-Progression, Disciplines,
> Node-Kataloge und Bedienung.
> Verwandt: [Team & Charaktere](CHARACTERS.md) · [Schadenssystem](DAMAGE-SYSTEM.md) ·
> [Items, Loot & Handwerk](ITEMS.md)

---

## 1. Grundmodell und Abgrenzung

- Jeder Charakter besitzt ab Spielstart genau **eine permanente Signaturwaffe**. Sie kann
  weder abgelegt noch getauscht werden.
- Die Waffe ist **kein Item**: kein Equipment-Slot, keine Rarity, kein Item-Level, keine
  Sockel, Gems, Sigils und keine Interaktion mit Blacksmith oder Jeweler.
- Die Waffe wächst ausschließlich über Charakterlevel und **Weapon Mastery**.
- Die vier gemeinsamen Disciplines **Finesse**, **Tempest**, **Dominance** und **Valor**
  spezialisieren die vier offensiven Muster Crit, Multi Hit, Splash und Counter.
- Eine fünfte, charakterindividuelle Weapon-Discipline verändert das Waffenprofil und trägt
  den Namen der Waffe: **WARHAMMER**, **TWIN BLADES** oder **LONGBOW**.
- Die Crucible-Signatur-Skills Mitigation, Sunder und Suppression bleiben ein getrenntes System
  ([Signatur-Skills](SIGNATURES.md)).

## 2. Waffenprofile und Derived Stats

| Charakter | Discipline      | Signaturwaffe              | Damage | Range    | Precision |
| --------- | --------------- | -------------------------- | -----: | -------- | --------: |
| Korvin    | **WARHAMMER**   | Heavy Hammer & Greatshield |     14 | 70–130 % |      70 % |
| Rhaya     | **TWIN BLADES** | Twin Blades                |     18 | 80–120 % |      80 % |
| Quinn     | **LONGBOW**     | Longbow & Quiver           |     20 | 90–110 % |      90 % |

Weapon Base Damage ersetzt die frühere Attack-Baseline. Charakterlevel erhöhen
Attack, Defense und Health nicht mehr automatisch:

```text
Attack  = (Weapon Base Damage + Might)
          × (1 + Ferocity-Bonus)
          × (1 + Crucible-Attack-Bonus)

Defense = (Start-Defense + Toughness + Mastery-Defense)
          × (1 + Resilience-Bonus)
          × (1 + Crucible-Defense-Bonus)

Health  = (Start-Health + Vitality)
          × (1 + Vigor-Bonus)
          × (1 + Crucible-Health-Bonus)
```

Start-Defense und Start-Health bleiben die festen Charakterwerte aus
[Team & Charaktere](CHARACTERS.md#2-stats). Might, Toughness und Vitality sind additive
Core-Stats; Attribute und Crucible wirken als getrennte Prozentebenen.

### 2.1 Precision, Clean Hit und Glancing Blow

- Jeder reguläre Angriff würfelt einmal gegen die **Precision** seiner Waffe. Jeder ausgelöste
  Counter besitzt einen eigenen Precision-Wurf.
- **Clean Hit:** Der Angriff verwendet seinen normalen Range-Wurf und alle dafür
  freigeschalteten Treffer dürfen critten.
- **Glancing Blow:** Der gemeinsame Rohschaden verwendet **MIN RNG**. Kein Treffer dieses
  Angriffs darf critten.
- Multi Hit und Splash werden auch bei Glancing normal geprüft und erzeugen ihre Treffer.
  Alle erzeugten Treffer teilen das Clean-/Glancing-Ergebnis und den gemeinsamen Rohschaden.
- Der Range-Wurf wird auch bei Glancing gezogen und danach durch MIN RNG ersetzt. Die
  deterministische Anzahl und Reihenfolge der PRNG-Züge bleibt damit stabil.
- Chancen einschließlich Precision cappen bei 100 %. Damage-Stats besitzen keinen Soft-Cap.
- Die vollständige Treffer- und PRNG-Reihenfolge steht im
  [Schadenssystem](DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden).

## 3. Mastery Points, Ranks und Node-Regeln

- Level 1 startet mit einem freien **Mastery Point**; jedes weitere Level gewährt einen. Bei
  Level 100 besitzt jeder Charakter insgesamt **100 Mastery Points**.
- Die 100 Punkte bilden einen gemeinsamen Pool über alle fünf Disciplines.
- Mastery Ranks werden dauerhaft durch das Charakterlevel freigeschaltet:

  | Rank            | Mindestlevel |
  | --------------- | -----------: |
  | **Initiate**    |            1 |
  | **Adept**       |           20 |
  | **Expert**      |           40 |
  | **Master**      |           60 |
  | **Grandmaster** |           80 |

- Ein Respec senkt keinen Rank; die Freischaltung hängt nie von aktuell investierten Punkten ab.
- **Stat-Nodes** besitzen fünf Ränge. Jeder Rang kostet einen Mastery Point.
- **Verhaltens-Nodes** besitzen genau einen Rang und kosten einen Mastery Point.
- Initiate-Nodes besitzen keine Vorgänger. Jede spätere Node benötigt mindestens einen Punkt
  in einem direkt verbundenen Vorgänger des vorherigen Ranks; der Vorgänger muss nicht
  maximiert sein.
- Jede Discipline besitzt eine zentrale Verhaltenslinie:
  `Expert-Verhalten → eine Master-Entscheidung → Capstone`.
- Die beiden Master-Nodes einer Discipline schließen einander aus. Ein Discipline-Respec löst
  diese Wahl wieder.
- Grandmaster enthält ausschließlich Capstones.
- Pro Charakter darf genau **einer** der vier gemeinsamen Discipline Capstones aktiv sein. Der
  feste Weapon Capstone ist davon unabhängig und kann zusätzlich gekauft werden.
- Effektiv kaufbare Kapazität: Finesse 43, Tempest 43, Dominance 47, Valor 43 und Weapon 53;
  insgesamt 229 Ränge bei 100 verfügbaren Punkten.

### 3.1 Discipline-Respec

- Ein Respec setzt ausschließlich die aktuell gewählte Discipline des gewählten Charakters
  zurück und erstattet deren Mastery Points vollständig.
- Attribute und die anderen vier Disciplines bleiben unverändert.
- Wird der aktive gemeinsame Discipline Capstone entfernt, werden die drei Alternativen wieder
  freigegeben. Ein Weapon-Respec entfernt nur den festen Weapon Capstone.
- Die Goldkosten skalieren mit den erstatteten Punkten:

  ```text
  Respec-Kosten = Grundpreis + Punktpreis × erstattete Mastery Points
  ```

- Grundpreis und Punktpreis sind deklarative Balancing-Werte und derzeit offen
  ([OPEN_ISSUES](../backlog/OPEN_ISSUES.md#ökonomie-und-endgame)).
- Bei null investierten Punkten ist Respec deaktiviert. Während eines Runs bleibt Respec
  gesperrt ([Fortschritt](PROGRESSION.md#4-checkpoints-wipe--abbruch)).

## 4. Gemeinsame Disciplines

Stat-Nodes verwenden den vollständigen Statnamen plus römische Liniennummer. Auf der kompakten
Node steht nur das Kurzlabel; der aktuelle Rang wird getrennt als `n/5` angezeigt.

### 4.1 Finesse

| Nodes | Kurzlabel | Wirkung je Rang        | Vollausbau inkl. Basis |
| ----: | --------- | ---------------------- | ---------------------: |
|   4×5 | `CHC`     | +3 pp Crit Hit Chance  |                   65 % |
|   4×5 | `CHD`     | +10 pp Crit Hit Damage |                  350 % |

Zentrale Linie:

- **Executioner (Expert):** Ein kritischer Clean Base Hit gegen ein Ziel unter 25 % seiner
  aktuellen Health erhält einmalig +50 Prozentpunkte Crit Damage. Der Health-Stand wird direkt
  vor dem Grundtreffer geprüft.
- **Perfect Exploit (Master):** Jeder Crit eines Clean Angriffs verwendet MAX RNG statt des
  gemeinsamen Range-Werts.
- **Surestrike (Master):** Der Clean Base Hit ist garantiert kritisch.
- **Overcritical (Grandmaster):** Nach einem Crit erfolgt genau ein weiterer Crit-Chance-Wurf.
  Bei Erfolg wird der reguläre Crit-Bonus einmal zusätzlich addiert; keine Rekursion.
  Executioners +50 Prozentpunkte werden nicht dupliziert.

Bei 200 % Crit Damage ergeben sich 250 % mit Executioner, 300 % mit Overcritical und 350 % mit
beiden Effekten.

### 4.2 Tempest

| Nodes | Kurzlabel | Wirkung je Rang              |
| ----: | --------- | ---------------------------- |
|   3×5 | `MHC`     | +5 pp Multi Hit Chance       |
|   2×5 | `MHD`     | +3 pp Multi Hit Damage       |
|   2×5 | `CHF`     | +5 pp Multi Hit Chain Factor |
|   4×1 | `CHAIN`   | +1 Multi Hit Chain           |

Vollausbau einschließlich Basis: 75 % Multi Hit Chance, 80 % Multi Hit Damage, Chain 5 und
90 % Chain Factor. Der erste Kettentreffer verwendet bereits als Grundregel 100 %; der Factor
greift ab Treffer zwei.

- **Converging Strikes (Expert, zentrale Linie):** Chain Hits dürfen critten.
- **Relentless Pursuit (Expert, Seitennode):** Stirbt das Primärziel mitten in der Kette, wählt
  jeder verbleibende Treffer nacheinander das nächste legale Ziel nach der normalen
  Zielpriorisierung.
- **Echoed Strike (Master):** Ein Clean Base Hit wird nach seiner vollständigen Auflösung einmal
  mit 50 % seines fertigen Schadens wiederholt. Das Echo erbt den Crit-Ausgang, würfelt nicht
  erneut und erzeugt keine Procs.
- **Storm Surge (Master):** Jeder Crit der ursprünglichen Chain erzeugt einen Bonus-Chain-Hit,
  maximal zwei. Die Hits werden ans Ende angehängt, setzen Chain-Index und Chain Factor fort,
  dürfen critten und erzeugen selbst keine weiteren Storm-Surge-Hits.
- **Perfect Cadence (Grandmaster):** Ein kritischer Chain Hit setzt den Chain Factor des direkt
  folgenden Chain Hits auf 100 %. Das gilt auch zwischen ursprünglichen und angehängten Hits.

### 4.3 Dominance

| Nodes | Kurzlabel | Wirkung je Rang         |
| ----: | --------- | ----------------------- |
|   4×5 | `SHC`     | +4 pp Splash Hit Chance |
|   4×5 | `SHD`     | +3 pp Splash Hit Damage |
|   4×1 | `RADIUS`  | +1 Splash Radius        |

Vollausbau einschließlich Basis: 80 % Splash Chance, 100 % Splash Damage und Radius 5.

- **Critical Mass (Expert):** Splash Hits dürfen critten.
- **Epicenter (Master):** Ein erfolgreicher Splash erzeugt auf dem Primärziel einen
  zusätzlichen Treffer mit 50 % des normalen Splash-Schadens. Der Treffer entsteht auch ohne
  vorhandenes Nebenziel.
- **Focused Blast (Master):** Jeder ungenutzte Radius-Platz addiert 25 % des normalen
  Splash-Schadens zu genau einem aggregierten Zusatztreffer auf dem Primärziel, maximal 100 %.
  Mit Radius 5 und zwei Nebenzielen sind drei Plätze frei, also 75 %.
- **Aftershock (Grandmaster):** Die tatsächlich getroffenen Nebenziele erhalten eine zweite
  Welle mit 50 % des normalen Splash-Schadens und eigenen Crit-Würfen. Aftershock wiederholt
  weder sich selbst noch den primären Zusatztreffer von Epicenter oder Focused Blast.

### 4.4 Valor

| Nodes | Kurzlabel | Wirkung je Rang      |
| ----: | --------- | -------------------- |
|   4×5 | `CTC`     | +4 pp Counter Chance |
|   4×5 | `CTD`     | +5 pp Counter Damage |

Vollausbau einschließlich Basis: 80 % Counter Chance und 160 % Counter Damage.

- **Baseline:** Nach jedem nicht ausgewichenen Treffer einschließlich Block wird Counter Chance
  geprüft. Evasion erzeugt ohne Master-Node keinen Counter.
- **Vengeful Edge (Expert):** Counter dürfen critten.
- **Perfect Riposte (Master):** Nach Evasion wird Counter Chance normal geprüft.
- **Guarded Reprisal (Master):** Nach einem erfolgreichen Block ist der Counter garantiert; der
  Counter-Chance-Wurf entfällt. Ungeblockte Treffer verwenden weiterhin Counter Chance.
- **Escalating Retaliation (Grandmaster):** Jeder erfolgreiche Counter derselben Runde erhöht
  den Counter Damage des nächsten Counters um +25 Prozentpunkte, maximal drei Stacks
  (+75 pp). Der erste Counter nutzt den Basiswert; Reset bei Rundenbeginn. Glancing Counter
  zählen als erfolgreiche Counter.

## 5. Charakterindividuelle Weapon-Disciplines

Alle Weapon-Stat-Nodes besitzen fünf Ränge. `DMG`, `DEF` und `INIT` geben +1 Punkt je Rang;
`PRC`, `MIN RNG`, `MAX RNG` und `BLK` geben +1 Prozentpunkt je Rang.

### 5.1 WARHAMMER — Korvin

| Stat-Nodes | Anzahl |
| ---------- | -----: |
| `DMG`      |      2 |
| `DEF`      |      2 |
| `BLK`      |      1 |
| `PRC`      |      2 |
| `MIN RNG`  |      1 |
| `MAX RNG`  |      2 |

Vollausbau vor der Master-Wahl: Damage 24, Mastery Defense +10, Range 75–140 %,
Precision 80 % und Block Chance 15 % einschließlich Korvins Basis.

- **Committed Impact (Expert):** Clean-Range-Würfe unter 100 % werden auf 100 % angehoben.
- **Titan’s Arc (Master):** +5 Damage, +15 pp MAX RNG, −10 pp Precision.
- **Shielded Advance (Master):** +5 Damage, +10 pp MIN RNG, +10 pp Precision,
  −15 pp MAX RNG.
- **Immovable Guard (Grandmaster):** Dauerhaft +15 pp Block Chance. Ein erfolgreicher Block
  gewährt nicht stapelbares `Guarded`. Der nächste reguläre Angriff ist Clean und verbraucht
  `Guarded`; der Precision-Wurf wird trotzdem gezogen und ignoriert. Counter verbrauchen den
  Zustand nicht. Er bleibt über Runden bestehen und verfällt am Encounter-Ende.

### 5.2 TWIN BLADES — Rhaya

| Stat-Nodes | Anzahl |
| ---------- | -----: |
| `DMG`      |      3 |
| `PRC`      |      2 |
| `MIN RNG`  |      2 |
| `MAX RNG`  |      2 |
| `INIT`     |      1 |

Vollausbau vor der Master-Wahl: Damage 33, Range 90–130 %, Precision 90 % und Initiative 17.

- **Twin Measure (Expert):** Bei Clean Hit wird Range zweimal gewürfelt und der höhere Wert
  verwendet.
- **Razor’s Edge (Master):** +3 Damage, −10 pp MIN RNG, +15 pp MAX RNG,
  −5 pp Precision.
- **Blade Poise (Master):** +3 Damage, +10 pp MIN RNG, −5 pp MAX RNG,
  +5 pp Precision.
- **Second Edge (Grandmaster):** Bei Clean Hit erzeugt der niedrigere Twin-Measure-Wurf einen
  separaten Treffer mit 25 % seines Rohschadens. Er besitzt einen eigenen Crit-Wurf, aber keine
  Multi-, Splash- oder sonstigen Generator-Procs.

### 5.3 LONGBOW — Quinn

| Stat-Nodes | Anzahl |
| ---------- | -----: |
| `DMG`      |      3 |
| `PRC`      |      2 |
| `MIN RNG`  |      3 |
| `MAX RNG`  |      1 |
| `INIT`     |      1 |

Vollausbau vor der Master-Wahl: Damage 35, Range 105–115 %, Precision 100 % und Initiative 19.

- **Zeroing In (Expert):** Der erste reguläre Angriff erfasst das Primärziel ohne Bonus. Ab dem
  zweiten aufeinanderfolgenden Angriff auf dasselbe Primärziel verschieben sich MIN und MAX RNG
  je Stack um +5 Prozentpunkte, maximal drei Stacks.
- **Overdraw (Master):** +3 Damage, +20 pp MAX RNG, −15 pp Precision.
- **Steady Draw (Master):** +3 Damage, +5 pp MIN RNG, +5 pp MAX RNG.
- **Patient Hunter (Grandmaster):** Erweitert Zeroing In auf fünf Stacks. Bei Stack 4 und 5
  verwenden Clean Hits MAX RNG.
- Clean und Glancing reguläre Angriffe bauen Zeroing auf. Der Zustand bleibt über Runden
  bestehen; Zielwechsel und Encounter-Ende setzen ihn zurück. Counter und generierte Treffer
  verändern ihn nicht.

## 6. Rank-Verteilung und Verbindungen

Die folgenden Tabellen sind der verbindliche Graph. `A | B` bei Voraussetzungen bedeutet
**A oder B**; ein Punkt in einem der genannten Vorgänger reicht. Gleichnamige Stat-Linien laufen
ansonsten von der niedrigeren zur höheren römischen Nummer.

### 6.1 Gemeinsame Graphen

| Discipline | Rank        | Nodes                                                              | Direkte Vorgänger                                                                            |
| ---------- | ----------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Finesse    | Initiate    | CHC I, CHD I                                                       | —                                                                                            |
| Finesse    | Adept       | CHC II, CHD II                                                     | jeweils I                                                                                    |
| Finesse    | Expert      | CHC III, CHD III, Executioner                                      | Stat jeweils II; Executioner: CHC II \| CHD II                                               |
| Finesse    | Master      | CHC IV, CHD IV, Perfect Exploit, Surestrike                        | Stat jeweils III; Verhalten: Executioner                                                     |
| Finesse    | Grandmaster | Overcritical                                                       | Perfect Exploit \| Surestrike                                                                |
| Tempest    | Initiate    | MHC I, MHD I, Chain I                                              | —                                                                                            |
| Tempest    | Adept       | MHC II, Chain Factor I, Chain II                                   | MHC I; MHD I; Chain I                                                                        |
| Tempest    | Expert      | MHC III, MHD II, Chain III, Converging Strikes, Relentless Pursuit | MHC II; Chain Factor I; Chain II; Converging: MHC II \| Chain Factor I; Relentless: Chain II |
| Tempest    | Master      | Chain Factor II, Chain IV, Echoed Strike, Storm Surge              | MHD II; Chain III; Verhalten: Converging Strikes                                             |
| Tempest    | Grandmaster | Perfect Cadence                                                    | Echoed Strike \| Storm Surge                                                                 |
| Dominance  | Initiate    | SHC I, SHD I, Radius I                                             | —                                                                                            |
| Dominance  | Adept       | SHC II, SHD II, Radius II                                          | jeweils I                                                                                    |
| Dominance  | Expert      | SHC III, SHD III, Radius III, Critical Mass                        | Stat jeweils II; Critical Mass: SHC II \| SHD II                                             |
| Dominance  | Master      | SHC IV, SHD IV, Radius IV, Epicenter, Focused Blast                | Stat jeweils III; Verhalten: Critical Mass                                                   |
| Dominance  | Grandmaster | Aftershock                                                         | Epicenter \| Focused Blast                                                                   |
| Valor      | Initiate    | CTC I, CTD I                                                       | —                                                                                            |
| Valor      | Adept       | CTC II, CTD II                                                     | jeweils I                                                                                    |
| Valor      | Expert      | CTC III, CTD III, Vengeful Edge                                    | Stat jeweils II; Vengeful Edge: CTC II \| CTD II                                             |
| Valor      | Master      | CTC IV, CTD IV, Perfect Riposte, Guarded Reprisal                  | Stat jeweils III; Verhalten: Vengeful Edge                                                   |
| Valor      | Grandmaster | Escalating Retaliation                                             | Perfect Riposte \| Guarded Reprisal                                                          |

### 6.2 Weapon-Graphen

| Weapon      | Rank        | Nodes                                              | Direkte Vorgänger                                  |
| ----------- | ----------- | -------------------------------------------------- | -------------------------------------------------- |
| WARHAMMER   | Initiate    | DMG I, DEF I, PRC I                                | —                                                  |
| WARHAMMER   | Adept       | DMG II, DEF II, PRC II                             | jeweils I                                          |
| WARHAMMER   | Expert      | BLK, MAX RNG I, Committed Impact                   | DEF II; PRC II; Committed: DMG II \| PRC II        |
| WARHAMMER   | Master      | MIN RNG, MAX RNG II, Titan’s Arc, Shielded Advance | Range: MAX RNG I; Verhalten: Committed Impact      |
| WARHAMMER   | Grandmaster | Immovable Guard                                    | Titan’s Arc \| Shielded Advance                    |
| TWIN BLADES | Initiate    | DMG I, PRC I, MAX RNG I                            | —                                                  |
| TWIN BLADES | Adept       | DMG II, MIN RNG I, INIT                            | DMG I; PRC I \| MAX RNG I; PRC I                   |
| TWIN BLADES | Expert      | DMG III, PRC II, Twin Measure                      | DMG II; MIN RNG I; Twin Measure: MIN RNG I \| INIT |
| TWIN BLADES | Master      | MIN RNG II, MAX RNG II, Razor’s Edge, Blade Poise  | Stat: PRC II; Verhalten: Twin Measure              |
| TWIN BLADES | Grandmaster | Second Edge                                        | Razor’s Edge \| Blade Poise                        |
| LONGBOW     | Initiate    | DMG I, PRC I, MIN RNG I                            | —                                                  |
| LONGBOW     | Adept       | DMG II, MIN RNG II, INIT                           | DMG I; MIN RNG I; PRC I                            |
| LONGBOW     | Expert      | DMG III, MIN RNG III, Zeroing In                   | DMG II; MIN RNG II; Zeroing: MIN RNG II \| INIT    |
| LONGBOW     | Master      | PRC II, MAX RNG I, Overdraw, Steady Draw           | Stat: MIN RNG III; Verhalten: Zeroing In           |
| LONGBOW     | Grandmaster | Patient Hunter                                     | Overdraw \| Steady Draw                            |

Ein Capstone ist damit ausschließlich über die zentrale Expert- und Master-Linie erreichbar;
Stat-Linien können sie nicht umgehen. Tempests Relentless Pursuit bleibt eine optionale
Seitennode und ist keine Voraussetzung der zentralen Linie.

## 7. Weapon-Mastery-Ansicht

- `WEAPON MASTERY` ist ein eigener Sidebar-Eintrag direkt nach `CRUCIBLE`.
- Links steht eine schmale vertikale Charakterleiste mit Portraits; immer genau ein Charakter
  ist aktiv.
- Oben stehen die fünf Discipline-Tabs. Investierte Punkte werden nur bei einem Wert größer
  null in eckigen Klammern angezeigt, etwa `FINESSE [12]`; es gibt keinen Maximalwert im Tab.
- Der Hauptbereich zeigt die fünf Ranks horizontal von Initiate bis Grandmaster. Innerhalb einer
  Rank-Spalte sind Nodes vertikal verbunden.
- Ein Node-Klick wählt nur aus. Ein fester rechter Inspector zeigt vollständigen Namen,
  aktuellen und nächsten Rang, Wirkung, Voraussetzungen, Sperrgrund, Kosten und den expliziten
  Investieren-Button.
- Master- und Discipline-Capstone-Nodes zeigen ihre Lock-Auswirkung im Inspector. Der explizite
  Button ist die Bestätigung; es gibt keinen zusätzlichen Dialog.
- Discipline-Respec steht im Tab-Header, zeigt den berechneten Goldpreis und verlangt einen
  Bestätigungsdialog mit Preis und Zahl der erstatteten Punkte.
- Bei 1920×1080 passen Charakterleiste, Tabs, aktiver Baum und Inspector ohne Seiten-Scroll in
  eine Ansicht. Kleinere Auflösungen verwenden einen responsiven Fallback.
- Sichtbare Kurzlabels:
  `CHC`, `CHD`, `MHC`, `MHD`, `SHC`, `SHD`, `CTC`, `CTD`, `DMG`, `DEF`, `PRC`,
  `MIN RNG`, `MAX RNG`, `BLK`, `INIT`.

## 8. Persistenz und Laufzeitzustand

- Persistiert werden pro Charakter: freie Mastery Points und der Rang jeder gekauften Node.
- Die Summe aus freien und investierten Mastery Points entspricht immer dem Charakterlevel.
- Exklusive Master-Wahlen und Capstone-Sperren werden aus den Node-Rängen abgeleitet und beim
  Laden validiert; sie benötigen keine zweite persistierte Wahrheitsquelle.
- `Guarded`, Zeroing-Stacks und andere kampfinterne Mastery-Zustände sind Teil des flüchtigen
  Combat-State und werden nie im Save gespeichert.
- Das Pre-Release-Save-Schema wird direkt auf Mastery umgestellt; es gibt keine Migration von
  `freeSkillPoints` oder `spentSkillPoints`.
