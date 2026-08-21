# SPEC — Kampfablauf

> Verbindlich: Kampfzustand, Runden, Initiative, Zielauswahl und Formation.
> Verwandt: [Schadenssystem](DAMAGE-SYSTEM.md) · [Signatur-Skills](SIGNATURES.md) · [Simulation](SIMULATION.md)

---

## 1. Kampf — Grundmodell

- Kampf ist **rundenbasiert** zwischen eigenem Team (drei Charaktere,
  [Team](CHARACTERS.md#1-team)) und einer Gegnerformation (bis zu sechs Gegner,
  [§1.3](#13-gegnerformation)).
- Der Kampf ist **deterministisch** und render-unabhängig simuliert (Simulation ≠ Rendering,
  inkrementelle Ausführung: [Simulation & Zeitverhalten](SIMULATION.md#1-grundmodell-verbindlich)).
- Ergebnis eines Kampfes ist **Sieg** (alle Gegner besiegt) oder **Niederlage/Wipe**
  (alle Charaktere besiegt). Ein Sieg erzeugt eine Belohnung (einziger Fortschrittsweg, siehe
  [DESIGN §2](../DESIGN.md#2-design-pillars)).
- Es gibt **keine aktiven, vom Spieler ausgelösten Fähigkeiten** im Kampf. Der Kampf
  läuft vollständig automatisch ab; der Spieler beeinflusst ihn ausschließlich **vor**
  dem Kampf über Charakter-Builds und Ausrüstung. (Die Architektur bleibt für spätere
  aktive Eingriffe offen, DESIGN-Pillar 4 — aktuell nicht umgesetzt.)

### 1.1 Rundenablauf

Ein Kampf besteht aus **Runden**. In jeder Runde handelt jeder lebende Akteur
(Charaktere und Gegner) **genau einmal**.

**Reihenfolge (Initiative):**

- Alle lebenden Akteure handeln **absteigend nach Initiative**.
- Charaktere haben einen festen Initiative-Wert (Stat, [Team](CHARACTERS.md#1-team)).
- Gegner haben eine **Initiative-Range**; ihr konkreter Wert wird **einmalig zu
  Kampfbeginn** per PRNG innerhalb der Range gewürfelt und bleibt für den restlichen
  Kampf fix. Gewürfelt wird in **Formations-Index-Reihenfolge** (Frontline 1–3, dann
  Backline 1–3), damit die PRNG-Sequenz festliegt.
- Die Reihenfolge ist eine **totale Ordnung** in drei Stufen:
  1. höhere Initiative zuerst,
  2. bei Gleichstand **Gegner vor Charakter**,
  3. bei Gleichstand innerhalb einer Seite **niedrigerer Slot-Index** zuerst — Charaktere in
     Team-Reihenfolge (Korvin → Rhaya → Quinn, [Team](CHARACTERS.md#1-team)), Gegner in
     Formations-Index-Reihenfolge.
- Die Ordnung verbraucht **keinen** PRNG-Zug und ist damit für jeden Zustand eindeutig
  bestimmt.

**Zugreihenfolge als Pending-Queue:**

- Zu Rundenbeginn wird aus allen **lebenden** Akteuren eine nach obiger Ordnung sortierte
  Liste gebildet. Sie ist Teil des Kampfzustands. **Momentum**
  ([Momentum](SIGNATURES.md#23-momentum-nach-suppression)) wirkt genau hier: Es erhöht die
  Initiative der lebenden Charaktere für diese Sortierung temporär, ohne einen Stat zu verändern.
- Ein Zug entnimmt das vorderste Element. Die Queue enthält damit stets nur noch
  **offene** Aktionen.
- Stirbt ein Akteur, wird er aus der Queue entfernt — seine Aktion entfällt.
- **Suppression** ([Suppression](SIGNATURES.md#13-suppression-quinn-ranged)) ist die einzige Operation, die die
  **bereits gebildete** Queue umsortiert: Sie verschiebt die noch offene Aktion eines Gegners
  **innerhalb der laufenden Runde** nach hinten.

**Ablauf einer Runde:**

1. **Rundenbeginn:** Für jeden lebenden Charakter wird die **Barrier** neu gesetzt
   (Höhe = Barrier-Stat). Nicht verbrauchte Barrier der Vorrunde **verfällt** — Barrier
   **stackt nicht** über Runden. Danach laufen fällige
   [Lingering-Effects](RUNES.md#43-modifier-auflösung) in Slot-Reihenfolge, bevor die erste
   Queue-Aktion beginnt.
2. **Aktionen** in Initiative-Reihenfolge:
   - **Charakter am Zug:** ein Basisangriff auf sein priorisiertes Ziel
     ([§1.2](#12-zielauswahl)), inklusive der Offensiv-Procs
     ([Ausgehender Schaden](DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden)). Danach folgen
     [Mark und Rite](RUNES.md#41-ausführungsreihenfolge); **direkt nach der eigenen Handlung**
     heilt die Regeneration den Charakter.
   - **Gegner am Zug:** ein Angriff gegen das **gesamte Team** (Team-weit, verteilt über die
     Schadenspipeline [§2.3](DAMAGE-SYSTEM.md#13-eingehender-schaden-schadenspipeline)). Gegner wählen **keine**
     Einzelziele. **Nachdem** die Pipeline für **alle** Charaktere abgeschlossen ist, lösen die
     Counter aus ([Ausgehender Schaden](DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden)) — in **Slot-Reihenfolge**
     (Korvin → Rhaya → Quinn), nicht verschachtelt in die Verteilung. Danach folgen fällige
     [Rites](RUNES.md#41-ausführungsreihenfolge) derselben Slot-Reihenfolge.
   - **Suppression** ([Suppression](SIGNATURES.md#13-suppression-quinn-ranged)) kann die noch offene Aktion eines
     Gegners **innerhalb der Runde nach hinten** verschieben — maximal bis an das Rundenende.
     Jeder lebende Gegner handelt weiterhin **genau einmal** pro Runde; eine Aktion entfällt
     ausschließlich, wenn der Gegner vor seinem verschobenen Zug stirbt.
3. **Rundenende:** keine gesonderten Effekte. Regeneration triggert pro Akteur, Barrier wird
   erst zu Rundenbeginn der Folgerunde angefasst (Schritt 1).

**Abbruch-/Endbedingungen:**

- **Sieg:** alle Gegner besiegt.
- **Niederlage/Wipe:** alle Charaktere besiegt → Kampf endet ohne Belohnung (siehe
  [Checkpoints, Wipe & Abbruch](PROGRESSION.md#4-checkpoints-wipe--abbruch)).
- **Manueller Abbruch:** Der Spieler kann einen laufenden Kampf jederzeit abbrechen
  (verlässt den Dungeon, keine Belohnung für den laufenden Floor,
  [Checkpoints, Wipe & Abbruch](PROGRESSION.md#4-checkpoints-wipe--abbruch)).
- **Kein Rundenlimit** — kein automatischer Runden-Cap.
  - **Endlichkeits-Zusicherung:** Gegner haben keine Heilung und Charakterangriffe verursachen
    stets vollen, positiven Schaden ([Treffermodell](DAMAGE-SYSTEM.md#12-treffermodell)), die Gegner-Gesamt-Health sinkt
    also **monoton** → jeder Kampf ist in **endlicher** Rundenzahl entschieden. Diese Zusicherung
    darf kein Feature verletzen (siehe [Auslösung](RUNES.md#4-auslösung-verbindlich)).
  - **Kein Blockieren:** Es wird nur eine Runde pro Anzeige-Takt gerechnet, im Catch-up
    ebenfalls an Echtzeit gebunden ([Simulation & Zeitverhalten](SIMULATION.md#1-grundmodell-verbindlich)).

### 1.2 Zielauswahl

**Gegner → Team (bewusste Asymmetrie):**

- Gegner wählen **kein** Einzelziel. Jeder Gegner-Angriff richtet sich gegen das
  **gesamte Team** und wird über die Schadenspipeline
  ([Schadenspipeline](DAMAGE-SYSTEM.md#13-eingehender-schaden-schadenspipeline)) auf die Charaktere verteilt.

**Charakter → Gegner:**

- Charaktere greifen **immer genau einen** Gegner an (plus mögliche Splash-Nebenziele,
  [§2.1](DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden)).
- **Tank- & Melee-Charakter:** können **nur die Frontline** angreifen, solange dort Gegner
  leben. Ein **Taunt** zwingt sie, einen lebenden gegnerischen Tank **vorrangig**
  anzugreifen.
- **Ranged-Charakter:** umgeht den Taunt und kann die **Backline von Beginn an** anvisieren,
  zahlt dafür aber einen laufenden **Bulwark-Malus** ([Bulwark](DAMAGE-SYSTEM.md#14-bulwark-deckung-der-backline)),
  solange Frontline-Gegner leben.
- **Priorisierung innerhalb der wählbaren Ziele:** Gegner mit der **höchsten Initiative
  zuerst**.

### 1.3 Gegnerformation

- Gegner stehen in einer **2×3-Formation**: zwei **Lanes** (Frontline, Backline) mit je
  drei Slots → **maximal sechs Gegner** pro Kampf.
- **Rollen:** Tank und Melee stehen in der **Frontline**, Ranged in der **Backline**.
  **Maximal ein Tank-Gegner** pro Kampf.
- Gegner-Stats: **Health, Attack, Accuracy, Initiative** (nur diese vier). Gegner haben
  **keine** Defense und **keine** Evasion → Charakter-Angriffe treffen immer und werden
  nicht gemindert ([Treffermodell](DAMAGE-SYSTEM.md#12-treffermodell)).
- Die Frontline schützt die Backline (Bulwark, [§2.4](DAMAGE-SYSTEM.md#14-bulwark-deckung-der-backline)).
