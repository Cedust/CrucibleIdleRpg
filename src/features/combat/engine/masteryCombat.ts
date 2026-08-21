import { CHARACTERS } from '@/game/characters/characters';
import {
  MASTERY_IDS,
  nodeById,
  WEAPON_MODE_KEYS,
  WEAPON_MODES,
} from '@/game/weaponMastery/mastery';
import type { CharacterId, DamageRange } from '@/game/types';
import type { CombatCharacter } from './combatState';
import { NO_CRIT_NODES, type AttackContext, type MasteryEffects } from './damage/outgoingDamage';

type MasteryRanks = Readonly<Record<string, number>>;

function has(character: CombatCharacter, id: string): boolean {
  return (character.masteryRanks?.[id] ?? 0) > 0;
}

function weaponBonus(
  characterId: CharacterId,
  ranks: MasteryRanks,
  stat: 'precision' | 'minRng' | 'maxRng',
): number {
  return Object.entries(ranks).reduce((total, [id, rank]) => {
    const node = nodeById(characterId, id);
    return node?.stat === stat && node.perRank !== undefined ? total + node.perRank * rank : total;
  }, 0);
}

/** Effektive Waffenwerte nach allen Mastery-Effekten — Range und Precision (SPEC §5). */
export interface EffectiveWeaponValues {
  damageRange: DamageRange;
  precision: number;
}

/**
 * Die aktuell wirksamen Waffenwerte eines Charakters aus Signaturwaffe plus gekauften
 * Mastery-Rängen. Kampf-Kontext (masteryContextFor) und Loadout lesen dieselbe Herleitung.
 */
export function effectiveWeaponValues(
  characterId: CharacterId,
  ranks: MasteryRanks = {},
  damageRangeFloorBonus = 0,
): EffectiveWeaponValues {
  const weapon = CHARACTERS[characterId].weapon;

  let min =
    weapon.damageRange.min + weaponBonus(characterId, ranks, 'minRng') + damageRangeFloorBonus;
  let max = weapon.damageRange.max + weaponBonus(characterId, ranks, 'maxRng');
  let precision = weapon.precision + weaponBonus(characterId, ranks, 'precision');

  // Exklusive Weapon-Mode-Kette: Der erste aktive Mode in Präzedenz-Reihenfolge gilt.
  const modeKey = WEAPON_MODE_KEYS.find((key) => (ranks[MASTERY_IDS[key]] ?? 0) > 0);
  if (modeKey !== undefined) {
    const mode = WEAPON_MODES[modeKey];
    min += mode.minRngDelta;
    max += mode.maxRngDelta;
    precision += mode.precisionDelta;
  }

  return { damageRange: { min, max: Math.max(min, max) }, precision };
}

/** Builds the complete, save-derived combat context for one character. */
export function masteryContextFor(character: CombatCharacter): AttackContext {
  const { damageRange, precision } = effectiveWeaponValues(
    character.id,
    character.masteryRanks,
    character.imprintEffects?.damageRangeFloorBonus ?? 0,
  );

  const mastery: MasteryEffects = {
    executioner: has(character, MASTERY_IDS.executioner),
    perfectExploit: has(character, MASTERY_IDS.perfectExploit),
    surestrike: has(character, MASTERY_IDS.surestrike),
    overcritical: has(character, MASTERY_IDS.overcritical),
    relentlessPursuit: has(character, MASTERY_IDS.relentlessPursuit),
    echoedStrike: has(character, MASTERY_IDS.echoedStrike),
    stormSurge: has(character, MASTERY_IDS.stormSurge),
    perfectCadence: has(character, MASTERY_IDS.perfectCadence),
    epicenter: has(character, MASTERY_IDS.epicenter),
    focusedBlast: has(character, MASTERY_IDS.focusedBlast),
    aftershock: has(character, MASTERY_IDS.aftershock),
    perfectRiposte: has(character, MASTERY_IDS.perfectRiposte),
    guardedReprisal: has(character, MASTERY_IDS.guardedReprisal),
    escalatingRetaliation: has(character, MASTERY_IDS.escalatingRetaliation),
    committedImpact: has(character, MASTERY_IDS.committedImpact),
    immovableGuard: has(character, MASTERY_IDS.immovableGuard),
    twinMeasure: has(character, MASTERY_IDS.twinMeasure),
    secondWind: has(character, MASTERY_IDS.secondWind),
    zeroingIn: has(character, MASTERY_IDS.zeroingIn),
    patientHunter: has(character, MASTERY_IDS.patientHunter),
    guarded: character.guarded ?? false,
    zeroing: character.zeroing,
    counterStacks: character.counterStacks ?? 0,
  };

  return {
    damageRange,
    precision,
    critNodes: {
      ...NO_CRIT_NODES,
      multiHit: has(character, MASTERY_IDS.convergingStrikes),
      splash: has(character, MASTERY_IDS.criticalMass),
      counter: has(character, MASTERY_IDS.vengefulEdge),
    },
    mastery,
  };
}
