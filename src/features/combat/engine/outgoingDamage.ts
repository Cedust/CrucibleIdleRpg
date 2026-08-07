import { MULTI_HIT_CHAIN_FACTOR_CAP } from '@/game/curves/combatConstants';
import type { DamageRange } from '@/game/types';
import { MASTERY_BALANCE } from '@/game/weaponMastery/mastery';
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

interface RollDamageOptions {
  damage: number;
  cleanHit: boolean;
  canCrit: boolean;
  critChance: number;
  critDamage: number;
  /** Executioner-Bonus gilt nur für den Grundtreffer unter der Health-Schwelle. */
  executioner?: boolean;
  /** Surestrike: Clean-Basistreffer sind garantiert kritisch — ohne Crit-Wurf. */
  guaranteedCrit?: boolean;
}

interface RolledDamage {
  damage: number;
  crit: boolean;
  /** Angewandter Crit-Multiplikator; `1` ohne Crit. */
  multiplier: number;
}

function rollDamage(prng: Prng, context: AttackContext, options: RollDamageOptions): RolledDamage {
  const mastery = context.mastery;
  const crit =
    options.cleanHit &&
    options.canCrit &&
    (options.guaranteedCrit === true || prng.chance(clampChance(options.critChance)));
  if (!crit) return { damage: options.damage, crit: false, multiplier: 1 };

  let multiplier =
    options.critDamage +
    (options.executioner === true && mastery?.executioner
      ? MASTERY_BALANCE.executioner.bonusCritDamage
      : 0);
  if (mastery?.overcritical && prng.chance(clampChance(options.critChance))) {
    multiplier += options.critDamage;
  }
  return { damage: options.damage * multiplier, crit: true, multiplier };
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
  const maxStacks = mastery.patientHunter
    ? MASTERY_BALANCE.patientHunter.maxStacks
    : MASTERY_BALANCE.zeroingIn.maxStacks;
  const bonus = Math.min(stacks, maxStacks) * MASTERY_BALANCE.zeroingIn.rangePerStack;
  return {
    range: { min: context.damageRange.min + bonus, max: context.damageRange.max + bonus },
    forceMax: mastery.patientHunter && stacks >= MASTERY_BALANCE.patientHunter.maxRngFromStack,
  };
}

/** Splash-Welle samt Epicenter, Focused Blast und Aftershock (WEAPON-MASTERY §4.3). */
function splashHits(
  state: CombatState,
  prng: Prng,
  context: AttackContext,
  input: {
    primary: EnemyTarget;
    targets: readonly EnemyTarget[];
    splashBase: number;
    cleanHit: boolean;
    critChance: number;
    critDamage: number;
    splashRadius: number;
  },
): Hit[] {
  const { primary, targets, splashBase, cleanHit, critChance, critDamage, splashRadius } = input;
  const mastery = context.mastery;
  const hits: Hit[] = [];

  for (const target of targets) {
    const rolled = rollDamage(prng, context, {
      damage: splashBase,
      cleanHit,
      canCrit: context.critNodes.splash,
      critChance,
      critDamage,
    });
    hits.push(buildHit('splash', state, target, rolled.damage, rolled.crit));
  }

  if (mastery?.epicenter) {
    hits.push(
      buildHit(
        'epicenter',
        state,
        primary,
        splashBase * MASTERY_BALANCE.epicenter.damageFactor,
        false,
      ),
    );
  }
  if (mastery?.focusedBlast) {
    const unused = Math.max(Math.trunc(splashRadius) - targets.length, 0);
    if (unused > 0) {
      hits.push(
        buildHit(
          'focusedBlast',
          state,
          primary,
          splashBase *
            Math.min(
              unused * MASTERY_BALANCE.focusedBlast.damagePerUnusedRadius,
              MASTERY_BALANCE.focusedBlast.damageFactorCap,
            ),
          false,
        ),
      );
    }
  }
  if (mastery?.aftershock) {
    for (const target of targets) {
      const rolled = rollDamage(prng, context, {
        damage: splashBase * MASTERY_BALANCE.aftershock.damageFactor,
        cleanHit,
        canCrit: context.critNodes.splash,
        critChance,
        critDamage,
      });
      hits.push(buildHit('aftershock', state, target, rolled.damage, rolled.crit));
    }
  }

  return hits;
}

