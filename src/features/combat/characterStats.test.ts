import { describe, expect, it } from 'vitest';
import { CHARACTERS, TEAM_ORDER } from '@/game/characters/characters';
import {
  ATTRIBUTE_BONUS_PER_POINT,
  BASELINE_GROWTH,
  CORE_STAT_PER_POINT,
} from '@/game/curves/characterCurves';
import type { CharacterDefinition } from '@/game/types';
import {
  deriveCharacterStats,
  neutralProgression,
  type CharacterProgression,
} from './characterStats';

/**
 * Eigene Eingangswerte statt Platzhalter-Content: Die Tests prüfen die **Struktur** der
 * Schichtung, nicht das Tuning (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten).
 * Die runden Basiswerte machen die Ebenen im Ergebnis unterscheidbar.
 */
const PROBAND: CharacterDefinition = {
  id: 'korvin',
  name: 'Proband',
  role: 'tank',
  baseCore: { might: 0, toughness: 0, vitality: 0 },
  baseDerived: { attack: 100, defense: 200, health: 400 },
  baseOffensive: {
    critChance: 0.11,
    critDamage: 1.7,
    multiHitChance: 0.12,
    multiHitDamage: 0.55,
    splashChance: 0.13,
    splashDamage: 0.45,
    counterChance: 0.14,
    counterDamage: 0.65,
  },
  baseDefensive: { barrier: 20, blockChance: 0.15, evasion: 0.06, regeneration: 7 },
  baseUtility: { initiative: 9, multiHitChain: 2, multiHitChainFactor: 0.5, splashRadius: 2 },
};

function progression(overrides: Partial<CharacterProgression> = {}): CharacterProgression {
  return { ...neutralProgression(1), ...overrides };
}

describe('deriveCharacterStats — Level-1-Fall', () => {
  it('reproduziert die Startwerte aller drei Charaktere', () => {
    for (const id of TEAM_ORDER) {
      const definition = CHARACTERS[id];
      const stats = deriveCharacterStats(definition, neutralProgression(1));

      expect(stats.derived).toEqual(definition.baseDerived);
      expect(stats.core).toEqual(definition.baseCore);
      expect(stats.offensive).toEqual(definition.baseOffensive);
      expect(stats.defensive).toEqual(definition.baseDefensive);
      expect(stats.utility).toEqual(definition.baseUtility);
    }
  });
});

describe('deriveCharacterStats — Core-Kategorie', () => {
  it('summiert Definition und Zusatzquellen (Item-Innate, Gems)', () => {
    const stats = deriveCharacterStats(
      PROBAND,
      progression({ coreStats: { might: 30, toughness: 20, vitality: 10 } }),
    );

    expect(stats.core).toEqual({ might: 30, toughness: 20, vitality: 10 });
  });
});

