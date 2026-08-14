# 010 — Ultrawide-Polish & Responsive-E2E

| Feld             | Wert               |
| ---------------- | ------------------ |
| **Status**       | `ready`            |
| **Meilenstein**  | UIF                |
| **Hängt ab von** | 006, 007, 008, 009 |

## Ziel

`e2e/responsive.spec.ts` prüft die Responsive-Matrix von 1366×768 bis 3840×2160 strukturell, und
die Clamp-Startwerte sind am echten Bild bei 1440p, Ultrawide und 4K feinjustiert.

## Nicht-Ziel

Screenshot-/Visual-Regression-Infrastruktur bleibt außen vor
([FOUNDATION §11](FOUNDATION.md#11-teststrategie)); Cleanup und Style-Guide-Finalisierung liegen
in [011](011-cleanup-und-styleguide.md).

## Blockiert durch

[006](006-screen-dungeon-selection.md), [007](007-screen-crucible.md),
[008](008-screen-weapon-mastery.md), [009](009-screen-dungeon-run.md) — alle Screens müssen auf
dem neuen Contract stehen.

## Verbindliche Spec-Anker

- [FOUNDATION §2](FOUNDATION.md#2-responsive-mechanik) — Clamp-Muster und Stützstellen
  (1920 / 2560 / 3840; 3440 = 2560-Äquivalent)
- [FOUNDATION §8](FOUNDATION.md#8-responsive-validierungsmatrix) — verbindliche Prüfmatrix
- [Weapon Mastery §7](../../spec/WEAPON-MASTERY.md#7-weapon-mastery-ansicht) — 1080p-Contract als
  untere Referenz

## Akzeptanzkriterien

- [ ] `e2e/responsive.spec.ts` deckt die Matrix aus FOUNDATION §8 ab: je Auflösung kein
      `html`-/`main`-Scroll, funktionierende lokale Scroller, zentrierte Caps
- [ ] Computed-Style-Assertions an den Stützstellen prüfen die Clamp-Tokens (u. a. `w-nav`,
      `--text-sm`) gegen die Solltabelle; 3440×1440 liefert die 2560-Werte
- [ ] Bei 1920×1080 und darunter bleiben alle bestehenden `smoke.spec.ts`-Szenarien unverändert grün
- [ ] Ein visueller Review-Pass bei 1440p, 3440×1440 und 4K ist erfolgt; nachjustierte Clamp-Werte
      sind in `index.css` und [FOUNDATION §4](FOUNDATION.md#4-token-katalog) synchron
- [ ] Optional (nur bei sichtbarem Bedarf im Review): präkomputierte Clamps für die
      9-Slice-Frame-Geometrie und Icon-Größen-Tokens

## Betroffene Dateien

- `e2e/responsive.spec.ts` — neu
- `src/app/index.css` — Feintuning der Clamp-Werte
- `FOUNDATION.md` — Token-Werte nachziehen

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
