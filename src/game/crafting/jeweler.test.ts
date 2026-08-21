import { describe, expect, it } from 'vitest';
import { createArmorItem } from '@/game/items/armor';
import { GEM_POOLS, GEM_VALUE_RANGES } from '@/game/items/gems';
import { isValidArmorItemState, RARITY_LAYER } from '@/game/items/itemLayers';
import type { ArmorItem, GemStock, Rarity, RegularGemColor } from '@/game/types';
import { createPrng } from '@/shared/utils/prng';
import { gemValueRange } from '@/game/items/gems';
import {
  applyAttune,
  applyInlay,
  applyRecut,
  ATTUNE_GOLD_COST,
  attuneFailure,
  attuneFodderCost,
  craftLootPrng,
  INLAY_GOLD_COST,
  inlayFailure,
  RECUT_GOLD_COST,
  recutFailure,
  rollGem,
  type JewelerFunds,
} from './jeweler';

function itemAt(rarity: Rarity): ArmorItem {
  return {
    ...createArmorItem('chest'),
    rarity,
    sockets: Array.from({ length: RARITY_LAYER[rarity].sockets }, () => null),
  };
}

function stock(overrides: Partial<GemStock> = {}): GemStock {
  return { amber: 0, ruby: 0, sapphire: 0, emerald: 0, diamond: 0, ...overrides };
}

function funds(overrides: Partial<GemStock> = {}, gold = 1000): JewelerFunds {
  return { gold, gems: stock(overrides) };
}

describe('rollGem (ITEMS §8)', () => {
  it('rollt den Affix aus dem Farb-Pool und den Wert aus dessen Range', () => {
    for (const color of ['amber', 'ruby', 'sapphire', 'emerald'] as const) {
      for (let seed = 0; seed < 20; seed += 1) {
        const gem = rollGem(color, createPrng(seed));
        const range = GEM_VALUE_RANGES[gem.affix];

        expect(gem.color).toBe(color);
        expect(gem.gemLevel).toBe(1);
        expect(GEM_POOLS[color]).toContain(gem.affix);
        expect(gem.value).toBeGreaterThanOrEqual(range.min);
        expect(gem.value).toBeLessThanOrEqual(range.max);
      }
    }
  });

  it('liefert für gleiche Seeds exakt denselben Roll', () => {
    expect(rollGem('amber', createPrng(4242))).toEqual(rollGem('amber', createPrng(4242)));
    expect(rollGem('ruby', craftLootPrng(7, 0))).toEqual(rollGem('ruby', craftLootPrng(7, 0)));
  });

  it('würfelt über verschiedene craftCounter frisch', () => {
    const rolls = Array.from({ length: 8 }, (_, counter) =>
      JSON.stringify(rollGem('sapphire', craftLootPrng(7, counter))),
    );

    expect(new Set(rolls).size).toBeGreaterThan(1);
  });
});

