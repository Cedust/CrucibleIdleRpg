# SPEC — Signatur-Skills & Molten Cast

> Verbindlich: die Kampfwirkung von Mitigation, Sunder, Suppression und den
> Molten-Cast-Vertiefungen.
> Verwandt: [Kampfablauf](COMBAT-RUN.md) · [Schadenssystem](DAMAGE-SYSTEM.md) · [Team & Charaktere](CHARACTERS.md)

---

## 1. Signatur-Skills (Kampfwirkung)

**Verbindlicher Wohnort der Kampfwirkung der drei Signatur-Skills.** Wer welchen Skill hat und
wie er freigeschaltet wird, steht in [Signatur-Skills](CHARACTERS.md#7-signatur-skills);
Design-Absicht in
[DESIGN §3.1](../DESIGN.md#3-player-experience--der-kern-loop).

- Jeder Skill belegt einen eigenen, sonst unberührten Kampf-Hebel: Schadensverteilung
  ([Eingehender Schaden](DAMAGE-SYSTEM.md#13-eingehender-schaden-schadenspipeline)), Bulwark/Formation
  ([Bulwark](DAMAGE-SYSTEM.md#14-bulwark-deckung-der-backline)) und Zug-Ökonomie ([Rundenablauf](COMBAT-RUN.md#11-rundenablauf)).
- **Kein Signatur-Skill hebt die eigene Rollen-Penalty auf** (Taunt/Bulwark/Frontline-Lock,
  [§1.2](COMBAT-RUN.md#12-zielauswahl)).
- Vor Freischaltung des zugehörigen Crucible-Knotens existiert der Effekt nicht.
- Die Skills führen **keinen** Zusatz-RNG ein; aller Zufall bleibt beim seedbaren PRNG
  ([Feststehende Regeln](DAMAGE-SYSTEM.md#15-feststehende-regeln)).

### 1.1 Mitigation (Korvin, Tank)

- Leitet einen Anteil `m` des DD-Ticks auf den Tank um — Formel und Summen-Erhaltung in
  [§1.3](DAMAGE-SYSTEM.md#13-eingehender-schaden-schadenspipeline), Schritt 1.
- `m` beträgt auf Node-Rang 1–5 genau `10/15/20/25/30 %`.
- **Test-Vektor:** Bei einem Team-Tick von `300` und drei lebenden Charakteren entstehen vor
  jeder persönlichen Minderung auf Rang 1 die Ticks Tank/DD/DD `120/90/90`, auf Rang 5
  `160/70/70`. Beide Verteilungen erhalten die Summe `300`.

### 1.2 Sunder (Rhaya, Melee)

- Jeder **Angriff** Rhayas reduziert den **Bulwark-Beitrag** `bᵢ` jedes dabei mindestens einmal
  getroffenen Frontline-Gegners
  ([Bulwark](DAMAGE-SYSTEM.md#14-bulwark-deckung-der-backline)).
- Pro Angriff und Ziel wird Sunder genau einmal angewandt. Multi Hit und wiederholte Treffer
  desselben Angriffs stapeln es nicht zusätzlich; verschiedene getroffene Frontline-Ziele
  erhalten jeweils eine Anwendung. Ein Counter ist ein eigenständiger Angriff.
- Der Abbau je Angriff beträgt auf Node-Rang 1–5 `2/4/6/8/10` Prozentpunkte. Das kumulative
  Abbau-Cap je Ziel und Kampf beträgt `4/8/12/16/20` Prozentpunkte. `bᵢ` fällt nie unter `0`.
- Der Abbau gilt nur für die Dauer des laufenden Kampfes; es gibt keinen Übertrag zwischen
  Floors. Die Treffer eines bereits begonnenen Angriffs verwenden den Bulwark-Stand zu
  Angriffsbeginn, Sunder beeinflusst erst nachfolgende Angriffe.
- **Test-Vektor:** Auf Rang 5 sinkt `bᵢ = 0,30` nach zwei getrennten Angriffen auf `0,10` und
  stoppt am Cap. Fünf Treffer derselben Multi-Hit-Kette senken nur einmal auf `0,20`. Trifft
  derselbe Angriff zwei Frontline-Ziele, sinkt der Beitrag beider Ziele jeweils einmal um `0,10`.

### 1.3 Suppression (Quinn, Ranged)

- Quinns Treffer verschiebt die **noch offene Aktion** des getroffenen Gegners um `L` Plätze
  **nach hinten** in der **Pending-Queue** der laufenden Runde ([Rundenablauf](COMBAT-RUN.md#11-rundenablauf));
  `L` = Node-Level 1–5, ein Platz pro Level.
- **Operation** auf der Pending-Queue — `L` zählt in **offenen** Einträgen:

  ```
  idx = Position des Ziels in der Pending-Queue
  Queue.remove(idx)
  Queue.insert(min(idx + L, Queue.length))
  ```

  Die Aktion rutscht damit maximal an das Rundenende und **verfällt nie**. **Kein Übertrag** in
  die nächste Runde. Steht das Ziel bereits als Letztes oder hat es in dieser Runde schon
  gehandelt, ist die Verschiebung `0`.

- **Rechenbeispiel (Test-Vektor).** Node-Level `L = 2`; Quinn hat gerade gehandelt und dabei
  Gegner `E2` getroffen.

  ```
  Pending-Queue vor der Operation (Quinn bereits entnommen):
    [0] E2   [1] E1   [2] Rhaya   [3] E4   [4] Korvin

  idx = 0
  remove(0)          → [E1, Rhaya, E4, Korvin]
  insert(min(0+2, 4) = 2)  → [E1, Rhaya, E2, E4, Korvin]

  Randfall — Ziel steht schon hinten (idx = 3, L = 2):
    remove(3)        → [E1, Rhaya, E2, Korvin]
    insert(min(3+2, 4) = 4)  → [E1, Rhaya, E2, Korvin, E4]   ⇒ effektiv +1 statt +2
  ```

  Was der Vektor absichert: `L` zählt in **offenen** Einträgen (Quinn ist nicht mehr enthalten,
  Rhaya und Korvin zählen mit); `min(…, Queue.length)` **nach** dem `remove` klemmt die Position,
  die Aktion fällt nie heraus; ein zweiter Treffer auf `E2` in derselben Runde verschiebt `0`.

- **Cap: ein Gegner kann pro Runde höchstens einmal supprimiert werden** (Flag pro Ziel und
  Runde). Damit ist auch Multi Hit ([Ausgehender Schaden](DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden)) abgedeckt — der
  erste Treffer verschiebt, alle weiteren um `0`. **Splash**-Nebenziele werden **nicht**
  verschoben; Suppression wirkt ausschließlich auf das **primäre Ziel**.
- **Counter** ([Ausgehender Schaden](DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden)) suppresst strukturell nie:
  Ein Counter trifft immer einen Gegner, der gerade gehandelt hat und damit nicht mehr in der
  Pending-Queue steht.
- **Zeitpunkt:** nach dem vollständigen Angriff (Grundtreffer, Multi-Hit-Kette, Splash) — sofern
  das Primärziel noch **lebt**, noch **nicht gehandelt** hat und in dieser Runde noch **nicht
  supprimiert** wurde.
- Wirkt nur auf **Gegner**; die Reihenfolge der eigenen Charaktere bleibt unberührt.
- **Der Delay hängt nicht am Schaden** — Quinns Bulwark-Malus
  ([Bulwark](DAMAGE-SYSTEM.md#14-bulwark-deckung-der-backline)) mindert die Verschiebung nicht.
- **Turn Skip** entsteht ausschließlich über den **Kill**: stirbt das Ziel vor seinem
  verschobenen Slot, ist seine Aktion endgültig verloren.

## 2. Molten-Cast-Vertiefungen

Der Tree **Molten Cast** ([§3.3](PROGRESSION.md#33-molten-cast)) trägt vier Basisnodes: die drei
Signatur-Skills aus [§1](#1-signatur-skills-kampfwirkung) und **Rally**, dessen Regel an seinem
Hebel — der Floor-Grenze — in [Checkpoints, Wipe & Abbruch](PROGRESSION.md#4-checkpoints-wipe--abbruch)
steht.

Die Vertiefungen sind keine weiteren Signatur-Skills. Sie bauen jeweils auf mindestens Rang 1
eines Molten-Basisnodes auf, verändern einen vorhandenen Kampfhebel ohne Zusatz-RNG und werden
erst im Molten-Folgetask kaufbar. Die Rangwerte stehen zusätzlich als Katalog in
[§3.3](PROGRESSION.md#33-molten-cast).

### 2.1 Ambush (nach Sunder)

- In Runde 1 verursachen alle von Charakteren erzeugten Treffer
  `5/10/15/20/25 %` mehr finalen ausgehenden Schaden gemäß Node-Rang.
- Der Bonus wird nach allen bestehenden Schadensmodifikatoren einschließlich Bulwark angewandt.
  Er gilt für Grundtreffer, Multi Hit, Splash, zusätzliche Mastery-Treffer und Counter.
- Ab Runde 2 ist der Multiplikator neutral. Ambush verbraucht keinen PRNG-Zug.

### 2.2 Menace (nach Mitigation)

- Solange Korvin zu Beginn eines Gegnerangriffs lebt, wird die Accuracy dieses Angriffs relativ
  um `2/4/6/8/10 %` gemäß Node-Rang reduziert.
- Die Reihenfolge ist `Accuracy × (1 − Menace) × (1 − Evasion)`
  ([Treffermodell](DAMAGE-SYSTEM.md#12-treffermodell)); das Ergebnis bleibt auf `[0, 1]` geklemmt.
  Stirbt Korvin während eines teamweiten Angriffs, gilt Menace noch für
  dessen vollständige, zu Angriffsbeginn festgelegte Auflösung, aber nicht für spätere Angriffe.
- **Test-Vektor:** Accuracy `0,80` wird auf Rang 5 vor Evasion zu `0,72`.

### 2.3 Momentum (nach Suppression)

- Bei der Pending-Queue-Erzeugung einer Runde `r` erhalten alle lebenden Charaktere temporär
  `min(r − 1, Node-Rang)` Initiative. Der Bonus verändert keine persistierten Stats.
- Runde 1 beginnt ohne Bonus. Rang 5 erreicht ab Runde 6 sein Maximum von `+5`; der Bonus wächst
  niemals unbegrenzt und verbraucht keinen PRNG-Zug.
- **Test-Vektor:** Rang 3 liefert in den Runden 1–7 `0/1/2/3/3/3/3` Initiative.

### 2.4 Second Wind (nach Rally)

- Einmal pro Dungeon verhindert Second Wind den ersten tödlichen Treffer gegen das Team. Der
  betroffene Charakter bleibt mit `10/15/20/25/30 %` seiner Max-Health gemäß Node-Rang am Leben.
- Der Verbrauch gilt für den gesamten Dungeon-Run und wird erst beim Start eines neuen Runs
  zurückgesetzt. Wipe, Verlassen und Reload beenden den Run ohnehin; es gibt keinen übertragbaren
  Restverbrauch.
- Treffen durch denselben teamweiten Angriff mehrere tödliche Ergebnisse ein, verbraucht der
  erste betroffene Charakter in der festen Team-Reihenfolge Korvin, Rhaya, Quinn
  ([Team](CHARACTERS.md#1-team)) die Auslösung; die weiteren Ergebnisse bleiben tödlich. Die
  Reihenfolge ist bewusst nicht die Initiative-Ordnung, damit der Verbrauch seedunabhängig ist.
- **Test-Vektor:** Auf Rang 3 bleibt der zuerst tödlich getroffene Charakter mit `200`
  Max-Health einmalig bei `40` Health.
