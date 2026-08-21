# SPEC — Runen (Endgame / Anvil Sparks)

> Teil der [SPEC](../spec/README.md): Rune Grimoire, Talisman, Rite, Auslösung, Rune-Level und die
> Anvil-Sparks-Nodes.
> Verwandt: [Kampf](COMBAT-RUN.md) · [Crucible](PROGRESSION.md#3-crucible-globaler-skilltree)

---

**Runescribe** ist die Station bzw. Persona des Runenbereichs, analog zu Blacksmith und Jeweler.
In `RUNESCRIBE` konfiguriert sie ausschließlich den Talisman mit Rite des aktuell gewählten
Charakters. Das teamweite `RUNE GRIMOIRE` ist eine eigene Sammelansicht für Inscribe und Etch.
Das **Rune-System** selbst heißt weiterhin Runen; Runescribe bezeichnet nicht die Kampfmechanik
oder ihre Inhalte.

## 1. Grundsatz & Abgrenzung

Runen sind die einzige **qualitative** Fortschritts-Achse: Sie fügen dem Kampf **konditionale
Ereignisse und temporäre Effekte** hinzu. Alle anderen Achsen (Item-Level, Seltenheit, Gems,
Sigils, Weapon Mastery, Attribute) sind **permanente Werte**.

- **Verbindliche Abgrenzung:** Eine Rune trägt **nie** „+X Stat". Was eine Rune tut, muss etwas
  sein, das kein Stat ausdrücken kann — z. B. Barrier **mitten in** der Runde (die sonst nur zu
  Rundenbeginn gesetzt wird, [Rundenablauf](COMBAT-RUN.md#11-rundenablauf)), Schaden, der **Bulwark ignoriert**
  ([Bulwark](DAMAGE-SYSTEM.md#14-bulwark-deckung-der-backline)), ein **temporärer**
  Buff oder eine Extra-Aktion.
- Das gesamte System wird über den **Anvil Sparks**-Tree des Crucible freigeschaltet
  ([Crucible](PROGRESSION.md#3-crucible-globaler-skilltree));
  vor dem `Rune Grimoire`-Node existiert es nicht (kein Talisman, keine Runen, kein Runewords-Drop).

## 2. Träger: Rune Grimoire, Talisman, Rite

| Begriff           | Rolle                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Rune Grimoire** | Katalog **aller** Runen mit Wissensstand und **Level**; die eigene `RUNE GRIMOIRE`-Ansicht ist der Ort für **Inscribe** und **Etch**. |
| **Talisman**      | Das eingravierte Schmuckstück, **eines pro Charakter**. Trägt genau **einen Rite**.                                                   |
| **Rite**          | Die Zeile auf dem Talisman: **Trigger + Effect + Modifier**.                                                                          |

- Der **Talisman ist kein fünfter Armor-Slot**: er trägt **keine** der fünf Item-Schichten
  ([Ausrüstung](CHARACTERS.md#6-ausrüstung)) — kein Innate, kein Item-Level, keine Seltenheit, keine
  Gems — und erscheint **nicht** in der Ausrüstungs-Ansicht, sondern ausschließlich in der
  Runen-Ansicht.
- Das Rune Grimoire ist ein **reiner Wissensstand — kein Bestand, kein Inventar** (Modellform wie
  der Sigil Codex, [Items, Loot & Handwerk](ITEMS.md)). Man besitzt von jeder bekannten Rune
  **genau ein Exemplar** → sie steckt in **höchstens einem** Rite, teamweit. Keine Duplikate,
  keine Stacks.
- Unentdeckte Runen sind als Silhouette mit ihrer Kategorie sichtbar, sobald ihre
  **Mindesttiefe** erreicht ist; der Katalog wächst also mit dem Fortschritt.
- **Umsockeln ist kostenlos und jederzeit möglich.** Eine ausgebaute Rune geht dabei nicht
  verloren und behält ihr Level.

## 3. Aufbau eines Rite

Ein Rite besteht aus drei Runen-Kategorien:

| Kategorie    | Antwortet auf | Pool  | teamweit aktiv |
| ------------ | ------------- | ----- | -------------- |
| **Trigger**  | _Wann?_       | **6** | 3              |
| **Effect**   | _Was?_        | **6** | 3              |
| **Modifier** | _Wie?_        | **5** | 3              |

Bei drei Charakteren mit je einem Rite sind **9 von 17** Runen gleichzeitig aktiv.

**Trigger** — je einer pro Muster; die ersten vier sind an die vier gemeinsamen
[Weapon-Mastery-Disciplines](WEAPON-MASTERY.md#4-gemeinsame-disciplines) gekoppelt. Der Rite
liest damit den gebauten Build:

`OnCrit` · `OnMultiHit` · `OnSplash` · `OnCounter` ·
`OnBlock` ([Schadenspipeline](DAMAGE-SYSTEM.md#13-eingehender-schaden-schadenspipeline), Schritt 3) ·
`OnEvade`

**Effect** — jeder Eintrag ist ein Effekt, den kein Stat leistet:

| Effect       | Wirkung                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Heal**     | heilt die Health des Trägers um einen flachen Effect-Wert                                                                 |
| **Barrier**  | addiert einen flachen Effect-Wert auf Barrier innerhalb der Runde                                                         |
| **Bolt**     | Zusatzschaden auf ein Ziel, **ignoriert den Bulwark-Malus** ([Bulwark](DAMAGE-SYSTEM.md#14-bulwark-deckung-der-backline)) |
| **Empower**  | temporärer `+Y % Attack`-Buff für den Träger                                                                              |
| **Mark**     | einmalige Mark-Ladung für einen späteren Angriff eines anderen Charakters                                                 |
| **Reprisal** | der Charakter handelt **erneut** (Basisangriff, [Charakter-Zug](DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden))   |

**Modifier** — jeder Modifier manipuliert **genau eine** von fünf Facetten eines Effects. Dadurch
ist **jede** Trigger/Effect/Modifier-Kombination automatisch definiert und braucht keine
Kompatibilitätsmatrix:

| Modifier      | Facette       | Wirkung                                                             |
| ------------- | ------------- | ------------------------------------------------------------------- |
| **Echo**      | **Frequenz**  | löst den Effect ein zweites Mal mit einem Echo-Faktor aus           |
| **Chain**     | **Zielmenge** | der Effect erfasst **X weitere** Ziele                              |
| **Prism**     | **Chance**    | addiert Prozentpunkte auf die Trigger-Chance, maximal bis **100 %** |
| **Surge**     | **Magnitude** | verstärkt die Effect-Magnitude um **+X %**                          |
| **Lingering** | **Dauer**     | wiederholt den gespeicherten Effect zu Beginn folgender Runden      |

## 4. Auslösung (verbindlich)

Ein vollständiger Rite benötigt Trigger und Effect; der Modifier ist optional. Ein Trigger reagiert
ausschließlich auf Events des eigenen Charakters (Korvins Rite feuert nicht auf Rhayas Crit):

| Trigger        | Qualifizierendes eigenes Event                                     |
| -------------- | ------------------------------------------------------------------ |
| **OnCrit**     | erster kritischer Basis-, Multi-Hit-, Splash- oder Counter-Treffer |
| **OnMultiHit** | Erzeugung des ersten Multi-Hits, nicht jedes Kettenglied           |
| **OnSplash**   | Erzeugung mindestens eines Splash-Treffers, nicht jedes Nebenziel  |
| **OnCounter**  | der tatsächlich ausgeführte Counter-Angriff                        |
| **OnBlock**    | ein erfolgreich geblockter eingehender Treffer                     |
| **OnEvade**    | ein erfolgreich ausgewichener eingehender Treffer                  |

- Das **erste** qualifizierende Event reserviert einen Rite für diese Runde. Nach Abschluss der
  auslösenden Handlung erhält er **genau einen** seedbaren Trigger-Wurf. Erfolg löst den Effect
  aus; Fehlschlag sperrt den Rite bis zum Rundenende. Weitere passende Events eröffnen niemals
  einen zweiten Versuch. Kein Modifier umgeht dieses Limit.
- Stirbt der Träger oder ein gebundenes Ziel vor diesem Wurf, verfällt der Proc ohne Würfelwurf
  und ohne Log-Eintrag; der Rite bleibt für die Runde reserviert.
- Rune-erzeugte Effekte emittieren keine Trigger-Events. Reprisal führt zwar normale offensive
  Procs aus, ist selbst aber kein Trigger-Kandidat. Es gibt keine Rune-Ketten und keine
  Selbst-Retriggerung.
- Aller Zufall bleibt beim seedbaren PRNG
  ([Feststehende Regeln](DAMAGE-SYSTEM.md#15-feststehende-regeln)).

### 4.1 Ausführungsreihenfolge

- Eine Charakterhandlung rechnet erst alle normalen Treffer ab. Verbrauchte Mark-Ladungen folgen
  als separate Bonus-Hits in der Reihenfolge, in der ihre Ziele erstmals in der Trefferliste
  vorkommen. Danach folgen Trigger-Wurf und gegebenenfalls der eigene Rite-Effect, dann die
  reguläre Regeneration.
- Ein Gegnerangriff rechnet erst die Team-Schadenspipeline und alle Counter ab. Fällige Rites
  folgen danach in Slot-Reihenfolge Korvin → Rhaya → Quinn.
- Erfolgreiche Rite-Auslösungen und ihre Folgen sind strukturierte Combat-Events. Fehlgeschlagene
  Trigger-Würfe erscheinen nicht im Combat Log.

### 4.2 Ziele und Basis-Effects

- Direkte gegnergerichtete Effects bleiben am auslösenden Gegner gebunden. Ist er bei der
  Ausführung besiegt, verfällt der Effect statt ein Ersatzziel zu wählen.
- **Bolt** ist ein separater Hit auf den gebundenen Gegner. Bei OnCrit, OnMultiHit, OnSplash und
  OnCounter ist seine Referenz die Summe der rohen normalen Treffer des Trägers gegen diesen
  Gegner; bei OnBlock und OnEvade die rohe Attack des Trägers. Bolt ignoriert Bulwark, würfelt
  weder Precision noch Damage Range noch Crit und erzeugt keine Trigger.
- **Mark** legt auf den gebundenen Gegner eine Ladung. Die erste normale Angriffshandlung eines
  anderen lebenden Charakters, die diesen Gegner trifft — regulärer Zug, Counter oder Reprisal —
  summiert ihre normalen Treffer gegen ihn und verbraucht eine Ladung für einen separaten
  Mark-Bonus-Hit. Rune-Bolt und Mark-Boni selbst zählen nicht zur Referenz und verbrauchen keine
  Ladung. Eine normale neue Mark-Auslösung entfernt bestehende Mark-Ladungen und legt genau eine
  neue an.
- **Heal**, **Barrier** und **Empower** betreffen nur den lebenden Träger. Heal überheilt nicht;
  Barrier addiert auf den vorhandenen Pool und verfällt mit dem Rundenbeginn-Reset. Empower gibt
  sofort `+Y % Attack`, zählt die angebrochene Runde nicht gegen seine Dauer und hält über `X`
  vollständige Folgerunden. Eine erneute normale Empower-Auslösung ersetzt Stärke und Dauer.
- **Reprisal** ist ein zusätzlicher Basisangriff mit normaler Zielwahl sowie normalen offensiven
  Procs, aber ohne zusätzliche Regeneration und ohne neue Trigger-Kandidaten.
- Keine Rune heilt oder belebt Gegner. Der Endlichkeits-Beweis jedes Kampfes
  ([Rundenablauf](COMBAT-RUN.md#11-rundenablauf)) beruht auf monoton sinkender Gegner-Gesamt-Health.

### 4.3 Modifier-Auflösung

- **Echo** führt eine zweite, über den Echo-Faktor skalierte Auslösung aus. Echo-Mark legt zwei
  getrennt verbrauchbare Ladungen auf dasselbe Ziel; Echo-Empower fasst Basis- und Echo-Anteil zu
  einem Buff mit gemeinsamer Dauer zusammen.
- **Chain** erweitert gegnergerichtete Effects auf weitere lebende Gegner: zuerst dieselbe Lane,
  dann die reguläre Gegnerpriorität; bereits gewählte Ziele werden übersprungen. Selbst-Effects
  erfassen weitere lebende Charaktere in Slot-Reihenfolge Korvin → Rhaya → Quinn. Chain-Reprisal
  greift weitere für den Träger legal erreichbare Gegner an.
- **Prism** addiert seine Prozentpunkte vor dem einzigen Trigger-Wurf; die gesamte Trigger-Chance
  ist bei 100 % gedeckelt.
- **Surge** multipliziert die Basis-Magnitude eines Effects. Bei Reprisal multipliziert es den
  rohen Schaden des zusätzlichen Basisangriffs; Zielwahl und offensive Procs bleiben unverändert.
- **Lingering** speichert Ziel und berechnete Stärke eines Effects und wiederholt ihn nach dem
  Barrier-Reset zu Beginn jeder Folgerunde seines Levels, vor der ersten Queue-Aktion. Direkte
  Effects und Self-Effects verfallen bei einem besiegten Ziel beziehungsweise Träger;
  Lingering-Reprisal wählt sein Ziel jeweils normal. Jede Lingering-Mark-Wiederholung fügt eine
  weitere Mark-Ladung hinzu.

## 5. Rune-Level

Jede Rune hat ein **Level**; jede Kategorie levelt ihre eigene Facette, damit alle drei Runen
eines Rite lohnende Ziele sind:

| Kategorie    | Was das Level hebt                                                                            |
| ------------ | --------------------------------------------------------------------------------------------- |
| **Effect**   | die **Basis-Magnitude**                                                                       |
| **Trigger**  | die **Auslösechance** des einzigen Trigger-Wurfs                                              |
| **Modifier** | die **Stärke der Modifikation** (Echo-Faktor, Chain-Zielzahl, Prism-Chance, Surge, Lingering) |

- **Level-Cap = Stand des `Rune Mastery`-Nodes** ([§8](#8-anvil-sparks-nodes)). Der
  `Rune Grimoire`-Node bringt Cap **1** mit, `Rune Mastery` hebt es auf **2/3/4/5**.
- Daraus ergeben sich zwei Phasen der Runewords-Verwendung: solange das Cap 1 ist, fließen
  Runewords
  vollständig in **Inscribe** (Entdeckung); mit steigendem Cap in **Etch** (Investition).

## 6. Runewords (Drop)

Verbindlicher Wohnort der Runewords-Drop-Regeln.

- Droppt von **allen** Gegnern, **sobald der `Rune Grimoire`-Node freigeschaltet ist** — vorher
  gar nicht.
- Elite/Boss-Bonus, Ausschüttung nach Floor-Tiefe gestaffelt (Kurve = Balancing).
- Finanziert **Inscribe** (neue Rune) und **Etch** (Rune aufleveln), siehe unten.

## 7. Rune-Grimoire-Aktionen

- **Inscribe (neue Rune):** **pro Kategorie** ein eigenes Rezept — man wählt Trigger, Effect oder
  Modifier und erhält eine **zufällige noch unbekannte** Rune dieser Kategorie, gezogen aus
  dem nach **Mindesttiefe** gestaffelten Pool. Kosten: Runewords + Gold.
  - **Es werden ausschließlich Unbekannte gezogen** — keine Duplikate, keine Fehlzüge
    (Design-Absicht: [DESIGN §6](../DESIGN.md#6-bewusste-nicht-ziele-design-perspektive)).
  - Ist eine Kategorie vollständig entdeckt, entfällt ihr Rezept.
- **Etch (Rune aufleveln):** hebt das Level einer bekannten Rune um eine Stufe bis zum Cap.
  Kosten: Runewords + Gold, pro Level steigend. Kein RNG.
- Der **`Rune Grimoire`-Node schenkt** einen Starter-Trigger und einen Starter-Effect, damit im
  Moment der Freischaltung ein vollständiger Rite gelegt werden kann (analog zum garantierten
  ersten Sigil-Drop, [Items, Loot & Handwerk](ITEMS.md)).

## 8. Anvil-Sparks-Nodes

| Node              | Level | Wirkung                                                                            | Relic Shards |
| ----------------- | ----- | ---------------------------------------------------------------------------------- | ------------ |
| **Rune Grimoire** | 1     | System an: Runewords-Drops, Starter-Trigger + Starter-Effect, Rune-Level-Cap **1** | 1            |
| **Talisman**      | 1–3   | Talisman mit Rite (**Trigger + Effect**) für Charakter 1 / 2 / 3                   | 6            |
| **Runic Focus**   | 1–3   | **Modifier**-Slot für Charakter 1 / 2 / 3                                          | 6            |
| **Rune Mastery**  | 1–4   | Rune-Level-Cap **2 / 3 / 4 / 5**                                                   | 10           |
|                   |       |                                                                                    | **23**       |

`Talisman` und `Runic Focus` sind **charakterweise** gestaffelt — Stufe `n` schaltet den Slot für
Charakter `n` frei (Design-Absicht: [DESIGN §3.2](../DESIGN.md#3-player-experience--der-kern-loop)).

<!-- TODO (Balancing, `src/game/`): konkreter Runen-Katalog (17 Einträge: Name, Mindesttiefe,
     Level-Skalierung je Stufe), Trigger-Chance-Kurven, Runewords-Drop-Kurve, Inscribe-/Etch-Kosten,
     Effect-Magnituden, Echo-Faktor, Chain-Zielzahl, Prism-Bonus, Surge und Lingering-Dauer je Level. -->
