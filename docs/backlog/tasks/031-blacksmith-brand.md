# 031 — Blacksmith: Brand & Re-Brand

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `blocked` |
| **Meilenstein**  | M4        |
| **Hängt ab von** | 027, 030  |

## Ziel

Brand überträgt das Implicit eines bekannten Sigils gegen Cinder und Gold auf ein
Legendary-Item seines gebundenen Slot-Typs, skaliert mit dem Sigil-Level, gilt teamweit genau
einmal und wirkt im Kampf; Re-Brand überschreibt günstiger.

## Nicht-Ziel

Runen, Talisman und Rite liegen in M5 ([ROADMAP](../ROADMAP.md#m5--runen--sigils)).

## Blockiert durch

[027](027-blacksmith-temper-und-masterwork.md) — Brand lebt im Blacksmith-Screen und braucht
Legendary-Items aus Masterwork. [030](030-sigil-drops-und-sigil-codex.md) — der Codex liefert
die bekannten Sigils. Die Implicit-Klassen und ihre Kampfwirkung hängen am offenen
Sigil-Katalog ([OPEN_ISSUES §2](../OPEN_ISSUES.md#2-offene-spec-punkte)).

## Verbindliche Spec-Anker

- [Blacksmith](../../spec/ITEMS.md#7-blacksmith--temper-masterwork--brand) — Brand auf
  Legendary, Kosten Cinder plus Gold, Re-Brand deutlich günstiger
- [Sigils & Sigil Codex](../../spec/ITEMS.md#5-sigils--sigil-codex) — teamweit genau einmal
  aktiv, Slot(-Typ)-Bindung, Stärke skaliert mit dem Sigil-Level
- [Item-Anatomie](../../spec/ITEMS.md#2-item-anatomie-fünf-schichten) — Schicht 5 als
  Identitäts-Ast; das Implicit liefert einen Affix, den kein Gem trägt
- [Ökonomische Absicht](../../BALANCING.md#3-ökonomische-absicht) — Kostenziel des Re-Brands
- [Umgang mit offenen Balancing-Werten](../README.md#4-umgang-mit-offenen-balancing-werten) —
  Brand-/Re-Brand-Kosten und Implicit-Skalierung sind markierter Balancing-Content

## Akzeptanzkriterien

- [ ] Brand setzt das Implicit eines bekannten Sigils auf ein Legendary-Item seines gebundenen
      Slot-Typs und kostet Cinder plus Gold nach markiertem Balancing-Content
- [ ] Jedes Sigil ist teamweit genau einmal aktiv; die Auswahl bietet nur regelkonforme
      Sigil-Item-Paare an
- [ ] Re-Brand überschreibt einen bestehenden Brand zu deutlich geringeren Kosten als der
      Erst-Brand
- [ ] Die Implicit-Wirkung skaliert mit dem Sigil-Level und fließt deterministisch in die
      Kampfwert-Herleitung ein; gleiche Seeds liefern denselben Kampfverlauf
- [ ] Der Brand-Zustand persistiert, überlebt einen Reload und ist im Blacksmith-Screen und in
      der Loadout-Detailkarte sichtbar
- [ ] Unit-, Store- und Component-Tests decken Legendary-Bedingung, Einmal-Aktivität,
      Re-Brand-Kosten und Kampfwirkung ab

## Betroffene Dateien

- `src/game/crafting/`, `src/game/sigils/` — Brand-Logik und Implicit-Wirkungen
- `src/features/crafting/` — Brand-Bereich im Blacksmith-Screen
- `src/features/combat/`, `src/features/heroes/` — Implicit in Herleitung und Anzeige
- `src/features/save/` — persistierter Brand-Zustand

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
