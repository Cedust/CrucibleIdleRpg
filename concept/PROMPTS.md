# PROMPTS.md — Bild-Prompts für KI-Assets

> Prompts für die Stilproben aus
> [017 — Art-Direction & Theme-Tokens](../docs/backlog/tasks/017-art-direction-und-theme-tokens.md)
> und die weiteren Charakter-Portraits.
> Zielablage und Manifest-Eintrag: [public/assets/](../public/assets/MANIFEST.md).
> Visuelle Referenz: die Concept-Screens in [ui-draft/assets/](ui-draft/assets/) — dunkler
> Blau-Slate-Grund, Goldakzente, Glut-Orange.

## 1. Dungeon-Hintergrund — The Ashen Depths

- **Zieldatei:** `public/assets/backgrounds/dungeon-ashen-depths.png` (oder `.webp`)
- **Format:** 16:9, mindestens 1920×1080

```text
Dark fantasy dungeon interior, "The Ashen Depths": vast ruined underground hall of a
once-golden empire, heavy stone architecture, cracked pillars with tarnished gold inlays,
drifting ash and faint embers in the air, a low fire glow from below casting warm orange
light (#e25822) against cool deep blue-slate shadows (#0f172a), gilded ruins mood — noble
and mysterious, never hopeless. Painterly digital art, muted colors, high readability,
soft atmospheric depth, no characters, no text, no UI. Wide 16:9 environment shot,
composition keeps the center-bottom area calm so UI panels and characters can sit on top.
```

## 2. Charakter-Portrait — Korvin (Knight)

- **Zieldatei:** `public/assets/portraits/korvin.png` (oder `.webp`)
- **Format:** 1:1, mindestens 1024×1024

```text
Painterly dark fantasy bust portrait of Korvin, a heavily armored male human knight-warden
in his late forties, looking directly into the camera. Broad, thickset build. Dark blued-steel
plate armor with tarnished gold inlay, visibly battle-repaired: riveted patches and
scorch marks along the edges. The upper rim of an enormous tower shield rises behind one
shoulder, its imperial crest half melted away; the worn haft of a massive warhammer
leans against the other. Short cropped grey-streaked hair, long beard. Calm, patient,
protective expression. Warm gold rim light (#fbbf24) against a dark blue-slate stone
background (#1e293b), dim ember light, faint drifting ash. Gilded ruins mood — noble and
mysterious. High fantasy, heroic realism, muted painterly colors, sharp focus on the
face, centered head-and-shoulders composition, square 1:1, plain dark background
suitable for a circular UI crop, no text, no watermark.
```

## 3. Charakter-Portrait — Rhaya (Sword Dancer)

- **Zieldatei:** `public/assets/portraits/rhaya.png` (oder `.webp`)
- **Format:** 1:1, mindestens 1024×1024

```text
Painterly dark fantasy bust portrait of Rhaya, a lean athletic female human blade dancer
in her late twenties, looking directly into the camera. Light layered armor: dark leather
with battered bronze-gold plates over her shoulders. The hilts of two shortswords
rise crossed behind her shoulders, blades chipped and etched with faintly glowing amber
cracks. Dark auburn hair in a rough braid coming undone, a few strands stuck to her face,
warm bronze skin. Hot-tempered, impatient, challenging half-smile. Warm gold rim light
(#fbbf24) against a dark blue-slate stone background (#1e293b), dim ember light, faint
drifting ash. Gilded ruins mood — noble and mysterious. High fantasy, heroic realism,
muted painterly colors, sharp focus on the face, centered head-and-shoulders composition,
square 1:1, plain dark background suitable for a circular UI crop, no text, no watermark.
```

## 4. Charakter-Portrait — Quinn (Archer)

- **Zieldatei:** `public/assets/portraits/quinn.png` (oder `.webp`)
- **Format:** 1:1, mindestens 1024×1024

```text
Painterly dark fantasy bust portrait of Quinn, a wiry androgynous non-binary human archer
in their early thirties, upright and composed, looking directly into the camera. No cloak
or hood. Worn high-collared imperial uniform vest over rolled-up shirtsleeves. The upper
limb of a tall longbow of dark wood and gold fittings rises behind one shoulder, a worn
leather quiver strap crosses the chest with fletched arrows over the other shoulder.
Short black hair combed severely back, one side shaved above the ear, light-dark skin, sharp
features. Dry, analytical, faintly impatient expression. Warm gold rim light (#fbbf24)
against a dark blue-slate stone background (#1e293b), dim ember light, faint drifting
ash. Gilded ruins mood — noble and mysterious. High fantasy, heroic realism, muted
painterly colors, sharp focus on the face, centered head-and-shoulders composition,
square 1:1, plain dark background suitable for a circular UI crop, no text, no watermark.
```

## 5. Panel-Ornamentrahmen (9-Slice)

- **Zieldatei:** `public/assets/frames/panel-ornate.png`
- **Format:** quadratisch, mindestens 768×768, transparenter Hintergrund
- **Technik:** Der Rahmen wird per CSS `border-image` in neun Kacheln zerlegt
  (Slice-Inset ein Sechstel der Kantenlänge, bei 768 px also 128 px). Ornament darf
  ausschließlich in diesem äußeren Ring liegen; das Zentrum bleibt vollständig transparent,
  die Fläche dahinter kommt aus den Theme-Tokens. Ecken müssen in sich abgeschlossen sein,
  Kantenmitten nahtlos wiederholbar (CSS `border-image-repeat: round`).

```text
Ornamental picture-frame border for a dark fantasy game UI panel, square 1:1, fully
transparent background and fully transparent empty center. A thin elegant frame of
tarnished brass and warm gold filigree (#8a6d3b to #fbbf24), heavy stone-carved imperial
style, gilded ruins mood. Ornate corner flourishes contained within the outer sixth of
the image; along the edges only a slim, perfectly straight, seamlessly repeatable gold
line pattern. Strict four-fold symmetry: all four corners identical, all four edges
identical. Crisp clean vector-like edges, subtle worn-metal texture, no background, no
inner panel fill, no text, no watermark.
```

### Edit-Prompt: Linie verstärken

- **Eingabe:** das bestehende `public/assets/frames/panel-ornate.png` mit hochladen
- **Zieldatei:** ersetzt `public/assets/frames/panel-ornate.png` (gleiche Maße beibehalten,
  aktuell 1137×987 nach Bounding-Box-Zuschnitt)
- **Zweck:** Die durchgehende Goldlinie ist im aktuellen Asset ~13 px dick und wird in der
  UI auf ~1,3 CSS-Pixel skaliert (Faktor 31/310) — auf manchen Zoomstufen rastert der
  Browser sie blass. Ziel sind ~30–35 px im Asset, also etwa das Zweieinhalbfache. Die
  Ornamentmuster entlang der Kanten und die Eckverzierungen bleiben unverändert; Slice-,
  Breiten- und Outset-Werte in `src/app/index.css` werden nach dem Tausch neu vermessen.

```text
Edit this ornamental frame image. Keep everything exactly as it is — the composition,
the ornate corner flourishes, the repeating ornament pattern along the edges, the
tarnished brass and warm gold colors (#8a6d3b to #fbbf24), the fully transparent
background and fully transparent empty center, the symmetry and the crisp vector-like
edges. Only change the thin continuous gold line that runs along the four edges and
connects the ornaments: make it about two and a half times thicker (bolder stroke
weight), so it reads clearly when the image is scaled down to a UI panel frame. The
line must stay perfectly straight, seamlessly repeatable along each edge, and connect
cleanly into the corner flourishes and edge ornaments. Do not add any new ornaments,
medallions, text or watermark.
```

## 6. Divider-Ornament

- **Zieldatei:** `public/assets/ornaments/divider-ornate.png`
- **Format:** Querformat ca. 8:1, mindestens 2048×256, transparenter Hintergrund
- **Technik:** Wird als einzelnes Bild über die Höhe skaliert und zentriert über oder
  unter Inhalten platziert (`<img>` bzw. CSS-Background). Strikte horizontale
  Spiegelsymmetrie und spitz auslaufende Enden lassen den Divider in jeder Breite
  freistehend wirken.

```text
Horizontal ornamental divider for a dark fantasy game UI, wide 8:1 landscape format,
fully transparent background. A single thin elegant line of tarnished brass and warm
gold (#8a6d3b to #fbbf24) running the full width, swelling toward the center into a
small filigree diamond medallion with a tiny gold gem, tapering to fine sharp points
at both ends. Heavy stone-carved imperial style, gilded ruins mood. Strict left-right
mirror symmetry, perfectly straight horizontal axis, crisp clean vector-like edges,
subtle worn-metal texture, no background, no text, no watermark.
```

## 7. Dünner Panel-Rahmen (9-Slice)

- **Zieldatei:** `public/assets/frames/panel-thin.png`
- **Format:** quadratisch, mindestens 768×768, transparenter Hintergrund
- **Technik:** Wie §5 — der Rahmen wird per CSS `border-image` in neun Kacheln zerlegt
  (Slice-Inset ein Sechstel der Kantenlänge, bei 768 px also 128 px). Ornament darf
  ausschließlich in diesem äußeren Ring liegen; das Zentrum bleibt vollständig
  transparent. Ecken müssen in sich abgeschlossen sein, Kantenmitten nahtlos
  wiederholbar (CSS `border-image-repeat: round`). Für Karten und Sekundär-Panels,
  daher deutlich schlanker als §5.

```text
Slim ornamental picture-frame border for a dark fantasy game UI card, square 1:1,
fully transparent background and fully transparent empty center. A very thin, delicate
double line of tarnished brass and warm gold (#8a6d3b to #fbbf24), heavy stone-carved
imperial style, gilded ruins mood. Corners marked only by small restrained accents —
short pointed tips and tiny gold dots contained within the outer sixth of the image;
along the edges nothing but the slim, perfectly straight, seamlessly repeatable double
gold line, no medallions. Strict four-fold symmetry: all four corners identical, all
four edges identical. Crisp clean vector-like edges, subtle worn-metal texture, no
background, no inner panel fill, no text, no watermark.
```

### Edit-Prompt: Linie verstärken

- **Eingabe:** das bestehende `public/assets/frames/panel-thin.png` mit hochladen
- **Zieldatei:** ersetzt `public/assets/frames/panel-thin.png` (gleiche Maße beibehalten)
- **Zweck:** Die Goldlinie ist im aktuellen Asset ~14 px dick (bei 1254 px Kantenlänge) und
  wird in der UI auf gut einen CSS-Pixel herunterskaliert — auf manchen Zoomstufen rastert
  der Browser sie fast unsichtbar. Ziel sind ~30–40 px im Asset, also etwa das
  Zweieinhalbfache. Slice- und Breiten-Werte in `src/app/index.css` bleiben unverändert.

