# 035 — Runescribe: Inscribe & Etch

| Feld             | Wert     |
| ---------------- | -------- |
| **Status**       | `ready`  |
| **Meilenstein**  | M5       |
| **Hängt ab von** | 033, 034 |

## Ziel

Runescribe ersetzt den Platzhalter durch das Rune Grimoire: Der Spieler sieht seinen wachsenden
Katalog und kann mit Runewords und Gold unbekannte Runen entdecken oder bekannte Runen bis zum
freigeschalteten Cap leveln.

## Nicht-Ziel

[036](036-talisman-rite-konfiguration.md) legt die entdeckten Runen erst auf Talismane. Dieser
Task führt keine Rite-Kampfauslösung und keine Modifier-Kampfwirkung ein.

## Blockiert durch

[033](033-rune-grimoire-fundament.md) liefert Katalog, Cap und Save-Modell;
[034](034-runewords-drops.md) macht die Währung im Spiel erwerbbar.

## Verbindliche Spec-Anker

- [Träger: Rune Grimoire, Talisman, Rite](../../spec/RUNES.md#2-träger-rune-grimoire-talisman-rite)
  — sichtbare Silhouetten ab Mindesttiefe, kein Inventar und kein Duplizieren
- [Rune-Level](../../spec/RUNES.md#5-rune-level) — Level-Facetten und Cap
- [Rune-Grimoire-Aktionen](../../spec/RUNES.md#7-rune-grimoire-aktionen) — Kategorie-Rezepte,
  unbekannter Pool, Kosten, kein Fehlzug und Etch ohne RNG
- [Seeds und Zufalls-Ströme](../../spec/SIMULATION.md#4-seeds-und-zufalls-ströme) — Craft-Seed,
  `craftCounter` und atomarer Roll
- [Viewport- und Screen-Contract](../../spec/UI.md#1-viewport--und-screen-contract) — Runescribe
  integriert sich als regulärer, responsiver Screen

## Akzeptanzkriterien

- [ ] `runescribe` rendert einen zugänglichen Rune-Grimoire-Screen statt des Platzhalters; er
      zeigt Runewords, bekannte Runen mit Level und bei erreichter Mindesttiefe die kategorisierte
      Silhouette unbekannter Runen
- [ ] Inscribe bietet je Kategorie genau ein Rezept, zieht nur eine erreichbare und noch
      unbekannte Rune, zieht nie doppelt und entfernt das Rezept bei vollständiger Entdeckung
- [ ] Jeder Inscribe-Roll kostet Runewords und Gold, verwendet den Craft-Seed und erhöht den
      `craftCounter` zusammen mit Bezahlung und Ergebnis atomar; unzureichende Mittel oder ein
      leerer Pool verändern keinen Save
- [ ] Etch erhöht ausschließlich eine bekannte Rune um eine Stufe bis zum aktuellen Cap, kostet
      die steigenden Runewords- und Goldwerte und enthält keinen Zufallswurf
- [ ] Unit-, Store- und Component-Tests decken Mindesttiefe, unbekannten Pool, fehlende Mittel,
      Cap, Craft-Determinismus, Reload und Tastaturbedienung ab

## Betroffene Dateien

- `src/game/runes/` — Pool-Auswahl, Kosten und Level-Regeln
- `src/features/save/` — atomare Inscribe-/Etch-Transaktionen
- `src/app/ui/ActiveView.tsx`, `src/features/runes/` — Runescribe-Screen und lokale UI-Auswahl
- `src/shared/utils/prng.ts` — Craft-Stream als zentrale, benannte Konstante ergänzen

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
