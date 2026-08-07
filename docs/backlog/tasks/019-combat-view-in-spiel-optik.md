# 019 — Combat View in Spiel-Optik

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `blocked` |
| **Meilenstein**  | M2.5      |
| **Hängt ab von** | 018       |

## Ziel

Der Kampfbildschirm zeigt einen Dungeon-Hintergrund und statische Portraits für Team und Gegner
und vermittelt Treffer, Schaden und Tod über Animationen und schwebende Schadenszahlen — bei
unverändertem Playback-Takt und unveränderter Kampflogik.

## Nicht-Ziel

Animierte Sprites und Sound liegen außerhalb von M2.5. Die Skill-Tree-Screens ziehen in
[020](020-skill-trees-in-spiel-optik.md) um.

## Blockiert durch

[018](018-ui-primitives-und-app-rahmen.md) — Panel, ScreenLayout und Icon müssen gemergt sein.

## Verbindliche Spec-Anker

- [Playback](../../spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit) — Takt und
  Geschwindigkeitsstufen bleiben die Zeitquelle; Animationen hängen an Events, nicht umgekehrt
- [Visuelle Umsetzung](../../DESIGN.md#5-visuelle-umsetzung) — statische Portraits, Treffer-,
  Schadens- und Todes-Feedback über Animationen und schwebende Schadenszahlen
- [Design-Pillars](../../DESIGN.md#2-design-pillars) — Pillar 2: Lesbarkeit und
  Nachvollziehbarkeit Zug für Zug gehen vor Effekt
- [AGENTS.md](../../../AGENTS.md) — Tokens und Primitives als einzige Styling-Quellen;
  Simulation bleibt frei von DOM und Timern

## Akzeptanzkriterien

- [ ] Jeder Akt-1-Dungeon hat einen zugeordneten Hintergrund; die Zuordnung liegt deklarativ
      im Content unter `src/game/`
- [ ] Team und Gegner erscheinen als Portraits mit sichtbaren Zuständen: am Zug, getroffen,
      gefallen
- [ ] Treffer erzeugen schwebende Schadenszahlen und eine kurze Treffer-Animation, synchron
      zum jeweiligen Kampf-Event und korrekt bei allen Geschwindigkeitsstufen
- [ ] Health- und Ressourcen-Anzeigen sowie TurnOrderBar und CombatLog nutzen die Primitives
      aus 018 und bleiben während des gesamten Kampfs lesbar
- [ ] `prefers-reduced-motion` reduziert die Animationen auf Zustandswechsel ohne Bewegung
- [ ] Kampfverlauf, Events und Save bleiben byte-identisch zu vorher; Component-Tests und
      `npm run test:e2e` sind grün

## Betroffene Dateien

- `src/features/combat/ui/` — TeamPanel, EnemyFormation, TurnOrderBar, CombatLog,
  Treffer-Feedback
- `src/game/` — deklarative Hintergrund-Zuordnung je Dungeon
- `public/assets/` — Hintergründe und Portraits samt Manifest-Einträgen

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
