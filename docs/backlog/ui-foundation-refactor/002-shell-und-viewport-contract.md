# 002 — Shell- & Viewport-Contract

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `blocked` |
| **Meilenstein**  | UIF       |
| **Hängt ab von** | 001       |

## Ziel

Die App füllt exakt den Viewport, gescrollt wird ausschließlich in dafür vorgesehenen Containern,
`ScreenLayout` ist standardmäßig full-height mit `scroll`-Prop und `@container`, und die
ResourceDock ist entfernt.

## Nicht-Ziel

Screen-interne Layoutumbauten (Caps, Zentrierung, Container-Query-Konvertierung) liegen in
[006](006-screen-dungeon-selection.md) bis [009](009-screen-dungeon-run.md).

## Blockiert durch

[001](001-tokens-und-state-fundament.md) — `--spacing-nav`, `--spacing-page-pad` und
`--spacing-frame-pad` müssen gemergt sein.

## Verbindliche Spec-Anker

- [FOUNDATION §1](FOUNDATION.md#1-viewport-und-screen-contract) — Shell-Struktur, symmetrische
  Branches, ScreenLayout-Contract, Scroll-Regel
- [Fortschritt §4](../../spec/PROGRESSION.md#4-checkpoints-wipe--abbruch) — ein laufender Run
  belegt den gesamten Viewport ohne Primärnavigation, Branding und Ressourcenanzeige
- [Weapon Mastery §7](../../spec/WEAPON-MASTERY.md#7-weapon-mastery-ansicht) — bei 1920×1080
  passt die Ansicht ohne Seiten-Scroll; kleinere Auflösungen nutzen einen responsiven Fallback

## Akzeptanzkriterien

- [ ] `body` trägt `overflow: hidden`; die `min-height: 100vh`-Regel ist entfernt; `html`, `body`
      und `#root` scrollen bei keiner Auflösung
- [ ] `main` ist `min-h-0 flex-1 overflow-hidden`; Run- und Normal-Branch der AppShell tragen
      symmetrisch `flex min-h-0 min-w-0 flex-1 overflow-hidden`
- [ ] Die Sidebar bezieht ihre Höhe aus dem Flex-Stretch der Shell und ihre Breite aus `w-nav`
- [ ] `ScreenLayout` rendert full-height (`h-full min-h-0`), stellt `@container` am
      Content-Wrapper, nutzt `p-4 sm:p-page-pad` und bietet die `scroll`-Prop
      (Default `true` = eigener `overflow-y-auto`; `DungeonRunScreen` übergibt `false`)
- [ ] Dungeon Selection und Crucible scrollen im ScreenLayout-Scroller; die Sticky-Inspector von
      Crucible und Weapon Mastery funktionieren darin (manuell verifiziert)
- [ ] Der Placeholder in `ActiveView` rendert in `ScreenLayout`
- [ ] `ResourceDock` ist entfernt: Datei, Verwendung in `AppShell`, die Crucible-Reserve
      `@min-[900px]:pr-80` sowie die Resources-Assertions in `AppShell.test.tsx` und
      `e2e/smoke.spec.ts`
- [ ] `npm test` und `npm run test:e2e` sind grün; neue E2E-Checks: kein Dokument-/`main`-Scroll
      auf Dungeon Selection und Crucible bei 1920×1080 und 1280×720

## Betroffene Dateien

- `src/app/AppShell.tsx`, `src/app/ui/AppSidebar.tsx`, `src/app/ui/ActiveView.tsx`
- `src/app/ui/ResourceDock.tsx` — löschen
- `src/shared/ui/ScreenLayout.tsx` (+ Test um `scroll`-Fälle erweitern)
- `src/features/crucible/CrucibleScreen.tsx` — `pr-80`-Reserve
- `src/features/dungeon/ui/DungeonRunScreen.tsx` — `scroll={false}`
- `src/app/index.css` — body-Regeln, `--spacing-frame-pad`-Nutzung der Vollrahmen
- `src/app/AppShell.test.tsx`, `e2e/smoke.spec.ts`

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
