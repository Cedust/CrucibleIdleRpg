# SPEC — Signatur-Skills

> Verbindlich: die Kampfwirkung von Mitigation, Sunder und Suppression.
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
  [§2.3](DAMAGE-SYSTEM.md#13-eingehender-schaden-schadenspipeline), Schritt 1.
- `m` steigt mit dem Node-Level (1–5); konkrete Werte = Balancing (`src/game/`).

### 1.2 Sunder (Rhaya, Melee)

- Rhayas Treffer auf einen **Frontline-Gegner** reduzieren dessen **Bulwark-Beitrag** `bᵢ`
  ([Bulwark](DAMAGE-SYSTEM.md#14-bulwark-deckung-der-backline)).
- Der Abbau ist **kumulativ pro Ziel** und gilt **nur für die Dauer des laufenden Kampfes** —
  es gibt **keinen Übertrag** zwischen Floors (Formationen stehen pro Floor neu).
- **Node-Skalierung (Level 1–5):** steigender Bulwark-Abbau pro Treffer und/oder höheres
  Abbau-Cap pro Ziel. Konkrete Werte = Balancing (`src/game/`, BALANCING).

<!-- TODO (Balancing): Sunder — Abbau-Betrag pro Treffer & Cap pro Ziel. -->

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
