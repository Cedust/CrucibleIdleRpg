# 025 — Gem- & Cinder-Drops

| Feld             | Wert     |
| ---------------- | -------- |
| **Status**       | `done`   |
| **Meilenstein**  | M3       |
| **Hängt ab von** | 022, 024 |

## Ziel

Jeder Floor-Sieg vergibt Gem-Bestände und Cinder nach seiner Gegner- und Floor-Klassifikation
deterministisch über den Loot-PRNG und zeigt die konkreten Gewinne in der Reward-Zusammenfassung.

## Nicht-Ziel

M3 erhält keinen Materials-Screen und keine dauerhafte Ressourcenanzeige. Sockeln, Gem-Affixe,
Attune, Recut und die Handwerks-UI gehören nach M4. Diamond-Gems droppen erst ab Akt 2;
Sigil-Drops und der Sigil Codex beginnen in M4 vor Blacksmith-Brand.

## Blockiert durch

[022](022-armory-und-armor-fundament.md) — der aktualisierte Save und die aktive Armory müssen
gemergt sein. [024](024-loadout-ansicht.md) schließt davor die M3-Charakterzentrale ab.

## Verbindliche Spec-Anker

- [Drops: Gems, Cinder & Sigils](../../spec/ITEMS.md#6-drops-gems-cinder--sigils) — reguläre
  Gems von allen Gegnern, Cinder garantiert von Bossen und als monotone Elite-Chance
- [Belohnungen aus einem Sieg](../../spec/PROGRESSION.md#2-belohnungen-aus-einem-sieg) — Loot wird
  pro Floor-Sieg zusammen mit XP, Gold und Relic Shards committet
- [Seeds und Zufalls-Ströme](../../spec/SIMULATION.md#4-seeds-und-zufalls-ströme) — Loot verwendet
  ausschließlich den getrennten, seedbaren `loot`-Strom
- [Save-Inhalt](../../spec/PERSISTENCE.md#2-save-inhalt) — Cinder und alle fünf Gem-Bestände sind
  globale persistierte Zähler
- [Umgang mit offenen Balancing-Werten](../README.md#4-umgang-mit-offenen-balancing-werten) —
  Mengen, Chancen und Staffelungen sind markierter Balancing-Content, keine neue Regelentscheidung

## Akzeptanzkriterien

- [x] Der Save enthält Cinder sowie die fünf Gem-Bestände Amber, Ruby, Sapphire, Emerald und
      Diamond als nichtnegative Ganzzahlen; der M3-Default beginnt mit allen Zählern bei `0`
- [x] Jeder besiegte Gegner vergibt reguläre Gems aus dem als Balancing-Content gekennzeichneten,
      tiefenabhängigen Drop-Modell; Diamond bleibt bis Akt 2 bei `0`
- [x] Jeder Boss-Kill vergibt genau `1` Cinder; Elite-Cinder ist eine Chance, die mit dem globalen
      Floor-Index monoton steigt und beim Aktwechsel nicht zurückgesetzt wird
- [x] Loot wird mit dem Floor-Sieg atomar gespeichert, erscheint als konkrete Gewinne in der
      Reward-Zusammenfassung und bleibt nach Reload erhalten; eine Gesamtbestandsanzeige entsteht
      erst mit den M4-Stationen
- [x] Dieselben Seeds, Encounter und Run-Zähler liefern denselben Loot; Loot-Würfe verändern weder
      Initialisierungs- noch Kampf-PRNG und damit keine Kampfevents
- [x] Unit- und Store-Tests decken Boss-Garantie, Elite-Monotonie, Akt-2-Diamond-Grenze,
      deterministische Wiederholung und atomaren Commit ab

## Betroffene Dateien

- `src/game/rewards/` — deklaratives Gem-/Cinder-Balancing und reine Loot-Auswertung
- `src/features/dungeon/` — Floor-Sieg-Commit und Reward-Zusammenfassung
- `src/features/save/` — persistierte Loot-Zähler und atomare Save-Aktualisierung
- `src/shared/utils/prng.ts` — vorhandenen `loot`-Strom gezielt verwenden

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
