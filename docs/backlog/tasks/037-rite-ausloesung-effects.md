# 037 — Rite-Auslösung & Basis-Effects

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `blocked` |
| **Meilenstein**  | M5        |
| **Hängt ab von** | 036       |

## Ziel

Ein vollständiger Rite ohne Modifier reagiert in der reinen Kampf-Engine auf das erste passende
eigene Event einer Runde, führt seinen Basis-Effect lesbar aus und bleibt bei gleichen Inputs
deterministisch.

## Nicht-Ziel

Echo, Chain, Prism, Surge und Lingering folgen in
[038](038-rite-modifier-m5-abschluss.md). Konkrete Rune-Stärken bleiben deklarativer
Balancing-Content; dieser Task implementiert weder neue Items noch Akt-2-/Akt-3-Content.

## Blockiert durch

[036](036-talisman-rite-konfiguration.md) liefert aktive Rites. Zusätzlich müssen Zeitpunkt und
Zielreihenfolge der Effects in [OPEN_ISSUES](../OPEN_ISSUES.md#1-offene-balancing-fragen--tuning-notizen)
in die SPEC überführt werden; ohne diese fachliche Regel darf der Task die Reihenfolge nicht im
Code erfinden.

## Verbindliche Spec-Anker

- [Grundsatz & Abgrenzung](../../spec/RUNES.md#1-grundsatz--abgrenzung) — Rune-Effekte sind
  qualitativ und verletzen keine Kampf-Endlichkeit
- [Aufbau eines Rite](../../spec/RUNES.md#3-aufbau-eines-rite) — Trigger und die sechs
  Basis-Effects
- [Auslösung](../../spec/RUNES.md#4-auslösung-verbindlich) — erstes eigenes Event, einmal pro
  Runde, keine Rune-Ketten und seedbarer Zufall
- [Rune-Level](../../spec/RUNES.md#5-rune-level) — Effect- und Trigger-Level bestimmen
  Magnitude und Attunement
- [Rundenablauf](../../spec/COMBAT-RUN.md#11-rundenablauf) — bestehende Aktionsreihenfolge,
  Barrier und Endlichkeits-Zusicherung
- [Ausgehender Schaden](../../spec/DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden) und
  [Bulwark](../../spec/DAMAGE-SYSTEM.md#14-bulwark-deckung-der-backline) — Basisangriff und
  Bolt-Ausnahme

## Akzeptanzkriterien

- [ ] Die Engine ordnet Trigger exakt ihren eigenen Crit-, Multi-Hit-, Splash-, Counter-, Block-
      und Evade-Events zu und löst einen vollständigen Rite beim ersten qualifizierenden Event
      des Trägers höchstens einmal je Runde aus
- [ ] Heal, Barrier, Bolt, Empower, Mark und Reprisal folgen der vorab entschiedenen
      Ausführungs- und Zielregel; Bolt ignoriert Bulwark, Reprisal bleibt ein Basisangriff und
      rune-erzeugte Effekte erzeugen keine neuen Trigger
- [ ] Temporäre Zustände leben ausschließlich im Kampfzustand, sind begrenzt und können weder
      Gegner heilen noch den Endlichkeits-Beweis des Kampfes verletzen
- [ ] Rite-Auslösungen und ihre Folgen sind als strukturierte Combat-Events im Combat Log lesbar
      und bleiben Teil der vorhandenen Playback-Reihenfolge
- [ ] Die Engine bleibt rein und seedbar; Unit- und Integrations-Tests decken jeden Trigger,
      Einmal-pro-Runde, eigene Ereignisse, Level-Skalierung, Bolt-Bulwark und Determinismus ab

## Betroffene Dateien

- `src/features/combat/engine/` — Event-Auswertung, temporärer Kampfzustand und Basis-Effects
- `src/features/combat/ui/` — strukturierte Rite-Events im Combat Log
- `src/features/dungeon/` — aktive Rites beim Aufbau eines Dungeon-Kampfs übergeben
- `src/game/runes/` — deklarative Effect- und Attunement-Skalierung

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
