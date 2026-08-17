# 023 — Heroes-Hub & Stats

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Meilenstein**  | M3     |
| **Hängt ab von** | 022    |

## Ziel

Heroes wird zur charaktergebundenen Zentrale: Der bestehende Sidebar-Switcher setzt den
gemeinsamen Charakterkontext, und der Stats-Bereich zeigt dessen aktuelle effektive Gesamtwerte.

## Nicht-Ziel

Weapon Mastery bleibt ein eigener Sidebar-Screen. Die Loadout-Darstellung aus
[024](024-loadout-ansicht.md) entsteht erst im Folgetask; der Talisman bleibt bis M5 gesperrt.
Dieser Task führt keine neue Spielregel, keinen neuen Wert und keine Quellenaufschlüsselung ein.

## Blockiert durch

[022](022-armory-und-armor-fundament.md) — die Stats-Ansicht muss gegen den finalen M3-Vertrag der
effektiven Armor-Werte gebaut werden.

## Verbindliche Spec-Anker

- [Stats](../../spec/CHARACTERS.md#2-stats) — Kategorien, abgeleitete Werte und ihre Quellen
- [Ausrüstung](../../spec/CHARACTERS.md#6-ausrüstung) — Armor und Signaturwaffe sind getrennte
  Systeme
- [Weapon-Mastery-Ansicht](../../spec/WEAPON-MASTERY.md#7-weapon-mastery-ansicht) — Weapon Mastery
  bleibt eigener Sidebar-Eintrag; der Character Switcher gilt view-übergreifend nur für die Sitzung
- [Viewport- und Screen-Contract](../../spec/UI.md#1-viewport--und-screen-contract) und
  [State-Modell](../../spec/UI.md#5-state-modell) — lokaler Screen-Zustand, Tabs und bestehende
  Primitives

## Akzeptanzkriterien

- [ ] `WEAPON MASTERY` bleibt ein eigener primärer Navigationseintrag und dupliziert keinen
      Skilltree in Heroes
- [ ] Heroes besitzt die lokalen Bereiche `Stats` und `Loadout`; der aktive Bereich bleibt während
      der Sitzung erhalten und startet nach Reload bei `Stats`
- [ ] Der Sidebar-Character-Switcher bleibt die einzige Charakterauswahl und setzt denselben
      aktiven Charakter für Stats, Loadout und Weapon Mastery
- [ ] `Stats` zeigt die aktuellen effektiven Gesamtwerte des aktiven Charakters nach ihren
      Stat-Kategorien, ohne neue Werte zu berechnen oder deren Quellen zentral aufzuschlüsseln
- [ ] Der noch nicht ausgebaute Loadout-Bereich hat keinen separaten Top-Level-Navigationseintrag;
      seine vollständige Darstellung wird durch [024](024-loadout-ansicht.md) ergänzt
- [ ] Die Tab-Navigation ist vollständig per Tastatur bedienbar, nutzt bestehende State-Primitives
      und erzeugt keinen Dokument-Scroll
- [ ] Component-Tests prüfen Charakterwechsel, Session-Verhalten der lokalen Auswahl,
      Reload-Default und die Darstellung effektiver Gesamtwerte

## Betroffene Dateien

- `src/app/` — Navigation-Store und View-Anbindung ohne neuen primären View
- `src/features/heroes/` — Heroes-Screen, Stats-Darstellung und lokaler Tab-Zustand
- `src/shared/ui/` — vorhandene Tabs, Screen- und State-Primitives wiederverwenden

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
