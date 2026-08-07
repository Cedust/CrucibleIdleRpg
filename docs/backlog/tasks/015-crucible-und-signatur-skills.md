# 015 — Crucible & Signatur-Skills

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `done`    |
| **Meilenstein**  | M2        |
| **Hängt ab von** | 012, 014c |

## Ziel

Der Crucible investiert Crystals in die Trees Anvil Sparks, Smelting Flames und die vier
Molten-Cast-Basisnodes, erlaubt je flexiblem Tree einen kostenlosen vollständigen Respec und
wendet die freigeschalteten Wirkungen deterministisch an.

## Nicht-Ziel

- Die vier Molten-Cast-Vertiefungen erscheinen sichtbar und gesperrt; sie folgen in
  [016](016-molten-cast-vertiefungen.md).
- Nodes für Ausrüstung, Handwerk und Runen erscheinen ebenfalls nur als sichtbar gesperrte
  Voraussetzungen; die Systeme folgen in M3–M5.
- Gold-, XP- und Handwerksrabatt-Nodes entstehen nicht — sie sind aus der Spec entfernt.

## Verbindliche Spec-Anker

- [Crucible](../../spec/PROGRESSION.md#3-crucible-globaler-skilltree) — vier Trees, Rangkosten
  `n` Crystals, permanenter Anvil-Tree und je ein kostenloser Tree-Respec für Smelting und Molten
- [Anvil Sparks](../../spec/PROGRESSION.md#31-anvil-sparks) — `anvil.waystones` Rang `n` öffnet
  `A1-D<n+1>` und verlangt den Abschluss von `A1-D<n>`; Armory, Blacksmith und Jeweler bleiben gesperrt
- [Smelting Flames](../../spec/PROGRESSION.md#32-smelting-flames) — vier unabhängige Nodes,
  `+3 %` Attack / Defense / Health und `+1` Initiative je Rang, innerhalb der Crucible-Ebene additiv
- [Molten Cast](../../spec/PROGRESSION.md#33-molten-cast) — Katalog und Rangwerte der vier
  Basisnodes sowie die gesperrten Vertiefungen
- [Signatur-Skills (Kampfwirkung)](../../spec/SIGNATURES.md#1-signatur-skills-kampfwirkung) —
  Mitigation, Sunder und Suppression mit festen Werten und Test-Vektoren
- [Checkpoints, Wipe & Abbruch](../../spec/PROGRESSION.md#4-checkpoints-wipe--abbruch) — Rally am
  Floor-Übergang und die Optimierungs-Sperre während eines Runs
- [Stats](../../spec/CHARACTERS.md#2-stats) — die Crucible-Ebene ist multiplikativ zur Basis- und
  Attributebene
- [Signatur-Skills](../../spec/CHARACTERS.md#7-signatur-skills) — drei charaktergebundene
  Molten-Nodes mit Level 1–5
- [Crucible-Save-Version](../../spec/PERSISTENCE.md#23-crucible-save-version) — Node-Ränge sind
  die alleinige Wahrheit, Checkpoints sind abgeleitet; Basissave, Schema und Tests wechseln
  atomar ([Migrationen im Pre-Release](../../spec/PERSISTENCE.md#21-migrationen-im-pre-release))
- [Kapazität](../../spec/PROGRESSION.md#35-kapazität) —
  `130` aktive Crystal-Kosten gegen `117` Crystals aus Akt 1

## Akzeptanzkriterien

- [ ] Ein Rang kostet genau seine Rangnummer in Crystals; ein voll gestufter Node kostet `15` und
      cappt bei Rang 5
- [ ] Kaufbar ist nur, wer bezahlbar ist und alle Voraussetzungen erfüllt; gesperrte Nodes
      (Armory, Blacksmith, Jeweler, Masterwork, die vier Molten-Vertiefungen) sind sichtbar und
      nicht kaufbar
- [ ] `anvil.waystones` Rang `n` verlangt das Vollendet-Flag von `A1-D<n>` und schaltet `A1-D<n+1>`
      frei; die freigeschalteten Einstiege werden aus dem Rang abgeleitet
- [ ] Anvil-Ränge sind nicht respecbar; Smelting und Molten besitzen je einen unabhängigen,
      kostenlosen Tree-Respec, der außerhalb eines Runs alle Ränge des Trees atomar entfernt und
      exakt die investierten Crystals erstattet
- [ ] Die vier Smelting-Nodes wirken additiv auf der Crucible-Ebene und multiplikativ zu Basis-
      und Attributebene; Quick Step addiert seinen Rang flach auf die Initiative
- [ ] Mitigation, Sunder, Suppression und Rally wirken mit den spezifizierten Rangwerten und nur
      nach Freischaltung; gleiche Seeds liefern denselben Kampfverlauf
- [ ] Sunder wird je Angriff und getroffenem Frontline-Ziel genau einmal angewandt, cappt je Ziel
      und Kampf und wirkt erst auf nachfolgende Angriffe
- [ ] Rally hebt am erfolgreichen Floor-Übergang alle Gefallenen auf den Rang-Anteil ihrer
      Max-Health, nicht nach Wipe, Verlassen oder Dungeon-Ende
- [ ] Basissave, Schema und Tests wechseln atomar auf die Crucible-Save-Version; das Schema lehnt
      unbekannte IDs, Überränge und verletzte Voraussetzungen ab
- [ ] Der Crucible-Screen zeigt die vier Trees mit Rängen, Kosten, Voraussetzungen, Sperrgründen
      und den beiden Respec-Aktionen; während eines Runs ist er lesend
- [ ] Unit-Tests decken Kosten, Caps, Voraussetzungen, beide Respecs, Persistenz und
      die vier Basiswirkungen deterministisch ab

## Betroffene Dateien

- `src/game/crucible/` — Node-Katalog, Rangwerte und Kostenfunktion
- `src/features/crucible/` — Crucible-Screen, Kaufen, Respec und abgeleitete Einstiege
- `src/features/combat/` — Mitigation, Sunder, Suppression und Rally an ihren Hebeln
- `src/features/save/` — Schema und Persistenz der Node-Ränge

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
