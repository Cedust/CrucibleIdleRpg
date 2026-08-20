# UI-Architektur — Contract, Mechanik und State-System

> **Zweck:** Verbindliche Regeln des UI-Fundaments: Viewport- und Screen-Contract,
> Responsive-Mechanik, Token-Regeln, zweiachsiges State-System und die Rolle der Shared
> Primitives. Neue Screens bauen gegen diese Regeln. Produktabsicht und Art-Direction:
> [DESIGN.md §5](../DESIGN.md#5-visuelle-umsetzung); Styling-Grundregeln:
> [AGENTS.md](../../AGENTS.md).

Die konkreten Werte leben an ihrem eigenen Wohnort: Tokens in `src/app/index.css` (`@theme`),
Primitive-APIs in den TypeScript-Interfaces unter `src/shared/ui/`, die geprüften Stützstellen in
[e2e/responsive.spec.ts](../../e2e/responsive.spec.ts). Dieses Dokument gibt die Richtung, gegen
die diese Stellen gebaut werden.

Drei Grundsätze tragen das Fundament:

1. Chrome-Skalierung läuft über **Per-Token-Clamps**; die Root-`font-size` bleibt bei 16 px, damit
   Browser-Zoom und User-Font-Präferenzen wirken.
2. Layout-Wechsel innerhalb des Mainviews laufen über **Container-Queries**; Media-Queries tragen
   echte Viewport-Belange.
3. Class-Komposition läuft über den handgerollten `cn()`-Helper ohne Merge-Logik.

---

## 1. Viewport- und Screen-Contract

Die Ebenen liegen in dieser Ordnung: Dokument → AppShell (füllt den Viewport, schaltet zwischen
Run- und Normal-Branch) → Rahmen-Spalte mit Vollrahmen → `main` → `ScreenLayout` → Screen.

Invarianten dieser Kette:

- Das Dokument scrollt nicht. Jede Ebene bis zum Screen gibt ihre Höhe weiter und begrenzt ihre
  Kinder, damit Überlauf lokal bleibt.
- Gescrollt wird in dafür vorgesehenen Containern: Listen, Logs, Tree-Canvas, Tab-Strips als
  Fallback schmaler Container. `ScreenLayout` stellt über die `scroll`-Prop entweder den
  Default-Scroller des Screens oder überlässt das Scrollen den Areas des Screens.
- `ScreenLayout` trägt den `@container` am Content-Wrapper, dazu Hintergrund-Art und
  Kontrast-Overlay mit Rand-Vignette.
- Der Screen selbst zentriert sich unter einem `--container-*`-Cap seines Typs.
- `ScreenHeader` rendert Titel und Intro linksbündig; `headingLevel` trägt `h1` für Screens ohne
  App-Navigation.
- Ein Dungeon-Run belegt den gesamten Viewport ohne Navigation
  ([Fortschritt §4](PROGRESSION.md#4-checkpoints-wipe--abbruch)); der Run-Branch der AppShell ist
  der Schalter.
- Neue Screens docken über denselben Contract an: `ScreenLayout` (`scroll` wählen) +
  `ScreenHeader` + ein Screen-Cap + Container-Queries + `stateAttrs`/Fragmente.

## 2. Responsive-Mechanik

Fluidität lebt in einzelnen `@theme`-Tokens nach einem gemeinsamen Muster:

- Ein Anker in `:root` misst den Abstand der 16:9-normierten Viewport-Breite zum
  1920px-Äquivalent (`min(100vw, 177.78vh) - 1920px`). Die Normierung ordnet Ultrawide seiner
  Höhenklasse zu: 3440×1440 skaliert wie 1440p.
- Jedes fluide Token ist ein `clamp()` mit MIN am 1920px-Äquivalent, linearem Anstieg bis MAX am
  3840px-Äquivalent und präkomputierter Steigung `(MAX − MIN) / 1920`. Bis zum 1920px-Äquivalent
  rendert alles auf den Minima.
- Jeder vw/vh-Term steht in einem `clamp()`; jede Viewport-Größe hat damit ein Maximum.
- Die Tailwind-Text-Tokens sind clamp-basiert überschrieben. Callsites bleiben unverändert,
  Line-Height-Ratios sind unitless und skalieren mit.
- **Responsive-Idiom:** Container-Queries für Layout-Wechsel im Mainview, Media-Queries für
  Viewport-Belange (Padding-Fallback, ErrorBoundary). Umrechnungsrezept:
  Container-Threshold = Viewport-Threshold − Nav − Frame − Page-Padding.
- Wiederholte Thresholds laufen über benannte `--container-*`-Varianten (`@tree-cols:`,
  `@branch-cols:`); einmalige Thresholds bleiben arbitrary und rem-basiert.

## 3. Zuordnung fixed und fluid

| Kategorie              | Elemente                                                                                                                                | Mechanik                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Fixed**              | 9-Slice-Frame-Geometrie der Panels, Vollrahmen und Buttons, Frame-Gutter, Gaps und Radii                                                | px/rem-konstant                               |
| **Leicht fluid**       | Nav-Breite, Tab-Strip samt Tab-Chrome, Inspector-Spalte, Page-Padding, Text-Skala, Medallions, Portraits, Akt-Panel-Höhe, Tor-Kunst-Cap | Clamp-Tokens nach dem Muster aus §2           |
| **Voll fluid**         | Graph- und Tree-Spalten, Arena-Spalten, Karten-Grids, Tor-Grid, Listenflächen, Log                                                      | Grid/Flex/`fr`/`minmax` + `min-w-0`/`min-h-0` |
| **Lokal scrollbar**    | Sidebar-Nav, ScreenLayout-Default-Scroller, Mastery-Tree-Canvas, Combat-Log, Arena, TurnOrder, Tab-Strips                               | `min-h-0 flex-1 overflow-y-auto`              |
| **max-width-begrenzt** | Screen-Flächen, zentriert je Screen-Typ: Trees, Listen/Detail, Run-Arena                                                                | `mx-auto w-full max-w-*`                      |

Die Caps sind pro Screen-Typ definiert; ein globales Maximum bleibt offen.

## 4. Token-Regeln

- Ein Wert wird zum Token, sobald mehrere Konsumenten ihn teilen oder er fluid skaliert. Ein
  einzelner Konsument trägt seinen Wert lokal (Utility-Klasse, TS-Konstante).
- Namespaces folgen ihrer Rolle: `--spacing-*` für Chrome-Maße, `--container-*` für Screen-Caps
  **und** Container-Query-Stützstellen (unterschieden über den Namen), `--text-*` für die
  Typo-Skala, `--color-state-*` und `--state-*` für das State-System, `--shadow-*`/`--drop-shadow-*`
  für Glows und Kontrast.
- Farben laufen über Palette-Tokens und `color-mix`. Schwarz-Literale bleiben Scrims und Schatten
  vorbehalten.
- Die Palette trennt zwei Schichten. Die **Statusfarben** (`--color-danger`, `--color-success`,
  `--color-info`) gehören dem Feedback: Health- und Barrier-Balken, Fehlermeldungen, nicht
  bezahlbare Kosten, gefallene Helden. Die vier **Stat-Achsen** (`--color-offense`,
  `--color-defense`, `--color-vitality`, `--color-utility`) tönen die Heroes-Ansicht im
  Ruhezustand — Attribute, Combat Stats, Core Stats und die drei Listen-Gruppen. Jeder Achsen-Ton
  liegt in OKLCH unter dem Chroma von `--color-accent` (0.164), damit Gold die lauteste Farbe der
  UI bleibt; die Helligkeit staffelt sie nach Gewicht von Defense (0.71) bis Utility (0.63).
- Der `progress`-Tone der `ProgressBar` trägt als einziger einen mehrfarbigen Verlauf: die
  Flamme aus `--color-flame-core`, `--color-flame-mid` und `--color-flame-tip`. Alle drei Stops
  sind bei jedem Füllstand sichtbar, der Balken wächst allein in der Breite. Ihn tragen die
  Balken, deren Füllen ein Ereignis ankündigt: XP bis zum Level-Up und die Floors eines
  Dungeons. Health und Barrier bleiben einfarbig, der Item-Level-Balken des Blacksmith bleibt
  auf `accent`, weil er eine Obergrenze zeigt und kein Ereignis. `--color-arcane` trägt damit
  Magie, Epic-Seltenheit und Schatten-Gegner, `--color-utility` die Stat-Achse.
- Die Achsen-Töne bleiben ein zweiter Kanal: Bei Rot-Grün-Schwäche fallen Stahl und Amethyst
  nahezu zusammen, was die Helligkeitsstaffelung mildert statt aufhebt. Die Zuordnung tragen
  Glyphe, Label und Gruppentitel, jede Stat-Zeile also unabhängig von ihrer Farbe.
- Query-Stützstellen bleiben statische Literale, weil Tailwind sie build-seitig in die
  `@container`-Queries inlined.
- State-Übergänge laufen über die gemeinsame `transition-state`-Utility, kombiniert mit
  `motion-reduce:transition-none`.
- Komponentenspezifische Tokens brauchen eine dokumentierte Begründung; der Ember-Inset-Glow der
  Tab-Selektion ist die bestehende Ausnahme.

## 5. State-Modell

Zwei orthogonale, kombinierbare Achsen (`src/shared/ui/utils/state.ts`):

- **Interaction:** `hover`/`focus`/`active` laufen über CSS-Pseudoklassen. Explizit bleiben
  `selected` (exklusives Highlight) und `disabled` (bekannte, aktuell nicht ausführbare Aktion —
  nativ, wo möglich). Kanonischer Prop-Name für Selektion ist `selected`.
- **Semantic:** game-weit `normal | locked | empty`.

Regeln:

- `stateAttrs()` setzt die `data-*`-Attribute, an denen die Tailwind-data-Variants hängen.
  Klassenlisten pro Komponente bleiben dadurch statisch; Kombinationen (Locked+Hover,
  Locked+Selected) entstehen im CSS.
- Die kanonischen Fragmente (Focus-Ring, Selection-Ring, Selection-Fläche, Hover-Border,
  Group-Hover-Border, State-Transition) leben ausschließlich in `state.ts` und sind die einzige
  Quelle der gemeinsamen State-Klassen. Arbitrary-Group-Variants bleiben auf die dort
  dokumentierte beschränkt.
- **Feature-Facetten** tragen eigene `data-*`-Attribute (Node-Verfügbarkeit, Combat-`defeated`)
  und stylen ausschließlich Akzente. Selection-Ring, Locked-Treatment und Focus-Ring kommen aus
  den globalen Fragmenten. Eine Facette wird zum `SemanticState`, sobald ein zweites Feature
  dieselbe Bedeutung braucht.
- ARIA bleibt pattern-korrekt (`role=tab` + `aria-selected`, Radio + `aria-checked`,
  `aria-pressed`, `aria-current`). Das visuelle System hängt einheitlich an `data-*`.
- Locked-Elemente bleiben klickbar: Der Klick inspiziert und zeigt den Sperrgrund.

## 6. Visuelle State-Sprache

Globalregeln: Opacity liegt ausschließlich auf Art-Layern (Hintergrund, Frame-Overlay, Portrait,
Icon), Text bleibt ≥ AA lesbar. Glow bedeutet Selektion oder Kauf-Affordance. Jede state-tragende
Ebene nutzt den gemeinsamen Übergang. Focus zeigt sich als sichtbarer Außen-Ring (Ausnahmen in §9).

| Kombination             | Sprache                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Normal + Default        | neutrale Border, volle Lesbarkeit, kein Glow                                                         |
| Normal + Hover          | Border wandert auf Ornament-Gold, leichter Surface-Lift, kein Glow (Hover ≠ Selected)                |
| Normal + Selected       | Selection-Ring bzw. voller Frame plus Selection-Tint und Glow, volle Opacity                         |
| Locked + Default        | Locked-Border, gedimmte und entsättigte Art, muted Text, Lock-Indikator, kein Glow, Klick inspiziert |
| Locked + Hover          | neutraler Lift; Gold-Akzente bleiben aus                                                             |
| Locked + Selected       | Selection-Ring in voller Stärke, Art bleibt gedimmt                                                  |
| Empty + Default         | gestrichelte Border, zurückgenommener Background, volle Text-Lesbarkeit, kein Glow                   |
| Empty + Hover           | gestrichelte Border wandert auf Ornament-Gold, leichter Lift                                         |
| Disabled + Default      | nur Controls: ganzheitliche Opacity-Absenkung plus `cursor-not-allowed`                              |
| Facette available / max | Akzent-Border plus Glow                                                                              |
| Facette insufficient    | neutrale Border, voll lesbarer Text, kein Glow                                                       |
| Facette defeated        | Portrait entsättigt und gedimmt; Name und Werte voll lesbar                                          |

Nicht-interaktive „current"-Flächen zeigen vollen Frame, Gold-Titel und Glow ohne
Hover-Affordance; `aria-current` bleibt.

## 7. Shared Primitives

`src/shared/ui/` ist nach Rolle gegliedert; die API jedes Primitives steht in seinem Interface.

| Ordner      | Rolle                                                                              |
| ----------- | ---------------------------------------------------------------------------------- |
| `utils/`    | `cn()`, State-System und Roving-Focus — die geteilte Mechanik ohne eigenes Markup  |
| `controls/` | fokussierbare Elemente: Button, Node-Button, Ornate-Tabs                           |
| `layout/`   | Flächen und Gerüste: Panel, ScreenLayout, ScreenHeader, SectionTitle, Divider      |
| `overlay/`  | über dem Fluss liegende Ebenen: Dialog, ConfirmDialog, Tooltip, NodeInspectorPanel |
| `tree/`     | Tree-Bausteine: Node-Medaillon mit Rang-Pips, Connector-Messung und SVG-Layer      |
| `feedback/` | Zustandsanzeige: ProgressBar, ErrorBoundary                                        |
| `icons/`    | Asset-Icons und Rollen-Glyphen über typisierte Namens-Unions                       |

Kompositionsregeln:

- **className-Policy:** `className` erweitert die Klassenliste eines Primitives und überschreibt
  keine Property, die das Primitive selbst setzt. Variation läuft über Props, weil `cn()` keine
  Merge-Logik trägt. Alle Klassenkompositionen laufen über `cn()`.
- **Panel-Rollen:** standard (Default) trägt alle Panels mit 9-Slice-Goldrahmen — große
  Screen-Panels, Karten, Inspectors, Bars und die Goldrahmen-Flächen der Dungeon-Auswahl —, plain
  für ruhige Log-Flächen; ornate und thin bleiben als Varianten erhalten, werden aber aktuell
  nirgends eingesetzt. Das Padding folgt der Rolle in einer bewussten Rhythmus-Skala von Dialogen
  bis zu kompakten Slots.
- **Divider-Rollen:** ornate (Default) trägt das große Ornament unter dem Sidebar-Titel, thin den
  feinen Trenner zwischen den Stat-Gruppen der Heroes-Panels. Beide skalieren ein vollbreites
  Asset per `object-cover` auf die Höhe ihres Streifens; die thin-Variante trägt zusätzlich eine
  Haarlinie, damit die Trennung auch ohne geladenes Asset steht.
- Ein Screen nutzt vorhandene Primitive; ein neues Primitive entsteht mit dem zweiten Konsumenten.
- Ein Primitive bleibt zustandslos gegenüber Spiellogik: Es empfängt State über Props und
  `stateAttrs`.
- Komponenten mit ausschließlich feature-internen Konsumenten bleiben im Feature.
- Bewusst ohne eigenes Primitive: Panel-State-API, generisches SelectableTile, Slot-Primitive
  (`semantic="empty"` plus Tokens tragen bis zu den Item-Slots), Ressourcen-Anzeige (wird mit dem
  Handwerk verortet).

## 8. Prüfregeln

- State wird über `data-*`/`aria-*` assertiert; literale Klassen-Assertions tragen Asset-Wiring
  und Layout-Contracts.
- Die strukturelle Responsive-Matrix lebt in [e2e/responsive.spec.ts](../../e2e/responsive.spec.ts)
  und deckt ab: kein Dokument- und `main`-Scroll über die Auflösungsklassen, funktionierende lokale
  Scroller, Umbruch der Karten-Grids bei schmalem Container, Clamp-Minima am 1920px-Äquivalent,
  Formelwerte der leichten Clamps an den oberen Stützstellen, Zentrierung unter den Screen-Caps
  und die 16:9-Normierung von Ultrawide.
- Die State-Matrix ist die Sichtpass-Checkliste je Komponententyp (Nav-Item, Tab,
  CharacterSwitcher, Node, Karte, Enemy-Slot, Button): Hover klar von Selected unterscheidbar,
  Focus-Ring sichtbar, Locked klar von Disabled unterscheidbar und ≥ AA lesbar, Selection-Ring
  auch auf gesperrten Elementen, Facetten ohne Achsen-Override, State ohne reine Farbwahrnehmung
  erkennbar, Ring oder Glow je Ebene ohne Stacking, Hover nur auf interaktiven Elementen.
- Der manuelle Sichtpass je berührtem Screen gehört zur Definition of Done
  ([AGENTS.md](../../AGENTS.md)).

## 9. Bewusste Sonderfälle

Dokumentierte, bleibende Abweichungen:

- Mastery-Tree-Canvas und Crucible-Branch-Graph tragen numerische Lesbarkeits-Grenzen
  (Mindestbreite des Canvas, Breiten-Cap der Lane-Graphen); der Scroller fängt schmalere
  Container.
- Das Crucible-Tree-Panel trägt einen Höhen-Floor für die gestapelte Ansicht; ab dem
  zweispaltigen Threshold streckt das Grid die Reihe.
- Dungeon-Tore sind freigestellte `<img>`-Illustrationen direkt auf dem Screen-Hintergrund; ihre
  Zustände laufen über CSS auf dem Art-Layer. Die Dungeon-Numerale liegt als cqw-skaliertes
  Text-Overlay auf dem Rauten-Zentrum der Tor-Crops (`@container`-Wrapper der Kachel, Offsets je
  Tor-Variante in `gateArt.ts`) und bleibt auf gesperrten Toren voll lesbar. Ein Gold-Pfad mit
  Status-Medaillons verbindet die Tore zur Akt-Route.
- Die Akt-Panels tragen den rechteckigen 9-Slice-Goldrahmen `border-image-standard` (px-konstant)
  über der Akt-Szenerie; die Höhe kommt aus dem Clamp-Token `--spacing-act-panel`, die Breite
  aus dem 3er-Grid des Screens. Das Medaillon-Asset trägt die Akt-Numerale als Text-Overlay,
  der Lock-Indikator sitzt am Akt-Label.
- Die Tree-Tabs sind Segmente einer durchgehenden flachen Leiste: Haarlinien-Rahmen und
  Eckwinkel tragen das Chrome, Gold und der Ember-Inset-Glow allein das aktive Segment. Der
  Ember-Inset-Glow bleibt dabei das einzige komponentenspezifische State-Token. Eckwinkel und
  Selektionsfläche sind CSS-Ornamente, weil ein 9-Slice-Rahmen auf dieser Bauhöhe schwerer
  aufträgt als die Navigation trägt.
- Ornate-Tabs führen den Focus-Ring nach innen, weil Leistenkante und X-Scroller einen
  Außen-Ring clippen; sein Offset liegt innerhalb der Selektionsfläche, damit Focus und
  Selektion getrennt lesbar bleiben.
- Der CharacterSwitcher trägt einen verkleinerten Focus-Offset und handjustierte
  Prozent-Geometrie, beides auf das Portrait-Frame-Asset abgestimmt.
- Das Charakterportal der Heroes-Stats trägt ebenfalls handjustierte Prozent-Geometrie, am
  Asset vermessen: die Bogenöffnung nimmt die freigestellte Ganzkörper-Figur auf, ihre
  Hintergrundfläche ist ein Rechteck, das hinter dem deckenden Stein über dem Spitzbogen
  hochläuft und seine Bogenform vom Rahmen-Asset ausgeschnitten bekommt, die Figur steht in
  einer eigenen Box ab der Bogenspitze, und die Steinfläche über dem Bogen trägt den
  Charakternamen als Text-Overlay. Das Portal füllt die Breite seiner Spalte; das Clamp-Token
  `--spacing-portal` cappt sie in den ein- und zweispaltigen Klassen, die Höhe folgt dem
  3:4-Format des Assets. Portal und Level-Panel sitzen am Fuß der Mittelspalte, der
  Höhenunterschied zu den Stat-Spalten liegt als Weißraum darüber.
- Der Stats-Bereich von Heroes trägt seine sechs Stat-Gruppen in zwei Spalten-Panels statt in
  sechs Einzelrahmen: links Combat, Attributes und Core, rechts Offensive, Defensive und Utility,
  je durch den feinen Divider getrennt. Das Grid streckt beide Panels auf dieselbe Höhe,
  `justify-between` verteilt den Rest. Combat steht links zuoberst und ist damit das optische
  Hauptpanel. Die Offensive Stats stehen paarweise — eine Zeile je Muster mit zwei Wertspalten,
  einmal klein als „Chance" und „Damage" im Kopf beschriftet; für Screenreader trägt jede Zelle
  ihren Qualifier selbst. Die rechte Spalte kommt damit auf 12 Zeilen und der Bereich in jeder
  dreispaltigen Klasse ohne Scroll aus. Unterhalb des 68rem-Thresholds spannt das Portal über
  beide Stat-Spalten und stapelt darüber; dort übernimmt der lokale Scroller des Tabpanels. Die
  Zeilen tragen in allen Klassen die volle Icon- und Textgröße.
- Controls senken im Disabled-Zustand ihre Opacity ganzheitlich, weil sie keinen
  Informationsgehalt tragen.
- Der TurnOrder-Akteur kombiniert Selection-Ring und Glow-Fläche — Bestandsschutz der
  Combat-Optik.
- Namens-Labels gesperrter Nodes und Karten bleiben voll lesbar; nur Medaillon- und
  Statusebenen sind muted.
- Die Sidebar-Navigation trägt ihre eigene Selektionssprache über ein Ornament-Asset mit
  konditionaler Klassenliste, weil die zugehörigen Pseudo-Element-Regeln am Klassennamen hängen.
  State-Attribute und Fragmente kommen aus dem State-System.
- Der Leave-Confirm der Run-Statusleiste ist ein nicht-modaler Zwei-Schritt, damit der Kampf
  sichtbar weiterläuft.
