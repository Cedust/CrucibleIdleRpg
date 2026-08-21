# 033 — Rune-Grimoire-Fundament

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Meilenstein**  | M5      |
| **Hängt ab von** | 031     |

## Ziel

Das vollständige, strikt validierte M5-Datenmodell steht: Der Anvil-Sparks-Runenast ist kaufbar,
das Rune Grimoire kennt seinen Katalog und die Starter-Runen, und Runewords sowie künftige Rites
sind persistent vorbereitet.

## Nicht-Ziel

Runewords-Drops und die Reward-Anzeige entstehen in [034](034-runewords-drops.md), Inscribe und
Etch samt Runescribe-Screen in [035](035-runescribe-inscribe-etch.md). Talismane werden erst in
[036](036-talisman-rite-konfiguration.md) konfigurierbar; Kampfeffekte folgen in 037 und 038.

## Verbindliche Spec-Anker

- [Grundsatz & Abgrenzung](../../spec/RUNES.md#1-grundsatz--abgrenzung) — Runen sind qualitative
  Kampfmechanik, keine zusätzlichen Stats
- [Träger: Rune Grimoire, Talisman, Rite](../../spec/RUNES.md#2-träger-rune-grimoire-talisman-rite)
  — Wissensstand statt Inventar und teamweit einzigartige Runen
- [Aufbau eines Rite](../../spec/RUNES.md#3-aufbau-eines-rite) — 6 Trigger, 6 Effects und 5
  Modifier als vollständiger Katalog
- [Rune-Level](../../spec/RUNES.md#5-rune-level) — Kategorien skalieren unterschiedliche
  Facetten, Cap durch Rune Mastery
- [Anvil-Sparks-Nodes](../../spec/RUNES.md#8-anvil-sparks-nodes) — Kosten, Starter-Runen,
  Freischalt- und Rangregeln
- [Crucible: Anvil Sparks](../../spec/PROGRESSION.md#31-anvil-sparks) — IDs und Voraussetzungen
  des unabhängigen Runenasts
- [Save-Inhalt](../../spec/PERSISTENCE.md#2-save-inhalt) — Grimoire, Runewords und Rites gehören
  zum persistierten Fortschritt
- [Begriffe](../../GLOSSARY.md) — **Runewords** ist der verbindliche Name der Runen-Währung

## Akzeptanzkriterien

- [ ] Ein typisierter, deklarativer Katalog enthält exakt 6 Trigger, 6 Effects und 5 Modifier mit
      Kategorie, Mindesttiefe und als Balancing-Content markierter Level-Skalierung
- [ ] Der Save enthält atomar den Runewords-Bestand, bekannte Runen samt Level und die nötige
      Rite-Struktur je Charakter; unbekannte, doppelt verwendete oder rangwidrige Zustände lehnt
      das Schema ab
- [ ] Der Default-Save, Schema und Schema-Tests wechseln gemeinsam auf das M5-Modell; jeder Save
      in einem anderen Format fällt gemäß Pre-Release-Policy auf den Default zurück
- [ ] `anvil.rune-grimoire`, `anvil.talisman`, `anvil.runic-focus` und `anvil.rune-mastery` sind
      ab M5 kaufbar, behalten Kosten und Voraussetzungen und leiten daraus Rune-Cap sowie
      charakterspezifische Slots ab
- [ ] Der Kauf von Rune Grimoire fügt exakt einen Starter-Trigger und einen Starter-Effect auf
      Level 1 zum Grimoire hinzu und ist beim wiederholten Einlesen idempotent
- [ ] Unit- und Save-Tests decken Katalog-Vollständigkeit, Cap, Voraussetzungen, Starter-Grant,
      Schema-Reset und die teamweite Einmaligkeit ab

## Betroffene Dateien

- `src/game/runes/`, `src/game/types.ts` — Katalog, Level-/Rite-Modelle und abgeleitete Regeln
- `src/game/crucible/`, `src/features/crucible/` — aktive Anvil-Sparks-Nodes und Präsentation
- `src/features/save/` — M5-Schema, Default und transaktionale Kauf-/Grant-Verarbeitung

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
