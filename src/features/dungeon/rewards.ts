import type { SaveData } from '@/features/save/saveSchema';
import { resolveAct1Encounter } from '@/game/encounters/act1';
import { gainExperience } from '@/game/rewards/xpRewards';
import { applySigilDrop } from '@/game/sigils/sigilDrops';
import { sigilDisplayName } from '@/game/sigils/sigils';
import { GEM_COLORS } from '@/game/types';
import type {
  EncounterClass,
  FloorId,
  FloorLoot,
  FloorRewardDefinition,
  GemColor,
  GemStock,
} from '@/game/types';

export interface RewardSummary {
  gold: number;
  xp: number;
  relicShards: number;
  loot: FloorLoot;
}

export interface RewardCommit {
  save: SaveData;
  reward: RewardSummary;
}

/** Relic-Shard-Wert eines Erstsiegs je Encounter-Klasse (PROGRESSION §2). */
const FIRST_VICTORY_RELIC_SHARDS: Readonly<Record<EncounterClass, number>> = {
  normal: 1,
  elite: 3,
  boss: 10,
};

/** Relic-Shard-Wert eines Erstsiegs über die strukturierte Encounter-Klassifikation. */
export function relicShardRewardForFirstVictory(floorId: FloorId): number {
  return FIRST_VICTORY_RELIC_SHARDS[resolveAct1Encounter(floorId).classification];
}

/** Anzeigename je Gem-Farbe (Spieltext, Englisch). */
export const GEM_NAMES: Readonly<Record<GemColor, string>> = {
  amber: 'Amber',
  ruby: 'Ruby',
  sapphire: 'Sapphire',
  emerald: 'Emerald',
  diamond: 'Diamond',
};

/** Formatiert die konkreten Loot-Gewinne eines Siegs; `null`, wenn nichts gedroppt ist. */
export function formatLootGains(loot: FloorLoot): string | null {
  const parts = GEM_COLORS.filter((color) => loot.gems[color] > 0).map(
    (color) => `+${loot.gems[color]} ${GEM_NAMES[color]}`,
  );
  if (loot.cinder > 0) {
    parts.push(`+${loot.cinder} Cinder`);
  }
  if (loot.sigil !== null) {
    parts.push(`${sigilDisplayName(loot.sigil.sigilId)} — Level ${loot.sigil.level}`);
  }
  return parts.length > 0 ? parts.join(' / ') : null;
}

/** Addiert die Gem-Gewinne eines Siegs auf die persistierten Bestände. */
function addGems(stock: GemStock, gains: GemStock): GemStock {
  return Object.fromEntries(
    GEM_COLORS.map((color) => [color, stock[color] + gains[color]]),
  ) as Record<(typeof GEM_COLORS)[number], number>;
}

/** Committet die Belohnung eines Floor-Siegs einschließlich aller daraus folgenden Level-Ups. */
export function commitFloorVictory(save: SaveData, input: FloorRewardDefinition): RewardCommit {
  const isFirstVictory = !save.firstVictories.includes(input.floorId);
  const relicShards = isFirstVictory ? relicShardRewardForFirstVictory(input.floorId) : 0;
  const xp = Object.values(input.characterXp).reduce((total, value) => total + value, 0);

  return {
    reward: { gold: input.gold, xp, relicShards, loot: input.loot },
    save: {
      ...save,
      characters: {
        korvin: {
          ...gainExperience(save.characters.korvin, input.characterXp.korvin),
        },
        rhaya: {
          ...gainExperience(save.characters.rhaya, input.characterXp.rhaya),
        },
        quinn: {
          ...gainExperience(save.characters.quinn, input.characterXp.quinn),
        },
      },
      currencies: {
        gold: save.currencies.gold + input.gold,
        relicShards: save.currencies.relicShards + relicShards,
        cinder: save.currencies.cinder + input.loot.cinder,
      },
      gems: addGems(save.gems, input.loot.gems),
      sigils: applySigilDrop(save.sigils, input.loot.sigil),
      firstVictories: isFirstVictory
        ? [...save.firstVictories, input.floorId]
        : save.firstVictories,
    },
  };
}
