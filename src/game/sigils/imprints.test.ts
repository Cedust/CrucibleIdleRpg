import { describe, expect, it } from 'vitest';
import { createArmorItem, createTeamArmor } from '@/game/items/armor';
import type { ArmorItem } from '@/game/types';
import {
  activeImprintSigilIds,
  appliedImprints,
  imprintEffectText,
  imprintEffects,
  validateActiveImprints,
} from './imprints';
import { sigilById } from './sigils';

function markedChest(sigilId: string): ArmorItem {
  return {
    ...createArmorItem('chest'),
    rarity: 'magic',
    sockets: [null],
    imprint: { sigilId },
  };
}

describe('imprint effects (ITEMS §5.1)', () => {
  it('derives known Imprints at their Codex level in fixed slot order', () => {
    const loadout = {
      chest: markedChest('sigil.burning-sentence'),
      legs: {
        ...createArmorItem('legs'),
        rarity: 'magic' as const,
        sockets: [null],
        imprint: { sigilId: 'sigil.stormchain' },
      },
    };
    const codex = { 'sigil.burning-sentence': 3, 'sigil.stormchain': 2 } as const;

    expect(appliedImprints(loadout, codex).map(({ sigil, level }) => [sigil.id, level])).toEqual([
      ['sigil.burning-sentence', 3],
      ['sigil.stormchain', 2],
    ]);
  });

  it('keeps Gem-covered stats percentage-only and exposes special non-Gem levers separately', () => {
    const burning = imprintEffects(
      { chest: markedChest('sigil.burning-sentence') },
      { 'sigil.burning-sentence': 3 },
    );
    const warden = imprintEffects(
      { chest: markedChest('sigil.wardens-bastion') },
      { 'sigil.wardens-bastion': 5 },
    );
    const tempered = imprintEffects(
      { chest: markedChest('sigil.tempered-edge') },
      { 'sigil.tempered-edge': 1 },
    );

    expect(burning.offensivePercent.critDamage).toBeCloseTo(0.12, 10);
    expect(warden.blockDamageReductionBonus).toBeCloseTo(0.2, 10);
    expect(tempered.weaponBaseDamagePercent).toBeCloseTo(0.04, 10);
  });

  it('enforces a known, matching, team-unique active Sigil state', () => {
    const armor = createTeamArmor({ 'anvil.armory': 1 });
    const chest = armor.korvin.chest;
    if (chest === undefined) throw new Error('Chest fehlt');
    const marked = {
      ...armor,
      korvin: {
        chest: {
          ...chest,
          rarity: 'magic' as const,
          sockets: [null],
          imprint: {
            sigilId: 'sigil.tempered-edge',
          },
        },
      },
    };

    expect(validateActiveImprints(marked, { 'sigil.tempered-edge': 1 })).toBeNull();
    expect(activeImprintSigilIds(marked)).toEqual(new Set(['sigil.tempered-edge']));
    const rhayaChest = marked.rhaya.chest;
    if (rhayaChest === undefined) throw new Error('Rhaya Chest fehlt');
    expect(
      validateActiveImprints(
        {
          ...marked,
          rhaya: {
            chest: {
              ...rhayaChest,
              rarity: 'magic',
              sockets: [null],
              imprint: { sigilId: 'sigil.tempered-edge' },
            },
          },
        },
        { 'sigil.tempered-edge': 1 },
      ),
    ).toBe('Ein Sigil ist mehrfach aktiv.');
  });

  it('formats item-facing Imprints without the Codex prefix', () => {
    const sigil = sigilById('sigil.wardens-bastion');
    if (sigil === undefined) throw new Error('Sigil fehlt');

    expect(imprintEffectText(sigil, 2)).toBe('Block Reduction +8 pp');
  });
});
