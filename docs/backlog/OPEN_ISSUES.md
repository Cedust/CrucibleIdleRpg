# OPEN_ISSUES.md — offene Fragen

> **Zweck:** Sammelstelle für **noch nicht entschiedene** Balancing-, Spec- und Design-Fragen.
>
> **Nichts in dieser Datei ist verbindlich.** Kein Agent implementiert daraus, und kein Wert
> von hier wandert in `src/game/`, bevor er entschieden und in
> [BALANCING.md](../BALANCING.md) bzw. der [SPEC](../SPEC.md) festgehalten ist. Genannte
> Kandidaten und Vorschläge sind Diskussionsstand, keine Vorgabe.
>
> Ein Punkt verlässt diese Datei, indem er an seinem Wohnort landet — nicht, indem er hier
> als erledigt markiert wird.

---

## 1. Offene Balancing-Fragen / Tuning-Notizen

Die Leitplanken, gegen die diese Fragen zu entscheiden sind, stehen in
[BALANCING §1](../BALANCING.md#1-balancing-philosophie) (Zielspielzeit, „bewusster Grind"),
[§2](../BALANCING.md#2-kern-wachstumsachsen) (Wachstumsachsen, Formationsgröße gegen Defense)
und [§3](../BALANCING.md#3-wachstumsquellen-woher-die-zahlen-kommen) (Wachstumsquellen).

### Charakter- und Gegner-Kurven

- [ ] **Derived-Stat-Kurven je Quelle** ([Stats](../spec/CHARACTERS.md#2-stats)):
      Baseline-Tabellen (Level 1–100), Attribut-Prozentsatz je Punkt und Core-Stat-Kurven
      (Might/Toughness/Vitality → Attack/Defense/Health) — je aus der Achsen-Basis abgeleitet
      ([BALANCING §2](../BALANCING.md#2-kern-wachstumsachsen)).
- [ ] Gegner-Kurven pro Akt/Dungeon/Floor (Health auf der Offense-Achse, Attack auf der
      Defense-Achse, Accuracy als gedeckelte Rampe); Elite-/Boss-eHP über die
      TTK-Ziel-Korridore ([BALANCING §2](../BALANCING.md#2-kern-wachstumsachsen)).
- [ ] **Regeneration-Kurve** (flacher Wert): einzige Heilquelle vor dem Endgame, muss über
      Sapphire-Gems mit der Health-Kurve mitwachsen; Sustain-Deckel gegen den erwarteten
      Durchlass beachten ([BALANCING §2](../BALANCING.md#2-kern-wachstumsachsen)).

### Kampf-Stellgrößen

- [ ] Bulwark-Prozentwerte (Tank-/Melee-Beitrag) und Mitigation-`m` je Node-Stufe.
- [ ] **Sunder-Werte** ([Sunder](../spec/COMBAT.md#32-sunder-rhaya-melee)):
      Bulwark-Abbau pro Treffer und Abbau-Cap pro Ziel, je Node-Stufe 1–5.
- [ ] **Defense-Konstante `K`**
      ([Schadenspipeline](../spec/COMBAT.md#23-eingehender-schaden-schadenspipeline), Schritt 4):
      legt fest, wie schnell die Mitigation mit Defense wächst (`Mitigation = D / (D + K)`);
      gegen die Toughness- und Gegner-Attack-Kurven der Defense-Achse tunen.
      **Achtung:** Der Test-Vektor der Schadenspipeline verwendet `K = 100` als frei gewählten
      Eingangswert — das ist keine Festlegung.
- [ ] **Rally-Anteil je Node-Stufe**
      ([Checkpoints, Wipe & Abbruch](../spec/PROGRESSION.md#4-checkpoints-wipe--abbruch)):
      Prozent der Max-Health beim Aufstehen an der Floor-Grenze. Klein halten, sonst entsteht ein
      Sprung, bei dem Sterben besser ist als knappes Überleben. Beachten: Die Floor-Kurven müssen
      **mit und ohne** Rally spielbar sein (gleiche Lage wie bei Mitigation).
- [ ] Waffen-Damage-Range-Breiten je Seltenheit (einmal pro Angriff gewürfelt,
      [Charakter-Zug](../spec/COMBAT.md#21-charakter-zug-ausgehender-schaden)).
- [ ] **Multi-Hit-Werte:** _Multi Hit Damage_ als Anteil des rohen Grundschadens, _Multi Hit
      Chance_, die Chain-Stufen und der **_Multi Hit Chain Factor_**
      ([Charakter-Zug](../spec/COMBAT.md#21-charakter-zug-ausgehender-schaden), Schritt 3;
      [ADR-0006](../adr/0006-multi-hit-kette-garantierte-laenge.md)). Der ADR nennt als
      Startvorschlag Basis **40 %** und Skilltree-Maximum **90 %** — das ist keine Festlegung.
      Der Zweigertrag ist `Multi Hit Chance × Multi Hit Damage × Σₖ f^(k−1)`; die Erwartungswerte
      über den Zweig hinweg durchrechnen, damit ein voll ausgebautes Tempest nicht die anderen
      drei Zweige entwertet.
- [ ] **Valor als Zwei-Faktor-Zweig:** Tempest und Dominance sind Produkte aus drei wachsenden
      Stats, Finesse und Valor aus zwei
      ([Charakter-Skilltree](../spec/CHARACTERS.md#4-charakter-skilltree)). Finesse gleicht das
      über die globale Wirkung des Crit-Faktors aus
      ([BALANCING §3](../BALANCING.md#3-wachstumsquellen-woher-die-zahlen-kommen)), Valor über die
      Zahl der Gegner-Angriffe. Prüfen, ob die Kurven das tragen oder Valor einen dritten Faktor
      braucht.
- [ ] **Grundtakt und 2×**
      ([Playback](../spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit)): 1000 ms pro
      Akteur ist als Lesegeschwindigkeit gesetzt, aber der klassische Playtest-Regler — gegen die
      Dauer eines 20-Floor-Runs prüfen.

### Ökonomie

- [ ] XP-Verteilungsschlüssel des individuellen Rests
      ([Belohnungen aus einem Sieg](../spec/PROGRESSION.md#2-belohnungen-aus-einem-sieg));
      Kandidat: nach verursachtem Schaden. Dazu Gold-Drop- und Respec-Kosten-Kurven.
- [ ] **Item-Level-Kurve (Cap +100):** Innate-Value je `+n` (Might auf der Offense-Achse,
      Toughness/Vitality/Initiative auf der Defense-Achse), Verteilung der 100 Stufen.
- [ ] **Item-Level-Caps je Seltenheit** (+20/+40/+60/+80/+100) und **Sockel-Zahlen** (0/1/2/3/4)
      gegen die Temper-Gold-Kurve prüfen: Liegen die Landmarken (20/40/50/60/80/100) angenehm im
      Spielverlauf, oder verschiebt die Exponentialkurve die späten Stufen zu weit nach hinten?
- [ ] **Cinder-Ökonomie (vollständig durchrechnen):** Refine-Kette **1/3/6/10** gegen den
      Gesamt-Sink (18 Slots × 20 = **360** + Brand + Re-Brand). Elite-Cinder-Drop-Chance als
      **monoton mit globaler Floor-Tiefe** steigende Kurve (kein Akt-Reset; Boss stets
      100 %/Kill) plus die **Erhöhung in Akt 2 & 3**. Brand- und Re-Brand-Kosten festlegen.
- [ ] **Blacksmith-/Jeweler-Gold-Kosten** (Temper, Refine, Brand, Inlay, Recut, Attune) — Refine
      und Brand zusätzlich in **Cinder**.
- [ ] **Gem-Value-Ranges** je Pool-Affix + Range-Anhebung pro Gem-Level (relative Position
      bleibt).
- [ ] **Gem-Targeting:** Amber (4 Chance), Ruby (4 Damage) und Sapphire (4 Defensive) → je 25 %
      Chance auf den Ziel-Stat beim Sockeln, Emerald (3 Core) → 33 %; Reroll-Kosten (Gold) so
      tunen, dass Ziel-Treffer erschwinglich bleibt.
- [ ] **Gem-Drop-Raten** & Aufleveln-Fodder-Kurve (Grind-Wall-Vermeidung); Diamond-Drop-Rate.
- [ ] **Sigils:** Pool-Größe (< 18), **Mindesttiefen** je Sigil, Drop-Chance je Encounter-Typ,
      **Gewicht unbekannter Sigils** im Wurf, **Level-Skalierung des Implicits** (1→5).
- [ ] **Runedust:** Drop-Kurve je Encounter-Typ ab der Freischalttiefe, **Inscribe**-Kosten je
      Kategorie und **Etch**-Kostenkurve (Level 1→5).

### Endgame & Gesamtbild

- [ ] **Prismatic-/Diamond-Effekte** (Meta-Multiplikatoren) + **Glass-Cannon-Check** (steile
      Offense- vs. flache Defense-Achse; nötigenfalls Sockel-Typ-Split oder
      Gegner-Accuracy-Rampe als Sicherheitsgurt).
- [ ] **Runen-Katalog** ([Runen](../spec/RUNES.md)): 17 Einträge
      (6 Trigger / 6 Effect / 5 Modifier) mit **Mindesttiefe** und **Level-Skalierung** je Stufe;
      Dauer-Werte für Empower/Mark/Lingering, Chain-Zielzahl je Modifier-Level, Bezugs-Stat von
      Surge.
- [ ] **Rune-Wirkstärke gegen die Zahlen-Achsen:** Da ein Rite **max. 1×/Runde** auslöst, muss
      die Magnitude **prozentual/skalierend** sein, damit Runen im Late-Game nicht verpuffen —
      ohne dass sie die Gem-Achse als Endgame-Min-Max verdrängen.
- [ ] **Trigger-Verlässlichkeit:** Alle sechs Trigger hängen an einer Chance (`OnCrit`,
      `OnMultiHit`, `OnSplash`, `OnCounter` an Offensiv-Stats; `OnBlock`, `OnEvade` an
      Defensiv-Stats) — es gibt keinen deterministischen. Die Auslöse-Häufigkeiten so
      gegeneinander abwägen, dass kein Trigger unabhängig vom Build die beste Wahl ist.

---

## 2. Offene Spec-Punkte

Hier fehlt **Struktur**, nicht nur ein Wert — diese Punkte gehören nach Klärung in die
[SPEC](../SPEC.md), nicht nach `src/game/`.

- [ ] **Prismatic/Diamond im Detail** ([Jeweler](../spec/ITEMS.md#8-jeweler--inlay-attune--recut)):
      welche Meta-Multiplikatoren es gibt und ob sie node-artig gesammelt werden.
- [ ] **Sigil-Katalog** ([Sigils & Sigil Codex](../spec/ITEMS.md#5-sigils--sigil-codex)): konkrete
      Sigils (Namen, Implicit-Identitäten, Mindesttiefe, Slot-Bindung, Level-Skalierung des
      Implicits) sowie die drei namentlichen **Boss-Signatur-Sigils**.
- [ ] **Implicit-Abgrenzung:** welche Effekt-Klassen ein Implicit trägt, die kein Gem-Affix
      liefert.
- [ ] **Mehrfachzug für Boss-Gegner:** Die Leitplanke „mindestens drei Gegner-Aktionen pro Runde"
      ([BALANCING §2](../BALANCING.md#2-kern-wachstumsachsen)) wird unter dem
      Ein-Zug-pro-Akteur-Modell ([Rundenablauf](../spec/COMBAT.md#11-rundenablauf)) über Adds
      erfüllt. Ein Boss mit **mehreren Zügen pro Runde** wäre die Alternative — sie berührt
      Pending-Queue, Initiative-Ordnung und Suppression und ist als Strukturfrage offen.
- [ ] **Save-Feldstruktur je Version**
      ([Persistenz](../spec/PERSISTENCE.md)): konkrete Zod-Schema-Form
      samt Migrationspfad.