describe('deriveCharacterStats — Derived-Kategorie', () => {
  it('skaliert die Baseline mit dem Charakterlevel', () => {
    const level = 50;
    const stats = deriveCharacterStats(PROBAND, progression({ level }));

    expect(stats.derived.attack).toBeCloseTo(
      100 * (BASELINE_GROWTH.attack[level - 1] as number),
      8,
    );
    expect(stats.derived.defense).toBeCloseTo(
      200 * (BASELINE_GROWTH.defense[level - 1] as number),
      8,
    );
    expect(stats.derived.health).toBeCloseTo(
      400 * (BASELINE_GROWTH.health[level - 1] as number),
      8,
    );
  });

  it('klemmt Level außerhalb der Tabelle auf deren Grenzen', () => {
    const letzterIndex = BASELINE_GROWTH.attack.length - 1;

    expect(deriveCharacterStats(PROBAND, progression({ level: 0 })).derived.attack).toBeCloseTo(
      100,
      8,
    );
    expect(deriveCharacterStats(PROBAND, progression({ level: 999 })).derived.attack).toBeCloseTo(
      100 * (BASELINE_GROWTH.attack[letzterIndex] as number),
      8,
    );
  });

  it('addiert den Core-Beitrag auf die Basis-Ebene', () => {
    const stats = deriveCharacterStats(
      PROBAND,
      progression({ coreStats: { might: 40, toughness: 40, vitality: 40 } }),
    );

    expect(stats.derived.attack).toBeCloseTo(100 + 40 * CORE_STAT_PER_POINT, 8);
    expect(stats.derived.defense).toBeCloseTo(200 + 40 * CORE_STAT_PER_POINT, 8);
    expect(stats.derived.health).toBeCloseTo(400 + 40 * CORE_STAT_PER_POINT, 8);
  });

  it('multipliziert die Attribut-Ebene auf Baseline und Core-Beitrag', () => {
    const punkte = 25;
    const faktor = 1 + punkte * ATTRIBUTE_BONUS_PER_POINT;
    const stats = deriveCharacterStats(
      PROBAND,
      progression({
        coreStats: { might: 40, toughness: 0, vitality: 0 },
        attributePoints: { ferocity: punkte, resilience: 0, vigor: 0 },
      }),
    );

    expect(stats.derived.attack).toBeCloseTo((100 + 40 * CORE_STAT_PER_POINT) * faktor, 8);
  });

  it('trennt die Ebenen: Core-Zuwachs wirkt vor, nicht neben dem Attribut-Prozent', () => {
    const punkte = 25;
    const faktor = 1 + punkte * ATTRIBUTE_BONUS_PER_POINT;
    const core = 40;

    const geschichtet = deriveCharacterStats(
      PROBAND,
      progression({
        coreStats: { might: core, toughness: 0, vitality: 0 },
        attributePoints: { ferocity: punkte, resilience: 0, vigor: 0 },
      }),
    ).derived.attack;

    // Läge der Core-Zuwachs neben statt unter der %-Ebene, käme dieser kleinere Wert heraus.
    const flach = 100 * faktor + core * CORE_STAT_PER_POINT;

    expect(geschichtet).toBeCloseTo(flach + core * CORE_STAT_PER_POINT * (faktor - 1), 8);
    expect(geschichtet).toBeGreaterThan(flach);
  });

  it('legt die Crucible-Ebene als eigene Schicht über die Attribut-Ebene', () => {
    const punkte = 25;
    const attributFaktor = 1 + punkte * ATTRIBUTE_BONUS_PER_POINT;
    const stats = deriveCharacterStats(
      PROBAND,
      progression({
        attributePoints: { ferocity: punkte, resilience: 0, vigor: 0 },
        crucibleBonus: { attack: 0.2, defense: 0, health: 0 },
      }),
    );

    // Multiplikativ (× 1.2), nicht additiv in dieselbe %-Ebene (× (1 + 0.25 + 0.2)).
    expect(stats.derived.attack).toBeCloseTo(100 * attributFaktor * 1.2, 8);
    expect(stats.derived.attack).not.toBeCloseTo(100 * (attributFaktor + 0.2), 8);
  });

  it('hält die Stat-Achsen getrennt: jede Quelle speist genau einen Derived Stat', () => {
    const nurMight = deriveCharacterStats(
      PROBAND,
      progression({ coreStats: { might: 50, toughness: 0, vitality: 0 } }),
    ).derived;
    expect(nurMight.attack).toBeGreaterThan(100);
    expect(nurMight.defense).toBeCloseTo(200, 8);
    expect(nurMight.health).toBeCloseTo(400, 8);

    const nurResilience = deriveCharacterStats(
      PROBAND,
      progression({ attributePoints: { ferocity: 0, resilience: 50, vigor: 0 } }),
    ).derived;
    expect(nurResilience.attack).toBeCloseTo(100, 8);
    expect(nurResilience.defense).toBeGreaterThan(200);
    expect(nurResilience.health).toBeCloseTo(400, 8);

    const nurVitality = deriveCharacterStats(
      PROBAND,
      progression({ coreStats: { might: 0, toughness: 0, vitality: 50 } }),
    ).derived;
    expect(nurVitality.attack).toBeCloseTo(100, 8);
    expect(nurVitality.defense).toBeCloseTo(200, 8);
    expect(nurVitality.health).toBeGreaterThan(400);
  });
});

describe('deriveCharacterStats — Offensive, Defensive und Utility', () => {
  const voll = progression({
    level: 100,
    coreStats: { might: 50, toughness: 50, vitality: 50 },
    attributePoints: { ferocity: 40, resilience: 30, vigor: 30 },
    crucibleBonus: { attack: 0.5, defense: 0.5, health: 0.5 },
  });

  it('übernimmt die drei Kategorien unverändert aus der Definition', () => {
    const stats = deriveCharacterStats(PROBAND, voll);

    expect(stats.offensive).toEqual(PROBAND.baseOffensive);
    expect(stats.defensive).toEqual(PROBAND.baseDefensive);
    expect(stats.utility).toEqual(PROBAND.baseUtility);
  });

  it('liefert Kopien, sodass ein Aufrufer den Content nicht verändert', () => {
    const stats = deriveCharacterStats(PROBAND, voll);
    stats.offensive.critChance = 1;
    stats.defensive.barrier = 999;
    stats.utility.initiative = 999;

    expect(PROBAND.baseOffensive.critChance).toBe(0.11);
    expect(PROBAND.baseDefensive.barrier).toBe(20);
    expect(PROBAND.baseUtility.initiative).toBe(9);
  });
});

describe('deriveCharacterStats — Reinheit', () => {
  it('ist frei von Seiteneffekten und liefert für gleiche Eingaben gleiche Werte', () => {
    const eingabe = progression({
      level: 42,
      coreStats: { might: 11, toughness: 12, vitality: 13 },
      attributePoints: { ferocity: 5, resilience: 6, vigor: 7 },
      crucibleBonus: { attack: 0.1, defense: 0.2, health: 0.3 },
    });

    expect(deriveCharacterStats(PROBAND, eingabe)).toEqual(deriveCharacterStats(PROBAND, eingabe));
    expect(CHARACTERS.korvin.baseDerived).toEqual({ attack: 12, defense: 5, health: 320 });
  });
});
