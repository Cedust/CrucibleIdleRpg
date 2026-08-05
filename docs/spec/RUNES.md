# SPEC — Runen (Endgame / Masterwork)

> Teil der [SPEC](../spec/README.md): Rune Grimoire, Talisman, Rite, Auslösung, Rune-Level und die
> Masterwork-Nodes.
> Verwandt: [Kampf](COMBAT-RUN.md) · [Crucible](PROGRESSION.md#3-crucible-globaler-skilltree)

---

## 1. Grundsatz & Abgrenzung

Runen sind die einzige **qualitative** Fortschritts-Achse: Sie fügen dem Kampf **konditionale
Ereignisse und temporäre Effekte** hinzu. Alle anderen Achsen (Item-Level, Seltenheit, Gems,
Sigils, Skilltree, Attribute) sind **permanente Werte**.

- **Verbindliche Abgrenzung:** Eine Rune trägt **nie** „+X Stat". Was eine Rune tut, muss etwas
  sein, das kein Stat ausdrücken kann — z. B. Barrier **mitten in** der Runde (die sonst nur zu
  Rundenbeginn gesetzt wird, [Rundenablauf](COMBAT-RUN.md#11-rundenablauf)), Schaden, der **Bulwark ignoriert**
  ([Bulwark](DAMAGE-SYSTEM.md#14-bulwark-deckung-der-backline)), ein **temporärer**
  Buff oder eine Extra-Aktion.
- Das gesamte System wird über den **Masterwork**-Tree des Crucible freigeschaltet
  ([Crucible](PROGRESSION.md#3-crucible-globaler-skilltree));
  vor dem `Rune Grimoire`-Node existiert es nicht (kein Talisman, keine Runen, kein Runedust-Drop).

## 2. Träger: Rune Grimoire, Talisman, Rite

| Begriff           | Rolle                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| **Rune Grimoire** | Katalog **aller** Runen mit Wissensstand und **Level**. Zugleich die Station für **Inscribe** und **Etch**. |
| **Talisman**      | Das eingravierte Schmuckstück, **eines pro Charakter**. Trägt genau **einen Rite**.                         |
| **Rite**          | Die Zeile auf dem Talisman: **Trigger + Effect + Modifier**.                                                |

- Der **Talisman ist kein siebter Ausrüstungs-Slot**: er trägt **keine** der vier Item-Schichten
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

**Trigger** — je einer pro Muster; die ersten vier sind an die vier Skilltree-Zweige gekoppelt
([Charakter-Skilltree](CHARACTERS.md#4-charakter-skilltree)), der Rite liest damit den gebauten Build:

`OnCrit` · `OnMultiHit` · `OnSplash` · `OnCounter` ·
`OnBlock` ([Schadenspipeline](DAMAGE-SYSTEM.md#13-eingehender-schaden-schadenspipeline), Schritt 3) ·
`OnEvade`

**Effect** — jeder Eintrag ist ein Effekt, den kein Stat leistet:

| Effect       | Wirkung                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Heal**     | heilt Health                                                                                                              |
| **Barrier**  | setzt Barrier **innerhalb** der Runde, zusätzlich zum Rundenbeginn-Wert ([Rundenablauf](COMBAT-RUN.md#11-rundenablauf))   |
| **Bolt**     | Zusatzschaden auf ein Ziel, **ignoriert den Bulwark-Malus** ([Bulwark](DAMAGE-SYSTEM.md#14-bulwark-deckung-der-backline)) |
| **Empower**  | temporärer Stat-Buff für X Runden — die **einzige** Quelle temporärer Buffs im Spiel                                      |
| **Mark**     | markiertes Ziel erleidet für X Runden **+Y % Schaden**                                                                    |
| **Reprisal** | der Charakter handelt **erneut** (Basisangriff, [Charakter-Zug](DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden))   |

**Modifier** — jeder Modifier manipuliert **genau eine** von vier Facetten eines Effects. Dadurch
ist **jede** Trigger/Effect/Modifier-Kombination automatisch definiert und braucht keine
Kompatibilitätsmatrix:

| Modifier      | Facette       | Wirkung                                                        |
| ------------- | ------------- | -------------------------------------------------------------- |
| **Echo**      | **Frequenz**  | der Effect löst **2×** aus                                     |
| **Chain**     | **Zielmenge** | der Effect erfasst **X weitere** Ziele                         |
| **Prism**     | **Zielmenge** | ein auf den Träger wirkender Effect erfasst **das ganze Team** |
| **Surge**     | **Magnitude** | Stärke skaliert mit einem **Stat des Trägers**                 |
| **Lingering** | **Dauer**     | der Effect wiederholt sich zu Beginn der **nächsten Runde**    |

## 4. Auslösung (verbindlich)

- **Ein Rite löst maximal einmal pro Runde aus** — beim **ersten** qualifizierenden Event.
  **Ohne Ausnahme:** Keine Rune und kein Modifier hebt dieses Limit.
  Konsequenz: Rune-Stärke skaliert über das **Rune-Level**, nicht über die Proc-Rate. Ein
  `OnCrit`-Rite ist bei 20 % und bei 100 % Crit Chance gleich stark, nur zuverlässiger.
- Ein Trigger reagiert **ausschließlich auf Events des eigenen Charakters** (Korvins Rite feuert
  nicht auf Rhayas Crit).
- **Rune-erzeugte Effekte emittieren keine Trigger-Events.** Es gibt keine Rune-Ketten und keine
  Selbst-Retriggerung.
- **Keine Rune heilt oder belebt Gegner.** Der Endlichkeits-Beweis jedes Kampfes
  ([Rundenablauf](COMBAT-RUN.md#11-rundenablauf)) beruht
  auf **monoton sinkender** Gegner-Gesamt-Health.
- Aller Zufall bleibt beim seedbaren PRNG ([Feststehende Regeln](DAMAGE-SYSTEM.md#15-feststehende-regeln)).

## 5. Rune-Level

Jede Rune hat ein **Level**; jede Kategorie levelt ihre eigene Facette, damit alle drei Runen
eines Rite lohnende Ziele sind:

| Kategorie    | Was das Level hebt                                                              |
| ------------ | ------------------------------------------------------------------------------- |
| **Effect**   | die **Basis-Magnitude**                                                         |
| **Trigger**  | einen **+% Magnitude**-Aufschlag auf den gesamten Rite (Attunement)             |
| **Modifier** | die **Stärke der Modifikation** (Echo: Kraft der 2. Auslösung; Chain: Zielzahl) |

- **Level-Cap = Stand des `Rune Mastery`-Nodes** ([§8](#8-masterwork-nodes)). Der
  `Rune Grimoire`-Node bringt Cap **1** mit, `Rune Mastery` hebt es auf **2/3/4/5**.
- Daraus ergeben sich zwei Phasen der Runedust-Verwendung: solange das Cap 1 ist, fließt Dust
  vollständig in **Inscribe** (Entdeckung); mit steigendem Cap in **Etch** (Investition).

## 6. Runedust (Drop)

Verbindlicher Wohnort der Runedust-Drop-Regeln.

- Droppt von **allen** Gegnern, **sobald der `Rune Grimoire`-Node freigeschaltet ist** — vorher
  gar nicht.
- Elite/Boss-Bonus, Ausschüttung nach Floor-Tiefe gestaffelt (Kurve = Balancing).
- Finanziert **Inscribe** (neue Rune) und **Etch** (Rune aufleveln), siehe unten.

## 7. Rune-Grimoire-Aktionen

- **Inscribe (neue Rune):** **pro Kategorie** ein eigenes Rezept — man wählt Trigger, Effect oder
  Modifier und erhält eine **zufällige noch unbekannte** Rune dieser Kategorie, gezogen aus
  dem nach **Mindesttiefe** gestaffelten Pool. Kosten: Runedust + Gold.
  - **Es werden ausschließlich Unbekannte gezogen** — keine Duplikate, keine Fehlzüge
    (Design-Absicht: [DESIGN §5](../DESIGN.md#5-bewusste-nicht-ziele-design-perspektive)).
  - Ist eine Kategorie vollständig entdeckt, entfällt ihr Rezept.
- **Etch (Rune aufleveln):** hebt das Level einer bekannten Rune um eine Stufe bis zum Cap.
  Kosten: Runedust + Gold, pro Level steigend. Kein RNG.
- Der **`Rune Grimoire`-Node schenkt** einen Starter-Trigger und einen Starter-Effect, damit im
  Moment der Freischaltung ein vollständiger Rite gelegt werden kann (analog zum garantierten
  ersten Sigil-Drop, [Items, Loot & Handwerk](ITEMS.md)).

## 8. Masterwork-Nodes

| Node              | Level | Wirkung                                                                           | Crystals |
| ----------------- | ----- | --------------------------------------------------------------------------------- | -------- |
| **Rune Grimoire** | 1     | System an: Runedust-Drops, Starter-Trigger + Starter-Effect, Rune-Level-Cap **1** | 1        |
| **Talisman**      | 1–3   | Talisman mit Rite (**Trigger + Effect**) für Charakter 1 / 2 / 3                  | 6        |
| **Runic Focus**   | 1–3   | **Modifier**-Slot für Charakter 1 / 2 / 3                                         | 6        |
| **Rune Mastery**  | 1–4   | Rune-Level-Cap **2 / 3 / 4 / 5**                                                  | 10       |
|                   |       |                                                                                   | **23**   |

`Talisman` und `Runic Focus` sind **charakterweise** gestaffelt — Stufe `n` schaltet den Slot für
Charakter `n` frei (Design-Absicht: [DESIGN §3.2](../DESIGN.md#3-player-experience--der-kern-loop)).

<!-- TODO (Balancing, `src/game/`): konkreter Runen-Katalog (17 Einträge: Name, Mindesttiefe,
     Level-Skalierung je Stufe), Runedust-Drop-Kurve, Inscribe-/Etch-Kosten, Dauer-Werte für
     Empower/Mark/Lingering, Chain-Zielzahl je Level, Surge-Bezugs-Stat je Rune. -->
