# 024 — Loadout-Ansicht

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `blocked` |
| **Meilenstein**  | M3        |
| **Hängt ab von** | 022, 023  |

## Ziel

Der Loadout-Bereich von Heroes macht die permanente Signaturwaffe und die Armor eines aktiven
Charakters als auswählbare, detailorientierte Ausrüstung sichtbar — ohne Inventar oder
Item-Interaktion vorzutäuschen.

## Nicht-Ziel

Weapon Mastery bleibt in seinem eigenen Screen. Der Loadout enthält weder Ausrüsten, Tausch noch
Handwerksaktionen; Sockel, Seltenheit und Implicit entstehen erst in M4. Der Talisman ist in M3
nicht nutzbar und erhält keinen eigenen Heroes-Tab.

## Blockiert durch

[022](022-armory-und-armor-fundament.md) — persistierte Slot-Wahrheit und Kampfwerte sind die
Quelle des Loadouts. [023](023-heroes-hub-und-stats.md) stellt Charakterkontext und lokalen
Bereich bereit.

## Verbindliche Spec-Anker

- [Ausrüstung](../../spec/CHARACTERS.md#6-ausrüstung) — Signaturwaffe, vier permanente Armor-Slots,
  kein Inventar und kein Tausch
- [Slots, Basen & Innate-Affixe](../../spec/ITEMS.md#1-slots-basen--innate-affixe) — Basen,
  Innates und Armory-Freischaltung
- [Item-Anatomie](../../spec/ITEMS.md#2-item-anatomie-fünf-schichten) — M3 zeigt nur Basis und
  Item-Level; spätere Schichten werden nicht simuliert
- [Weapon-Mastery-Ansicht](../../spec/WEAPON-MASTERY.md#7-weapon-mastery-ansicht) — Weapon Mastery
  bleibt vom Loadout getrennt
- [Viewport- und Screen-Contract](../../spec/UI.md#1-viewport--und-screen-contract) und
  [State-Modell](../../spec/UI.md#5-state-modell) — lokale Scrolls, semantische Zustände und
  Tastaturbedienung

## Akzeptanzkriterien

- [ ] `Loadout` ist ein lokaler Heroes-Bereich, kein eigener Sidebar-Eintrag; der aktive
      Character-Switcher bestimmt seinen Inhalt
- [ ] Das Layout verwendet keine Charakterporträts: rechts steht die anatomische Armor-Säule
      Head, Chest, Legs, Feet; links oben der abgesetzte Talisman-Bereich, links unten die
      Signaturwaffe
- [ ] Die freigeschaltete Signaturwaffe ist auswählbar und zeigt aktuelle effektive Waffenwerte
      einschließlich bereits wirksamer Weapon-Mastery-Effekte, aber keinen Skilltree
- [ ] Freigeschaltete Armor-Slots sind auswählbar und zeigen ausschließlich Basis, Item-Level und
      Innate-Wert; es gibt keine leeren Sockel-, Seltenheits- oder Implicit-Platzhalter
- [ ] Gesperrte Armor-Slots sind nicht auswählbar, zeigen keine Detailkarte und tragen einen
      zugänglichen Locked-Status; ihre konkrete Freischaltung erklärt nur der Crucible-Inspector
- [ ] Der Talisman ist als nicht-Armor-Ritual-Slot sichtbar und auswählbar, bleibt gesperrt und
      erklärt im Detailbereich seine Freischaltung in M5
- [ ] Die Slot-Auswahl ändert ausschließlich die Detailansicht. Alle Zustände sind per Tastatur
      erreichbar, respektieren `prefers-reduced-motion` und erzeugen keinen Dokument-Scroll
- [ ] Component- und E2E-Tests decken Auswahl, Sperrbehandlung, Detailinhalt, Character-Wechsel
      und die responsive Anordnung ab

## Betroffene Dateien

- `src/features/heroes/` — Loadout-Bereich, Slot-Auswahl und Detaildarstellung
- `src/app/` — bestehende Heroes-Anbindung, keine neue primäre Navigation
- `src/shared/ui/` — vorhandene Tabs, Panels und State-Primitives wiederverwenden
- `e2e/` — Heroes-Loadout und responsive Screen-Route

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
