import type { ArmorItem, Rarity } from '@/game/types';

/**
 * Kapazitäts-Schicht der Item-Anatomie (docs/spec/ITEMS.md#3-seltenheit-sockel--level-cap):
 * Die Seltenheit ist der Master-Regler und bestimmt Sockelzahl und Item-Level-Cap.
 * Die Cinder-Kosten des Masterwork folgen mit dem Blacksmith (Task 027); das Gem-Level-Cap
 * greift mit dem Jeweler (Task 029).
 */
export const RARITY_LAYER: Readonly<Record<Rarity, { sockets: number; itemLevelCap: number }>> = {
  common: { sockets: 0, itemLevelCap: 20 },
  magic: { sockets: 1, itemLevelCap: 40 },
  rare: { sockets: 2, itemLevelCap: 60 },
  epic: { sockets: 3, itemLevelCap: 80 },
  legendary: { sockets: 4, itemLevelCap: 100 },
};

/** Höchstes erreichbares Item-Level — das Cap der höchsten Seltenheit. */
export const MAX_ITEM_LEVEL = RARITY_LAYER.legendary.itemLevelCap;

/** Prismatic-Sockel (docs/spec/ITEMS.md#4-prismatic-sockel), unabhängig von Seltenheit und Brand. */
export function prismaticSocketCount(itemLevel: number): number {
  return Math.floor(itemLevel / 50);
}

/**
 * Prüft die seltenheits-abgeleiteten Invarianten eines persistierten Armor-Items:
 * Item-Level im Cap, Sockelzahlen nach Tabelle und Prismatic-Formel, Implicit nur auf
 * Legendary (Brand-Ziel, docs/spec/ITEMS.md#7-blacksmith--temper-masterwork--brand).
 * Farb-Pool-Bindung der Gems erzwingt bereits der `SocketedGem`-Typ bzw. das Save-Schema.
 */
export function isValidArmorItemState(item: ArmorItem): boolean {
  const layer = RARITY_LAYER[item.rarity];
  return (
    Number.isInteger(item.itemLevel) &&
    item.itemLevel >= 1 &&
    item.itemLevel <= layer.itemLevelCap &&
    item.sockets.length === layer.sockets &&
    item.prismaticSockets.length === prismaticSocketCount(item.itemLevel) &&
    (item.implicit === undefined || item.rarity === 'legendary')
  );
}
