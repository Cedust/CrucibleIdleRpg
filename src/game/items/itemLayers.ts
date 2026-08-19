import type { ArmorItem, Rarity } from '@/game/types';

/**
 * Kapazitäts-Schicht der Item-Anatomie (docs/spec/ITEMS.md#3-seltenheit-sockel--level-cap):
 * Die Seltenheit ist der Master-Regler und bestimmt Sockelzahl, Gem-Level-Cap und
 * Item-Level-Cap. Die Gem-Level-Caps sind PLATZHALTER
 * (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten): verbindlich ist nur, dass
 * die Seltenheit das Gem-Level nach oben deckelt (ITEMS §8); die Stufen sind Tuning.
 */
export const RARITY_LAYER: Readonly<
  Record<Rarity, { sockets: number; gemLevelCap: number; itemLevelCap: number }>
> = {
  common: { sockets: 0, gemLevelCap: 1, itemLevelCap: 20 },
  magic: { sockets: 1, gemLevelCap: 2, itemLevelCap: 40 },
  rare: { sockets: 2, gemLevelCap: 3, itemLevelCap: 60 },
  epic: { sockets: 3, gemLevelCap: 4, itemLevelCap: 80 },
  legendary: { sockets: 4, gemLevelCap: 5, itemLevelCap: 100 },
};

/** Höchstes erreichbares Item-Level — das Cap der höchsten Seltenheit. */
export const MAX_ITEM_LEVEL = RARITY_LAYER.legendary.itemLevelCap;

/** Prismatic-Sockel (docs/spec/ITEMS.md#4-prismatic-sockel), unabhängig von Seltenheit und Brand. */
export function prismaticSocketCount(itemLevel: number): number {
  return Math.floor(itemLevel / 50);
}

/**
 * Prüft die seltenheits-abgeleiteten Invarianten eines persistierten Armor-Items:
 * Item-Level im Cap, Sockelzahlen nach Tabelle und Prismatic-Formel, Gem-Level im
 * Seltenheits-Cap (Attune-Grenze, docs/spec/ITEMS.md#8-jeweler--inlay-attune--recut),
 * Implicit nur auf Legendary (Brand-Ziel, docs/spec/ITEMS.md#7-blacksmith--temper-masterwork--brand).
 * Farb-Pool-Bindung der Gems erzwingt bereits der `SocketedGem`-Typ bzw. das Save-Schema.
 */
export function isValidArmorItemState(item: ArmorItem): boolean {
  const layer = RARITY_LAYER[item.rarity];
  return (
    Number.isInteger(item.itemLevel) &&
    item.itemLevel >= 1 &&
    item.itemLevel <= layer.itemLevelCap &&
    item.sockets.length === layer.sockets &&
    item.sockets.every(
      (gem) =>
        gem === null ||
        (Number.isInteger(gem.gemLevel) && gem.gemLevel >= 1 && gem.gemLevel <= layer.gemLevelCap),
    ) &&
    item.prismaticSockets.length === prismaticSocketCount(item.itemLevel) &&
    (item.implicit === undefined || item.rarity === 'legendary')
  );
}
