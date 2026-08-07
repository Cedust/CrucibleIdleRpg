# 014c — Mastery Combat Arts

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Meilenstein**  | M2      |
| **Hängt ab von** | 014b    |

## Ziel

Alle Expert-, Master- und Capstone-Nodes verändern die Kampfauflösung deterministisch und exakt
nach ihrem Weapon-Mastery-Katalog.

## Nicht-Ziel

Crucible-Nodes und Signatur-Skills bleiben in [015](015-crucible-und-signatur-skills.md);
Armor, Blacksmith und Jeweler folgen in M3/M4.

## Verbindliche Spec-Anker

- [Finesse](../../spec/WEAPON-MASTERY.md#41-finesse) — Executioner, Master-Wahl und Overcritical.
- [Tempest](../../spec/WEAPON-MASTERY.md#42-tempest) — Chain-Crits, Retargeting, Bonus-Hits und
  Perfect Cadence.
- [Dominance](../../spec/WEAPON-MASTERY.md#43-dominance) — primäre Zusatzeffekte und Aftershock.
- [Valor](../../spec/WEAPON-MASTERY.md#44-valor) — Counter bei Evasion/Block und Runden-Stacks.
- [Weapon-Disciplines](../../spec/WEAPON-MASTERY.md#5-charakterindividuelle-weapon-disciplines)
  — alle neun charakterindividuellen Verhaltens-Nodes.
- [Charakter-Zug](../../spec/DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden) — dynamische,
  endliche Trefferauflösung und PRNG-Reihenfolge.
- [Kampfzustand](../../spec/WEAPON-MASTERY.md#8-persistenz-und-laufzeitzustand) — Guarded und
  Zeroing bleiben flüchtig.

## Blockiert durch

-

## Akzeptanzkriterien

- [ ] Jede Expert-, Master- und Capstone-Node wirkt ausschließlich nach Kauf und exakt auf ihre
      spezifizierte Trefferklasse.
- [ ] Relentless Pursuit löst Treffer sequenziell auf; Storm Surge bleibt bei zwei Bonus-Hits
      gedeckelt und setzt Chain-Index/-Factor fort.
- [ ] Glancing unterbindet sämtliche Crit-Verhalten, lässt Generatoren aber bestehen; alle
      Finesse-Ausnahmen addieren Crit- und Range-Effekte genau einmal.
- [ ] Epicenter/Focused Blast/Aftershock treffen Primär- und Nebenziele ohne Rekursion oder
      doppelte Zusatztreffer.
- [ ] Valor unterscheidet Evasion und Block, setzt Counter-Stapel bei Rundenbeginn zurück und
      zählt Glancing Counter regelkonform.
- [ ] Guarded und Zeroing besitzen die spezifizierten Aufbau-, Verbrauchs- und Reset-Regeln.
- [ ] Gleiche Seeds und identische Mastery-Builds liefern denselben Event- und Schadensverlauf.
- [ ] Deterministische Tests decken jede Node sowie relevante Cross-Discipline-Interaktionen ab.

## Betroffene Dateien

- `src/features/combat/`, `src/game/weaponMastery/`
- angrenzende Combat-Events, Playback-Darstellung und Tests

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