describe('inlay (ITEMS §8)', () => {
  it('verbraucht genau einen Gem der Farbe, zahlt Gold und bindet den Roll an den Sockel', () => {
    const outcome = applyInlay(itemAt('magic'), 0, 'amber', funds({ amber: 2 }), createPrng(1));

    expect(outcome?.gems).toEqual(stock({ amber: 1 }));
    expect(outcome?.gold).toBe(1000 - INLAY_GOLD_COST);
    expect(outcome?.item.sockets).toHaveLength(1);
    expect(outcome?.item.sockets[0]).toMatchObject({ color: 'amber', gemLevel: 1 });
    expect(outcome === null ? false : isValidArmorItemState(outcome.item)).toBe(true);
  });

  it('lässt alle anderen Schichten und Sockel unberührt', () => {
    const item = itemAt('rare');
    const outcome = applyInlay(item, 1, 'emerald', funds({ emerald: 1 }), createPrng(2));

    expect(outcome?.item).toEqual({
      ...item,
      sockets: [null, outcome?.item.sockets[1]],
    });
  });

  it('überschreibt einen belegten Sockel; der alte Gem ist verloren, der Bestand unverändert', () => {
    const first = applyInlay(
      itemAt('magic'),
      0,
      'ruby',
      funds({ ruby: 1, amber: 1 }),
      createPrng(3),
    );
    if (first === null) throw new Error('Inlay abgelehnt');

    const second = applyInlay(
      first.item,
      0,
      'amber',
      { gold: first.gold, gems: first.gems },
      createPrng(4),
    );

    expect(second?.item.sockets[0]).toMatchObject({ color: 'amber' });
    // Der überschriebene Ruby kehrt nicht in den Bestand zurück; nur der Amber wurde gezahlt.
    expect(second?.gems).toEqual(stock());
  });

  it('ist deterministisch: gleicher Seed und gleiche Eingaben liefern denselben Ausgang', () => {
    const run = () =>
      applyInlay(itemAt('epic'), 2, 'sapphire', funds({ sapphire: 3 }), createPrng(99));

    expect(run()).toEqual(run());
  });

  it('lehnt Items ohne Sockel mit Verweis auf das Masterwork ab', () => {
    expect(inlayFailure(itemAt('common'), 0, 'amber', funds({ amber: 1 }))).toBe(
      'The piece has no sockets. Masterwork opens the first socket.',
    );
    expect(applyInlay(itemAt('common'), 0, 'amber', funds({ amber: 1 }), createPrng(5))).toBeNull();
  });

  it('lehnt ungültige Sockel-Indizes ab', () => {
    const item = itemAt('magic');

    for (const socketIndex of [-1, 1, 0.5]) {
      expect(inlayFailure(item, socketIndex, 'amber', funds({ amber: 1 }))).toBe(
        'No socket selected.',
      );
      expect(applyInlay(item, socketIndex, 'amber', funds({ amber: 1 }), createPrng(6))).toBeNull();
    }
  });

  it('lehnt leere Bestände und fehlendes Gold mit benanntem Grund ab', () => {
    const item = itemAt('magic');

    expect(inlayFailure(item, 0, 'emerald', funds())).toBe('No Emerald in stock.');
    expect(inlayFailure(item, 0, 'emerald', funds({ emerald: 1 }, INLAY_GOLD_COST - 1))).toBe(
      'Not enough Gold.',
    );
    expect(inlayFailure(item, 0, 'emerald', funds({ emerald: 1 }, INLAY_GOLD_COST))).toBeNull();
    expect(applyInlay(item, 0, 'emerald', funds(), createPrng(7))).toBeNull();
  });

  it('sockelt jede reguläre Farbe nur mit ihrem eigenen Bestand', () => {
    const item = itemAt('legendary');
    const colors: RegularGemColor[] = ['amber', 'ruby', 'sapphire', 'emerald'];

    for (const [index, color] of colors.entries()) {
      const outcome = applyInlay(item, index, color, funds({ [color]: 1 }), createPrng(index));
      expect(outcome?.item.sockets[index]).toMatchObject({ color });
      expect(outcome?.gems[color]).toBe(0);
    }
  });
});

