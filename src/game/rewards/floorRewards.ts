import type { CharacterId, EncounterClass, FloorRewardDefinition } from '@/game/types';
import type { SigilCodex } from '@/game/sigils/types';
import { lootStreamPrng, rollFloorLoot } from './lootRewards';
import { distributeFloorXp } from './xpRewards';

/**
 * PLATZHALTER — Gold je Floor-Sieg, bis zum Economy-Pass bewusst konstant
 * (docs/backlog/OPEN_ISSUES.md#1-offene-balancing-fragen--tuning-notizen).
 */
export const FLOOR_GOLD_REWARD = 10;

/** Eingaben eines Floor-Siegs; Encounter-Daten plus Kampfergebnis. */
export interface FloorRewardInput {
  floorId: FloorRewardDefinition['floorId'];
  floorIndex: number;
  /** Quelle des `loot`-Stroms (docs/spec/SIMULATION.md#4-seeds-und-zufalls-ströme). */
  floorSeed: number;
  classification: EncounterClass;
  enemyCount: number;
  /** Codex-Stand vor diesem Sieg; Sigil-Progression wird daraus über den Loot-Strom gerollt. */
  sigils: SigilCodex;
  effectiveDamage: Readonly<Record<CharacterId, number>>;
}

/**
 * Die Gold-Kurve bleibt bis zum Economy-Pass bewusst konstant. XP stammen aus dem deklarativen
 * Progression-Content und dem Ergebnis des gerade gewonnenen Kampfs; der Loot würfelt
 * ausschließlich über den vom Floor-Seed abgeleiteten `loot`-Strom.
 */
export function createFloorReward(input: FloorRewardInput): FloorRewardDefinition {
  const { floorId, floorIndex, floorSeed, classification, enemyCount, effectiveDamage } = input;
  return {
    floorId,
    gold: FLOOR_GOLD_REWARD,
    characterXp: distributeFloorXp({ floorIndex, enemyCount, effectiveDamage }),
    loot: rollFloorLoot(
      { floorId, classification, floorIndex, enemyCount },
      input.sigils,
      lootStreamPrng(floorSeed),
    ),
  };
}