```text
Edit this ornamental frame image. Keep everything exactly as it is — the composition,
the corner ornaments with their pointed star tips and gold dots, the tarnished brass
and warm gold colors (#8a6d3b to #fbbf24), the fully transparent background and fully
transparent empty center, the strict four-fold symmetry and the crisp vector-like
edges. Only change the thin double gold line running along the four edges: make it
about two and a half times thicker (bolder stroke weight), so it reads clearly when
the image is scaled down to a small UI card frame. The line must stay perfectly
straight, seamlessly repeatable along each edge, and connect cleanly into the corner
ornaments. Do not add any new ornaments, medallions, text or watermark.
```

## 8. Nav-Selection-Ornament

- **Zieldatei:** `public/assets/ornaments/nav-selection.png`
- **Format:** hochkant ca. 1:2, mindestens 256×512, transparenter Hintergrund
- **Technik:** Sitzt als absolut positioniertes Bild an der linken Kante des aktiven
  Navigations-Eintrags, vertikal zentriert, Höhe etwa gleich der Eintragshöhe. Die
  zentrale Spitze zeigt nach rechts in den Eintrag hinein. Die obere und untere,
  nach rechts auslaufende Goldlinie der Selektion wird separat per CSS-Gradient auf
  Pseudoelementen des aktiven Eintrags umgesetzt; sie gehört nicht in dieses Asset.

```text
Vertical ornamental selection marker for a dark fantasy game UI navigation menu,
portrait 1:2 format, fully transparent background. A slender vertical bracket of
tarnished brass and warm gold (#8a6d3b to #fbbf24): a thin vertical line with a
central spearhead point aiming to the right, small filigree flourishes curling at the
top and bottom ends. Heavy stone-carved imperial style, gilded ruins mood. Strict
top-bottom mirror symmetry, the ornament hugging the left side of the canvas with the
point reaching right. Crisp clean vector-like edges, subtle worn-metal texture, no
background, no text, no watermark.
```

### Edit-Prompt: Selektionsmarker verbreitern und verstärken

- **Eingabe:** das bestehende `public/assets/ornaments/nav-selection.png` mit hochladen
- **Zieldatei:** ersetzt `public/assets/ornaments/nav-selection.png`
- **Zweck:** Der aktuelle Marker nutzt zu wenig von der horizontalen Bildfläche und wirkt
  nach dem Herunterskalieren wie eine schmale Linie. Die zentrale Spitze und die Filigranformen
  sollen deutlich weiter in den Menüeintrag hineinragen und auch bei etwa 40–48 px Eintragshöhe
  klar lesbar bleiben.

```text
Edit this existing vertical navigation selection ornament for a dark fantasy game UI.
Keep the transparent background, tarnished brass and warm gold palette (#8a6d3b to
#fbbf24), worn-metal texture, strict top-bottom mirror symmetry, and the overall
gilded ruins style. Make the marker substantially broader and visually stronger,
thicken the main vertical gold bar, enlarge the top and bottom finials,
and extend the central angular spearhead much farther to the right. The central point
should be bold and immediately readable when the asset is scaled to a 40–48 px tall
navigation row. Reduce unused transparent space on the right so the ornament occupies
roughly three quarters of the canvas width, while keeping a small transparent safety
margin around every visible edge. Preserve crisp vector-like contours and restrained
imperial filigree; do not turn it into a complete rectangular frame. No background, text, icons, glow haze, or watermark.
```

## 9. Button-Ornamentrahmen (9-Slice)

- **Zieldatei:** `public/assets/frames/button-ornate.png`
- **Format:** quadratisch, mindestens 768×768, transparenter Hintergrund
- **Technik:** Wie §7 (9-Slice, Slice-Inset ein Sechstel, transparentes Zentrum,
  `border-image-repeat: round`). Neutrales Gold, damit derselbe Rahmen über dem
  Gold-Gradient des Primär-Buttons und der Rot-Fläche des Danger-Buttons funktioniert.

```text
Very slim ornamental button border frame for a dark fantasy game UI, square 1:1,
fully transparent background and fully transparent empty center. A narrow double line
of tarnished brass and warm gold (#8a6d3b to #fbbf24), heavy stone-carved imperial
style, gilded ruins mood. Corners accented with short diagonal gold ticks and a tiny
dot, all ornament contained within the outer sixth of the image; along the edges only
the slim, perfectly straight, seamlessly repeatable double gold line. Strict four-fold
symmetry: all four corners identical, all four edges identical. Crisp clean
vector-like edges, subtle worn-metal texture, no background, no inner fill, no text,
no watermark.
```

## 10. Crucible-Logo-Emblem

- **Zieldatei:** `public/assets/icons/crucible-emblem.png`
- **Format:** 1:1, mindestens 1024×1024, transparenter Hintergrund
- **Technik:** Freistehendes Emblem für die Sidebar-Kopfzeile; der Schriftzug
  „CRUCIBLE" bleibt Live-Text in Cinzel und ist nicht Teil des Assets.

```text
Heraldic golden emblem for a dark fantasy game logo, square 1:1, fully transparent
background. A stylized crucible — a heavy ornate chalice-like vessel of tarnished
brass and warm gold (#8a6d3b to #fbbf24) — with a single rising ember flame glowing
warm orange (#e25822) at its heart, flanked by symmetric filigree wings and radiating
gold rays. Heavy stone-carved imperial style, gilded ruins mood — noble and
mysterious. Strict left-right mirror symmetry, centered composition, standalone
emblem suitable for small UI display. Crisp clean vector-like edges, subtle
worn-metal texture, no background, no lettering, no text, no watermark.
```

## 11. Item-Slot-Rahmen (9-Slice)

- **Zieldatei:** `public/assets/frames/slot-ornate.png`
- **Format:** quadratisch, mindestens 512×512, transparenter Hintergrund
- **Technik:** Wie §7 (9-Slice, Slice-Inset ein Sechstel, transparentes Zentrum,
  `border-image-repeat: round`); bei festen Slot-Größen auch als komplettes
  quadratisches Overlay einsetzbar. Für Icon-Kacheln in Inventar und
  Belohnungsanzeigen.

```text
Compact square ornamental slot frame for dark fantasy game UI item icons, square 1:1,
fully transparent background and fully transparent empty center. A thin single line of
tarnished brass and warm gold (#8a6d3b to #fbbf24), heavy stone-carved imperial style,
gilded ruins mood. Four small identical corner accents — tiny pointed gold flourishes
contained within the outer sixth of the image; along the edges only the thin,
perfectly straight, seamlessly repeatable gold line. Strict four-fold symmetry: all
four corners identical, all four edges identical. Crisp clean vector-like edges,
subtle worn-metal texture, no background, no inner fill, no text, no watermark.
```

## 12. Dungeon-Hintergrund — The Ember Foundry

- **Zieldatei:** `public/assets/backgrounds/dungeon-ember-foundry.png` (oder `.webp`)
- **Format:** 16:9, mindestens 1920×1080
- **Verwendung:** Akt-Panel der Dungeon-Auswahl (Crop ca. 280×150), später auch als
  Screen-Hintergrund von Akt 2.

```text
Dark fantasy dungeon interior, "The Ember Foundry": colossal ruined forge-halls of a
once-golden empire, giant cold furnaces and channels of faintly glowing molten metal,
heavy stone architecture, cracked pillars with tarnished gold inlays, drifting sparks
and smoke, ember glow (#e25822) casting warm orange light against cool deep blue-slate
shadows (#0f172a), gilded ruins mood — noble and mysterious, never hopeless. Painterly
digital art, muted colors, high readability, soft atmospheric depth, no characters, no
text, no UI. Wide 16:9 environment shot with one strong focal point at the horizontal
center and mid-height of the frame, so the image stays readable when cropped to a small
wide card.
```

## 13. Dungeon-Hintergrund — The Forgotten Citadel

- **Zieldatei:** `public/assets/backgrounds/dungeon-forgotten-citadel.png` (oder `.webp`)
- **Format:** 16:9, mindestens 1920×1080
- **Verwendung:** Akt-Panel der Dungeon-Auswahl (Crop ca. 280×150), später auch als
  Screen-Hintergrund von Akt 3.

```text
Dark fantasy dungeon interior, "The Forgotten Citadel": the buried throne halls of a
lost imperial citadel, towering vaulted architecture, colossal cracked pillars, faded
banners and tarnished gold filigree on dark stone, pale arcane light (#8b5cf6) mixing
with a faint warm ember glow (#e25822) against cool deep blue-slate shadows (#0f172a),
drifting ash, gilded ruins mood — noble and mysterious, never hopeless. Painterly
digital art, muted colors, high readability, soft atmospheric depth, no characters, no
text, no UI. Wide 16:9 environment shot with one strong focal point at the horizontal
center and mid-height of the frame, so the image stays readable when cropped to a small
wide card.
```

## 14. Dungeon-Hintergrund — The Ashen Depths (Neufassung)

- **Zieldatei:** `public/assets/backgrounds/dungeon-ashen-depths_1.png`
- **Format:** 16:9, mindestens 1920×1080
- **Verwendung:** Akt-Panel der Dungeon-Auswahl (Crop ca. 280×150) und Screen-Hintergrund
  von Akt 1 — im Stil-Duktus von §12/§13.

```text
Dark fantasy dungeon interior, "The Ashen Depths": vast ruined underground hall of a
once-golden empire, heavy stone architecture, cracked pillars with tarnished gold inlays,
drifting ash and faint embers in the air, a low fire glow from below casting warm orange
light (#e25822) against cool deep blue-slate shadows (#0f172a), gilded ruins mood — noble
and mysterious, never hopeless. Painterly digital art, muted colors, high readability,
soft atmospheric depth, no characters, no text, no UI. Wide 16:9 environment shot with
one strong focal point at the horizontal center and mid-height of the frame, so the
image stays readable when cropped to a small wide card; the center-bottom area stays
calm so UI panels and characters can sit on top.
```

## 15. Alternativer Panel-Ornamentrahmen (9-Slice)

- **Zieldatei:** `public/assets/frames/panel-ornate-alt.png`
- **Format:** quadratisch, mindestens 1024×1024, transparenter Hintergrund und vollständig
  transparentes Zentrum
