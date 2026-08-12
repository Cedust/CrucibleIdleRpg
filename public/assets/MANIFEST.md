# MANIFEST.md — Asset-Herkunft und Lizenzen

> Jedes Asset unter `public/assets/` steht hier mit Quelle, Autor und Lizenz
> ([DESIGN.md §5](../../docs/DESIGN.md#5-visuelle-umsetzung)). Neue Assets erhalten beim
> Hinzufügen einen Eintrag.

## Icons

| Datei                                                  | Quelle                                                                             | Autor                                | Lizenz                                                    | Bearbeitung                                                                 |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| [icons/melting-metal.svg](icons/melting-metal.svg)     | [game-icons.net](https://game-icons.net/1x1/delapouite/melting-metal.html)         | [Delapouite](https://delapouite.com) | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | Hintergrund-Rechteck entfernt, `fill` auf `currentColor` für CSS-Einfärbung |
| [icons/crucible-emblem.png](icons/crucible-emblem.png) | KI-generiert (ChatGPT), Prompt: [concept/PROMPTS.md §10](../../concept/PROMPTS.md) | Timo Sudeck                          | projektintern                                             | —                                                                           |

## Hintergründe

| Datei                                                                        | Quelle                                                                            | Autor       | Lizenz        | Bearbeitung |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------- | ------------- | ----------- |
| [backgrounds/dungeon-ashen-depths.png](backgrounds/dungeon-ashen-depths.png) | KI-generiert (ChatGPT), Prompt: [concept/PROMPTS.md §1](../../concept/PROMPTS.md) | Timo Sudeck | projektintern | —           |
| `backgrounds/dungeon-ember-foundry.png` _(Asset ausstehend)_                 | KI-generiert, Prompt: [concept/PROMPTS.md §12](../../concept/PROMPTS.md)          | Timo Sudeck | projektintern | —           |
| `backgrounds/dungeon-forgotten-citadel.png` _(Asset ausstehend)_             | KI-generiert, Prompt: [concept/PROMPTS.md §13](../../concept/PROMPTS.md)          | Timo Sudeck | projektintern | —           |

## Rahmen

| Datei                                                      | Quelle                                                                             | Autor       | Lizenz        | Bearbeitung                                                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------- | ------------- | --------------------------------------------------------------------- |
| [frames/panel-ornate.png](frames/panel-ornate.png)         | KI-generiert, Prompt: [concept/PROMPTS.md §5](../../concept/PROMPTS.md)            | Timo Sudeck | projektintern | Auf die Ornament-Bounding-Box zugeschnitten (1137×987, 9-Slice-Basis) |
| [frames/panel-thin.png](frames/panel-thin.png)             | KI-generiert (ChatGPT), Prompt: [concept/PROMPTS.md §7](../../concept/PROMPTS.md)  | Timo Sudeck | projektintern | —                                                                     |
| [frames/button-ornate.png](frames/button-ornate.png)       | KI-generiert (ChatGPT), Prompt: [concept/PROMPTS.md §9](../../concept/PROMPTS.md)  | Timo Sudeck | projektintern | —                                                                     |
| [frames/slot-ornate.png](frames/slot-ornate.png)           | KI-generiert (ChatGPT), Prompt: [concept/PROMPTS.md §11](../../concept/PROMPTS.md) | Timo Sudeck | projektintern | —                                                                     |
| [frames/panel-ornate-alt.png](frames/panel-ornate-alt.png) | KI-generiert, Prompt-Basis: [concept/PROMPTS.md §15](../../concept/PROMPTS.md)     | Timo Sudeck | projektintern | Prompt mehrfach iteriert; 1024×1536, alternative Panel-Variante       |
| [frames/mainview-ornate.png](frames/mainview-ornate.png)   | KI-generiert, Prompt: [concept/PROMPTS.md §16](../../concept/PROMPTS.md)           | Timo Sudeck | projektintern | 1024×1536; gemeinsamer Rahmen für Sidebar und Main-Area               |

## Ornamente

| Datei                                                        | Quelle                                                                            | Autor       | Lizenz        | Bearbeitung |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------- | ----------- | ------------- | ----------- |
| [ornaments/divider-ornate.png](ornaments/divider-ornate.png) | KI-generiert (ChatGPT), Prompt: [concept/PROMPTS.md §6](../../concept/PROMPTS.md) | Timo Sudeck | projektintern | —           |
| [ornaments/nav-selection.png](ornaments/nav-selection.png)   | KI-generiert (ChatGPT), Prompt: [concept/PROMPTS.md §8](../../concept/PROMPTS.md) | Timo Sudeck | projektintern | —           |

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
