# UI-Foundation — Style-Guide

> **Zweck:** Dauerhafter Style-Guide der UI-Foundation: Viewport-Contract, Responsive-Mechanik,
> State-System und Shared Primitives. Neue Screens und UI-Arbeit bauen gegen diese Regeln
> (Task-Historie: [README.md](README.md)). Produktabsicht:
> [DESIGN.md §5](../../DESIGN.md#5-visuelle-umsetzung);
> Styling-Grundregeln: [AGENTS.md](../../../AGENTS.md).

Getroffene Grundsatzentscheidungen (Review 2026-08-14):

1. Chrome-Skalierung über **Per-Token-Clamps**; die Root-`font-size` bleibt bei 16 px
   (Browser-Zoom und User-Font-Präferenzen bleiben unberührt).
2. Die **ResourceDock entfällt ersatzlos**; die Ressourcen-Anzeige wird mit M4 (Handwerk) in den
   betroffenen Screens neu verortet.
3. Class-Komposition über einen **handgerollten `cn()`-Helper**; Variant-Libraries bleiben außen vor.

---

## 1. Viewport und Screen-Contract

```text
html/body           → overflow: hidden (kein Seiten-Scroll)
AppShell            → flex h-dvh; Run- und Normal-Branch symmetrisch
                      (min-h-0 / min-w-0 / flex / overflow-hidden)
├── AppSidebar      → w-nav (Clamp-Token), Höhe aus Flex-Stretch
└── Main-Spalte     → flex-1 min-w-0 min-h-0 overflow-hidden, border-image-mainview
    └── main        → min-h-0 flex-1 overflow-hidden
        └── ScreenLayout
            ├── @container am Content-Wrapper (Container-Queries für alle Screens)
            ├── Background-Layer (bg-cover + Vignette, unverändert)
            └── Content-Wrapper: full-height flex, p-4 sm:p-page-pad,
                scroll-Prop: true (Default) = eigener overflow-y-auto,
                false = Screen managt eigene Scroller
                └── Screen: mx-auto w-full max-w-<screen-cap>
                    + interne Scroll-Areas (min-h-0 flex-1 overflow-y-auto)
```

- Gescrollt wird ausschließlich in dafür vorgesehenen Containern (Listen, Logs, Trees,
  Tab-Strips als Fallback). Der ScreenLayout-Default-Scroller deckt Screens ohne eigene
  Scroll-Struktur ab.
- `ScreenHeader` rendert das gemeinsame Titel-/Intro-Muster (`font-display text-display-lg`
  - `font-intro`-Absatz); `headingLevel` wählt `h2` (Default) oder `h1` (Dungeon-Run ohne
    App-Navigation).
- Ein Dungeon-Run belegt den gesamten Viewport ohne Navigation
  ([Fortschritt §4](../../spec/PROGRESSION.md#4-checkpoints-wipe--abbruch)); der Run-Branch der
  AppShell bleibt dafür der Schalter.
- Neue Screens (Heroes M3, Blacksmith/Jeweler M4, Runes M5) docken über denselben Contract an:
  `ScreenLayout` (`scroll` wählen) + `ScreenHeader` + ein `--container-*`-Cap + Container-Queries
  - `stateAttrs`/Fragmente.

## 2. Responsive-Mechanik

Fluidität lebt in einzelnen `@theme`-Tokens nach diesem Muster:

```css
/* Muster: MIN bis 1920px-Äquivalent, linear bis MAX bei 3840px-Äquivalent.
   min(100vw, 177.78vh) = 16:9-normierte Breite → Ultrawide (3440×1440) skaliert
   wie 1440p (Höhenklasse). SLOPE = (MAX − MIN) / 1920 (Zahl, präkomputiert). */
--spacing-nav: clamp(18rem, calc(18rem + (min(100vw, 177.78vh) - 1920px) * 0.028125), 21.375rem);
/* 288px @≤1080p → 306px @1440p → 342px @4K */
```

- Bei ≤ 1920px-Äquivalent (alle bestehenden E2E-Viewports, inklusive 2048×785 = vh-limitiert
  1395px-Äquivalent) rendern Chrome-Maße und Text-Skala auf ihren Clamp-Minima und damit
  identisch zum Stand vor dem Refactor. Die von den Screen-Tasks angeordneten
  Layout-Neuverankerungen (Zentrierung, Screen-Caps, Threshold-Vereinheitlichung auf 1200,
  Entfall der Dock-Reserve) verändern Positionen auch ≤ 1920 bewusst —
  Liste: [DECISIONS D-008](DECISIONS.md#d-008--scope-der-pixel-identität-und-sanktionierte-normalisierungen).
- `clamp()` begrenzt jeden vw/vh-Term; unbegrenzte Viewport-Größen sind ausgeschlossen.
- Die Tailwind-Default-Tokens `--text-xs/--text-sm/--text-base` und die drei `--text-display-*`
  werden clamp-basiert überschrieben — alle bestehenden Verwendungen werden dadurch fluid,
  Callsites bleiben unverändert (Line-Height-Ratios sind unitless und skalieren mit).
- **Responsive-Idiom:** Container-Queries für alle Layout-Wechsel innerhalb des Mainviews
  (ScreenLayout stellt `@container`); Media-Queries nur für echte Viewport-Belange
  (`sm:`-Padding-Fallback, ErrorBoundary). Umrechnungsrezept:
  Container-Threshold = Viewport-Threshold − Nav − Frame − Page-Padding.
  Wiederholte Thresholds laufen über benannte `--container-*`-Varianten (`@tree-cols:`,
  `@branch-cols:`); einmalige Thresholds bleiben arbitrary und rem-basiert (`@min-[19rem]` u. a.).

## 3. Zuordnung fixed und fluid

| Kategorie              | Elemente                                                                                                                                      | Mechanik                                                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Fixed**              | 9-Slice-Frame-Geometrie der Panels/Vollrahmen (border-width/outset/slices), Frame-Gutter 12 px, Dungeon-Kachel `h-74 w-40`, kleine Gaps/Radii | px/rem-konstant ([DECISIONS D-004](DECISIONS.md#d-004--task-010-keine-clamps-für-die-9-slice-frame-geometrie)); Ausnahme Tab-Frame und Tab-Surface: leicht fluid (D-006) |
| **Leicht fluid**       | Nav-Breite, Tab-Strip-Höhe, Inspector-Spalte, Page-Padding, Text-Skala, Node-Medallions, Combat-Portraits                                     | Clamp-Tokens, 1,00× → ~1,09× @1440p → 1,25× @4K                                                                                                                          |
| **Voll fluid**         | Graph-/Tree-Spalten, Arena-Spalten, Karten-Grid (`auto-fill`), Listenflächen, Log                                                             | Grid/Flex/`fr`/`minmax` + `min-w-0`/`min-h-0`                                                                                                                            |
| **Lokal scrollbar**    | Sidebar-Nav, ScreenLayout-Default-Scroller, Mastery-Tree-Canvas, Combat-Log, Arena, TurnOrder, Tab-Strips                                     | `min-h-0 flex-1 overflow-y-auto`                                                                                                                                         |
| **max-width-begrenzt** | pro Screen-Typ, zentriert: `--container-page` (Trees), `--container-page-narrow` (Listen/Detail), `--container-run` (Arena)                   | `mx-auto w-full max-w-*`                                                                                                                                                 |

Die Caps sind bewusst pro Screen-Typ definiert; ein globales Maximum gibt es nicht.

## 4. Token-Katalog

`src/app/index.css`, `@theme` — finale Werte, validiert über
[e2e/responsive.spec.ts](../../../e2e/responsive.spec.ts) (Abweichungen der Doku-Stützstellen:
[DECISIONS D-003](DECISIONS.md#d-003--task-010-nav-stützstelle-bei-1440p-ist-in-foundation-nicht-linear)):

```css
@theme {
  /* — Layout (leicht fluid, Muster §2) — */
  --spacing-nav: clamp(18rem, …, 21.375rem); /* Sidebar */
  --spacing-tab-strip: clamp(4rem, …, 6rem); /* Tab-Leisten der Tree-Screens (Faktor 1,5) */
  --spacing-inspector: clamp(19rem, …, 22rem); /* Node-Inspector-Spalte */
  --spacing-page-pad: clamp(1.5rem, …, 2rem); /* ScreenLayout-Padding */
  --spacing-medallion: clamp(5rem, …, 6rem); /* Node-Medallion lg */
  --spacing-medallion-sm: clamp(4rem, …, 5rem); /* Node-Medallion md */
  --spacing-portrait-xl: clamp(9rem, …, 11.25rem); /* CombatPortrait xl; sm/md/lg analog */

  /* — Layout (fix) — */
  --spacing-frame-pad: 0.75rem; /* Gutter der Vollrahmen */

  /* — Screen-Caps (pro Screen-Typ) — */
  --container-page: 96rem; /* Tree-Screens */
  --container-page-narrow: 80rem; /* Listen/Detail */
  --container-run: clamp(105rem, …, 131rem); /* Dungeon-Run-Arena */

  /* — Container-Query-Thresholds (Tree-Screens) — */
  --container-tree-cols: 75rem; /* zweispaltiges Tree-Layout (@tree-cols:) */
  --container-branch-cols: 50rem; /* Branch-Lane-Flip (@branch-cols:) */

  /* — Typografie (fluid; ersetzt die Defaults) — */
  --text-xs: clamp(0.75rem, …, 0.9375rem);
  --text-sm: clamp(0.875rem, …, 1.09375rem);
  --text-base: clamp(1rem, …, 1.25rem);
  --text-2xs: clamp(0.65rem, …, 0.8125rem); /* Mikro-Labels (Branch, Rank-Level) */
  --text-display-sm: clamp(0.875rem, …, 1.09375rem);
  /* --text-display / --text-display-lg analog */

  /* — State: Interaction — */
  --color-state-selected: var(--color-accent);
  --color-state-selected-tint: color-mix(in srgb, var(--color-accent) 12%, transparent);
  --color-state-focus: var(--color-accent);

  /* — State: Semantic — */
  --color-state-locked-border: var(--color-border);
  --color-state-empty-border: color-mix(in srgb, var(--color-border) 70%, transparent);

  /* — De-Emphasis-Skala — */
  --state-deemphasis-strong: 0.3; /* Frame-Art leerer/gesperrter Container */
  --state-deemphasis-medium: 0.55; /* Bildmaterial locked/defeated */
  --state-deemphasis-weak: 0.75; /* nicht selektierte Frame-Art */

  /* — Glows, palette-gebunden, kontrollierter Radius — */
  --shadow-glow-accent: 0 0 16px 0 color-mix(in srgb, var(--color-accent) 25%, transparent);
  --shadow-glow-accent-sm: 0 0 5px 0 color-mix(in srgb, var(--color-accent) 60%, transparent);
  --drop-shadow-glow-accent: 0 0 6px color-mix(in srgb, var(--color-accent) 40%, transparent);
  --shadow-glow-ember-inset: inset 0 0 20px color-mix(in srgb, var(--color-ember) 42%, transparent);

  /* — Text-Kontrast auf Bild-Hintergründen — */
  --drop-shadow-text-contrast: 0 1px 3px rgb(0 0 0 / 0.95);
}

@utility transition-state {
  transition-property:
    color, background-color, border-color, outline-color, opacity, box-shadow, filter;
  transition-duration: 150ms;
}
```

Der `--container-*`-Namespace trägt zwei Rollen: Screen-Caps (`max-w-*`) und
Container-Query-Stützstellen (`@tree-cols:`, `@branch-cols:`), unterschieden über den Namen.
Das `min-w-200` der Mastery-Tab-Leiste bleibt numerisch — ein eigenständiger Lesbarkeits-Floor,
der nur zufällig wertgleich mit `--container-branch-cols` ist. Die Dungeon-Hintergründe leben
in zwei absichtlichen Maps: `ScreenLayout` trägt die Screen-Art, `dungeonBackgrounds.ts` die
Karten-Art (nur `ashen-depths` nutzt eine eigene Karten-Variante).
Schwarz-Literale bleiben Scrims und Schatten vorbehalten (`backdrop:bg-black/70` des Dialogs,
`--drop-shadow-text-contrast`); alle anderen Farben laufen über Palette-Tokens.

Bewusst ohne Token: Panel-Gap (`gap-5` genügt), Button-Höhen (padding-getrieben), die
`8rem`-Node-Spalten des Branch-Graphen (lokale TS-Konstante, ein Konsument), einmalige
Container-Thresholds der Listen-/Combat-Screens (`@min-[19rem]` u. a.), komponentenspezifische
State-Tokens (`--shadow-glow-ember-inset` ist die einzige, dokumentierte Ausnahme:
Ember-Identität der Mastery-Tabs).

## 5. State-Modell

Zwei orthogonale, kombinierbare Achsen:

```ts
// Interaction-Achse: hover/focus/active über CSS-Pseudoklassen; explizit nur:
selected?: boolean;   // exklusives Highlight (Tab, Node, Card, Character, aktueller Akteur)
disabled?: boolean;   // Aktion bekannt, aktuell nicht ausführbar → natives disabled wo möglich

// Semantic-Achse (game-weit):
type SemanticState = 'normal' | 'locked' | 'empty';
```

- `stateAttrs({ selected, semantic })` in `src/shared/ui/state.ts` setzt `data-selected` /
  `data-semantic="locked|empty"`; das Styling hängt an Tailwind-data-Variants. Klassenlisten pro
  Komponente sind dadurch statisch; Kombinationen (Locked+Hover, Locked+Selected) entstehen nativ
  im CSS. Die kanonischen Fragmente (`focusRing`, `selectedRing`, `selectedSurface`, `hoverBorder`,
  `transitionState`) leben ausschließlich in `state.ts`; ebenso die einzige Arbitrary-Group-Variant
  (`group-[:hover:not([data-semantic=locked])]:`).
- **Feature-Facetten:** Node-`available|insufficient|max` → `data-availability` (gesetzt vom
  gemeinsamen `NodeButton`, Typ `NodeAvailability` in `src/shared/ui/NodeButton.tsx`);
  Combat-`defeated` → `data-defeated`. Facetten stylen Akzente; Selection-Ring, Locked-Treatment
  und Focus-Ring kommen immer aus den globalen Fragmenten. Eine Facette wird erst zum
  `SemanticState`, wenn ein zweites Feature dieselbe Bedeutung braucht.
- Kanonischer Prop-Name für Selektion ist `selected`.
- ARIA bleibt pattern-korrekt: `role=tab`+`aria-selected` (Tabs), Radio+`aria-checked`
  (CharacterSwitcher, DungeonCards), `aria-pressed` (Nodes, Playback), `aria-current="page|step"`
  (Nav, TurnOrder). Das visuelle System hängt einheitlich an `data-*`.
- Locked-Elemente bleiben klickbar (Klick = Inspizieren/Vorschau); `cursor-pointer` ist dort
  zutreffend.

## 6. Visuelle State-Regeln

Globalregeln: Opacity liegt ausschließlich auf Art-Layern (Hintergrund, Frame-Overlay, Portrait,
Icon) — Text bleibt ≥ AA lesbar. Glow bedeutet Selektion oder Kauf-Affordance. Jede state-tragende
Ebene nutzt `transition-state motion-reduce:transition-none`. Focus:
`outline-2 outline-offset-2 outline-state-focus` (Ausnahmen in §10).

| Kombination             | Sprache                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Normal + Default        | `border-border`, volle Lesbarkeit, kein Glow                                                                                                                  |
| Normal + Hover          | Border → `border-ornament`, Surface-Lift, kein Glow (Hover ≠ Selected)                                                                                        |
| Normal + Selected       | `ring-2 ring-state-selected` bzw. Frame in voller Stärke + `bg-state-selected-tint` + `shadow-glow-accent`, volle Opacity                                     |
| Locked + Default        | `border-state-locked-border`; Art `--state-deemphasis-medium` + `grayscale-50`; Text `text-text-muted`; Lock-Indikator; kein Glow; `cursor-pointer` (Inspect) |
| Locked + Hover          | neutraler Lift (`bg-surface/50`), Gold-Akzente bleiben aus                                                                                                    |
| Locked + Selected       | Selection-Ring in voller Stärke, Art bleibt gedimmt                                                                                                           |
| Empty + Default         | `border-dashed border-state-empty-border`, zurückgenommener Background, volle Text-Lesbarkeit, kein Glow                                                      |
| Empty + Hover           | dashed → `border-ornament`, leichter Lift                                                                                                                     |
| Disabled + Default      | nur Controls: `disabled:opacity-50` ganzheitlich (dokumentierte Ausnahme) + `cursor-not-allowed`                                                              |
| Facette available / max | `border-accent-strong` bzw. `border-accent` + `shadow-glow-accent`                                                                                            |
| Facette insufficient    | `border-border text-text`, kein Glow                                                                                                                          |
| Facette defeated        | Portrait `grayscale` + `--state-deemphasis-medium`; Name und Werte voll lesbar                                                                                |

Nicht-interaktive Elemente (z. B. ActPanel) tragen weder Hover-Affordance noch Selection-Glow;
„current" zeigt sich über vollen Frame und Gold-Titel, `aria-current` bleibt.

## 7. Shared Primitives

| Primitive                                   | API (minimal)                                                                                                                                     | Konsumenten                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `cn()` (`src/shared/ui/cn.ts`)              | `cn(...parts: Array<string \| false \| null \| undefined>)`                                                                                       | alle migrierten Komponenten                          |
| `state.ts`                                  | `SemanticState`, `VisualStateProps`, `stateAttrs()`, kanonische Fragmente                                                                         | alle migrierten Komponenten                          |
| `NodeMedallion` + `RankPips`                | `size: 'md' \| 'lg'`, `invested`, children = Icon; Badge/Ring über `group-data-*`                                                                 | `NodeButton`; Pips zusätzlich `NodeInspectorPanel`   |
| `NodeButton`                                | `NodeAvailability`, `name`/`visibleLabel`, `insufficientStatus`, `layout: 'standard' \| 'branch'`, `medallionSize?`, children = Medaillon-Icon    | beide Tree-Graphen                                   |
| `NodeInspectorPanel`                        | `label`, `medallion`, `title`, `rankCaption`, `effect`, `lockReason`/`lockReasonId` → `aria-describedby`, `actionLabel?`, children = Detailzeilen | beide Node-Inspectors, M3-Equip-Panels               |
| `OrnateTabs`/`OrnateTab` + `useRovingFocus` | Tab: `selected`, `controls`, `surface: ReactNode` (Render-Slot)                                                                                   | beide Tree-Navs; Roving zusätzlich CharacterSwitcher |
| `Button`-Erweiterung                        | `selected?: boolean` → `data-selected`; Cursor-Policy                                                                                             | Playback-Buttons, ErrorBoundary-Reload               |
| `Dialog`                                    | natives `<dialog>` + `showModal`; Panel-thin-Chrome, `backdrop:bg-black/70`                                                                       | `ConfirmDialog`                                      |
| `ConfirmDialog`                             | `label`, `title`, `icon?` (Glut-Roundel), `confirmLabel`, `cancelLabel?`, children = Body-Text                                                    | beide Respec-Dialoge, M3-Confirms                    |
| `ProgressBar`-Erweiterung                   | `tone: health \| barrier \| xp \| accent`, `labelSize: 'xs' \| 'sm'`, `className` erweitert das Root                                              | Combat-Bars, SelectedDungeonPanel                    |
| `FramedCard`                                | Layer-Stack Art/Scrim/9-Slice-Frame mit §6-Opacities; `stateAttrs`-Passthrough                                                                    | DungeonSelector-Karte, ActPanel                      |
| `ScreenHeader`                              | `title`, `intro?`, `headingLevel: 'h1' \| 'h2'`, children (Actions)                                                                               | Dungeons, Crucible, Mastery, Run, Placeholder        |
| `SectionTitle`                              | `as: 'h2' \| 'h3'`, `align: 'center' \| 'start'`, `id?`                                                                                           | Heroes, Combat Log, Enemy-Lanes                      |
| `useConnectionPaths` + `ConnectionLayer`    | `NodeConnection { sourceId, targetId, unlocked }`, `connectionKey()`; misst `[data-node-medallion]`-Anker, orthogonale Pfade, Gleichheits-Guard   | Crucible-Branch-Graph, Mastery-Tree-Canvas           |

**className-Policy:** `className`-Props erweitern die Klassenliste eines Primitives, sie
überschreiben keine Property, die das Primitive selbst setzt — Variation läuft über Props
(`cn()` hat bewusst keine Merge-Logik, Grundsatzentscheidung 3). Alle Klassenkompositionen
laufen über `cn()`.

**Panel-Flächen:** `ornate` = große Screen-Panels, `thin` = Karten/Inspectors/Bars,
`plain` = ruhige Log-Fläche (`rounded-lg border-border bg-surface/90 shadow-panel`). Das
Padding folgt der Rolle: `p-5` Dialoge/Inspectors, `p-4` Default, `p-3`/`p-2` kompakte
Karten und Slots, `px-4 py-3` Leisten — eine bewusste Rhythmus-Skala, kein Drift.

Bewusst ohne eigenes Primitive: Panel-State-API (Panel bleibt zustandslose Fläche), generisches
SelectableTile, Slot-Primitive (Item-Slots kommen mit M3; `semantic="empty"` + Tokens tragen bis
dahin), ResourceStat/CurrencyDisplay (die Ressourcen-Anzeige wird mit M4 neu verortet,
Grundsatzentscheidung 2). `CombatPortrait` bleibt in `features/combat/ui` — alle Konsumenten
sind Combat-Komponenten.

## 8. Responsive-Validierungsmatrix

Strukturelle Assertions in [e2e/responsive.spec.ts](../../../e2e/responsive.spec.ts);
Screenshot-Infrastruktur bleibt außen vor.

| Auflösung          | Prüfungen                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| 1366×768, 1600×900 | kein `html`-/`main`-Scroll; Tab-Strips und Mastery-Canvas scrollen intern; Hauptcontent vollständig             |
| 1920×1080          | pixelidentisch zum Stand vor dem Refactor (Clamp-Minima aktiv); kein Seiten-Scroll                              |
| 2560×1440          | Nav ≈ 306 px, `text-sm` ≈ 15,2 px (computed styles); Screens zentriert; Content-Spalten breiter                 |
| 3440×1440          | skaliert wie 1440p (16:9-Normierung); Caps und `mx-auto` greifen                                                |
| 3840×2160          | Nav ≈ 342 px, `text-sm` ≈ 17,5 px; Arena ≤ `--container-run`-Max, zentriert; Ornamente scharf                   |
| alle               | lokale Scroller funktionieren; Browser-Zoom 80–150 % nutzbar (manueller Sichtpass); `bg-cover`-Cropping korrekt |

## 9. State-Validierungsmatrix

Je Komponententyp (Nav-Item, Tab, CharacterSwitcher, Node, DungeonCard, Enemy-Slot, Button):

| Kombination                                  | Erwartung                                                                                                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Normal + Default/Hover/Focus/Selected        | Hover klar von Selected unterscheidbar (Glow nur bei Selected); Focus-Ring sichtbar                                                                 |
| Locked + Default/Hover                       | Gold-Akzente bleiben aus; Text ≥ AA; Lock-Indikator; klar von Disabled unterscheidbar                                                               |
| Locked + Selected                            | Selection-Ring voll, Art bleibt gedimmt                                                                                                             |
| Empty + Default/Hover                        | gestrichelt, volle Lesbarkeit, klar von Disabled unterscheidbar                                                                                     |
| Disabled + Default                           | nur Controls; `cursor-not-allowed`                                                                                                                  |
| Facetten available/insufficient/max/defeated | Akzente ohne Achsen-Override; defeated dimmt ausschließlich das Portrait                                                                            |
| übergreifend                                 | State ohne reine Farbwahrnehmung erkennbar (Ring-Form/Indikator/Text); Ring oder Glow je Ebene, kein Stacking; Hover nur auf interaktiven Elementen |

## 10. Bewusste Sonderfälle

Dokumentierte, bleibende Abweichungen:

- `min-w-225` des Mastery-Tree-Canvas — Lesbarkeits-Floor, Scroller fängt schmalere Container.
- `max-w-5xl` des Crucible-Branch-Graphen — Lesbarkeits-Cap der Lane-Graphen.
- Dungeon-Kachel `h-74 w-40` — gestaltete Kachelgröße.
- `--shadow-glow-ember-inset` — Ember-Identität der Mastery-Tabs.
- Ornate-Tab-Focus-Offset `-5px` — der Frame-Überhang würde einen Außen-Ring clippen.
- CharacterSwitcher-Focus-Offset `1px` — der enge Kachelraster lässt keinen 2-px-Außenring zu.
- CharacterSwitcher-Prozent-Geometrie — handjustiert auf das Portrait-Frame-Asset.
- `disabled:opacity-50` ganzheitlich auf Controls — Controls tragen keinen Informationsgehalt.
- TurnOrder-Akteur kombiniert Selection-Ring und Glow-Fläche — Bestandsschutz der Combat-Optik.
- Namens-Labels gesperrter Nodes und Karten bleiben `text-text` — Bestandsschutz; nur
  Medaillon-/Statusebenen sind muted.
- Die Sidebar-Navigation behält ihre eigene Selektionssprache (Ornament-Asset, Hairlines) mit
  konditionaler Klassenliste: `nav-selection-surface` muss literal am Element stehen, weil die
  `::before/::after`-Regeln aus index.css am Klassennamen hängen; State-Attribute und Fragmente
  kommen aus `state.ts` ([DECISIONS D-009](DECISIONS.md#d-009--offene-reste-außerhalb-des-uif-scopes)).
- Der Leave-Confirm der Run-Statusleiste bleibt ein nicht-modaler Zwei-Schritt (Keep Fighting /
  Confirm Leave Dungeon) — der Kampf läuft sichtbar weiter, ein Modal würde ihn verdecken.

## 11. Teststrategie

- State wird über `data-*`/`aria-*` assertiert; literale Klassen-Assertions bleiben für
  Asset-Wiring (`border-image-*`, `bg-[url(…)]`) und Layout-Contracts.
- Je Task: `npm run lint`, `npm run typecheck`, `npm test`, danach `npm run test:e2e`
  ([AGENTS.md](../../../AGENTS.md)).
- Die Matrizen aus §8 und §9 sind die Abnahme-Checkliste der Screen-Tasks; der manuelle Sichtpass
  je Screen gehört zur Definition of Done.
