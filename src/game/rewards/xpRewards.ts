import { TEAM_ORDER } from '@/game/characters/characters';
import {
  MAX_CHARACTER_LEVEL,
  XP_PER_ENEMY_BY_FLOOR,
  XP_REQUIRED_PER_LEVEL,
} from '@/game/curves/progressionCurves';
import type { AttributePoints, CharacterId, CharacterProgressionState } from '@/game/types';

const CHARACTER_COUNT = TEAM_ORDER.length;
const GUARANTEED_SHARE = 0.25;
const ATTRIBUTE_KEYS = [
  'ferocity',
  'resilience',
  'vigor',
] as const satisfies readonly (keyof AttributePoints)[];

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
  let freeMasteryPoints = progression.freeMasteryPoints;

  while (level < MAX_CHARACTER_LEVEL) {
    const required = xpRequiredForNextLevel(level);
    if (remainingXp < required) {
      break;
    }

    remainingXp -= required;
    level += 1;
    freeAttributePoints += 1;
    freeMasteryPoints += 1;
  }

  return {
    ...progression,
    level,
    xp: level === MAX_CHARACTER_LEVEL ? 0 : remainingXp,
    freeAttributePoints,
    freeMasteryPoints,
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

/** Summe der drei Attribute; die Punktsumme bleibt über jede Neuverteilung erhalten. */
function totalAttributePoints(points: AttributePoints): number {
  return points.ferocity + points.resilience + points.vigor;
}

/**
 * Punkte, die eine Neuverteilung aus ihren Attributen zurückholt — die Bemessungsgrundlage des
 * Goldpreises. Punkte, die nur aus dem freien Pool nachgelegt werden, kosten nichts.
 */
export function refundedAttributePoints(current: AttributePoints, target: AttributePoints): number {
  return ATTRIBUTE_KEYS.reduce(
    (sum, attribute) => sum + Math.max(current[attribute] - target[attribute], 0),
    0,
  );
}

/** Preis eines Attribut-Respecs je erstatteten Punkt (CHARACTERS §3). */
export function attributeRespecCost(refundedPoints: number): number {
  // Explicit balancing placeholder; replace only after OPEN_ISSUES decision.
  return Math.max(Math.trunc(refundedPoints), 0) * 25;
}

/**
 * Attribut-Respec als Neuverteilung: schreibt das Ziel, verbucht die Restpunkte als frei und
 * zieht den aus den erstatteten Punkten berechneten Goldpreis ab. Ein vollständiger Respec ist
 * das Ziel `{ ferocity: 0, resilience: 0, vigor: 0 }`. `null` bei ungültigem Ziel, wenn das Ziel
 * mehr Punkte verlangt als der Charakter besitzt, oder ohne Gold-Deckung.
 */
export function redistributeAttributePoints(
  progression: CharacterProgressionState,
  gold: number,
  target: AttributePoints,
): { progression: CharacterProgressionState; gold: number } | null {
  if (
    ATTRIBUTE_KEYS.some(
      (attribute) => !Number.isSafeInteger(target[attribute]) || target[attribute] < 0,
    )
  ) {
    return null;
  }

  const available =
    totalAttributePoints(progression.attributePoints) + progression.freeAttributePoints;
  const requested = totalAttributePoints(target);
  if (requested > available) {
    return null;
  }

  const cost = attributeRespecCost(refundedAttributePoints(progression.attributePoints, target));
  if (gold < cost) {
    return null;
  }

  return {
    progression: {
      ...progression,
      freeAttributePoints: available - requested,
      attributePoints: { ...target },
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
