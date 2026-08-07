# 008 — WeaponMasteryScreen: A11y & Zerlegung

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Schwere**      | mittel  |
| **Hängt ab von** | —       |

## Ziel

Der Weapon-Mastery-Screen ist keyboard-accessibel (Dialog, Tabs), in fokussierte Komponenten
zerlegt, und seine UI-Verdrahtung ist getestet.

## Befund

Alle Fundstellen in
[WeaponMasteryScreen.tsx](../../../src/features/weaponMastery/WeaponMasteryScreen.tsx):

- **Dialog ohne Fokus-Management (Schwere: hoch):** Der Respec-Dialog (Z. 187–214) trägt
  `role="dialog"` + `aria-modal="true"`; Fokus-Move, Fokus-Trap und Escape fehlen — der
  Tastaturfokus bleibt hinter dem Overlay.
- **Unvollständiges Tab-Pattern:** `role="tablist"`/`role="tab"` (Z. 93–112) ohne
  Pfeiltasten-Navigation, `aria-controls` und `role="tabpanel"`.
- **`role="alert"`** (Z. 170–174) für einen statischen Lock-Hinweis feuert bei jeder
  Node-Auswahl eine assertive Ansage.
- **`min-w-[850px]`** (Z. 113) ohne umgebenden Scroll-Container — auf schmalen Viewports
  läuft der Screen aus dem Layout.
- **Komponentengröße:** 217 Zeilen mit fünf Verantwortlichkeiten (Charakter-Rail,
  Disziplin-Tabs, Node-Grid, Inspector, Respec-Dialog) und vierfachem lokalem State.
- **Testlücke:** Invest-Enable/Disable via `lockReason`, Dialog-Flow und
  Charakterwechsel-Reset sind UI-seitig ungetestet; die Regel-Logik selbst liegt testbar in
  `@/game`.

## Nicht-Ziel

Änderungen an der Mastery-Regel-Logik in `src/game/`.

## Verbindliche Spec-Anker

- [AGENTS.md § Coding Style](../../../AGENTS.md#coding-style--naming-conventions) — semantisches, keyboard-accessibles HTML
- [WEAPON-MASTERY.md](../../spec/WEAPON-MASTERY.md) — Kauf-/Respec-Regeln

## Akzeptanzkriterien

- [ ] Der Respec-Dialog nutzt natives `<dialog>` mit `showModal()` (oder Fokus-Trap +
      Escape); Fokus wandert hinein und zurück.
- [ ] Tabs erfüllen das ARIA-Tab-Pattern vollständig oder verwenden `aria-pressed`-Buttons
      ohne Tab-Rollen.
- [ ] Der Lock-Hinweis verwendet `aria-live="polite"` oder keine Live-Region.
- [ ] Das Node-Grid liegt in einem Scroll-Container oder skaliert responsiv.
- [ ] `RespecDialog` und `NodeInspector` sind eigene Komponenten.
- [ ] Komponententests decken Invest-Button-Zustände, Dialog-Flow (öffnen/bestätigen/
      abbrechen) und Charakterwechsel-Reset.

## Betroffene Dateien

- `src/features/weaponMastery/WeaponMasteryScreen.tsx` — Zerlegung
- `src/features/weaponMastery/` — neue Komponenten + Tests

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
