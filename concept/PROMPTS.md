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

## Hinweise zur Ablage

1. Bild generieren, Datei unter dem genannten Zielpfad ablegen.
2. Im Manifest ([public/assets/MANIFEST.md](../public/assets/MANIFEST.md)) beim
   jeweiligen Eintrag Tool und ggf. abweichenden Prompt ergänzen.
