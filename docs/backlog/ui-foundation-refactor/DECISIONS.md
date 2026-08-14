# DECISIONS — UI-Foundation-Refactor

> **Zweck:** Protokoll der Entscheidungen, die während der autonomen Umsetzung der UIF-Tasks
> anfielen und normalerweise eine menschliche Antwort gebraucht hätten. Je Eintrag: Problem,
> Optionen, Entscheidung mit Begründung. Zielarchitektur: [FOUNDATION.md](FOUNDATION.md).

## D-001 — Arbeits- und Commit-Modell der autonomen Session

**Problem:** Die Backlog-Konvention sagt „ein Task = eine Agenten-Session = ein PR"
([../README.md §1](../README.md#1-ein-task)), AGENTS.md sagt „Only commit or open a Pull Request
when explicitly requested". Der Auftrag lautet, alle elf UIF-Tasks in einer Session umzusetzen —
elf Tasks unversioniert im Working Tree zu halten wäre fragil und ließe die Task-Grenzen im
Review verschwinden.

**Optionen:**

1. Alles uncommitted im Working Tree lassen (wörtliche AGENTS.md-Lesart).
2. Ein Sammel-Commit am Ende.
3. Ein Conventional Commit je abgeschlossenem Task auf `feat/ui-fundament`, keine Pushes,
   keine PRs.

**Entscheidung:** Option 3. Der Auftrag ist die explizite Anweisung, den ganzen Meilenstein auf
dem dafür angelegten Branch fertigzustellen; Commits je Task sind die projekteigene Granularität,
schützen die Arbeit vor Verlust und lassen die Pre-Commit-Hooks (lint-staged, typecheck,
docs:links) jeden Task einzeln validieren. Pushes und PRs bleiben aus — die bleiben explizit
angefragt.

## D-002 — Task 006: „Sechs Dungeons → zweite Reihe" ist als Fixture nicht typbar

**Problem:** Task 006 verlangt eine Testfixture, in der sechs Dungeons eine zweite Grid-Reihe
erzeugen. `DungeonSelector` iteriert über `ACT_1_DUNGEON_IDS`, und `Act1DungeonId` kennt genau
fünf Werte — ein sechster Test-Dungeon ist ohne Aufweichen der Game-Typen nicht darstellbar.
jsdom misst zudem kein echtes Grid-Layout; eine „zweite Reihe" wäre dort ohnehin nicht prüfbar.

**Optionen:**

1. `DungeonSelector` eine `dungeonIds`-Prop mit aufgeweichtem Typ geben, nur damit ein Test
   sechs Karten rendern kann.
2. Die auto-fill-Mechanik über Klassen-Assertions (Unit) plus echtes Reflow-Verhalten bei
   schmalen Breiten im Responsive-E2E (Task 010) absichern.

**Entscheidung:** Option 2. Das Grid `repeat(auto-fill,10rem)` bricht per CSS um — geprüft wird
die verbaute Mechanik (Klassen-Assertion, kein `overflow-x-auto`) und in `e2e/responsive.spec.ts`
das echte Umbruchverhalten der fünf vorhandenen Karten bei schmalen Containern. Die Game-Typen
bleiben strikt (AGENTS.md); der Task-Wortlaut „Testfixture" ist damit sinngemäß erfüllt.

## D-003 — Task 010: Nav-Stützstelle bei 1440p ist in FOUNDATION nicht linear

**Problem:** FOUNDATION §2 definiert die Nav-Breite als lineare Clamp
(`SLOPE = (342 − 288) / 1920 = 0.028125`). Bei 2560×1440 ergibt das 288 + 640 × 0.028125 =
**306 px** — der Formel-Kommentar und die §8-Matrix nennen aber „312 px @1440p". Die drei
Stützstellen 288/312/342 liegen auf keiner Geraden; Formel und Kommentar widersprechen sich.

**Optionen:**

1. Slope auf 312 px @1440p anheben (0.0375) — dann läge 4K bei 360 px statt der
   spezifizierten 342 px.
2. Der Formel folgen (288 → 306 → 342) und die dokumentierten Erwartungswerte in
   FOUNDATION §4/§8 nachziehen.

**Entscheidung:** Option 2. Die Formel mit präkomputiertem SLOPE ist der verbindliche
Spec-Anker (§2), die Matrix-Werte tragen ein „≈" und Task 010 sieht das Nachziehen der
Token-Werte in FOUNDATION ausdrücklich vor. `e2e/responsive.spec.ts` assertiert die
Formelwerte (306 px @2560/3440, 342 px @3840); §4-Kommentar und §8-Matrix wurden korrigiert.

## D-004 — Task 010: keine Clamps für die 9-Slice-Frame-Geometrie

**Problem:** Task 010 nennt präkomputierte Clamps für Frame-Geometrie und Icon-Größen als
Optional-Posten „nur bei sichtbarem Bedarf im Review".

**Entscheidung:** Ausgelassen. Der visuelle Review-Pass (1440p, 3440×1440, 4K; Dungeons,
Crucible, Mastery, Run) zeigte scharfe Ornamente und stimmige Proportionen der fixen
Frame-Geometrie; die Startwerte aus Task 001 blieben unverändert. Bei späterem Bedarf bleibt
das der dokumentierte Anknüpfungspunkt (FOUNDATION §3, Kategorie „Fixed").

## D-005 — Nutzer-Feedback: Tree-Panels full-height, Mastery-Canvas top-aligned

**Problem:** Nach dem Sichtpass wünschte der Nutzer zwei Layout-Korrekturen: (1) Der
Crucible-Nodes-Bereich soll wie bei Weapon Mastery die volle Höhe füllen (Task 007 hatte den
Screen auf dem ScreenLayout-Default-Scroller mit content-getriebener Panelhöhe gelassen).
(2) Der Mastery-Tree-Canvas soll oben beginnen — Task 008 formulierte „mit `m-auto` zentriert",
was vertikal mittig rendert.

**Entscheidung:** Beide Screens teilen jetzt dasselbe Full-Height-Muster: Die Crucible-Section
ist `flex min-h-0 flex-1 flex-col`, das Layout-Grid streckt Reihe 2 über
`grid-rows-[auto_minmax(0,1fr)]`, das Tree-Panel füllt sie mit `h-full` und scrollt seinen
Inhalt bei sehr flachen Viewports intern (`overflow-auto`; `min-h-112` bleibt als Floor der
gestapelten Ansicht). Der Mastery-Canvas nutzt `mx-auto` statt `m-auto` — horizontal zentriert,
Inhalt top-aligned. Abweichung vom Task-008-Wortlaut („m-auto zentriert") ist damit bewusst
und nutzergetrieben.

## D-006 — Nutzer-Feedback: Tab-Chrome skaliert ab 1440p mit (Ausnahme zu D-004)

**Problem:** Bei 1440p wirkten die Tree-Tabs zu klein und schwer lesbar: Der Strip wuchs nur
minimal (64 → 66,7 px), Rahmen (16/24 px) und Surface-Inset blieben fix, und der sehr flache
Bild-Ausschnitt der Tab-Art (Downscale eines 2172-px-Assets auf ein ~43-px-Band) wirkte
verpixelt/gestreckt.

**Entscheidung:** Das Tab-Chrome wird als Familie mit Faktor 1,5 leicht fluid —
`--spacing-tab-strip` clamp(4rem → 6rem), `border-image-tab-ornate` border-width
clamp(16→24 px / 24→36 px), `.tab-ornate-surface` Inset clamp(12→18 px / 8→12 px) und
Notch clamp(10→15 px), alle nach dem §2-Muster. Bei ≤ 1080p bleibt alles pixelidentisch;
bei 1440p ist der Strip ~75 px hoch mit proportional dickerem Rahmen und höherem Art-Band.
Die Rest-Verpixelung der Tab-Hintergründe ist eine Asset-Eigenschaft (extremes
Seitenverhältnis des Bandes) — eine schärfere Neufassung der drei `crucible-tab-*.png`
wäre Asset-Arbeit außerhalb dieses Refactors.

## D-007 — Nutzer-Feedback: Tab-Rahmen unten neu vermessen (asymmetrischer Slice)

**Problem:** Unter der unteren Goldschiene der Tree-Tabs ragte die Tab-Fläche heraus und
darunter sickerte der Seitenhintergrund durch. Pixel-Messung des Assets `tab-ornate.png`
(2171×724): Die Grafik belegt nur die Zeilen 184–505, die Transparenzränder sind ungleich
(oben 184 px, unten 219 px), die Goldschienen liegen bei 188–198 und 463–473. Mit dem
symmetrischen 9-Slice 260 landete die obere Schiene bei ~12 px von der Kante (deckungsgleich
mit dem Surface-Inset), die untere aber bei ~15,7 px — darunter 4 px Fläche und ~13 px
transparentes Loch. Der Defekt bestand schon vor dem Refactor und wurde durch das größere
Tab-Chrome sichtbar.

**Entscheidung:** Asymmetrischer Slice `260 300 335 300`: Der Bottom-Slice 335 spiegelt die
untere Schiene auf ~12 px vor die Kante — die Fläche liegt beidseitig knapp innerhalb der
Schienen, unterhalb bleibt nur der schmale Asset-Glow. Die bewusste Abweichung von der
strikten ≤-1080p-Pixel-Identität (untere Schiene rückt 3,7 px nach außen) ist eine
nutzerbeauftragte Korrektur einer Alt-Fehlkalibrierung („insgesamt nochmal ausmessen").

## D-008 — Scope der Pixel-Identität und sanktionierte Normalisierungen

**Problem:** FOUNDATION §2 formulierte die ≤-1920px-Pixel-Identität unbeschränkt („rendert
alles pixelidentisch"), während die Screen-Tasks 006–009 Layout-Neuverankerungen anordnen,
die auch ≤ 1920 sichtbar sind. Der adversariale Abschluss-Review bestätigte vier solcher
Stellen als undokumentiert.

**Entscheidung:** Die Identitäts-Zusage gilt für Chrome-Maße und Text-Skala (Clamp-Minima);
§2 wurde entsprechend gescopet. Bewusst sichtbare, task-angeordnete Änderungen ≤ 1920:

1. Dungeons: Zentrierung (`mx-auto`) und Entfall der `w-220`-Spalte — Screen rückt ab
   ~1520 px Viewport, Karten-/Panelspalte wird breiter (Task 006).
2. Crucible/Mastery: `mx-auto` (bis 12 px Shift nahe 1920) und Entfall der Dock-Reserve
   `pr-80` — die Intro-Zeile bricht breiter um (Tasks 002/007).
3. Mastery: Threshold-Vereinheitlichung 1280 → 1200 — bei 1560–1639 px Viewport (u. a.
   1600×900) rendert der Screen jetzt zweispaltig (Task 008).
4. Dungeon Run: `--container-run`-Minimum 105rem cappt die zuvor ungecappte Arena ab
   ~1753 px Viewport und zentriert sie (FOUNDATION §4; bei 1920×1080 −168 px Breite).

Sanktionierte Vereinheitlichungen mit kleiner visueller Wirkung: Pips-Glow über
`shadow-glow-accent-sm` (Accent 60 % statt 100 %), Tab-Frame-Glow über
`drop-shadow-glow-accent` (6 px/40 % statt 7 px/35 %), De-Emphasis-Werte auf der
Token-Skala (u. a. locked 0,65 → 0,55 + `grayscale-50`, inaktive Frames 0,5 → 0,75),
Intro-Absätze einheitlich mit `leading-6` (Dungeons +4 px Zeilenhöhe),
`SelectedDungeonPanel`-Umbruch nach Umrechnungsrezept auf `@min-[19rem]`. Parity-bewusste
Abweichungen von der §6-Tabelle: FramedCard nutzt Scrim-Entfall statt
`bg-state-selected-tint`, TurnOrder kombiniert Ring und Glow, Namens-Labels gesperrter
Elemente bleiben `text-text` (FOUNDATION §10).

## D-009 — Offene Reste außerhalb des UIF-Scopes

Vom Abschluss-Review benannt, bewusst offen gelassen:

1. **SidebarNavItem** läuft seit UIF-019 auf `cn()`, `stateAttrs({ selected })` und den
   kanonischen Fragmenten (`focusRing`, `transitionState`). Die Selektionsoptik bleibt
   asset-basiert und damit konditional: `nav-selection-surface` muss literal am Element
   stehen, weil die `::before/::after`-Regeln aus index.css am Klassennamen hängen
   (FOUNDATION §10).
2. **Sidebar-Glow-Freistellung:** Der Nav-Scroller (`overflow-y-auto`) kann den
   Selection-Glow des CharacterSwitcher-Frames horizontal clippen (Plan-Optional-Punkt) —
   sichtbar nur bei übervoller Nav; offen für M6.
3. **Browser-Zoom 80–150 %** bleibt manueller Sichtpass (FOUNDATION §8); Playwright bildet
   Browser-Zoom nicht verlässlich ab.
4. **Tooltip-Kollisionslogik** war bereits Task-005-Nicht-Ziel; das `align`-Prop bleibt die
   Teil-Mitigation.
5. **`hoverBorder`** hat aktuell keinen Konsumenten — das Fragment bleibt als kanonischer
   Teil der state.ts-API für kommende Self-Hover-Konsumenten (M3-Slots).
