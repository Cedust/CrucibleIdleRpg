import { TEAM_ORDER } from '@/game/characters/characters';
import {
  MAX_CHARACTER_LEVEL,
  XP_PER_ENEMY_BY_FLOOR,
  XP_REQUIRED_PER_LEVEL,
} from '@/game/curves/progressionCurves';
import type { CharacterId, CharacterProgressionState } from '@/game/types';

const CHARACTER_COUNT = TEAM_ORDER.length;
const GUARANTEED_SHARE = 0.25;

export interface FloorXpInput {
  /** Nullbasierter globaler Floor-Index. */
  floorIndex: number;
  enemyCount: number;
  effectiveDamage: Readonly<Record<CharacterId, number>>;
}

/** Liefert den vorberechneten XP-Wert pro Gegner und klemmt außerhalb von Floors 1–300. */
export function xpPerEnemyForFloor(floorIndex: number): number {
  const index = Math.min(Math.max(Math.trunc(floorIndex), 0), XP_PER_ENEMY_BY_FLOOR.length - 1);
  return XP_PER_ENEMY_BY_FLOOR[index] as number;
}

/** Ein Floor-Pool ist der tabellierte Wert pro Gegner mal seiner tatsächlichen Gegnerzahl. */
export function floorXpPool(floorIndex: number, enemyCount: number): number {
  return xpPerEnemyForFloor(floorIndex) * Math.max(Math.trunc(enemyCount), 0);
}

/** XP für den Übergang vom angegebenen Level zum nächsten; Level 100 braucht keine XP mehr. */
export function xpRequiredForNextLevel(level: number): number {
  if (level >= MAX_CHARACTER_LEVEL) {
    return 0;
  }

  const index = Math.min(Math.max(Math.trunc(level), 1), MAX_CHARACTER_LEVEL - 1) - 1;
  return XP_REQUIRED_PER_LEVEL[index] as number;
}

/**
 * Verteilt einen Floor-Pool: 75 % sind sicher (je 25 %), 25 % richten sich nach dem effektiv
 * entfernten Gegner-Health. Der Pool ist durch die Vierer-Rundung immer durch vier teilbar.
 */
export function distributeFloorXp(input: FloorXpInput): Readonly<Record<CharacterId, number>> {
  const pool = floorXpPool(input.floorIndex, input.enemyCount);
  const guaranteed = pool * GUARANTEED_SHARE;
  const individual = pool - guaranteed * CHARACTER_COUNT;
  const allocatedIndividual = distributeByLargestRemainder(
    individual,
    input.effectiveDamage,
    input.floorIndex,
  );

  return Object.fromEntries(
    TEAM_ORDER.map((id) => [id, guaranteed + allocatedIndividual[id]]),
  ) as Record<CharacterId, number>;
}

/** Wendet XP an und verarbeitet jeden Level-Up einzeln, damit kein Punkt verloren geht. */
export function gainExperience(
  progression: CharacterProgressionState,
  xp: number,
): CharacterProgressionState {
  let level = progression.level;
  let remainingXp = progression.xp + Math.max(Math.trunc(xp), 0);
  let freeAttributePoints = progression.freeAttributePoints;
  let freeSkillPoints = progression.freeSkillPoints;

  while (level < MAX_CHARACTER_LEVEL) {
    const required = xpRequiredForNextLevel(level);
    if (remainingXp < required) {
      break;
    }

    remainingXp -= required;
    level += 1;
    freeAttributePoints += 1;
    freeSkillPoints += 1;
  }

  return {
    ...progression,
    level,
    xp: level === MAX_CHARACTER_LEVEL ? 0 : remainingXp,
    freeAttributePoints,
    freeSkillPoints,
  };
}

/** Gibt genau einen freien Attributpunkt aus; falsche oder nicht verfügbare Ausgaben bleiben aus. */
export function spendAttributePoint(
  progression: CharacterProgressionState,
  attribute: keyof CharacterProgressionState['attributePoints'],
): CharacterProgressionState | null {
  if (progression.freeAttributePoints <= 0) {
    return null;
  }

  return {
    ...progression,
    freeAttributePoints: progression.freeAttributePoints - 1,
    attributePoints: {
      ...progression.attributePoints,
      [attribute]: progression.attributePoints[attribute] + 1,
    },
  };
}

/** Respec erstattet alle verteilten Attributpunkte und zieht den vom Aufrufer bestimmten Goldpreis ab. */
export function respecAttributes(
  progression: CharacterProgressionState,
  gold: number,
  goldCost: number,
): { progression: CharacterProgressionState; gold: number } | null {
  const cost = Math.max(Math.trunc(goldCost), 0);
  if (gold < cost) {
    return null;
  }

  const { ferocity, resilience, vigor } = progression.attributePoints;
  const refunded = ferocity + resilience + vigor;
  return {
    progression: {
      ...progression,
      freeAttributePoints: progression.freeAttributePoints + refunded,
      attributePoints: { ferocity: 0, resilience: 0, vigor: 0 },
    },
    gold: gold - cost,
  };
}

function distributeByLargestRemainder(
  total: number,
  effectiveDamage: Readonly<Record<CharacterId, number>>,
  floorIndex: number,
): Record<CharacterId, number> {
  const damage = TEAM_ORDER.map((id) => Math.max(effectiveDamage[id], 0));
  const totalDamage = damage.reduce((sum, value) => sum + value, 0);
  const weights = totalDamage === 0 ? damage.map(() => 1) : damage;
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  const rotation = ((Math.trunc(floorIndex) % CHARACTER_COUNT) + CHARACTER_COUNT) % CHARACTER_COUNT;
  const exact = TEAM_ORDER.map((id, index) => ({
    id,
    value: (total * (weights[index] as number)) / weightTotal,
  }));
  const result = Object.fromEntries(
    exact.map(({ id, value }) => [id, Math.floor(value)]),
  ) as Record<CharacterId, number>;
  let remainder = total - Object.values(result).reduce((sum, value) => sum + value, 0);
  const rotationRank = (id: CharacterId) =>
    (TEAM_ORDER.indexOf(id) - rotation + CHARACTER_COUNT) % CHARACTER_COUNT;

  for (const entry of [...exact].sort(
    (left, right) =>
      right.value - Math.floor(right.value) - (left.value - Math.floor(left.value)) ||
      rotationRank(left.id) - rotationRank(right.id),
  )) {
    if (remainder === 0) {
      break;
    }
    result[entry.id] += 1;
    remainder -= 1;
  }

  return result;
}