/** Clean-Hit-Follow-ups des Waffenbaums: Echoed Strike und Second Wind (WEAPON-MASTERY §5). */
function followUpHits(
  state: CombatState,
  prng: Prng,
  context: AttackContext,
  input: {
    primary: EnemyTarget;
    base: RolledDamage;
    attack: number;
    firstRoll: number;
    secondRoll: number | undefined;
    cleanHit: boolean;
    critChance: number;
    critDamage: number;
  },
): Hit[] {
  const { primary, base, attack, firstRoll, secondRoll, cleanHit, critChance, critDamage } = input;
  const mastery = context.mastery;
  const hits: Hit[] = [];

  if (cleanHit && mastery?.echoedStrike) {
    hits.push(
      buildHit(
        'echo',
        state,
        primary,
        base.damage * MASTERY_BALANCE.echoedStrike.damageFactor,
        base.crit,
      ),
    );
  }
  if (cleanHit && mastery?.secondWind && secondRoll !== undefined) {
    const lower = Math.min(firstRoll, secondRoll);
    const rolled = rollDamage(prng, context, {
      damage: attack * lower * MASTERY_BALANCE.secondWind.damageFactor,
      cleanHit: true,
      canCrit: true,
      critChance,
      critDamage,
    });
    hits.push(buildHit('secondWind', state, primary, rolled.damage, rolled.crit));
  }

  return hits;
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
  if (cleanHit && mastery?.committedImpact)
    damageRangeRoll = Math.max(damageRangeRoll, MASTERY_BALANCE.committedImpact.minCleanRoll);
  if (rangeEffect.forceMax) damageRangeRoll = rangeEffect.range.max;
  const baseDamage = derived.attack * (cleanHit ? damageRangeRoll : rangeEffect.range.min);
  const hits: Hit[] = [];
  const executioner =
    primary.enemy.health / primary.enemy.maxHealth < MASTERY_BALANCE.executioner.healthThreshold;
  let base = rollDamage(prng, context, {
    damage: baseDamage,
    cleanHit,
    canCrit: true,
    critChance: offensive.critChance,
    critDamage: offensive.critDamage,
    executioner,
    guaranteedCrit: mastery?.surestrike === true,
  });
  if (base.crit && mastery?.perfectExploit) {
    // Über den Crit-Multiplikator statt einer Division — auch bei Grundschaden 0 kein NaN.
    base = { ...base, damage: derived.attack * rangeEffect.range.max * base.multiplier };
  }
  hits.push(buildHit('base', state, primary, base.damage, base.crit));

  const chainLength = prng.chance(clampChance(offensive.multiHitChance))
    ? Math.max(Math.trunc(utility.multiHitChain), 0)
    : 0;
  const chainFactor = clampChainFactor(utility.multiHitChainFactor);
  let decay = 1;
  let bonusHits = 0;
  const resolveChain = (chainIndex: number, original: boolean): void => {
    // Nur Relentless Pursuit braucht den projizierten Zwischenstand für das Retargeting.
    const target = mastery?.relentlessPursuit
      ? selectPrimaryTarget(projectedState(state, hits), attacker)
      : primary;
    if (!target) return;
    const rolled = rollDamage(prng, context, {
      damage: baseDamage * offensive.multiHitDamage * decay,
      cleanHit,
      canCrit: context.critNodes.multiHit,
      critChance: offensive.critChance,
      critDamage: offensive.critDamage,
    });
    hits.push(buildHit('multiHit', state, target, rolled.damage, rolled.crit, chainIndex));
    if (
      mastery?.stormSurge &&
      original &&
      rolled.crit &&
      bonusHits < MASTERY_BALANCE.stormSurge.maxBonusHits
    )
      bonusHits += 1;
    decay =
      mastery?.perfectCadence && rolled.crit
        ? MASTERY_BALANCE.perfectCadence.chainFactorReset
        : decay * chainFactor;
  };
  for (let index = 1; index <= chainLength; index += 1) resolveChain(index, true);
  for (let index = 1; index <= bonusHits; index += 1) resolveChain(chainLength + index, false);

  const splashTriggered = prng.chance(clampChance(offensive.splashChance));
  if (splashTriggered) {
    hits.push(
      ...splashHits(state, prng, context, {
        primary,
        targets: selectSplashTargets(state, primary, utility.splashRadius),
        splashBase: baseDamage * offensive.splashDamage,
        cleanHit,
        critChance: offensive.critChance,
        critDamage: offensive.critDamage,
        splashRadius: utility.splashRadius,
      }),
    );
  }

  hits.push(
    ...followUpHits(state, prng, context, {
      primary,
      base,
      attack: derived.attack,
      firstRoll,
      secondRoll,
      cleanHit,
      critChance: offensive.critChance,
      critDamage: offensive.critDamage,
    }),
  );

  const maxStacks = mastery?.patientHunter
    ? MASTERY_BALANCE.patientHunter.maxStacks
    : MASTERY_BALANCE.zeroingIn.maxStacks;
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
