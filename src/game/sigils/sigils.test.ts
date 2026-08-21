import { describe, expect, it } from 'vitest';
import {
  SIGILS,
  sigilAct,
  sigilById,
  sigilDisplayName,
  sigilsForSource,
  unlockedSigilActs,
  validateSigilCatalog,
} from './sigils';

describe('SIGILS', () => {
  it('declares all 18 catalog entries with the canonical elite and boss sources', () => {
    expect(validateSigilCatalog()).toBeNull();
    expect(SIGILS).toHaveLength(18);
    expect(SIGILS.filter((sigil) => sigilAct(sigil) === 1)).toHaveLength(5);
    expect(SIGILS.filter((sigil) => sigilAct(sigil) === 2)).toHaveLength(5);
    expect(SIGILS.filter((sigil) => sigilAct(sigil) === 3)).toHaveLength(8);
    expect(sigilsForSource('A3-D5-20')).toHaveLength(4);
    expect(sigilsForSource('A1-D1-20')).toHaveLength(1);
    expect(sigilsForSource('A1-D1-19')).toHaveLength(0);
  });

  it('keeps imprint identity, slot binding and Codex display text addressable by ID', () => {
    const sigil = sigilById('sigil.tempered-edge');

    expect(sigil).toMatchObject({
      name: 'Tempered Edge',
      sourceFloorId: 'A1-D1-20',
      imprint: { id: 'weapon-base-damage' },
      slots: ['chest', 'legs'],
    });
    expect(sigilDisplayName('sigil.tempered-edge')).toBe('Sigil of Tempered Edge');
  });

  it('shows the start act and expands placeholder acts with future Codex knowledge', () => {
    expect(unlockedSigilActs({})).toEqual([1]);
    expect(unlockedSigilActs({ 'sigil.stormchain': 1 })).toEqual([1, 2]);
    expect(unlockedSigilActs({ 'sigil.gilded-force': 1 })).toEqual([1, 2, 3]);
  });
});
