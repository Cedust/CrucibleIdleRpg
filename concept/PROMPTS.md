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
  zentrale Spitze zeigt nach rechts in den Eintrag hinein.

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

## Hinweise zur Ablage

1. Bild generieren, Datei unter dem genannten Zielpfad ablegen.
2. Im Manifest ([public/assets/MANIFEST.md](../public/assets/MANIFEST.md)) beim
   jeweiligen Eintrag Tool und ggf. abweichenden Prompt ergänzen.