- **Technik:** 9-Slice-Rahmen für eine schmale, viewport-hohe Fläche. Der Slice-Inset liegt bei
  einem Sechstel der Kantenlänge; sämtliche Ornamente bleiben innerhalb dieses äußeren Rings.
  Die geraden Kantenstücke müssen nahtlos wiederholbar sein (`border-image-repeat: round`),
  damit der Rahmen ohne Verzerrung auf unterschiedliche Menübreiten und Viewport-Höhen skaliert.
  Die Eckornamente zeigen jeweils in den transparenten Innenraum: oben links nach rechts unten,
  oben rechts nach links unten, unten links nach rechts oben und unten rechts nach links oben.

```text
Ornamental four-sided frame for a full-height dark fantasy game UI panel, designed
as a square 1:1 nine-slice border asset with a fully transparent background and a
fully transparent empty center. A very thin double outline of tarnished brass and
restrained warm gold (#8a6d3b to #fbbf24) forms a tall, narrow rectangular boundary
around a vertical content column. Each corner carries a small elegant imperial
ornament that grows from the border and points diagonally inward into the empty center:
the top-left corner points down and right, the top-right corner down and left, the
bottom-left corner up and right, and the bottom-right corner up and left. Each corner
combines a short angular spear tip, a tiny diamond-shaped joint, and one restrained
curl of stone-carved filigree. The result should feel like a delicate architectural
frame around an ancient palace panel: noble, precise, slightly weathered, and clearly
visible against a deep blue-black background, but much lighter and narrower than an
ornate content-panel frame.

Strict four-fold symmetry: all corner ornaments are mirrored versions of one design,
and all four edge lines share the same slim weight. Keep every ornament entirely
inside the outer sixth of the canvas. Between the corners, use only perfectly straight,
seamlessly repeatable thin double lines so CSS border-image slicing can extend the
frame to a tall, narrow panel of any height without stretching the decorations. Preserve
clear transparent safety space between the ornament tips and the empty center. Crisp
vector-like contours, subtle worn-metal texture, minimal warm highlights, no glow
haze, no dark panel fill, no background, no text, no icons, no medallions, no complete
screen frame, and no watermark.
```

## 16. Frame-Ornament nach Eck-Referenz (9-Slice)

- **Eingabe:** das Referenzbild (Eck-Ausschnitt aus den Concept-Screens) mit hochladen
- **Zieldatei:** `public/assets/frames/mainview-ornate.png`
- **Format:** quadratisch, mindestens 1024×1024, transparenter Hintergrund und vollständig
  transparentes Zentrum
- **Technik:** Wie §15 — 9-Slice-Rahmen, Slice-Inset ein Sechstel der Kantenlänge, Ornamente
  ausschließlich im äußeren Ring, Kantenmitten nahtlos wiederholbar
  (`border-image-repeat: round`). Die Referenz liefert nur Aufbau und Formensprache der Ecke;
  die Farben kommen aus der Projekt-Palette. Der Rahmen wird in der UI auf etwa ein Fünftel
  skaliert (Slice ein Sechstel von 1024 ≈ 170 px, gerendert als 32 px Border); jede Einzellinie
  braucht im Asset daher ~12–16 px Stärke, damit sie über einem CSS-Pixel bleibt und beim
  Browser-Zoom nicht wegrastert (vgl. die Edit-Prompts zu §5/§7). Nach dem Tausch werden
  Slice-, Breiten- und Padding-Werte in `src/app/index.css` neu vermessen.

```text
Ornamental four-sided frame for a dark fantasy game UI, square 1:1, designed as a
nine-slice border asset with a fully transparent background and a fully transparent
empty center. Recreate the corner design from the attached reference image: a slim
double gold line meeting in a clean right angle, crowned at the corner by a small
pointed diamond finial and a single elegant stone-carved filigree flourish that curls
diagonally inward into the empty center. Use the reference only for shape, proportions
and composition; render all colors in the project palette of tarnished brass and warm
gold (#8a6d3b to #fbbf24) with restrained warm amber highlights (#f59e0b), heavy
stone-carved imperial style, gilded ruins mood — noble, precise, slightly weathered.

Strict four-fold symmetry: all four corners are identical mirrored versions of the
reference corner, each flourish pointing diagonally inward into the empty center.
Keep every ornament entirely inside the outer sixth of the canvas. Between the
corners, use only the perfectly straight, seamlessly repeatable double gold line so
CSS border-image slicing can stretch the frame to any panel size without distorting
the decorations. Give every line a bold, confident stroke weight — on a 1024 px
canvas each of the two gold lines must be at least 12 to 16 pixels thick, never
hairline-thin — so the frame still reads clearly after being scaled down to about
one fifth of its size in the UI. Preserve clear transparent safety space between the
flourish tips and the empty center. Crisp clean vector-like contours, subtle
worn-metal texture, minimal warm highlights, no glow haze, no dark panel fill, no
background, no text, no icons, no medallions, no watermark.
```

## 17. Glutlicht (Ember-Glow-Overlay)

- **Zieldatei:** `public/assets/effects/ember-glow.png`
- **Format:** quadratisch, mindestens 1024×1024, transparenter Hintergrund
- **Technik:** Liegt als absolut positioniertes Bild am unteren Rand der Sidebar
  (volle Breite, `pointer-events: none`), unterhalb des Rahmen-`::before`
  (`z-index` < 20) und hinter den Navigationseinträgen. Das Leuchten bleibt in der
  unteren Bildhälfte und läuft nach oben und zu den Seiten vollständig transparent
  aus, damit das Asset an der schmalen Sidebar-Spalte (288 px) ohne sichtbare
  Kanten sitzt. Durch die horizontale Symmetrie ist es auch unten rechts im
  Main-Bereich wiederverwendbar (versetzt positioniert oder gespiegelt).

```text
Atmospheric ember-glow overlay for a dark fantasy game UI, square 1:1, fully
transparent background. Soft, diffuse firelight rising from the bottom edge of
the canvas, as if a crucible of glowing coals burns just out of view below:
warm ember orange (#e25822) blending into amber highlights (#f59e0b, #fbbf24),
brightest in a gentle arc along the center of the bottom edge, fading smoothly
and evenly into full transparency toward the sides and upward. The upper half
of the canvas stays completely empty and transparent. A sparse scatter of tiny
drifting embers and sparks — small glowing dots and very short streaks — floats
upward out of the glow, growing fainter and rarer with height. Pure light and
embers only: no flames with hard silhouettes, no objects, no smoke clouds, no
logo. Soft painterly gradients with generous semi-transparency so dark UI
panels and gold ornaments stay fully readable on top. Gilded ruins mood —
noble and mysterious. Roughly left-right mirror symmetry, no background, no
text, no watermark.
```

## 18. Crucible-Tree-Tab-Hintergrund — Anvil Sparks

- **Zieldatei:** `public/assets/backgrounds/crucible-tab-anvil-sparks.png` (oder `.webp`)
- **Format:** sehr breites Querformat 3:1, mindestens 1536×512
- **Verwendung:** Hintergrund des Tabs „Anvil Sparks“. Das Asset wird per `background-size: cover`
  in einen nur 64 px hohen Tab eingesetzt und muss deshalb auch bei seitlichem Crop auf schmalen
  Viewports funktionieren. Die ruhige, dunkle Bildmitte bleibt für den darüberliegenden Live-Text
  frei; der Tree-Name ist nicht Teil des Bildes.

```text
Use case: stylized-concept
Asset type: dark fantasy game UI tab background
Primary request: a restrained symbolic forge scene for "Anvil Sparks", representing
permanent access, ancient craft, and systems awakened by the first strike of an anvil
Scene/backdrop: a shadowed imperial forge alcove built from massive dark stone, with a
weathered anvil, faint engraved construction lines, and a sparse shower of tiny sparks
suggesting dormant mechanisms coming to life
Style/medium: painterly dark fantasy concept art with crisp material definition, matching
the project's heavy stone-carved imperial style and gilded ruins mood
Composition/framing: very wide 3:1 landscape banner, designed for a shallow 64 px UI tab;
balanced visual interest in the left and right thirds, no important detail at the extreme
edges, and a calm dark low-detail area across the horizontal center for overlaid live text;
crop-safe for aspect ratios between roughly 2:1 and 5:1
Lighting/mood: one restrained warm spark glow around the anvil, noble and mysterious,
subdued rather than explosive
Color palette: deep blue-black and slate shadows (#0f172a), tarnished brass and muted gold
(#8a6d3b to #fbbf24), sparse ember orange accents (#e25822)
Materials/textures: worn black iron, cracked stone, aged gold inlays, fine ash in the air
Constraints: keep the center dark enough for bright UI lettering; readable at very small
display height; no border or frame; no text, letters, runes resembling text, icons, characters,
logos, interface elements, or watermark
Avoid: a large centered object behind the label, bright full-frame fire, excessive sparks,
busy micro-detail, modern machinery, photorealistic photography
```

## 19. Crucible-Tree-Tab-Hintergrund — Smelting Flames

- **Zieldatei:** `public/assets/backgrounds/crucible-tab-smelting-flames.png` (oder `.webp`)
- **Format:** sehr breites Querformat 3:1, mindestens 1536×512
- **Verwendung:** Hintergrund des Tabs „Smelting Flames“. Gleiche Kompositions- und Crop-Regeln
  wie bei §18; der Tree-Name bleibt Live-Text.

```text
Use case: stylized-concept
Asset type: dark fantasy game UI tab background
Primary request: a restrained smelting scene for "Smelting Flames", representing raw
physical power refined and strengthened through heat
Scene/backdrop: the interior of an ancient imperial smelter, with dark furnace masonry,
glowing metal channels, heat-scarred crucibles, and a controlled ribbon of molten iron
moving through the scene
Style/medium: painterly dark fantasy concept art with crisp material definition, matching
the project's heavy stone-carved imperial style and gilded ruins mood
Composition/framing: very wide 3:1 landscape banner, designed for a shallow 64 px UI tab;
the furnace glow and molten channels create subtle movement in the left and right thirds,
while the horizontal center remains dark, calm, and low-detail for overlaid live text; no
important detail at the extreme edges; crop-safe for aspect ratios between roughly 2:1 and 5:1
Lighting/mood: contained furnace heat and a steady internal glow, powerful and enduring,
never chaotic or apocalyptic
Color palette: deep blue-black and charcoal shadows (#0f172a), dark iron, tarnished gold
(#8a6d3b), concentrated ember orange and amber light (#e25822, #f59e0b)
Materials/textures: rough furnace stone, blackened iron, viscous molten metal, subtle heat
haze, small traces of soot and ash
Constraints: keep the center dark enough for bright UI lettering; readable at very small
display height; no border or frame; no text, letters, runes resembling text, icons, characters,
logos, interface elements, or watermark
Avoid: a wall of flames, lava landscape, bright yellow center, excessive bloom, busy
micro-detail, modern industrial equipment, photorealistic photography
```

