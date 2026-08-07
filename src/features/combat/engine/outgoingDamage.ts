import { MULTI_HIT_CHAIN_FACTOR_CAP } from '@/game/curves/combatConstants';
import type { DamageRange } from '@/game/types';
import type { Prng } from '@/shared/utils/prng';
import { applyBulwark, bulwarkDamageFactor } from './bulwark';
import type { ActorRef, CombatCharacter, CombatState } from './combatState';
import { selectPrimaryTarget, selectSplashTargets, type EnemyTarget } from './targeting';

export type HitKind =
  | 'base'
  | 'multiHit'
  | 'splash'
  | 'echo'
  | 'epicenter'
  | 'focusedBlast'
  | 'aftershock'
  | 'secondWind'
  | 'counter';

export interface Hit {
  kind: HitKind;
  target: ActorRef;
  rawDamage: number;
  crit: boolean;
  bulwarkFactor: number;
  damage: number;
  chainIndex?: number;
}

export interface CritNodes {
  multiHit: boolean;
  splash: boolean;
  counter: boolean;
}

export const NO_CRIT_NODES: CritNodes = { multiHit: false, splash: false, counter: false };

export interface MasteryEffects {
  executioner: boolean;
  perfectExploit: boolean;
  surestrike: boolean;
  overcritical: boolean;
  relentlessPursuit: boolean;
  echoedStrike: boolean;
  stormSurge: boolean;
  perfectCadence: boolean;
  epicenter: boolean;
  focusedBlast: boolean;
  aftershock: boolean;
  perfectRiposte: boolean;
  guardedReprisal: boolean;
  escalatingRetaliation: boolean;
  committedImpact: boolean;
  immovableGuard: boolean;
  twinMeasure: boolean;
  secondWind: boolean;
  zeroingIn: boolean;
  patientHunter: boolean;
  guarded: boolean;
  zeroing?: { target: number; stacks: number };
  counterStacks: number;
}

export interface AttackContext {
  damageRange: DamageRange;
  precision?: number;
  critNodes: CritNodes;
  mastery?: MasteryEffects;
}

export interface AttackResult {
  primaryTarget: ActorRef | undefined;
  cleanHit: boolean;
  damageRangeRoll: number;
  baseDamage: number;
  hits: readonly Hit[];
  consumeGuarded: boolean;
  nextZeroing?: { target: number; stacks: number };
}

export function clampChainFactor(chainFactor: number): number {
  return Math.min(Math.max(chainFactor, 0), MULTI_HIT_CHAIN_FACTOR_CAP);
}

export function clampChance(chance: number): number {
  return Math.min(Math.max(chance, 0), 1);
}

function buildHit(
  kind: HitKind,
  state: CombatState,
  target: EnemyTarget,
  rawDamage: number,
  crit: boolean,
  chainIndex?: number,
): Hit {
  const bulwarkFactor = bulwarkDamageFactor(state.enemies, target.enemy);
  return {
    kind,
    target: target.ref,
    rawDamage,
    crit,
    bulwarkFactor,
    damage: applyBulwark(rawDamage, state.enemies, target.enemy),
    ...(chainIndex === undefined ? {} : { chainIndex }),
  };
}

function rollDamage(
  prng: Prng,
  damage: number,
  cleanHit: boolean,
  canCrit: boolean,
  critChance: number,
  critDamage: number,
  context: AttackContext,
  executioner = false,
  guaranteedCrit = false,
): { damage: number; crit: boolean } {
  const mastery = context.mastery;
  const crit = cleanHit && canCrit && (guaranteedCrit || prng.chance(clampChance(critChance)));
  if (!crit) return { damage, crit: false };

  let multiplier = critDamage + (executioner && mastery?.executioner ? 0.5 : 0);
  if (mastery?.overcritical && prng.chance(clampChance(critChance))) {
    multiplier += critDamage;
  }
  return { damage: damage * multiplier, crit: true };
}

function projectedState(state: CombatState, hits: readonly Hit[]): CombatState {
  const health = state.enemies.map((enemy) => enemy.health);
  for (const hit of hits) {
    const current = health[hit.target.index];
    if (current !== undefined) health[hit.target.index] = Math.max(current - hit.damage, 0);
  }
  return {
    ...state,
    enemies: state.enemies.map((enemy, index) => ({ ...enemy, health: health[index] ?? 0 })),
  };
}

function zeroingRange(
  context: AttackContext,
  primary: EnemyTarget,
): { range: DamageRange; forceMax: boolean } {
  const mastery = context.mastery;
  if (!mastery?.zeroingIn || mastery.zeroing?.target !== primary.ref.index) {
    return { range: context.damageRange, forceMax: false };
  }
  const stacks = mastery.zeroing.stacks;
  const bonus = Math.min(stacks, mastery.patientHunter ? 5 : 3) * 0.05;
  return {
    range: { min: context.damageRange.min + bonus, max: context.damageRange.max + bonus },
    forceMax: mastery.patientHunter && stacks >= 4,
  };
}

