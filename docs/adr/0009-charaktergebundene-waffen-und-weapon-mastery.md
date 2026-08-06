# ADR-0009: Charaktergebundene Waffen und Weapon Mastery

- **Status:** Akzeptiert
- **Datum:** 2026-08-07
- **Betrifft:** spec/CHARACTERS.md §2, §4–§6; spec/ITEMS.md §1–§3;
  spec/WEAPON-MASTERY.md; spec/DAMAGE-SYSTEM.md §1.1; ADR-0001; ADR-0007

---

## Kontext

Das bisherige Modell kombinierte einen gemeinsamen Charakter-Skilltree mit Main- und
Off-Hand-Items. Die Hand-Slots gehörten zugleich zu Ausrüstung, Rarity, Sockeln und Crafting,
obwohl sie den unverzichtbaren Grundschaden und die Damage-Range eines Charakters trugen.
Charakterlevel erhöhten zusätzlich Attack, Defense und Health über automatische Baseline-Kurven.

Damit konkurrierten drei Systeme um dieselbe Identität: Level-Baseline, Waffen-Items und
Skilltree. Main/Off waren keine echten wechselbaren Gegenstände — das Projekt besitzt weder
Inventar noch Itemtausch — mussten aber trotzdem alle generischen Itemregeln mittragen.

## Betrachtete Alternativen

- **Main/Off als normale Items behalten.** Wenig Änderung, aber Waffenidentität bleibt über
  Rarity, Gems und Crafting verteilt und der Charakter-Skilltree bleibt von der Waffe getrennt.
- **Waffen als eigenes Item-System behalten.** Klare Trennung von Armor, aber ein zweiter
  Rarity-/Crafting-Pfad verdoppelt Regeln und UI ohne Wechsel- oder Lootentscheidung.
- **Eine charaktergebundene Waffe mit eigener Mastery.** Verbindet Grundschaden, Range,
  Precision und Kampfstil in einer Progressionsachse; Armor und Crafting bleiben eigenständig.

## Entscheidung

Wir nutzen die dritte Alternative:

1. Jeder Charakter besitzt genau eine permanente Signaturwaffe.
2. Main Hand und Off Hand entfallen als Equipment-Slots.
3. Waffen besitzen keine Item-Rarity, Sockel, Gems, Sigils, Item-Level oder
   Crafting-Interaktionen.
4. Der bisherige Charakter-Skilltree wird durch fünf Weapon-Mastery-Disciplines ersetzt.
5. Weapon Base Damage ersetzt die automatische Attack-Baseline. Auch Defense und Health wachsen
   nicht mehr automatisch mit dem Level; Level vergibt Attribute und Mastery Points.
6. Precision führt Clean Hits und Glancing Blows ein, ohne einen vollständigen Miss-Zustand für
   Charakterangriffe zu schaffen.

Die verbindlichen Regeln und Werte stehen in
[Weapon Mastery](../spec/WEAPON-MASTERY.md), nicht in diesem ADR.

## Konsequenzen

- Charakteridentität entsteht über feste Waffenprofile, individuelle Weapon-Nodes und die vier
  frei kombinierbaren Kampfstil-Disciplines.
- Armor besitzt nur noch Head, Chest, Legs und Feet. Item-Rarity gilt ausschließlich für diese
  vier Slots.
- Might verliert seine festen Main-/Off-Hand-Innates und stammt aus Emerald Gems.
- Die Levelkurve vergibt keine versteckte automatische Kampfkraft mehr; jeder Zuwachs ist einer
  sichtbaren Entscheidung oder Progressionsquelle zugeordnet.
- ADR-0001 bleibt für das Prinzip universeller Stats gültig; seine konkrete Aussage, Korvins
  Schildidentität entstehe über einen Hand-Slot, ist durch diese Entscheidung abgelöst.
- ADR-0007 bleibt für Achsen, Prozentebenen und den komprimierten Zahlenraum gültig; seine
  generische Baseline-Formel wird für Charaktere durch die festen Startwerte und Weapon Base
  Damage aus dieser Entscheidung präzisiert.