## 20. Crucible-Tree-Tab-Hintergrund — Molten Cast

- **Zieldatei:** `public/assets/backgrounds/crucible-tab-molten-cast.png` (oder `.webp`)
- **Format:** sehr breites Querformat 3:1, mindestens 1536×512
- **Verwendung:** Hintergrund des Tabs „Molten Cast“. Gleiche Kompositions- und Crop-Regeln
  wie bei §18; der Tree-Name bleibt Live-Text.

```text
Use case: stylized-concept
Asset type: dark fantasy game UI tab background
Primary request: a restrained casting scene for "Molten Cast", representing combat rules
being reshaped as liquid metal is committed to a decisive new form
Scene/backdrop: an ancient imperial casting floor where a narrow stream of luminous molten
metal pours into branching weapon and armor moulds cut into dark stone, with incomplete
silhouettes emerging at the edges of the composition
Style/medium: painterly dark fantasy concept art with crisp material definition, matching
the project's heavy stone-carved imperial style and gilded ruins mood
Composition/framing: very wide 3:1 landscape banner, designed for a shallow 64 px UI tab;
use restrained diagonal flow and branching mould lines in the left and right thirds to imply
choice and transformation, while preserving a calm dark low-detail band across the horizontal
center for overlaid live text; no important detail at the extreme edges; crop-safe for aspect
ratios between roughly 2:1 and 5:1
Lighting/mood: focused molten light cutting through cool darkness, tactical, dangerous, and
deliberate rather than wild
Color palette: deep blue-slate and near-black shadows (#0f172a), aged brass and muted gold
(#8a6d3b to #fbbf24), narrow accents of white-hot amber and ember orange (#f59e0b, #e25822)
Materials/textures: carved stone moulds, scorched iron, liquid metal, thin smoke, sparse sparks
Constraints: keep the center dark enough for bright UI lettering; readable at very small
display height; no border or frame; no text, letters, runes resembling text, icons, characters,
logos, interface elements, or watermark
Avoid: one large centered weapon, literal combat scene, bright full-frame lava, excessive
flames or bloom, busy micro-detail, modern foundry machinery, photorealistic photography
```

## 21. Crucible-View-Hintergrund — Der Schmelztiegel

- **Zieldatei:** `public/assets/backgrounds/crucible-view.png` (oder `.webp`)
- **Format:** Querformat 16:9, mindestens 2560×1440
- **Verwendung:** Vollflächiger Hintergrund der gesamten Crucible-Ansicht hinter Überschrift,
  Tree-Tabs, Node-Panel und Detailansicht. Das Bild wird per `background-size: cover` eingesetzt.
  Der Schmelztiegel bleibt auch bei engerem Crop das zentrale Motiv; die UI-relevanten Bereiche
  sind dunkel und kontrastarm gehalten.

```text
Use case: stylized-concept
Asset type: full-screen dark fantasy game UI background
Primary request: a monumental ancient crucible — a true heavy smelting vessel — as the
defining visual heart of the Crucible view, where recovered Relic Shards are melted down
and reforged into permanent access, physical strength, and altered combat techniques
Scene/backdrop: a vast subterranean imperial forge-temple beneath a ruined kingdom, built
around one colossal stone-and-black-iron crucible set into a circular furnace dais; the
vessel has a broad heavy rim, short reinforced handles, weathered gold bands, and a deep
interior glow of molten metal; immense cracked pillars, dormant channels, chains, and faded
gilded reliefs disappear into the surrounding darkness
Subject: the crucible itself is unmistakable and dominant, viewed slightly from above so
both its massive vessel silhouette and the molten interior are clearly readable; it feels
ancient, functional, sacred, and powerful rather than like a decorative chalice or cooking pot
Style/medium: cinematic painterly dark fantasy environment concept art with restrained
detail and strong silhouettes, matching the project's heavy stone-carved imperial style and
gilded ruins mood — noble and mysterious, never hopeless
Composition/framing: wide 16:9 landscape background for a responsive game screen; place the
monumental crucible in the lower central third, large enough to remain the clear focal point
but low enough that UI panels can occupy the middle of the screen; preserve a broad, dark,
low-detail field through the central and upper-middle area for Tree-Tabs, nodes, connectors,
and the inspector; keep the upper-left corner especially calm for the live "Crucible" heading;
distribute secondary architecture symmetrically toward the outer edges; crop-safe from wide
desktop down to roughly 4:5 mobile, with the crucible remaining recognizable near the center
Lighting/mood: the only strong light rises from within the crucible, casting a controlled
ember glow upward onto its rim and the nearest floor carvings; distant forge architecture
stays in cool shadow with sparse floating embers and soft atmospheric depth
Color palette: dominant deep blue-black and cool slate shadows (#0f172a), blackened iron,
tarnished brass and aged gold (#8a6d3b to #fbbf24), concentrated molten ember orange
(#e25822) and restrained amber highlights (#f59e0b)
Materials/textures: massive soot-darkened stone, forged black iron, worn gold inlays, viscous
molten metal, cracked furnace masonry, subtle ash and smoke haze
Constraints: prioritize UI readability; keep most of the image dark and low-contrast outside
the crucible; retain enough negative space for large opaque or translucent panels; no border
or frame; no text, letters, readable runes, icons, characters, weapons as focal objects, logos,
interface elements, or watermark
Avoid: a small crucible, cauldron, goblet, trophy cup, kitchen vessel, volcano, open lava lake,
wall-to-wall flames, bright orange full-frame lighting, excessive bloom, busy foreground clutter,
modern industrial machinery, horror imagery, photorealistic photography
```

## 22. Weapon-Mastery-View-Hintergrund — Halle der Meisterschaft

- **Zieldatei:** `public/assets/backgrounds/weapon-mastery-view.png` (oder `.webp`)
- **Format:** Querformat 16:9, mindestens 2560×1440
- **Verwendung:** Vollflächiger Hintergrund der gesamten Weapon-Mastery-Ansicht hinter
  Charakterleiste, Überschrift, Discipline-Tabs, Rank-Baum und Inspector. Das Bild wird per
  `background-size: cover` eingesetzt. Die Mitte und die UI-Randbereiche bleiben dunkel und
  kontrastarm; die Signaturwaffen erscheinen nur als untergeordnete Motive der Architektur.

```text
Use case: stylized-concept
Asset type: full-screen dark fantasy game UI background
Primary request: an ancient imperial hall of arms dedicated to lifelong weapon mastery,
expressing disciplined progression from Initiate to Grandmaster without depicting a literal
skill tree, interface, or combat scene
Scene/backdrop: a vast vaulted armory-sanctum beneath a ruined golden empire, with a long worn
stone training floor, massive shadowed pillars, weathered gold-inlaid weapon racks, faded
martial reliefs, and five distant architectural bays that subtly rise in grandeur from left
to right; peripheral wall niches contain a heavy warhammer, crossed twin blades, and a tall
longbow as restrained silhouettes, honoring the three permanent signature weapons
Subject: the hall itself is the subject, ancient, functional, solemn, and still cared for;
the five bays suggest ascending ranks through scale and increasingly refined gold detail, but
no single weapon or object dominates the composition
Style/medium: cinematic painterly dark fantasy environment concept art with restrained
detail and strong architectural silhouettes, matching the project's heavy stone-carved
imperial style and gilded ruins mood — noble and mysterious, never hopeless
Composition/framing: wide 16:9 landscape background for a responsive game screen; use a
mostly symmetrical frontal view with subtle depth into the hall; preserve a broad, dark,
low-detail field across the central and upper-middle area for five horizontal Rank columns,
nodes, connectors, and Discipline tabs; keep the upper-left area especially calm for the live
"Weapon Mastery" heading, the far-left strip quiet behind the character portrait rail, and
the right third dark and uncluttered behind the inspector; place weapon racks, reliefs, floor
inlays, and other visual interest toward the lower edge and far outer sides; crop-safe from
wide desktop down to roughly 4:5 mobile without relying on any one weapon remaining visible
Lighting/mood: cool ambient darkness with restrained warm light from a few low shielded
braziers and thin gold inlays, suggesting focus, patience, and earned expertise rather than
spectacle; sparse dust and ash catch the light with soft atmospheric depth
Color palette: dominant deep blue-black and cool slate shadows (#0f172a), blackened steel,
tarnished brass and aged gold (#8a6d3b to #fbbf24), with only sparse ember-orange accents
(#e25822) and restrained amber highlights (#f59e0b)
Materials/textures: cracked imperial stone, worn training-floor grooves, forged black iron,
aged leather weapon grips, dulled steel, weathered gold inlays, fine dust and faint ash haze
Constraints: prioritize UI readability; keep most of the image dark, low-contrast, and
low-detail; make the three signature weapons recognizable only as secondary peripheral
silhouettes; retain generous negative space for large opaque or translucent panels; no border
or frame; no text, letters, readable runes, icons, characters, enemies, logos, interface
elements, or watermark
Avoid: one large centered weapon, weapons floating in empty space, a literal branching tree,
a museum display, crowded weapon racks, active fighting or training characters, bright
full-frame fire, excessive bloom, busy micro-detail, modern equipment, horror imagery,
photorealistic photography
```

## 23. Charakter-Portrait-Rahmen

- **Zieldatei:** `public/assets/frames/character-portrait-frame.png`
- **Format:** Hochformat 7:10, mindestens 896×1280; nach Freistellung optional auf etwa
  448×640 verkleinern
- **Verwendung:** Ein gemeinsames dekoratives Overlay für die drei Portraitkarten im
  Charakter-Switcher. Das Asset wird bei ungefähr 80×114 CSS-Pixeln angezeigt. Portrait,
  Rollenicon, Charaktername, Aktivmarker und Glühen werden separat als Live-UI gerendert.
- **Technik:** Vollständig transparenter Außenbereich, transparente Portraitöffnung,
  transparenter Wappenhalter und transparentes Namensschild. Das Bild wird als komplettes
  Overlay skaliert, nicht als 9-Slice verwendet. Alle sichtbaren Formen benötigen einen
  transparenten Sicherheitsabstand zum Bildrand; keine Schatten oder Glows außerhalb der
  Leinwand.
