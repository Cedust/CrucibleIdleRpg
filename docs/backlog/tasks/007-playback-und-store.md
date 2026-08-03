# 007 — Playback & Combat-Store

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Meilenstein**  | M1     |
| **Hängt ab von** | 006    |

## Ziel

Ein Zeit-Akkumulator treibt das Schrittwerk mit dem Grundtakt an, ein Zustand-Store hält den
laufenden Kampf, und Pause funktioniert.

## Nicht-Ziel

**2×-Geschwindigkeit** ist pro Dungeon freizuschalten
([Checkpoints, Wipe & Abbruch](../../spec/PROGRESSION.md#4-checkpoints-wipe--abbruch)) und
folgt in M2 — die Stufe ist als Parameter vorzusehen. Rendering liegt in
[008](008-kampfbildschirm.md).

## Verbindliche Spec-Anker

- [Playback](../../spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit) — Grundtakt
  1000 ms pro Akteur; Pause ab Spielstart; die Geschwindigkeit betrifft ausschließlich die
  Anzeige
- [Zeitverhalten & Catch-up](../../spec/SIMULATION.md#3-zeitverhalten--catch-up) — der
  Akkumulator trägt, Page Visibility ist nur Beschleuniger; **Deckel 5 Minuten**, darüber
  hinaus verfällt Zeit; Zeitbudget pro Frame mit Abgabe an den Browser
- [Grundmodell](../../spec/SIMULATION.md#1-grundmodell-verbindlich) — kein Offline-Progress
- [AGENTS.md §6](../../../AGENTS.md#6-state-management-zustand) — Zustand-Store pro Feature,
  selektive Subscriptions

## Akzeptanzkriterien

- [x] Das Playback berührt den Kampfverlauf nicht: gleicher Seed ⇒ gleicher Ausgang bei jeder
      Geschwindigkeitsstufe und bei beliebiger Batch-Größe (Test gegen einen am Stück
      gerechneten Referenzlauf)
- [x] Aus verstrichener Zeit werden die fälligen Takte abgeleitet, nicht ein Takt pro Frame
- [x] Zeit über dem 5-Minuten-Deckel verfällt; der Kampf läuft danach normal weiter
- [x] Ein Catch-up-Batch gibt zwischendurch an den Browser ab
- [x] Pause hält das Playback an, ohne Zeit zu akkumulieren
- [x] Der Store hält den laufenden Kampf und wird beim Ansichtswechsel nicht zurückgesetzt
      ([AGENTS.md §6](../../../AGENTS.md#6-state-management-zustand))
- [x] Die Zeitquelle ist injizierbar, damit der Test ohne echte Uhr läuft

## Betroffene Dateien

- `src/features/combat/combatStore.ts` + Test
- `src/features/combat/useCombatPlayback.ts` + Test
