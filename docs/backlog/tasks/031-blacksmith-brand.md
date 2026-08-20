# 031 — Blacksmith: Brand & Re-Brand

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `blocked` |
| **Meilenstein**  | M4        |
| **Hängt ab von** | 027, 030  |

## Ziel

Brand überträgt das Imprint eines bekannten Sigils gegen Cinder und Gold auf ein Item ab Magic
seines gebundenen Slot-Typs, skaliert mit dem Sigil-Level, gilt teamweit genau einmal und wirkt
im Kampf; Re-Brand überschreibt günstiger.

## Nicht-Ziel

Runen, Talisman und Rite liegen in M5 ([ROADMAP](../ROADMAP.md#m5--runen--sigils)).

## Blockiert durch

[030](030-sigil-drops-und-sigil-codex.md) — der Codex liefert die bekannten Sigils und den
Katalog, gegen den die Imprint-Wirkungen entstehen.

## Verbindliche Spec-Anker

- [Blacksmith](../../spec/ITEMS.md#7-blacksmith--temper-masterwork--brand) — Brand auf ein Item
  ab Magic, Kosten Cinder plus Gold, Re-Brand deutlich günstiger
- [Sigils & Sigil Codex](../../spec/ITEMS.md#5-sigils--sigil-codex) — teamweit genau einmal
  aktiv, Slot(-Typ)-Bindung, Stärke skaliert mit dem Sigil-Level, Imprints verstärken Gem-Stats
  ausschließlich prozentual, Anzeige ohne `Sigil of`-Präfix
- [Katalog](../../spec/ITEMS.md#51-katalog) — die 18 Imprint-Wirkungen samt der Sonderregeln für
  `Burning Sentence` und `Warden's Bastion`
- [Item-Anatomie](../../spec/ITEMS.md#2-item-anatomie-fünf-schichten) — Schicht 5 als
  Identitäts-Ast; das Imprint liefert einen Affix, den kein Gem trägt
- [Ökonomische Absicht](../../BALANCING.md#3-ökonomische-absicht) — Kostenziel des Re-Brands
- [Umgang mit offenen Balancing-Werten](../README.md#4-umgang-mit-offenen-balancing-werten) —
  Brand-/Re-Brand-Kosten und Imprint-Skalierung sind markierter Balancing-Content

## Akzeptanzkriterien

- [ ] Brand setzt das Imprint eines bekannten Sigils auf ein Item ab Magic-Seltenheit auf dessen
      gebundenem Slot-Typ und kostet Cinder plus Gold nach markiertem Balancing-Content
- [ ] Jedes Sigil ist teamweit genau einmal aktiv; die Auswahl bietet nur regelkonforme
      Sigil-Item-Paare an
- [ ] Re-Brand überschreibt einen bestehenden Brand zu deutlich geringeren Kosten als der
      Erst-Brand
- [ ] Ein Imprint verstärkt einen gem-gedeckten Stat ausschließlich prozentual und hebt einen
      gem-freien Stat flach; `Burning Sentence` wirkt auf den Bonus-Anteil des Crit Damage und
      die Block-Reduktion aus `Warden's Bastion` ist bei 100 % gedeckelt
- [ ] Die Imprint-Wirkung skaliert mit dem Sigil-Level und fließt deterministisch in die
      Kampfwert-Herleitung ein; gleiche Seeds liefern denselben Kampfverlauf
- [ ] Der Brand-Zustand persistiert, überlebt einen Reload und ist im Blacksmith-Screen und in
      der Loadout-Detailkarte ohne `Sigil of`-Präfix sichtbar
- [ ] Unit-, Store- und Component-Tests decken die Magic-Schwelle, Einmal-Aktivität,
      Re-Brand-Kosten und Kampfwirkung ab

## Betroffene Dateien

- `src/game/crafting/`, `src/game/sigils/` — Brand-Logik und Imprint-Wirkungen
- `src/features/crafting/` — Brand-Bereich im Blacksmith-Screen
- `src/features/combat/`, `src/features/heroes/` — Imprint in Herleitung und Anzeige
- `src/features/save/` — persistierter Brand-Zustand

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