- **Referenzen:** Für Aufbau und Proportionen
  `concept/ui-draft-2/ui-menu-character-switcher-v1.png`; für Metall, Farbe und Ornamentstil
  `public/assets/frames/panel-ornate.png` und `public/assets/frames/mainview-ornate.png`.

```text
Use case: stylized-concept
Asset type: reusable ornamental overlay frame for a dark fantasy game UI character portrait
Primary request: one strong, compact imperial portrait-card frame that can be placed over
different character paintings and remains clearly readable at only about 80 by 114 CSS pixels
Canvas and transparency: exact 7:10 portrait aspect ratio, at least 896 by 1280 pixels; fully
transparent background outside the ornament and fully transparent openings everywhere inside
the portrait window, crest holder, and nameplate; preserve a transparent safety margin around
every visible outer edge
Structure: a tall arched portrait opening occupies most of the card; above the arch is one
small centered empty heraldic crest holder for a separately rendered live role icon; below the
portrait is one broad empty rectangular nameplate with slightly clipped or pointed corners for
separately rendered live text; the lower edge ends in a restrained centered diamond point
Frame style: heavy stone-carved imperial metalwork from a fallen golden empire, dark aged
brass and blackened iron with warm gold highlights (#8a6d3b to #fbbf24), subtle worn edges,
small ember-orange reflections (#e25822), noble and mysterious rather than luxurious
Composition and readability: strict left-right symmetry; bold silhouette; thick continuous
metal rails around the portrait; large calm shapes and only a few restrained leaf or spear
motifs around the arch shoulders and base; every important stroke must survive strong
downscaling; keep the portrait opening as large as possible and do not cover the face area
Lighting: canonical active-state metal with controlled warm highlights, crisp separation from
dark portraits, no baked glow halo and no cast shadow outside the frame
Rendering style: polished game UI asset, crisp vector-like contours with painterly worn-metal
texture, clean alpha edges, front-facing orthographic presentation, no perspective distortion
Constraints: frame only; no character, face, body, weapon, scenery, background panel, black
fill, role symbol, shield icon, swords icon, crosshair icon, letters, words, readable runes,
logo, interface text, particles, lens flare, bloom haze, drop shadow, or watermark
Avoid: micro-filigree, hair-thin lines, overly baroque decoration, asymmetric damage, a round
medallion covering the portrait, a thick solid base that reduces portrait height, fake
transparency shown as checkerboard, baked-in dark backdrop, separate active and inactive
versions, multiple frames in one image, mockup presentation
```

## 24. Gemeinsamer Ornament-Tabrahmen (9-Slice)

- **Zieldatei:** `public/assets/frames/tab-ornate.png`
- **Format:** sehr breites Querformat 4:1, mindestens 1600×400
- **Verwendung:** Ein gemeinsamer skalierbarer Ornamentrahmen für Weapon-Mastery-, Crucible- und
  vergleichbare Tree-Tabs. Icons, Live-Labels, investierte Punkte, Innenfläche und sämtliche
  Interaktionszustände bleiben Live-UI.
- **Technik:** Vollständig transparenter Außenbereich und vollständig transparente
  Rahmenöffnung. Die seitlichen Endstücke bleiben beim 9-Slice-Skalieren unverändert; lange,
  gerade und detailarme Abschnitte an Ober- und Unterkante bilden die horizontal streckbare
  Mitte. Der Rahmen wird bei ungefähr 64 CSS-Pixeln Höhe angezeigt und darf deshalb keine
  haarfeinen tragenden Linien verwenden.
- **Referenzen:** Für Form, Proportionen und Segmentierung
  `concept/ui-draft-2/ui-weapon-mastery-v1.png`; für Metall, Farbe und Alterung
  `public/assets/frames/panel-ornate.png` und `public/assets/frames/mainview-ornate.png`.

```text
Use case: stylized-concept
Asset type: reusable horizontal 9-slice ornamental tab frame for a dark fantasy game UI
Primary request: one shallow imperial metal frame for a reusable game UI tree tab,
designed to turn live text, optional separately rendered icons, and contained background art into
a strong game-style tab while remaining reusable for different labels and interaction states
Canvas and transparency: exact 4:1 landscape aspect ratio, at least 1600 by 400 pixels; true
transparent alpha outside the ornament and throughout the entire inner opening; preserve a
clear transparent safety margin around every outer point; do not simulate transparency with
black, white, or a checkerboard
Structure: strict left-right symmetry; a long shallow frame with stepped, slightly clipped
corners; bold blackened-iron rails edged with aged gold; one restrained diamond or spear-point
accent centered on each short end; small matching points may project from the top and bottom
near the end caps; the silhouette should resemble an imperial dark-fantasy tab segment without
copying any text or icon from the reference concept
9-slice requirements: keep all distinctive end-cap construction inside the outer left and
right quarters of the canvas; make the middle half of the top and bottom rails straight,
horizontal, continuous, and deliberately low-detail so it can stretch without visible
distortion; keep the inner opening broad and unobstructed; no ornament may cross through the
center opening
Frame style: heavy stone-carved imperial metalwork from a fallen golden empire, dark aged
brass and blackened iron with restrained warm gold highlights (#8a6d3b to #fbbf24), subtle
worn edges, and only tiny ember-orange reflections (#e25822); noble, martial, and mysterious
rather than luxurious or decorative
Composition and readability: front-facing orthographic presentation with no perspective;
bold continuous rails, large calm shapes, crisp alpha edges, and enough visual weight to remain
recognizable when the complete frame is only about 64 CSS pixels high; prioritize silhouette
and material separation over micro-detail
Lighting and states: neutral canonical metal under controlled warm edge light; no baked active
glow, hover glow, focus ring, selection flare, cast shadow, or dark interior fill because all
states and surfaces will be rendered separately with CSS
Rendering style: polished game UI asset, crisp vector-like contours with restrained painterly
worn-metal texture, matching the project's Gilded Ruins visual language
Constraints: frame only; no text, letters, readable runes, numbers, weapon, shield, discipline
symbol, character, scenery, background panel, interior texture, particles, flames, lens flare,
bloom haze, logo, interface mockup, or watermark
Avoid: ornate corner rosettes that consume the shallow opening, thin filigree, asymmetry,
broken rails, large curls, excessive spikes, bright solid-gold metal, colored gemstones,
separate active and inactive versions, multiple frames in one image, mockup presentation
```

## 25. Weapon-Mastery-Tab-Icon-Sheet

- **Zielrohdatei:** `concept/ui-draft-2/weapon-mastery-tab-icons-sheet.png`
- **Format:** exakt 2048×1024 mit transparentem Hintergrund; unsichtbares 4×2-Raster aus
  512×512 großen Feldern
- **Verwendung:** Gemeinsame Produktionsgrundlage für sieben stilistisch konsistente
  Weapon-Mastery-Tab-Icons. Das Sheet wird nicht direkt in der Anwendung verwendet.
- **Kachelreihenfolge:** Oben `Warhammer`, `Twin Blades`, `Longbow`, `Finesse`; unten `Tempest`,
  `Dominance`, `Valor`, leeres Feld.
- **Aufbereitung:** Die sieben belegten Felder werden ohne kreative Umgestaltung an den exakten
  Viertelgrenzen ausgeschnitten und als Alpha-Masken unter `public/assets/icons/weapon-mastery/`
  abgelegt. Jede Glyphe muss deshalb innerhalb einer zentralen 384×384-Sicherheitszone liegen.

```text
Use case: stylized-concept
Asset type: production icon sheet containing seven monochrome alpha-mask glyphs for dark
fantasy Weapon Mastery tabs
Primary request: create one internally consistent family of seven bold imperial martial
symbols that replaces generic library icons and remains unmistakable at only 24 to 28 CSS
pixels; the symbols will later be cut into individual square PNG files and recolored through
CSS masks
Canvas and grid: exact 2048 by 1024 pixel transparent canvas, divided conceptually into an
invisible four-column by two-row grid of exact 512 by 512 pixel cells; do not draw grid lines,
cell borders, guides, labels, captions, numbers, or tile backgrounds; keep the eighth and final
bottom-right cell completely empty and transparent
Placement and safe area: center exactly one symbol in each occupied cell; every visible pixel
of each symbol must remain inside the central 384 by 384 pixel safe area of its cell; use the
same optical size, line weight, visual density, orientation logic, and amount of negative space
for all seven symbols; symbols must never touch, overlap, or extend into neighboring cells
Fixed row-major order and motifs:
1. top-left — WARHAMMER: one heavy square-headed warhammer in a compact rising diagonal pose,
with a short reinforced haft and a broad unmistakable striking head
2. top-second — TWIN BLADES: two matching slender slightly curved swords crossed in a balanced
X, with distinct grips and clean gaps between the blades
3. top-third — LONGBOW: one tall recurved longbow with a clearly nocked arrow, compressed into
a strong centered silhouette without becoming a generic crossbow
4. top-right — FINESSE: a precise many-pointed target-star or needle-star impulse with a small
controlled center and four stronger cardinal points, expressing accuracy and critical mastery
5. bottom-left — TEMPEST: three parallel aggressive diagonal storm-slashes, tapered and
slightly offset to imply rapid repeated strikes without resembling three separate swords
6. bottom-second — DOMINANCE: a compact radial impact burst with a heavy central core and short
forceful outward fractures, expressing overwhelming area impact rather than fire or sunlight
7. bottom-third — VALOR: a heraldic shield containing one simple upward-pointing martial
chevron or blade motif, expressing guarded retaliation and courage without crowns or text
8. bottom-right — EMPTY: no mark, ornament, placeholder, guide, or residual shadow
Visual language: one coherent set of ancient imperial dark-fantasy glyphs from a fallen golden
empire; bold engraved-emblem silhouettes, controlled symmetry where appropriate, strong outer
contours, only a few large interior cutouts, no delicate filigree, and clear semantic separation
between all seven motifs
Mask rendering: each glyph is a single fully opaque warm-white shape on true transparent
alpha; all intended holes and negative spaces are fully transparent; no intentional
semi-transparent shading inside the glyphs, with partial alpha allowed only for minimal clean
edge antialiasing; no material color, gradient, texture, lighting, shadow, glow, outline halo,
ambient occlusion, or background fill
Readability: design for severe downscaling to 24 to 28 pixels; prefer one dominant silhouette
and two or three large internal separations over small detail; maintain at least a robust
medium stroke weight after downscaling
Constraints: icons only; no medallions, circles around the icons, frames, UI tabs, letters,
words, readable runes, numbers, characters, hands, scenery, flames, particles, logos, mockup,
watermark, checkerboard transparency, or visible grid
Avoid: seven unrelated art styles, inconsistent scale, duplicate silhouettes, weapon bundles,
photorealistic objects, painterly color, black backgrounds, clipped shapes, thin scratchy
lines, busy engraving, soft blurry edges, merged neighboring cells, any content in cell eight
```