describe('attune (ITEMS §8)', () => {
  /** Rare-Item mit einem gebundenen Emerald auf wählbarem Level und Wert. */
  function itemWithGem(gemLevel: number, value: number, rarity: Rarity = 'rare'): ArmorItem {
    const item = itemAt(rarity);
    return {
      ...item,
      sockets: item.sockets.map((_, index) =>
        index === 0
          ? { color: 'emerald' as const, affix: 'might' as const, gemLevel, value }
          : null,
      ),
    };
  }

  it('hebt das Gem-Level um genau eine Stufe und zahlt Gold plus Fodder gleicher Farbe', () => {
    const range = gemValueRange('might', 1);
    const outcome = applyAttune(itemWithGem(1, range.min), 0, funds({ emerald: 10 }));

    expect(outcome?.item.sockets[0]).toMatchObject({ color: 'emerald', gemLevel: 2 });
    expect(outcome?.gold).toBe(1000 - ATTUNE_GOLD_COST);
    expect(outcome?.gems.emerald).toBe(10 - attuneFodderCost(1));
    expect(outcome === null ? false : isValidArmorItemState(outcome.item)).toBe(true);
  });

  it('erhält die relative Position des Werts in der wachsenden Range', () => {
    for (const position of [0, 0.25, 0.5, 1]) {
      const from = gemValueRange('might', 2);
      const to = gemValueRange('might', 3);
      const value = from.min + position * (from.max - from.min);
      const outcome = applyAttune(itemWithGem(2, value), 0, funds({ emerald: 100 }));
      const gem = outcome?.item.sockets[0];

      expect(gem?.value).toBeCloseTo(to.min + position * (to.max - to.min), 10);
      expect(gem?.value).toBeGreaterThan(value);
    }
  });

  it('verlangt je Level streng monoton mehr Fodder (markierte Balancing-Kurve)', () => {
    for (let level = 1; level < 5; level += 1) {
      expect(Number.isInteger(attuneFodderCost(level))).toBe(true);
      expect(attuneFodderCost(level)).toBeGreaterThan(0);
      if (level > 1) {
        expect(attuneFodderCost(level)).toBeGreaterThan(attuneFodderCost(level - 1));
      }
    }
  });

  it('stoppt am Gem-Level-Cap der Item-Seltenheit und nennt Masterwork als Weg', () => {
    const capped = itemWithGem(3, gemValueRange('might', 3).min);

    expect(attuneFailure(capped, 0, funds({ emerald: 100 }))).toBe(
      'Gem level is at the Rare cap. Masterwork raises the cap.',
    );
    expect(applyAttune(capped, 0, funds({ emerald: 100 }))).toBeNull();

    const legendary = itemWithGem(5, gemValueRange('might', 5).min, 'legendary');
    expect(attuneFailure(legendary, 0, funds({ emerald: 100 }))).toBe(
      'Gem level is at the Legendary maximum.',
    );
  });

  it('lehnt leere Sockel, fehlendes Fodder und fehlendes Gold mit benanntem Grund ab', () => {
    expect(attuneFailure(itemAt('rare'), 0, funds({ emerald: 100 }))).toBe(
      'The socket holds no gem.',
    );
    const item = itemWithGem(1, gemValueRange('might', 1).min);
    expect(attuneFailure(item, 0, funds({ emerald: attuneFodderCost(1) - 1 }))).toBe(
      'Not enough Emerald fodder.',
    );
    expect(
      attuneFailure(item, 0, funds({ emerald: attuneFodderCost(1) }, ATTUNE_GOLD_COST - 1)),
    ).toBe('Not enough Gold.');
    expect(attuneFailure(item, 0, funds({ emerald: attuneFodderCost(1) }))).toBeNull();
    expect(applyAttune(itemAt('rare'), 0, funds({ emerald: 100 }))).toBeNull();
  });
});

describe('recut (ITEMS §8)', () => {
  function itemWithGem(gemLevel: number, value: number): ArmorItem {
    const item = itemAt('rare');
    return {
      ...item,
      sockets: item.sockets.map((_, index) =>
        index === 0
          ? { color: 'sapphire' as const, affix: 'barrier' as const, gemLevel, value }
          : null,
      ),
    };
  }

  it('würfelt den Wert innerhalb der aktuellen Range neu und lässt alles andere unberührt', () => {
    const range = gemValueRange('barrier', 2);
    const item = itemWithGem(2, range.min);
    const outcome = applyRecut(item, 0, 1000, createPrng(11));
    const gem = outcome?.item.sockets[0];

    expect(gem).toMatchObject({ color: 'sapphire', affix: 'barrier', gemLevel: 2 });
    expect(gem?.value).toBeGreaterThanOrEqual(range.min);
    expect(gem?.value).toBeLessThanOrEqual(range.max);
    expect(outcome?.gold).toBe(1000 - RECUT_GOLD_COST);
    expect(outcome?.item.sockets[1]).toBeNull();
    expect(outcome === null ? false : isValidArmorItemState(outcome.item)).toBe(true);
  });

  it('liefert für gleiche Seeds exakt denselben Wert', () => {
    const item = itemWithGem(1, gemValueRange('barrier', 1).max);
    const first = applyRecut(item, 0, 1000, craftLootPrng(7, 3));
    const second = applyRecut(item, 0, 1000, craftLootPrng(7, 3));

    expect(first).toEqual(second);
  });

  it('lehnt leere Sockel und fehlendes Gold mit benanntem Grund ab', () => {
    expect(recutFailure(itemAt('rare'), 0, 1000)).toBe('The socket holds no gem.');
    const item = itemWithGem(1, gemValueRange('barrier', 1).min);
    expect(recutFailure(item, 0, RECUT_GOLD_COST - 1)).toBe('Not enough Gold.');
    expect(recutFailure(item, 0, RECUT_GOLD_COST)).toBeNull();
    expect(applyRecut(itemAt('rare'), 0, 1000, createPrng(12))).toBeNull();
  });
});
