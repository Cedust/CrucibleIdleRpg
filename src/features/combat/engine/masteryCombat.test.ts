import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '@/game/characters/characters';
import { createArmorItem } from '@/game/items/armor';
import { imprintEffects } from '@/game/sigils/imprints';
import type { CharacterId } from '@/game/types';
import { MASTERY_IDS, nodeById } from '@/game/weaponMastery/mastery';
import type { CombatCharacter } from './combatState';
import { effectiveWeaponValues, masteryContextFor } from './masteryCombat';

/**
 * Geprüft wird die Übersetzung gekaufter `masteryRanks` in den Kampf-Kontext — ID→Effekt-
 * Mapping, Akkumulation der Weapon-Boni, die exklusive Weapon-Mode-Kette und der Range-Clamp —
 * nicht das Tuning der Platzhalter-Werte
 * (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten).
 */

function character(
  id: CharacterId,
  masteryRanks: Readonly<Record<string, number>> = {},
  fluechtig: Partial<
    Pick<CombatCharacter, 'guarded' | 'zeroing' | 'counterStacks' | 'imprintEffects'>
  > = {},
): CombatCharacter {
  return {
    id,
    name: id,
    role: 'tank',
    slotIndex: 0,
    stats: {
      core: { might: 0, toughness: 0, vitality: 0 },
      derived: { attack: 100, defense: 0, health: 1000 },
      offensive: {
        critChance: 0.25,
        critDamage: 2,
        multiHitChance: 0.4,
        multiHitDamage: 0.5,
        splashChance: 0.3,
        splashDamage: 0.4,
        counterChance: 0.2,
        counterDamage: 0.6,
      },
      defensive: { barrier: 0, blockChance: 0, evasion: 0, regeneration: 0 },
      utility: { initiative: 10, multiHitChain: 2, multiHitChainFactor: 0.6, splashRadius: 1 },
    },
    health: 1000,
    maxHealth: 1000,
    barrier: 0,
    masteryRanks,
    ...fluechtig,
  };
}

/** Alle Behavior-Flags, deren `MASTERY_IDS`-Key dem `MasteryEffects`-Feld entspricht. */
const BEHAVIOR_FLAGS = [
  'executioner',
  'perfectExploit',
  'surestrike',
  'overcritical',
  'relentlessPursuit',
  'echoedStrike',
  'stormSurge',
  'perfectCadence',
  'epicenter',
  'focusedBlast',
  'aftershock',
  'perfectRiposte',
  'guardedReprisal',
  'escalatingRetaliation',
  'committedImpact',
  'immovableGuard',
  'twinMeasure',
  'secondWind',
  'zeroingIn',
  'patientHunter',
] as const;

describe('masteryContextFor — ID→Effekt-Mapping', () => {
  it('setzt je gekauftem Behavior-Node genau sein Flag', () => {
    for (const flag of BEHAVIOR_FLAGS) {
      const mastery = masteryContextFor(character('korvin', { [MASTERY_IDS[flag]]: 1 })).mastery;

      for (const other of BEHAVIOR_FLAGS) {
        expect(mastery?.[other], `${flag} gekauft, ${other} geprüft`).toBe(other === flag);
      }
    }
  });

  it('lässt ohne gekaufte Nodes alle Flags aus', () => {
    const mastery = masteryContextFor(character('korvin')).mastery;

    for (const flag of BEHAVIOR_FLAGS) {
      expect(mastery?.[flag]).toBe(false);
    }
  });

  it('schaltet die Crit-Knoten der Generatoren über ihre Discipline-Nodes frei', () => {
    expect(masteryContextFor(character('korvin')).critNodes).toEqual({
      multiHit: false,
      splash: false,
      counter: false,
    });
    expect(
      masteryContextFor(character('korvin', { [MASTERY_IDS.convergingStrikes]: 1 })).critNodes
        .multiHit,
    ).toBe(true);
    expect(
      masteryContextFor(character('korvin', { [MASTERY_IDS.criticalMass]: 1 })).critNodes.splash,
    ).toBe(true);
    expect(
      masteryContextFor(character('korvin', { [MASTERY_IDS.vengefulEdge]: 1 })).critNodes.counter,
    ).toBe(true);
  });

  it('reicht Guarded, Zeroing und Counter-Stacks als flüchtigen Zustand durch', () => {
    const mastery = masteryContextFor(
      character(
        'quinn',
        {},
        { guarded: true, zeroing: { target: 2, stacks: 2 }, counterStacks: 2 },
      ),
    ).mastery;

    expect(mastery?.guarded).toBe(true);
    expect(mastery?.zeroing).toEqual({ target: 2, stacks: 2 });
    expect(mastery?.counterStacks).toBe(2);

    const neutral = masteryContextFor(character('quinn')).mastery;

    expect(neutral?.guarded).toBe(false);
    expect(neutral?.counterStacks).toBe(0);
  });
});