/** Resolves the finite character hit tree. Generator children never call this function again. */
export function resolveCharacterAttack(
  state: CombatState,
  attacker: CombatCharacter,
  prng: Prng,
  context: AttackContext,
): AttackResult {
  const primary = selectPrimaryTarget(state, attacker);
  if (!primary) {
    return {
      primaryTarget: undefined,
      cleanHit: false,
      damageRangeRoll: 0,
      baseDamage: 0,
      hits: [],
      consumeGuarded: false,
    };
  }

  const { offensive, utility, derived } = attacker.stats;
  const mastery = context.mastery;
  const rangeEffect = zeroingRange(context, primary);
  const precisionRoll =
    context.precision === undefined || prng.chance(clampChance(context.precision));
  const cleanHit = mastery?.guarded ? true : precisionRoll;
  const firstRoll =
    rangeEffect.range.min + prng.next() * (rangeEffect.range.max - rangeEffect.range.min);
  const secondRoll =
    cleanHit && mastery?.twinMeasure
      ? rangeEffect.range.min + prng.next() * (rangeEffect.range.max - rangeEffect.range.min)
      : undefined;
  let damageRangeRoll = secondRoll === undefined ? firstRoll : Math.max(firstRoll, secondRoll);
  if (cleanHit && mastery?.committedImpact) damageRangeRoll = Math.max(damageRangeRoll, 1);
  if (rangeEffect.forceMax) damageRangeRoll = rangeEffect.range.max;
  const baseDamage = derived.attack * (cleanHit ? damageRangeRoll : rangeEffect.range.min);
  const hits: Hit[] = [];
  const executioner = primary.enemy.health / primary.enemy.maxHealth < 0.25;
  let base = rollDamage(
    prng,
    baseDamage,
    cleanHit,
    true,
    offensive.critChance,
    offensive.critDamage,
    context,
    executioner,
    mastery?.surestrike === true,
  );
  if (base.crit && mastery?.perfectExploit) {
    const maxRaw = derived.attack * rangeEffect.range.max;
    base = { ...base, damage: (base.damage / baseDamage) * maxRaw };
  }
  hits.push(buildHit('base', state, primary, base.damage, base.crit));

  const chainLength = prng.chance(clampChance(offensive.multiHitChance))
    ? Math.max(Math.trunc(utility.multiHitChain), 0)
    : 0;
  const chainFactor = clampChainFactor(utility.multiHitChainFactor);
  let decay = 1;
  let bonusHits = 0;
  const resolveChain = (chainIndex: number, original: boolean): void => {
    const turnState = projectedState(state, hits);
    const target = mastery?.relentlessPursuit ? selectPrimaryTarget(turnState, attacker) : primary;
    if (!target) return;
    const rolled = rollDamage(
      prng,
      baseDamage * offensive.multiHitDamage * decay,
      cleanHit,
      context.critNodes.multiHit,
      offensive.critChance,
      offensive.critDamage,
      context,
    );
    hits.push(buildHit('multiHit', state, target, rolled.damage, rolled.crit, chainIndex));
    if (mastery?.stormSurge && original && rolled.crit && bonusHits < 2) bonusHits += 1;
    decay = mastery?.perfectCadence && rolled.crit ? 1 : decay * chainFactor;
  };
  for (let index = 1; index <= chainLength; index += 1) resolveChain(index, true);
  for (let index = 1; index <= bonusHits; index += 1) resolveChain(chainLength + index, false);

  const splashTriggered = prng.chance(clampChance(offensive.splashChance));
  const splashTargets = splashTriggered
    ? selectSplashTargets(state, primary, utility.splashRadius)
    : [];
  const splashBase = baseDamage * offensive.splashDamage;
  for (const target of splashTargets) {
    const rolled = rollDamage(
      prng,
      splashBase,
      cleanHit,
      context.critNodes.splash,
      offensive.critChance,
      offensive.critDamage,
      context,
    );
    hits.push(buildHit('splash', state, target, rolled.damage, rolled.crit));
  }
  if (splashTriggered) {
    if (mastery?.epicenter)
      hits.push(buildHit('epicenter', state, primary, splashBase * 0.5, false));
    if (mastery?.focusedBlast) {
      const unused = Math.max(Math.trunc(utility.splashRadius) - splashTargets.length, 0);
      if (unused > 0)
        hits.push(
          buildHit('focusedBlast', state, primary, splashBase * Math.min(unused * 0.25, 1), false),
        );
    }
    if (mastery?.aftershock) {
      for (const target of splashTargets) {
        const rolled = rollDamage(
          prng,
          splashBase * 0.5,
          cleanHit,
          context.critNodes.splash,
          offensive.critChance,
          offensive.critDamage,
          context,
        );
        hits.push(buildHit('aftershock', state, target, rolled.damage, rolled.crit));
      }
    }
  }
  if (cleanHit && mastery?.echoedStrike)
    hits.push(buildHit('echo', state, primary, base.damage * 0.5, base.crit));
  if (cleanHit && mastery?.secondWind && secondRoll !== undefined) {
    const lower = Math.min(firstRoll, secondRoll);
    const rolled = rollDamage(
      prng,
      derived.attack * lower * 0.25,
      true,
      true,
      offensive.critChance,
      offensive.critDamage,
      context,
    );
    hits.push(buildHit('secondWind', state, primary, rolled.damage, rolled.crit));
  }
  const maxStacks = mastery?.patientHunter ? 5 : 3;
  const nextZeroing = mastery?.zeroingIn
    ? {
        target: primary.ref.index,
        stacks: Math.min(
          mastery.zeroing?.target === primary.ref.index ? mastery.zeroing.stacks + 1 : 1,
          maxStacks,
        ),
      }
    : undefined;
  return {
    primaryTarget: primary.ref,
    cleanHit,
    damageRangeRoll,
    baseDamage,
    hits,
    consumeGuarded: mastery?.guarded === true,
    ...(nextZeroing ? { nextZeroing } : {}),
  };
}