## 26. Titel-Banner der Screens (9-Slice)

- **Zieldatei:** `public/assets/frames/title-banner.png`
- **Format:** Querformat 4:1, mindestens 2048×512
- **Verwendung:** Banner-Rahmen für Screen-Überschriften; das Asset liegt generiert unter
  der Zieldatei und ist für eine spätere Einbindung vorgehalten.
- **Technik:** Vollständig transparenter Außenbereich und vollständig transparente
  Rahmenöffnung. Die Endstücke liegen in den äußeren Vierteln; lange, gerade, detailarme
  Schienen an Ober- und Unterkante bilden die horizontal streckbare Mitte für unterschiedlich
  lange Titel („Dungeons", „Weapon Mastery"). Der Banner wird bei ungefähr 80 CSS-Pixeln Höhe
  angezeigt.
- **Referenzen:** Für Form und Wirkung der Titelzone
  `concept/ui-draft-2/ui-dungeon-selection-v7.png`; für Metall, Farbe und Alterung
  `public/assets/frames/tab-ornate.png` und `public/assets/frames/panel-ornate.png`.

```text
Use case: stylized-concept
Asset type: reusable horizontal 9-slice ornamental title banner frame for a dark fantasy game UI
Primary request: one wide imperial metal banner frame that surrounds a live centered screen
title, designed to crown the top of every main screen while remaining reusable for titles of
different lengths
Canvas and transparency: exact 4:1 landscape aspect ratio, at least 2048 by 512 pixels; true
transparent alpha outside the ornament and throughout the entire inner opening; preserve a
clear transparent safety margin around every outer point; do not simulate transparency with
black, white, or a checkerboard
Structure: strict left-right symmetry; a shallow elongated banner with bold blackened-iron
rails edged with aged gold; each short end resolves into a sweeping winged or spear-point
finial that tapers outward; small matching points may rise from the top and bottom rails near
the end caps; the silhouette should read as a ceremonial imperial title plaque from a fallen
golden empire
9-slice requirements: keep all distinctive end-cap and finial construction inside the outer
left and right quarters of the canvas; make the middle half of the top and bottom rails
straight, horizontal, continuous, and deliberately low-detail so it can stretch without
visible distortion; keep the inner opening broad and unobstructed; no crest, medallion, or
ornament may sit on or cross the center of the rails or the opening
Frame style: heavy stone-carved imperial metalwork, dark aged brass and blackened iron with
restrained warm gold highlights (#8a6d3b to #fbbf24), subtle worn edges, and only tiny
ember-orange reflections (#e25822); noble, martial, and mysterious rather than luxurious
Composition and readability: front-facing orthographic presentation with no perspective; bold
continuous rails, large calm shapes, crisp alpha edges, and enough visual weight to remain
recognizable when the complete banner is only about 80 CSS pixels high
Lighting and states: neutral canonical metal under controlled warm edge light; no baked glow,
hover state, focus ring, selection flare, cast shadow, or dark interior fill because all
states and surfaces will be rendered separately with CSS
Rendering style: polished game UI asset, crisp vector-like contours with restrained painterly
worn-metal texture, matching the project's Gilded Ruins visual language
Constraints: frame only; no text, letters, readable runes, numbers, skull, crown, character,
scenery, background panel, interior texture, particles, flames, lens flare, bloom haze, logo,
interface mockup, or watermark
Avoid: a centered crest that blocks the stretchable middle, thin filigree, asymmetry, broken
rails, large curls, excessive spikes, bright solid-gold metal, colored gemstones, separate
state versions, multiple frames in one image, mockup presentation
```

## 27. Dungeon-Tor-Illustrationen (vier Varianten)

- **Zieldateien:** `public/assets/gates/gate-open.png`,
  `public/assets/gates/gate-locked.png`, `public/assets/gates/gate-boss-open.png`,
  `public/assets/gates/gate-boss-locked.png`
- **Format:** je Hochformat 3:4, mindestens 768×1024, freigestellt auf transparentem
  Hintergrund
- **Verwendung:** Wiederverwendete Tor-Kacheln der Dungeon-Auswahl; jede Kachel zeigt genau
  eine Variante als `<img>`. Dungeon 1–4 eines Akts nutzen das normale Tor, Dungeon 5 das
  Boss-Tor; der Freischalt-Zustand wählt zwischen offener und verschlossener Variante. Labels,
  Auswahl-Glow, Hover und Fokus bleiben Live-UI (CSS).
- **Technik:** Alle vier Varianten teilen Stil, Perspektive, Bodenlinie und optische Größe
  innerhalb der Leinwand, damit die Kacheln in einer Reihe ruhig nebeneinanderstehen. Der
  Ember-Glow ist ausschließlich in den offenen Varianten eingebacken; Ketten und
  Schloss-Medaillon ausschließlich in den verschlossenen Varianten. Angezeigt bei ungefähr
  140–190 CSS-Pixeln Breite.
- **Referenzen:** Für Tor-Aufbau, Glut und Ketten `concept/ui-draft-2/ui-dungeon-selection-v7.png`;
  für Material und Palette `public/assets/backgrounds/dungeon-ashen-depths.png`.

Gemeinsamer Familien-Block, der jedem der vier Prompts vorangestellt wird:

```text
Use case: stylized-concept
Asset type: free-standing dungeon gate illustration for a dark fantasy game UI, one of a
consistent family of four
Canvas and transparency: exact 3:4 portrait aspect ratio, at least 768 by 1024 pixels; true
transparent alpha everywhere outside the gate silhouette; the gate stands free on a shallow
rocky base that fades out before the canvas edges; do not simulate transparency with black,
white, or a checkerboard
Family consistency: all four gates share the same front-facing orthographic presentation, the
same ground line, the same optical size inside the canvas, and the same material language of
ancient blackened stone, dark aged brass, and restrained gold accents (#8a6d3b to #fbbf24);
imperial dark-fantasy architecture of a fallen golden empire, noble and ominous
Composition and readability: one single gate centered in the canvas, bold silhouette, large
calm shapes, crisp alpha edges, readable at about 150 CSS pixels width
Rendering style: polished painterly game UI asset with crisp contours, matching the project's
Gilded Ruins visual language
Constraints: gate only; no characters, text, letters, readable runes, numbers, interface
elements, logo, mockup presentation, or watermark
Avoid: photorealism, perspective distortion, busy micro-detail, baked selection or hover
effects, multiple gates in one image, checkerboard transparency
```

Variantenspezifische Ergänzungen:

```text
gate-open.png — Primary request: the standard dungeon gate, unlocked and inviting descent; a
tall arched stone portal with brass fittings; the archway stands open and a warm ember glow
(#e25822 to #ff8a4d) radiates from inside the passage, spilling soft embers and heat light
onto the threshold; the glow is part of the artwork; mood: dangerous invitation
```

```text
gate-locked.png — Primary request: the same standard dungeon gate as the open variant, sealed
and dormant; the archway is closed by a dark iron portcullis or door; heavy iron chains are
draped across the front and meet in a circular brass lock medallion at the lower center of the
gate; the passage is dark and cold with no inner glow; mood: silent refusal
```

```text
gate-boss-open.png — Primary request: the act's final boss gate, unlocked; visibly grander and
more threatening than the standard gate while keeping the same optical size; a taller crowned
arch with a skull or crown motif worked into the stone above the apex; the archway stands open
with a stronger ember glow (#e25822 to #ff8a4d) burning from inside; mood: throne-room menace
```

```text
gate-boss-locked.png — Primary request: the same boss gate as the open variant, sealed; the
crowned arch is closed by a dark iron door; heavy iron chains cross the front and meet in a
circular brass lock medallion at the lower center; the passage is dark and cold with no inner
glow; mood: forbidden threshold
```

## 28. Ornament-Button-Rahmen (9-Slice)

