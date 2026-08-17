import { describe, expect, it } from 'vitest';
import { createArmorItem } from '@/game/items/armor';
import { isValidArmorItemState, MAX_ITEM_LEVEL, RARITY_LAYER } from '@/game/items/itemLayers';
import type { ArmorItem, Rarity } from '@/game/types';
import {
  applyMasterwork,
  applyTemper,
  MASTERWORK_CINDER_COST,
  masterworkCost,
  masterworkFailure,
  nextRarity,
  temperFailure,
  temperGoldCost,
} from './blacksmith';

/** Gültiges Item auf beliebiger Schichten-Kombination als Test-Eingabe. */
function itemAt(rarity: Rarity, itemLevel: number): ArmorItem {
  return {
    ...createArmorItem('chest'),
    rarity,
    itemLevel,
    sockets: Array.from({ length: RARITY_LAYER[rarity].sockets }, () => null),
    prismaticSockets: Array.from({ length: Math.floor(itemLevel / 50) }, () => null),
  };
}

describe('temper (ITEMS §7)', () => {
  it('raises the item level by exactly one and pays the gold cost', () => {
    const outcome = applyTemper(createArmorItem('chest'), 1000);

    expect(outcome?.item.itemLevel).toBe(2);
    expect(outcome?.gold).toBe(1000 - temperGoldCost(1));
    expect(outcome === null ? false : isValidArmorItemState(outcome.item)).toBe(true);
  });

  it('keeps every other layer untouched', () => {
    const item = itemAt('magic', 3);
    const outcome = applyTemper(item, 1000);

    expect(outcome?.item).toEqual({ ...item, itemLevel: 4 });
  });

  it('prices each step along a strictly increasing gold curve up to +99', () => {
    for (let level = 1; level < MAX_ITEM_LEVEL; level += 1) {
      expect(Number.isInteger(temperGoldCost(level))).toBe(true);
      expect(temperGoldCost(level)).toBeGreaterThan(0);
      if (level > 1) {
        expect(temperGoldCost(level)).toBeGreaterThan(temperGoldCost(level - 1));
      }
    }
  });

  it('stops at the rarity cap and names Masterwork as the way forward', () => {
    const capped = itemAt('common', RARITY_LAYER.common.itemLevelCap);

    expect(temperFailure(capped, 1_000_000)).toBe(
      'Item level is at the Common cap. Masterwork raises the cap.',
    );
    expect(applyTemper(capped, 1_000_000)).toBeNull();
  });

  it('names the Legendary maximum without pointing to Masterwork', () => {
    const capped = itemAt('legendary', MAX_ITEM_LEVEL);

    expect(temperFailure(capped, 1_000_000)).toBe('Item level is at the Legendary maximum.');
    expect(applyTemper(capped, 1_000_000)).toBeNull();
  });

  it('rejects unaffordable tempers with a general shortage notice', () => {
    const item = createArmorItem('chest');
    const cost = temperGoldCost(1);

    expect(temperFailure(item, cost - 1)).toBe('Not enough Gold.');
    expect(applyTemper(item, cost - 1)).toBeNull();
    expect(temperFailure(item, cost)).toBeNull();
  });

  it('opens the prismatic sockets at +50 and +100 (ITEMS §4)', () => {
    const beforeFirst = applyTemper(itemAt('rare', 49), 1_000_000);
    expect(beforeFirst?.item.prismaticSockets).toHaveLength(1);

    const beforeSecond = applyTemper(itemAt('legendary', 99), 1_000_000);
    expect(beforeSecond?.item.prismaticSockets).toHaveLength(2);
    expect(beforeSecond === null ? false : isValidArmorItemState(beforeSecond.item)).toBe(true);
  });
});

describe('masterwork (ITEMS §3/§7)', () => {
  it('walks the rarity ladder and prices Cinder by the spec table', () => {
    expect(nextRarity('common')).toBe('magic');
    expect(nextRarity('legendary')).toBeUndefined();
    expect(MASTERWORK_CINDER_COST).toEqual({ magic: 1, rare: 3, epic: 6, legendary: 10 });
    expect(masterworkCost('legendary')).toBeUndefined();
  });

  it('raises the rarity by one stage and opens exactly one socket', () => {
    const outcome = applyMasterwork(createArmorItem('chest'), { gold: 10_000, cinder: 10 });
    const cost = masterworkCost('common');

    expect(outcome?.item.rarity).toBe('magic');
    expect(outcome?.item.sockets).toEqual([null]);
    expect(outcome?.gold).toBe(10_000 - (cost?.gold ?? 0));
    expect(outcome?.cinder).toBe(10 - (cost?.cinder ?? 0));
    expect(outcome === null ? false : isValidArmorItemState(outcome.item)).toBe(true);
  });

  it('is available at any item level once the costs are covered', () => {
    // Kein Mindestlevel: Common +1 ist sofort masterworkbar (ITEMS §3).
    expect(masterworkFailure(createArmorItem('chest'), { gold: 10_000, cinder: 1 })).toBeNull();
  });

  it('reaches Legendary through the full ladder and then stops', () => {
    let item = createArmorItem('chest');
    let funds = { gold: 100_000, cinder: 100 };

    for (const expected of ['magic', 'rare', 'epic', 'legendary'] as const) {
      const outcome = applyMasterwork(item, funds);
      if (outcome === null) throw new Error('Masterwork abgelehnt');
      item = outcome.item;
      funds = { gold: outcome.gold, cinder: outcome.cinder };
      expect(item.rarity).toBe(expected);
      expect(isValidArmorItemState(item)).toBe(true);
    }

    expect(item.sockets).toHaveLength(4);
    expect(funds.cinder).toBe(100 - (1 + 3 + 6 + 10));
    expect(masterworkFailure(item, { gold: 100_000, cinder: 100 })).toBe(
      'Legendary is the highest rarity.',
    );
    expect(applyMasterwork(item, { gold: 100_000, cinder: 100 })).toBeNull();
  });

  it('names every missing cost component, Gold before Cinder', () => {
    const item = createArmorItem('chest');
    const cost = masterworkCost('common');
    if (cost === undefined) throw new Error('Kosten fehlen');

    expect(masterworkFailure(item, { gold: cost.gold, cinder: 0 })).toBe('Not enough Cinder.');
    expect(masterworkFailure(item, { gold: 0, cinder: cost.cinder })).toBe('Not enough Gold.');
    expect(masterworkFailure(item, { gold: 0, cinder: 0 })).toBe('Not enough Gold and Cinder.');
    expect(applyMasterwork(item, { gold: 0, cinder: 0 })).toBeNull();
  });

  it('raises the item level cap so the next temper continues (Stamm-Modell, ITEMS §2)', () => {
    const capped = itemAt('common', RARITY_LAYER.common.itemLevelCap);
    expect(applyTemper(capped, 1_000_000)).toBeNull();

    const mastered = applyMasterwork(capped, { gold: 10_000, cinder: 10 });
    if (mastered === null) throw new Error('Masterwork abgelehnt');

    const tempered = applyTemper(mastered.item, 1_000_000);
    expect(tempered?.item.itemLevel).toBe(RARITY_LAYER.common.itemLevelCap + 1);
    expect(tempered === null ? false : isValidArmorItemState(tempered.item)).toBe(true);
  });
});
