import type {
  CharacterId,
  DefensiveStats,
  Lane,
  OffensiveStats,
  Role,
  UtilityStats,
} from '@/game/types';
import type { Prng } from '@/shared/utils/prng';
import type { CombatCharacter, CombatEnemy, CombatState } from './combatState';

/**
 * Gemeinsame Engine-Test-Helfer: gestellter PRNG und Fixture-Factories mit neutralen
 * Basiswerten. Die Testdateien halten ihre fachlichen Profile als dünne Wrapper darüber —
 * eigene Eingangswerte statt Platzhalter-Content
 * (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten).
 */

/**
 * Ein gestellter PRNG: liefert die Werte in der übergebenen Reihenfolge und **protokolliert
 * jeden Zug**. Das Protokoll ist die Absicherung der verbindlichen Zugreihenfolge — ein
 * zusätzlicher oder entfallener Wurf fällt damit auf (docs/spec/DAMAGE-SYSTEM.md#15-feststehende-regeln).
 */
export interface ScriptedPrng extends Prng {
  readonly draws: readonly string[];
}

export function scriptedPrng(values: readonly number[]): ScriptedPrng {
  const draws: string[] = [];
  let index = 0;

  const take = (label: string): number => {
    const value = values[index];

    if (value === undefined) {
      throw new Error(`PRNG-Zug ${index + 1} (${label}) ist nicht gestellt`);
    }

    index += 1;
    draws.push(label);

    return value;
  };

  return {
    seed: 0,
    draws,
    next: () => take('damageRange'),
    nextInt: (min, max) => min + Math.floor(take('nextInt') * (max - min + 1)),
    chance: (p) => take(`chance:${p}`) < p,
  };
}

export interface CharacterFixture {
  id: CharacterId;
  role?: Role;
  slotIndex?: number;
  attack?: number;
  defense?: number;
  health?: number;
  maxHealth?: number;
  /** Setzt Barrier-Stat und aktuellen Laufzeitwert gemeinsam. */
  barrier?: number;
  offensive?: Partial<OffensiveStats>;
  defensive?: Partial<DefensiveStats>;
  utility?: Partial<UtilityStats>;
  masteryRanks?: Readonly<Record<string, number>>;
  guarded?: boolean;
  zeroing?: { target: number; stacks: number };
  counterStacks?: number;
}

export function characterFixture(setup: CharacterFixture): CombatCharacter {
  const maxHealth = setup.maxHealth ?? 1000;

  return {
    id: setup.id,
    name: setup.id,
    role: setup.role ?? 'melee',
    slotIndex: setup.slotIndex ?? 0,
    stats: {
      core: { might: 0, toughness: 0, vitality: 0 },
      derived: { attack: setup.attack ?? 100, defense: setup.defense ?? 0, health: maxHealth },
      offensive: {
        critChance: 0,
        critDamage: 2,
        multiHitChance: 0,
        multiHitDamage: 0.5,
        splashChance: 0,
        splashDamage: 0.4,
        counterChance: 0,
        counterDamage: 0.6,
        ...setup.offensive,
      },
      defensive: {
        barrier: setup.barrier ?? 0,
        blockChance: 0,
        evasion: 0,
        regeneration: 0,
        ...setup.defensive,
      },
      utility: {
        initiative: 10,
        multiHitChain: 2,
        multiHitChainFactor: 0.6,
        splashRadius: 1,
        ...setup.utility,
      },
    },
    health: setup.health ?? maxHealth,
    maxHealth,
    barrier: setup.barrier ?? 0,
    masteryRanks: setup.masteryRanks,
    guarded: setup.guarded ?? false,
    zeroing: setup.zeroing,
    counterStacks: setup.counterStacks ?? 0,
  };
}

export interface EnemyFixture {
  formationIndex: number;
  /** Ohne Angabe folgt die Rolle der Lane: Frontline Melee, Backline Ranged. */
  role?: Role;
  health?: number;
  maxHealth?: number;
  attack?: number;
  accuracy?: number;
  initiative?: number;
  bulwarkContribution?: number;
}

export function enemyFixture(setup: EnemyFixture): CombatEnemy {
  const lane: Lane = setup.formationIndex < 3 ? 'frontline' : 'backline';
  const health = setup.health ?? 1000;

  return {
    definitionId: 'ashenGhoul',
    name: `Enemy ${setup.formationIndex}`,
    role: setup.role ?? (lane === 'frontline' ? 'melee' : 'ranged'),
    lane,
    formationIndex: setup.formationIndex,
    health,
    maxHealth: setup.maxHealth ?? health,
    attack: setup.attack ?? 30,
    accuracy: setup.accuracy ?? 1,
    initiative: setup.initiative ?? 5,
    bulwarkContribution: setup.bulwarkContribution ?? 0,
    sunderedBulwark: 0,
  };
}

export function combatStateFixture(
  characters: readonly CombatCharacter[],
  enemies: readonly CombatEnemy[],
  overrides: Partial<CombatState> = {},
): CombatState {
  return {
    floorId: 'A1-D1-01',
    floorIndex: 0,
    floorSeed: 1,
    combatPrngState: 1,
    characters,
    effectiveDamage: { korvin: 0, rhaya: 0, quinn: 0 },
    enemies,
    round: 1,
    pending: [],
    secondWindConsumed: false,
    rites: {},
    riteReservedRounds: {},
    ...overrides,
  };
}