- **Zieldatei:** `public/assets/frames/button-ornate.png`
- **Format:** Querformat 2:1, mindestens 1536×768
- **Verwendung:** Rahmen der `Button`-Variante `ornate` für primäre Screen-Aktionen
  („Enter Dungeon"). Beschriftung, Füllung und alle Interaktionszustände bleiben
  Live-UI (CSS).
- **Technik:** Vollständig transparenter Außenbereich und vollständig transparente
  Rahmenöffnung; die CSS-Füllung (dunkle Fläche mit Ember-Schimmer, goldene Beschriftung)
  liegt hinter dem Rahmen, dessen Zeichnung sich davon abheben muss. Endstücke in den äußeren Vierteln; gerade,
  detailarme Schienen bilden die streckbare Mitte. Der Rahmen wird bei ungefähr 52 CSS-Pixeln
  Höhe angezeigt.
- **Referenzen:** Für Form und Wirkung der Button-Zone
  `concept/ui-draft-2/ui-dungeon-selection-v7.png`; für Metall, Farbe und Alterung
  `public/assets/frames/tab-ornate.png`.

```text
Use case: stylized-concept
Asset type: reusable horizontal 9-slice ornamental button frame for a dark fantasy game UI
Primary request: one compact imperial metal frame for the primary action button of a game
screen, designed to sit on top of a dark ember-lit fill rendered separately in CSS and to stay
reusable for labels of different lengths
Canvas and transparency: exact 2:1 landscape aspect ratio, at least 1536 by 768 pixels; true
transparent alpha outside the ornament and throughout the entire inner opening; preserve a
clear transparent safety margin around every outer point; do not simulate transparency with
black, white, or a checkerboard
Structure: strict left-right symmetry; a slender rectangular frame with bold blackened-iron
rails edged with aged gold; each short end carries one compact pointed or bracket-shaped end
cap; small matching studs or points may sit on the rails near the end caps; the silhouette
should read as the forged bezel of a royal command seal
9-slice requirements: keep all distinctive end-cap construction inside the outer left and
right quarters of the canvas; make the middle half of the top and bottom rails straight,
horizontal, continuous, and deliberately low-detail so it can stretch without visible
distortion; keep the inner opening broad and unobstructed; no ornament may cross the opening
Frame style: dark aged brass and blackened iron with restrained warm gold highlights (#8a6d3b
to #fbbf24); the rails must keep enough contrast and visual weight to stay clearly readable in
front of a dark ember-lit interior fill (deep surface tones warmed by #e25822) as well as in
front of dark scenery; noble, martial, and mysterious rather than luxurious
Composition and readability: front-facing orthographic presentation with no perspective; bold
continuous rails, large calm shapes, crisp alpha edges, and enough visual weight to remain
recognizable when the complete frame is only about 52 CSS pixels high
Lighting and states: neutral canonical metal under controlled warm edge light; no baked glow,
hover state, focus ring, pressed state, selection flare, cast shadow, or interior fill because
all states and surfaces will be rendered separately with CSS
Rendering style: polished game UI asset, crisp vector-like contours with restrained painterly
worn-metal texture, matching the project's Gilded Ruins visual language
Constraints: frame only; no text, letters, readable runes, numbers, skull, crown, character,
scenery, background panel, interior texture, particles, flames, lens flare, bloom haze, logo,
interface mockup, or watermark
Avoid: thick heavy borders that shrink the label area, thin filigree, asymmetry, broken rails,
large curls, excessive spikes, bright solid-gold metal, colored gemstones, separate state
versions, multiple frames in one image, mockup presentation
```

## 29. Crucible-Tree-Tab-Icon-Sheet

- **Zielrohdatei:** `concept/ui-draft-2/crucible-tab-icons-sheet.png`
- **Format:** exakt 2048×512 mit transparentem Hintergrund; unsichtbares 4×1-Raster aus
  512×512 großen Feldern
- **Verwendung:** Gemeinsame Produktionsgrundlage für drei stilistisch konsistente
  Crucible-Tree-Tab-Icons. Das Sheet wird nicht direkt in der Anwendung verwendet.
- **Kachelreihenfolge:** `Anvil Sparks`, `Smelting Flames`, `Molten Cast`, leeres Feld.
- **Aufbereitung:** Die drei belegten Felder werden ohne kreative Umgestaltung an den exakten
  Viertelgrenzen ausgeschnitten und als Alpha-Masken unter `public/assets/icons/crucible/`
  abgelegt. Jede Glyphe muss deshalb innerhalb einer zentralen 384×384-Sicherheitszone liegen.
- **Referenz:** Stilfamilie wie das Weapon-Mastery-Sheet (§25,
  `concept/ui-draft-2/weapon-mastery-tab-icons-sheet.png`) — gleiche Strichstärke,
  optische Größe und Formensprache, damit beide Icon-Familien in denselben Tabs bestehen.

```text
Use case: stylized-concept
Asset type: production icon sheet containing three monochrome alpha-mask glyphs for dark
fantasy Crucible skill tree tabs
Primary request: create one internally consistent family of three bold imperial forge
symbols that remains unmistakable at only 24 to 28 CSS pixels; the symbols will later be
cut into individual square PNG files and recolored through CSS masks
Canvas and grid: exact 2048 by 512 pixel transparent canvas, divided conceptually into an
invisible four-column by one-row grid of exact 512 by 512 pixel cells; do not draw grid
lines, cell borders, guides, labels, captions, numbers, or tile backgrounds; keep the
fourth and final right cell completely empty and transparent
Placement and safe area: center exactly one symbol in each occupied cell; every visible
pixel of each symbol must remain inside the central 384 by 384 pixel safe area of its
cell; use the same optical size, line weight, visual density, orientation logic, and
amount of negative space for all three symbols; symbols must never touch, overlap, or
extend into neighboring cells
Fixed left-to-right order and motifs:
1. first cell — ANVIL SPARKS: one heavy flat-topped blacksmith anvil in strict side view,
with a broad level working face, one pointed horn, and a compact waisted base; a small
controlled burst of three to five short spark strokes rises just above the face,
expressing the first awakening strike without any hammer
2. second cell — SMELTING FLAMES: one wide shallow smelting vat in strict front view, a
heavy open crucible basin with a thick reinforced rim, two stubby side lugs or handles,
and a completely plain smooth body and base without any holes, dots, studs, or rivets;
three to four bold tongues of flame rise from inside the rim in a calm symmetric
cluster, expressing contained refining heat rather than wildfire
3. third cell — MOLTEN CAST: one heavy open casting mould shown from the side, a low
rectangular mould block resting on the ground in the same strict orthographic side
elevation as the anvil; above it a compact tilted pouring crucible releases one short
thick stream of molten metal falling into the open top of the mould, with a small
controlled splash of two or three round drops at the impact point; the visible long
side of the mould block carries a clean sword-shaped cavity as a fully transparent
stencil-like cutout through blade, guard, and grip, the blade lying horizontal with
the tip toward one end, so the block is unmistakably a sword mould; the block face is
otherwise completely plain without corner holes, pins, bolts, or rivets; the whole
glyph expresses liquid metal committed to a decisive new form
Visual language: one coherent set of ancient imperial dark-fantasy forge glyphs from a
fallen golden empire, in the same family as the existing Weapon Mastery tab glyphs; bold
engraved-emblem silhouettes, controlled symmetry where appropriate, strong outer
contours, only a few large interior cutouts, no delicate filigree, and clear semantic
separation between all three motifs
Mask rendering: each glyph is a single fully opaque warm-white shape on true transparent
alpha; all intended holes and negative spaces are fully transparent; no intentional
semi-transparent shading inside the glyphs, with partial alpha allowed only for minimal
clean edge antialiasing; no material color, gradient, texture, lighting, shadow, glow,
outline halo, ambient occlusion, or background fill
Readability: design for severe downscaling to 24 to 28 pixels; prefer one dominant
silhouette and two or three large internal separations over small detail; maintain at
least a robust medium stroke weight after downscaling
Constraints: icons only; no medallions, circles around the icons, frames, UI tabs,
letters, words, readable runes, numbers, characters, hands, hammers, scenery, smoke,
particles beyond the named sparks and drops, logos, mockup, watermark, checkerboard
transparency, or visible grid
Avoid: three unrelated art styles, inconsistent scale, duplicate silhouettes, a lava
puddle leaking from the mould base, a top-down view of the mould, an upright mould
slab facing the viewer, corner pin holes, rivet dots, or bolt heads on the mould block
or the vat, photorealistic objects,
painterly color, black backgrounds, clipped shapes, thin scratchy lines, busy
engraving, soft blurry edges, merged neighboring cells, any content in cell four
```

### Edit-Prompt: Bottich säubern und Gussform neu aufbauen

- **Eingabe:** das bestehende `concept/ui-draft-2/crucible-tab-icons-sheet.png` mit hochladen
- **Zieldatei:** ersetzt `concept/ui-draft-2/crucible-tab-icons-sheet.png` (gleiche Maße
  und Rasterung beibehalten)
- **Zweck:** Der Amboss (Zelle 1) ist abgenommen. Am Bottich (Zelle 2) stören die drei
  Löcher im Fußband. Die Gussform (Zelle 3) liest sich als von oben betrachtete, flach
  liegende Platte mit Passstift-Löchern in den Ecken; sie soll stattdessen als liegender
  Formkasten in Seitenansicht stehen, in den ein gekippter Gießtiegel von oben eingießt,
  mit der Schwertkavität als schablonenartiger Durchbrechung in der sichtbaren Längsseite.

```text
Edit this icon sheet of three monochrome alpha-mask glyphs on a transparent 2048 by 512
canvas with an invisible four-column grid of 512 by 512 pixel cells. Keep the overall
style, the fully opaque warm-white mask rendering on true transparent alpha, the shared
optical size, line weight, and safe-area placement, and keep the fourth cell completely
empty.
Cell one (anvil with sparks): keep exactly as it is, unchanged.
Cell two (smelting vat with flames): keep the vat, handles, and flames unchanged; only
remove the three holes from the band at the base of the vat so the body and base are
completely plain and smooth.
Cell three (casting mould): rebuild this glyph. Replace the flat top-down slab with a
heavy open casting mould shown from the side, in the same strict orthographic side
elevation as the anvil: a low rectangular mould block resting on the ground, and above
it a compact tilted pouring crucible releasing one short thick stream of molten metal
that falls into the open top of the mould, with a small controlled splash of two or
three round drops at the impact point. The visible long side of the mould block
carries a clean sword-shaped cavity as a fully transparent stencil-like cutout through
blade, guard, and grip, the blade lying horizontal with the tip toward one end, so the
block is unmistakably a sword mould. The block face is otherwise completely plain
without corner holes, pins, bolts, or rivets. Bold
engraved-emblem silhouette, strong outer contour, no delicate filigree, readable at 24
to 28 pixels. No text, frames, grid lines, color, gradients, shadows, glow, or
watermark anywhere on the sheet.
```

## 30. Akt-Bannerrahmen (9-Slice, vertikal)

- **Zieldatei:** `public/assets/frames/banner-act.png`
- **Format:** Hochformat 3:4, mindestens 1152×1536
- **Verwendung:** Gemeinsamer Rahmen der Akt-Banner in der Dungeon-Auswahl. Ein Asset trägt
  alle Akte; Akt-Szenerie (`backgrounds/dungeon-*.png`), Label, Name, Schloss-Medaillon,
  Selektions-Glow und alle Interaktionszustände bleiben Live-UI (CSS).
- **Technik:** Vollständig transparenter Außenbereich und vollständig transparente
  Rahmenöffnung, einschließlich des Bereichs innerhalb der unteren Spitze — die
  CSS-Bildfläche folgt der Spitze über ein `clip-path`-Polygon. Kopfschiene mit Finials
  vollständig im oberen Viertel, Schwanzspitze vollständig im unteren Viertel; die mittlere
  Hälfte der linken und rechten Schiene ist gerade, vertikal und detailarm und bildet die
  vertikal streckbare Mitte. Die Spitze ist ein breiter, flacher Chevron: Ober- und
  Unterkante werden horizontal gestreckt, und ein flacher Winkel bleibt dabei formtreu.
  Angezeigt bei ungefähr 230–290 CSS-Pixeln Breite.
- **Referenzen:** Für Form, Aufhängung und Proportionen
  `concept/ui-draft-2/ui-dungeon-selection-v5.png`; für Metall, Farbe und Alterung
  `public/assets/frames/tab-ornate.png` und `public/assets/frames/panel-ornate.png`.

```text
Use case: stylized-concept
Asset type: reusable vertical 9-slice ornamental banner frame for a dark fantasy game UI
Primary request: one hanging imperial banner frame that surrounds a live portrait content area,
designed to present one act of a game campaign and to stay reusable for several acts and all
interaction states
Canvas and transparency: exact 3:4 portrait aspect ratio, at least 1152 by 1536 pixels; true
transparent alpha outside the ornament and throughout the entire inner opening, including the
area inside the lower point; preserve a clear transparent safety margin around every outer
point so the outward-reaching finials stay inside the canvas; do not simulate transparency with
black, white, or a checkerboard
Structure: strict left-right symmetry; a tall rectangular banner suspended from a horizontal
ornamental head rail whose ends resolve into compact finials that reach outward past the
banner body; bold blackened-iron side rails edged with aged gold run down both long edges; the
lower end closes as one broad shallow chevron point; small matching studs or points may sit on
the side rails near the head and near the point; the silhouette should read as the forged
standard of a fallen golden empire, hanging in a hall
9-slice requirements: keep all distinctive head-rail and finial construction inside the upper
quarter of the canvas and all point construction inside the lower quarter; make the middle half
of the left and right side rails straight, vertical, continuous, and deliberately low-detail so
it can stretch vertically without visible distortion; keep the horizontal center of the head
rail and of the lower point calm and low-detail so a modest horizontal scale change stays
invisible; carry the visual weight of the head in the corners and finials rather than in a
large centered crest; keep the inner opening broad and unobstructed; no ornament may cross the
opening
Frame style: heavy stone-carved imperial metalwork, dark aged brass and blackened iron with
restrained warm gold highlights (#8a6d3b to #fbbf24), subtle worn edges, and only tiny
ember-orange reflections (#e25822); noble, martial, and mysterious rather than luxurious
Composition and readability: front-facing orthographic presentation with no perspective; bold
continuous rails, large calm shapes, crisp alpha edges, and enough visual weight to remain
recognizable when the complete banner is only about 260 CSS pixels high; prioritize silhouette
and material separation over micro-detail
Lighting and states: neutral canonical metal under controlled warm edge light; no baked glow,
hover state, focus ring, selection flare, ember rim light, cast shadow, lock, chain, emblem, or
interior fill because all states, artwork, and surfaces will be rendered separately with CSS
Rendering style: polished game UI asset, crisp vector-like contours with restrained painterly
worn-metal texture, matching the project's Gilded Ruins visual language
Constraints: frame only; no text, letters, readable runes, numbers, cross, sunburst, skull,
crown, lock, chain, rope, character, scenery, background panel, interior texture, cloth folds,
fabric weave, particles, flames, lens flare, bloom haze, logo, interface mockup, or watermark
Avoid: a long needle-like tail, a centered crest that blocks the stretchable middle, thin
filigree, asymmetry, broken rails, large curls, excessive spikes, bright solid-gold metal,
colored gemstones, painted cloth banner instead of a metal frame, separate state versions,
multiple banners in one image, mockup presentation
```

## 31. Blacksmith-View-Hintergrund — Die Schmiede

- **Zieldatei:** `public/assets/backgrounds/blacksmith-view.png` (oder `.webp`)
- **Format:** Querformat 16:9, mindestens 2560×1440
- **Verwendung:** Vollflächiger Hintergrund der gesamten Blacksmith-Ansicht hinter Überschrift,
  Gold/Cinder-Bestand, Service-Tabs (Temper, Masterwork, Brand), Slot-Liste, Werkstück-Bühne
  und Dienst-Panel. Das Bild wird per `background-size: cover` eingesetzt. Esse und Amboss
  bleiben auch bei engerem Crop das zentrale Motiv; die UI-relevanten Bereiche sind dunkel
  und kontrastarm gehalten.

```text
Use case: stylized-concept
Asset type: full-screen dark fantasy game UI background
Primary request: an ancient imperial blacksmith workshop as the defining visual heart of
the Blacksmith view, where armor recovered from the depths is tempered, reforged into
higher rarities, and branded — a working forge of a fallen golden empire, alive again
Scene/backdrop: a vaulted stone forge-hall carved into the ruins of a golden empire, built
around one broad blackened-iron forge hearth with banked glowing coals and a massive
scarred anvil on a low stone dais before it; behind and beside them, heavy soot-darkened
masonry, cracked pillars with tarnished gold inlays, hanging tongs and hammers as quiet
silhouettes, a stone quenching trough, and racks of half-finished armor plates receding
into the surrounding darkness
Subject: the forge hearth and anvil together form one unmistakable focal group; the hearth
glows with contained banked coals rather than open fire, and the anvil is heavy, worn, and
clearly in use — the workshop feels ancient, functional, and dignified rather than
decorative or abandoned
Style/medium: cinematic painterly dark fantasy environment concept art with restrained
detail and strong silhouettes, matching the project's heavy stone-carved imperial style and
gilded ruins mood — noble and mysterious, never hopeless
Composition/framing: wide 16:9 landscape background for a responsive game screen; place the
forge hearth and anvil in the lower central third, large enough to remain the clear focal
point but low enough that UI panels can occupy the middle of the screen; preserve a broad,
dark, low-detail field across the central and upper-middle area for service tabs, a slot
list on the left, an item stage in the center, and an action panel on the right; keep the
upper-left corner especially calm for the live "Blacksmith" heading and resource display;
distribute secondary workshop elements symmetrically toward the outer edges; crop-safe from
wide desktop down to roughly 4:5 mobile, with hearth and anvil remaining recognizable near
the center
Lighting/mood: the only strong light rises from the banked coals of the hearth, casting a
controlled ember glow onto the anvil, the nearest floor slabs, and the lower edges of the
pillars; sparse drifting sparks and fine ash catch the light; the rest of the hall stays in
cool shadow with soft atmospheric depth
Color palette: dominant deep blue-black and cool slate shadows (#0f172a), blackened iron,
tarnished brass and aged gold (#8a6d3b to #fbbf24), concentrated ember orange (#e25822) and
restrained amber highlights (#f59e0b)
Materials/textures: soot-darkened stone, forged black iron, worn gold inlays, glowing
coals, scorched wood, aged leather straps, fine ash and subtle smoke haze
Constraints: prioritize UI readability; keep most of the image dark and low-contrast
outside the hearth glow; retain enough negative space for large opaque or translucent
panels; no border or frame; no text, letters, readable runes, icons, characters, logos,
interface elements, or watermark
Avoid: a blacksmith figure or any hands at work, one large centered weapon, open
wall-to-wall flames, bright orange full-frame lighting, excessive bloom or sparks, busy
foreground clutter, modern industrial machinery, horror imagery, photorealistic photography
```

## 32. Jeweler-View-Hintergrund — Die Juwelierwerkstatt

- **Zieldatei:** `public/assets/backgrounds/jeweler-view.png` (oder `.webp`)
- **Format:** Querformat 16:9, mindestens 2560×1440
- **Verwendung:** Vollflächiger Hintergrund der gesamten Jeweler-Ansicht hinter Überschrift,
  Gem-Beständen, Service-Tabs (Inlay, Attune, Recut), Slot-Liste, Werkstück-Bühne und
  Dienst-Panel. Das Bild wird per `background-size: cover` eingesetzt. Werkbank und
  Schleifrad bleiben auch bei engerem Crop das zentrale Motiv; die UI-relevanten Bereiche
  sind dunkel und kontrastarm gehalten.

```text
Use case: stylized-concept
Asset type: full-screen dark fantasy game UI background
Primary request: an ancient imperial jeweler's workshop as the defining visual heart of
the Jeweler view, where gems recovered from the depths are cut, set into armor sockets,
attuned, and recut — a precise lapidary atelier of a fallen golden empire, alive again
Scene/backdrop: a vaulted stone atelier carved into the ruins of a golden empire, built
around one heavy gem-cutter's workbench of dark stone and blackened iron with a brass
lapidary wheel and a gold-rimmed magnifying lens suspended above it on an articulated
arm; behind and beside it, soot-darkened masonry, cracked pillars with tarnished gold
inlays, wall shelves with small brass trays and bowls holding uncut gems in amber, deep
ruby red, sapphire blue, and emerald green, fine tongs and engraving tools resting as
quiet silhouettes, and one small locked crystal case holding a single pale diamond,
receding into the surrounding darkness
Subject: the workbench with its lapidary wheel and hanging lens forms one unmistakable
focal group; a few cut gems lie on the bench catching the light, and the wheel and tools
are worn and clearly in use — the atelier feels ancient, functional, and dignified rather
than decorative or abandoned
Style/medium: cinematic painterly dark fantasy environment concept art with restrained
detail and strong silhouettes, matching the project's heavy stone-carved imperial style and
gilded ruins mood — noble and mysterious, never hopeless
Composition/framing: wide 16:9 landscape background for a responsive game screen; place the
workbench with wheel and lens in the lower central third, large enough to remain the clear
focal point but low enough that UI panels can occupy the middle of the screen; preserve a
broad, dark, low-detail field across the central and upper-middle area for service tabs, a
slot list on the left, an item stage in the center, and an action panel on the right; keep
the upper-left corner especially calm for the live "Jeweler" heading and gem inventory
display; distribute secondary workshop elements symmetrically toward the outer edges;
crop-safe from wide desktop down to roughly 4:5 mobile, with workbench and wheel remaining
recognizable near the center
Lighting/mood: the only strong light is a low shielded lamp glow at the workbench, casting
a controlled warm light onto the wheel, the lens, and the nearest floor slabs; the gems on
the bench and in the trays answer with small, dim colored glints of amber, ruby, sapphire,
and emerald; fine dust catches the light; the rest of the atelier stays in cool shadow
with soft atmospheric depth
Color palette: dominant deep blue-black and cool slate shadows (#0f172a), blackened iron,
tarnished brass and aged gold (#8a6d3b to #fbbf24), restrained amber highlights (#f59e0b),
sparse ember orange (#e25822), and small localized jewel accents of ruby red, sapphire
blue, and emerald green that stay subordinate to the warm gold light
Materials/textures: soot-darkened stone, forged black iron, worn gold inlays, polished
brass, faceted crystal and raw gemstone, velvet-lined trays, aged leather tool rolls, fine
dust haze
Constraints: prioritize UI readability; keep most of the image dark and low-contrast
outside the workbench light; keep every colored gem glint small and localized; retain
enough negative space for large opaque or translucent panels; no border or frame; no text,
letters, readable runes, icons, characters, logos, interface elements, or watermark
Avoid: a jeweler figure or any hands at work, one large centered gemstone, piles of
treasure or coins, a merchant counter or shop display, rainbow or prismatic full-frame
lighting, excessive sparkle and bloom, busy foreground clutter, modern machinery or
optics, horror imagery, photorealistic photography
```

## Hinweise zur Ablage

1. Bild generieren, Datei unter dem genannten Zielpfad ablegen.
2. Im Manifest ([public/assets/MANIFEST.md](../public/assets/MANIFEST.md)) beim
   jeweiligen Eintrag Tool und ggf. abweichenden Prompt ergänzen.
