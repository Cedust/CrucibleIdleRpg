import { CHARACTERS } from '@/game/characters/characters';
import { nodeById } from '@/game/weaponMastery/mastery';
import type { CombatCharacter } from './combatState';
import { NO_CRIT_NODES, type AttackContext, type MasteryEffects } from './outgoingDamage';

function has(character: CombatCharacter, id: string): boolean {
  return (character.masteryRanks?.[id] ?? 0) > 0;
}

function weaponBonus(character: CombatCharacter, stat: 'precision' | 'minRng' | 'maxRng'): number {
  return Object.entries(character.masteryRanks ?? {}).reduce((total, [id, rank]) => {
    const node = nodeById(character.id, id);
    return node?.stat === stat && node.perRank !== undefined ? total + node.perRank * rank : total;
  }, 0);
}

/** Builds the complete, save-derived combat context for one character. */
export function masteryContextFor(character: CombatCharacter): AttackContext {
  const weapon = CHARACTERS[character.id].weapon;
  const minBonus = weaponBonus(character, 'minRng');
  const maxBonus = weaponBonus(character, 'maxRng');
  const precisionBonus = weaponBonus(character, 'precision');

  let min = weapon.damageRange.min + minBonus;
  let max = weapon.damageRange.max + maxBonus;
  let precision = weapon.precision + precisionBonus;

  if (has(character, "weapon.titan's-arc")) {
    max += 0.15;
    precision -= 0.1;
  } else if (has(character, 'weapon.shielded-advance')) {
    min += 0.1;
    max -= 0.15;
    precision += 0.1;
  } else if (has(character, "weapon.razor's-edge")) {
    min -= 0.1;
    max += 0.15;
    precision -= 0.05;
  } else if (has(character, 'weapon.blade-poise')) {
    min += 0.1;
    max -= 0.05;
    precision += 0.05;
  } else if (has(character, 'weapon.overdraw')) {
    max += 0.2;
    precision -= 0.15;
  } else if (has(character, 'weapon.steady-draw')) {
    min += 0.05;
    max += 0.05;
  }

  const mastery: MasteryEffects = {
    executioner: has(character, 'finesse.executioner'),
    perfectExploit: has(character, 'finesse.perfect-exploit'),
    surestrike: has(character, 'finesse.surestrike'),
    overcritical: has(character, 'finesse.overcritical'),
    relentlessPursuit: has(character, 'tempest.relentless-pursuit'),
    echoedStrike: has(character, 'tempest.echoed-strike'),
    stormSurge: has(character, 'tempest.storm-surge'),
    perfectCadence: has(character, 'tempest.perfect-cadence'),
    epicenter: has(character, 'dominance.epicenter'),
    focusedBlast: has(character, 'dominance.focused-blast'),
    aftershock: has(character, 'dominance.aftershock'),
    perfectRiposte: has(character, 'valor.perfect-riposte'),
    guardedReprisal: has(character, 'valor.guarded-reprisal'),
    escalatingRetaliation: has(character, 'valor.escalating-retaliation'),
    committedImpact: has(character, 'weapon.committed-impact'),
    immovableGuard: has(character, 'weapon.immovable-guard'),
    twinMeasure: has(character, 'weapon.twin-measure'),
    secondWind: has(character, 'weapon.second-wind'),
    zeroingIn: has(character, 'weapon.zeroing-in'),
    patientHunter: has(character, 'weapon.patient-hunter'),
    guarded: character.guarded ?? false,
    zeroing: character.zeroing,
    counterStacks: character.counterStacks ?? 0,
  };

  return {
    damageRange: { min, max: Math.max(min, max) },
    precision,
    critNodes: {
      ...NO_CRIT_NODES,
      multiHit: has(character, 'tempest.converging-strikes'),
      splash: has(character, 'dominance.critical-mass'),
      counter: has(character, 'valor.vengeful-edge'),
    },
    mastery,
  };
}
