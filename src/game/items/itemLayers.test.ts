import { describe, expect, it } from 'vitest';
import type { ArmorItem, Rarity, SocketedGem } from '@/game/types';
import { createArmorItem } from './armor';
import {
  isValidArmorItemState,
  MAX_ITEM_LEVEL,
  prismaticSocketCount,
  RARITY_LAYER,
} from './itemLayers';

/** Gültig gefülltes Sockel-Beispiel; Affix-Farb-Bindung erzwingt bereits der Typ. */
const AMBER_GEM: SocketedGem = { color: 'amber', affix: 'critChance', gemLevel: 1, value: 0.02 };

/** Basis-Item mit überschriebenen Handwerks-Schichten für Invarianten-Fälle. */
function craftedChest(layers: Partial<ArmorItem>): ArmorItem {
  return { ...createArmorItem('chest'), ...layers };
}

describe('Seltenheits-Tabelle (ITEMS §3)', () => {
  it('legt Sockelzahl, Gem-Level-Cap und Item-Level-Cap je Seltenheit fest', () => {
    expect(RARITY_LAYER).toEqual({
      common: { sockets: 0, gemLevelCap: 1, itemLevelCap: 20 },
      magic: { sockets: 1, gemLevelCap: 2, itemLevelCap: 40 },
      rare: { sockets: 2, gemLevelCap: 3, itemLevelCap: 60 },
      epic: { sockets: 3, gemLevelCap: 4, itemLevelCap: 80 },
      legendary: { sockets: 4, gemLevelCap: 5, itemLevelCap: 100 },
    });
    expect(MAX_ITEM_LEVEL).toBe(100);
  });
});

describe('Prismatic-Formel (ITEMS §4)', () => {
  it('öffnet einen Prismatic-Sockel bei +50 und einen zweiten bei +100', () => {
    expect(prismaticSocketCount(1)).toBe(0);
    expect(prismaticSocketCount(49)).toBe(0);
    expect(prismaticSocketCount(50)).toBe(1);
    expect(prismaticSocketCount(99)).toBe(1);
    expect(prismaticSocketCount(100)).toBe(2);
  });
});

describe('isValidArmorItemState', () => {
  it('akzeptiert die Common-+1-Startform und voll ausgebaute Schichten', () => {
    expect(isValidArmorItemState(createArmorItem('chest'))).toBe(true);
    expect(
      isValidArmorItemState(
        craftedChest({
          rarity: 'legendary',
          itemLevel: 100,
          sockets: [AMBER_GEM, null, null, null],
          prismaticSockets: [null, null],
          imprint: { sigilId: 'sigil.placeholder' },
        }),
      ),
    ).toBe(true);
  });

  it('deckelt das Item-Level nach oben durch das Seltenheits-Cap', () => {
    expect(isValidArmorItemState(craftedChest({ itemLevel: 20 }))).toBe(true);
    expect(isValidArmorItemState(craftedChest({ itemLevel: 21 }))).toBe(false);
    expect(
      isValidArmorItemState(craftedChest({ rarity: 'magic', itemLevel: 21, sockets: [null] })),
    ).toBe(true);
    expect(isValidArmorItemState(craftedChest({ itemLevel: 0 }))).toBe(false);
    expect(isValidArmorItemState(craftedChest({ itemLevel: 1.5 }))).toBe(false);
  });

  it('verlangt die Sockelzahl exakt nach Seltenheits-Tabelle', () => {
    expect(isValidArmorItemState(craftedChest({ sockets: [null] }))).toBe(false);
    expect(isValidArmorItemState(craftedChest({ rarity: 'magic' }))).toBe(false);
    expect(isValidArmorItemState(craftedChest({ rarity: 'magic', sockets: [AMBER_GEM] }))).toBe(
      true,
    );
    expect(
      isValidArmorItemState(craftedChest({ rarity: 'rare', sockets: [AMBER_GEM, null, null] })),
    ).toBe(false);
  });

  it('verlangt die Prismatic-Sockelzahl exakt nach der Formel', () => {
    expect(
      isValidArmorItemState(craftedChest({ rarity: 'rare', itemLevel: 50, sockets: [null, null] })),
    ).toBe(false);
    expect(
      isValidArmorItemState(
        craftedChest({
          rarity: 'rare',
          itemLevel: 50,
          sockets: [null, null],
          prismaticSockets: [null],
        }),
      ),
    ).toBe(true);
    expect(isValidArmorItemState(craftedChest({ prismaticSockets: [null] }))).toBe(false);
  });

  it('deckelt das Gem-Level gesockelter Gems durch das Seltenheits-Cap (Attune, ITEMS §8)', () => {
    expect(
      isValidArmorItemState(
        craftedChest({ rarity: 'magic', sockets: [{ ...AMBER_GEM, gemLevel: 2 }] }),
      ),
    ).toBe(true);
    expect(
      isValidArmorItemState(
        craftedChest({ rarity: 'magic', sockets: [{ ...AMBER_GEM, gemLevel: 3 }] }),
      ),
    ).toBe(false);
    expect(
      isValidArmorItemState(
        craftedChest({ rarity: 'magic', sockets: [{ ...AMBER_GEM, gemLevel: 0 }] }),
      ),
    ).toBe(false);
    expect(
      isValidArmorItemState(
        craftedChest({ rarity: 'magic', sockets: [{ ...AMBER_GEM, gemLevel: 1.5 }] }),
      ),
    ).toBe(false);
  });

  it('erlaubt ein Imprint ab Magic und lehnt es auf Common ab (Brand-Ziel, ITEMS §7)', () => {
    const imprinted = (rarity: Rarity): ArmorItem =>
      craftedChest({
        rarity,
        sockets: Array.from({ length: RARITY_LAYER[rarity].sockets }, () => null),
        imprint: { sigilId: 'sigil.placeholder' },
      });

    expect(isValidArmorItemState(imprinted('common'))).toBe(false);
    expect(isValidArmorItemState(imprinted('magic'))).toBe(true);
    expect(isValidArmorItemState(imprinted('rare'))).toBe(true);
    expect(isValidArmorItemState(imprinted('epic'))).toBe(true);
    expect(isValidArmorItemState(imprinted('legendary'))).toBe(true);
  });
});
