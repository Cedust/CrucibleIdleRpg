# 016 — Molten Cast Vertiefungen

| Feld             | Wert      |
| ---------------- | --------- |
| **Status**       | `blocked` |
| **Meilenstein**  | M2        |
| **Hängt ab von** | 015       |

## Ziel

Die vier Molten-Cast-Vertiefungen Ambush, Menace, Momentum und Second Wind werden kaufbar und
verändern ihre jeweiligen Kampfhebel deterministisch.

## Nicht-Ziel

Keine neuen Nodes, Trees oder Respec-Regeln. Der Katalog, die Kostenfunktion, beide Respecs und
die vier Basiswirkungen stehen aus [015](015-crucible-und-signatur-skills.md) bereits.

## Blockiert durch

[015](015-crucible-und-signatur-skills.md) — Katalog, Kostenfunktion, Persistenz und die vier
Molten-Basisnodes müssen gemergt sein, bevor die Vertiefungen daran anschließen können.

## Verbindliche Spec-Anker

- [Molten-Cast-Vertiefungen](../../spec/SIGNATURES.md#2-molten-cast-vertiefungen) — Wirkung,
  Reihenfolge und Test-Vektoren der vier Nodes
- [Ambush](../../spec/SIGNATURES.md#21-ambush-nach-sunder) — `5/10/15/20/25 %` finaler
  ausgehender Schaden in Runde 1, für alle charaktererzeugten Treffer einschließlich Counter
- [Menace](../../spec/SIGNATURES.md#22-menace-nach-mitigation) — relative Accuracy-Minderung vor
  Evasion, solange Korvin bei Angriffsbeginn lebt
- [Momentum](../../spec/SIGNATURES.md#23-momentum-nach-suppression) — `min(r − 1, Rang)`
  Initiative bei der Queue-Erzeugung in Runde `r`
- [Second Wind](../../spec/SIGNATURES.md#24-second-wind-nach-rally) — einmal pro Dungeon teamweit,
  fester Team-Reihenfolge-Tiebreak
- [Molten Cast](../../spec/PROGRESSION.md#33-molten-cast) — Rangwerte und die Voraussetzung Rang 1
  des zugeordneten Basisnodes
- [Twin Echo](../../spec/WEAPON-MASTERY.md#52-twin-blades--rhaya) — sichtbare Umbenennung des
  Grandmaster-Nodes bei unverändertem Identifier `weapon.second-wind`
- [Kapazität und Save-Migration](../../spec/PROGRESSION.md#35-kapazität-und-save-migration) — die
  aktive Kapazität steigt auf `190` Crystals

## Akzeptanzkriterien

- [ ] Jede Vertiefung ist erst ab Rang 1 ihres Basisnodes kaufbar: Sunder → Ambush,
      Mitigation → Menace, Suppression → Momentum, Rally → Second Wind
- [ ] Ambush erhöht nur in Runde 1 den finalen ausgehenden Schaden aller charaktererzeugten
      Treffer einschließlich Multi Hit, Splash, Mastery-Treffer und Counter; ab Runde 2 ist der
      Multiplikator neutral
- [ ] Menace mindert die Accuracy eines Gegnerangriffs relativ, bevor Evasion angewandt wird, und
      nur solange Korvin bei Angriffsbeginn lebt
- [ ] Momentum vergibt bei der Queue-Erzeugung `min(r − 1, Rang)` Initiative an lebende
      Charaktere, cappt am Rang und verändert keine persistierten Stats
- [ ] Second Wind verhindert einmal pro Dungeon-Run den ersten tödlichen Treffer teamweit; bei
      mehreren tödlichen Ergebnissen desselben Angriffs verbraucht der erste Charakter in fester
      Team-Reihenfolge die Auslösung
- [ ] Der Molten-Respec erstattet die Vertiefungen mit; die Basisnodes bleiben in derselben
      atomaren Operation
- [ ] Der Weapon-Mastery-Grandmaster-Node von Rhaya heißt sichtbar `Twin Echo`; der persistierte
      Identifier bleibt `weapon.second-wind` und Spielstände laden unverändert
- [ ] Unit-Tests decken die Runde-1-Grenze von Ambush, den Momentum-Cap samt Queue-Neuberechnung,
      die Menace-Reihenfolge vor Evasion und den einmaligen dungeonweiten Second-Wind-Verbrauch
      deterministisch ab

## Betroffene Dateien

- `src/game/crucible/` — Rangwerte und Voraussetzungen der vier Vertiefungen
- `src/features/combat/` — Schadensabschluss, Trefferchance, Queue-Erzeugung und Todesauflösung
- `src/game/weaponMastery/mastery.ts` — Anzeigename `Twin Echo`

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