describe('masteryContextFor — Weapon-Boni', () => {
  it('raises only the lower Damage Range bound for Narrowed Fate', () => {
    const imprints = imprintEffects(
      {
        head: {
          ...createArmorItem('head'),
          rarity: 'magic',
          sockets: [null],
          imprint: { sigilId: 'sigil.narrowed-fate' },
        },
      },
      { 'sigil.narrowed-fate': 2 },
    );

    const context = masteryContextFor(character('korvin', {}, { imprintEffects: imprints }));

    expect(context.damageRange.min).toBeCloseTo(
      CHARACTERS.korvin.weapon.damageRange.min + 0.08,
      10,
    );
    expect(context.damageRange.max).toBe(CHARACTERS.korvin.weapon.damageRange.max);
  });

  it('akkumuliert Precision- und MAX-RNG-Boni über Nodes und Ränge', () => {
    const prcI = nodeById('korvin', 'weapon.prc-i');
    const prcII = nodeById('korvin', 'weapon.prc-ii');
    const maxI = nodeById('korvin', 'weapon.max-rng-i');

    expect(prcI?.perRank).toBeGreaterThan(0);

    const kontext = masteryContextFor(
      character('korvin', { 'weapon.prc-i': 3, 'weapon.prc-ii': 2, 'weapon.max-rng-i': 1 }),
    );

    const waffe = CHARACTERS.korvin.weapon;

    expect(kontext.precision).toBeCloseTo(
      waffe.precision + 3 * (prcI?.perRank ?? 0) + 2 * (prcII?.perRank ?? 0),
      10,
    );
    expect(kontext.damageRange.min).toBeCloseTo(waffe.damageRange.min, 10);
    expect(kontext.damageRange.max).toBeCloseTo(waffe.damageRange.max + (maxI?.perRank ?? 0), 10);
  });

  it('erreicht den Spec-Vollausbau: Range 75–140 %, Precision 80 % (WEAPON-MASTERY §5.1)', () => {
    const kontext = masteryContextFor(
      character('korvin', {
        'weapon.prc-i': 5,
        'weapon.prc-ii': 5,
        'weapon.min-rng': 5,
        'weapon.max-rng-i': 5,
        'weapon.max-rng-ii': 5,
      }),
    );

    expect(kontext.precision).toBeCloseTo(0.8, 10);
    expect(kontext.damageRange.min).toBeCloseTo(0.75, 10);
    expect(kontext.damageRange.max).toBeCloseTo(1.4, 10);
  });

  it('ignoriert Node-IDs, die im Baum dieses Charakters nicht existieren', () => {
    // `weapon.min-rng-iii` gehört zu Quinn — in Korvins Baum löst die ID nicht auf.
    const kontext = masteryContextFor(character('korvin', { 'weapon.min-rng-iii': 5 }));

    expect(kontext.damageRange).toEqual(CHARACTERS.korvin.weapon.damageRange);
    expect(kontext.precision).toBe(CHARACTERS.korvin.weapon.precision);
  });
});

describe('effectiveWeaponValues — geteilte Waffen-Herleitung', () => {
  it('liefert ohne Ränge die unveränderte Signaturwaffe', () => {
    expect(effectiveWeaponValues('quinn')).toEqual({
      damageRange: CHARACTERS.quinn.weapon.damageRange,
      precision: CHARACTERS.quinn.weapon.precision,
    });
  });

  it('stimmt für jeden Rang-Stand mit dem Kampf-Kontext überein', () => {
    const staende: readonly Readonly<Record<string, number>>[] = [
      {},
      { 'weapon.prc-i': 3, 'weapon.max-rng-i': 2 },
      { [MASTERY_IDS.titansArc]: 1, 'weapon.min-rng': 5 },
    ];

    for (const ranks of staende) {
      const kontext = masteryContextFor(character('korvin', ranks));

      expect(effectiveWeaponValues('korvin', ranks)).toEqual({
        damageRange: kontext.damageRange,
        precision: kontext.precision,
      });
    }
  });
});

describe('masteryContextFor — Weapon-Modes (exklusive Kette)', () => {
  const basis = masteryContextFor(character('korvin'));

  it("wendet Titan's Arc als Range-Mode an: MAX RNG steigt, Precision sinkt", () => {
    const kontext = masteryContextFor(character('korvin', { [MASTERY_IDS.titansArc]: 1 }));

    expect(kontext.damageRange.min).toBe(basis.damageRange.min);
    expect(kontext.damageRange.max).toBeGreaterThan(basis.damageRange.max);
    expect(kontext.precision).toBeLessThan(basis.precision ?? 0);
  });

  it("lässt Titan's Arc dem parallel gesetzten Shielded Advance vorgehen", () => {
    const beide = masteryContextFor(
      character('korvin', { [MASTERY_IDS.titansArc]: 1, [MASTERY_IDS.shieldedAdvance]: 1 }),
    );
    const nurTitans = masteryContextFor(character('korvin', { [MASTERY_IDS.titansArc]: 1 }));
    const nurShielded = masteryContextFor(
      character('korvin', { [MASTERY_IDS.shieldedAdvance]: 1 }),
    );

    expect(beide.damageRange).toEqual(nurTitans.damageRange);
    expect(beide.precision).toBe(nurTitans.precision);
    expect(beide.damageRange).not.toEqual(nurShielded.damageRange);
  });

  it('klemmt MAX RNG auf MIN RNG, wenn Boni das Intervall kreuzen', () => {
    // Absichtlich überzogene Ränge: Der Clamp ist die Sicherung gegen ein gekipptes Intervall.
    const minRng = nodeById('korvin', 'weapon.min-rng');
    const kontext = masteryContextFor(character('korvin', { 'weapon.min-rng': 999 }));

    expect(kontext.damageRange.min).toBeCloseTo(
      CHARACTERS.korvin.weapon.damageRange.min + 999 * (minRng?.perRank ?? 0),
      10,
    );
    expect(kontext.damageRange.max).toBe(kontext.damageRange.min);
  });
});
