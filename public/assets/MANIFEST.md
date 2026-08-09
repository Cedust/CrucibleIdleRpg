# MANIFEST.md — Asset-Herkunft und Lizenzen

> Jedes Asset unter `public/assets/` steht hier mit Quelle, Autor und Lizenz
> ([DESIGN.md §5](../../docs/DESIGN.md#5-visuelle-umsetzung)). Neue Assets erhalten beim
> Hinzufügen einen Eintrag.

## Icons

| Datei                                              | Quelle                                                                     | Autor                                | Lizenz                                                    | Bearbeitung                                                                 |
| -------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| [icons/melting-metal.svg](icons/melting-metal.svg) | [game-icons.net](https://game-icons.net/1x1/delapouite/melting-metal.html) | [Delapouite](https://delapouite.com) | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | Hintergrund-Rechteck entfernt, `fill` auf `currentColor` für CSS-Einfärbung |

## Hintergründe

| Datei                                                                        | Quelle                                                                            | Autor       | Lizenz        | Bearbeitung |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------- | ------------- | ----------- |
| [backgrounds/dungeon-ashen-depths.png](backgrounds/dungeon-ashen-depths.png) | KI-generiert (ChatGPT), Prompt: [concept/PROMPTS.md §1](../../concept/PROMPTS.md) | Timo Sudeck | projektintern | —           |

## Rahmen

| Datei                                              | Quelle                                                                  | Autor       | Lizenz        | Bearbeitung                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------------- | ----------- | ------------- | --------------------------------------------------------------------- |
| [frames/panel-ornate.png](frames/panel-ornate.png) | KI-generiert, Prompt: [concept/PROMPTS.md §5](../../concept/PROMPTS.md) | Timo Sudeck | projektintern | Auf die Ornament-Bounding-Box zugeschnitten (1137×987, 9-Slice-Basis) |

## Portraits

| Datei                                        | Quelle                                                                            | Autor       | Lizenz        | Bearbeitung |
| -------------------------------------------- | --------------------------------------------------------------------------------- | ----------- | ------------- | ----------- |
| [portraits/korvin.png](portraits/korvin.png) | KI-generiert (ChatGPT), Prompt: [concept/PROMPTS.md §2](../../concept/PROMPTS.md) | Timo Sudeck | projektintern | —           |
| [portraits/rhaya.png](portraits/rhaya.png)   | KI-generiert (ChatGPT), Prompt: [concept/PROMPTS.md §3](../../concept/PROMPTS.md) | Timo Sudeck | projektintern | —           |
| [portraits/quinn.png](portraits/quinn.png)   | KI-generiert (ChatGPT), Prompt: [concept/PROMPTS.md §4](../../concept/PROMPTS.md) | Timo Sudeck | projektintern | —           |

KI-generierte Hintergründe und Portraits nennen als Quelle das Generierungstool und
verweisen auf den Prompt in [concept/PROMPTS.md](../../concept/PROMPTS.md).

## Schriften (npm-Pakete, im Bundle)

| Schrift         | Paket                         | Autor            | Lizenz                                     |
| --------------- | ----------------------------- | ---------------- | ------------------------------------------ |
| Cinzel Variable | `@fontsource-variable/cinzel` | Natanael Gama    | [SIL OFL 1.1](https://openfontlicense.org) |
| Inter Variable  | `@fontsource-variable/inter`  | Rasmus Andersson | [SIL OFL 1.1](https://openfontlicense.org) |
