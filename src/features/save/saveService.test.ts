import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SavePort } from '@/shared/ports/savePort';
import { createArmorItem, createTeamArmor } from '@/game/items/armor';
import { createDefaultSave } from './saveSchema';
import { createSaveService } from './saveService';

function memoryPort(initial: string | null): SavePort & { raw: () => string | null } {
  let raw = initial;

  return {
    load: () => Promise.resolve(raw),
    save: (next) => {
      raw = next;
      return Promise.resolve();
    },
    clear: () => {
      raw = null;
      return Promise.resolve();
    },
    raw: () => raw,
  };
}

describe('createSaveService', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ['ungültigem JSON', '{kaputt'],
    ['schema-verletzendem JSON', JSON.stringify({ ...createDefaultSave(777), runCounter: -4 })],
    ['fremder Save-Version', JSON.stringify({ ...createDefaultSave(777), version: 99 })],
  ])('fällt bei %s kontrolliert auf einen neuen Default zurück', async (_label, raw) => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fallback = createDefaultSave(777);
    const service = createSaveService(memoryPort(raw), () => fallback);

    await expect(service.load()).resolves.toEqual(fallback);
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it('setzt einen Save mit dem entfernten Währungsfeld vollständig auf Default zurück', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const legacyCurrencyKey = ['crys', 'tals'].join('');
    const current = createDefaultSave(42);
    const legacy = {
      ...current,
      runCounter: 9,
      currencies: { gold: 50, [legacyCurrencyKey]: 12 },
    };
    const fallback = createDefaultSave(777);
    const service = createSaveService(memoryPort(JSON.stringify(legacy)), () => fallback);

    await expect(service.load()).resolves.toEqual(fallback);
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it('setzt einen Save vor dem Armory-Schema vollständig auf Default zurück', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const oldSave = JSON.parse(JSON.stringify(createDefaultSave(42))) as Record<string, unknown>;
    delete oldSave.armor;
    const fallback = createDefaultSave(777);
    const service = createSaveService(memoryPort(JSON.stringify(oldSave)), () => fallback);

    await expect(service.load()).resolves.toEqual(fallback);
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it('setzt einen Save mit Armor-Items ohne Sockel-Schichten (M3-Form) auf Default zurück', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const m3Item = {
      slot: 'chest',
      itemType: 'armor',
      rarity: 'common',
      itemLevel: 1,
      innate: 'toughness',
    };
    const oldSave = {
      ...createDefaultSave(42),
      crucible: { 'anvil.armory': 1 },
      armor: { korvin: { chest: m3Item }, rhaya: { chest: m3Item }, quinn: { chest: m3Item } },
    };
    const fallback = createDefaultSave(777);
    const service = createSaveService(memoryPort(JSON.stringify(oldSave)), () => fallback);

    await expect(service.load()).resolves.toEqual(fallback);
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it('setzt einen Save mit dem alten Feldnamen der fünften Schicht auf Default zurück', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Der alte Feldname darf in `src/` nicht mehr vorkommen (Task 032) und wird deshalb
    // zur Laufzeit zusammengesetzt.
    const legacyLayerKey = ['imp', 'licit'].join('');
    const brandedChest = {
      ...createArmorItem('chest'),
      rarity: 'legendary',
      sockets: [null, null, null, null],
    };
    const armedSave = (chest: Record<string, unknown>) => ({
      ...createDefaultSave(42),
      crucible: { 'anvil.armory': 1 },
      armor: { ...createTeamArmor({ 'anvil.armory': 1 }), korvin: { chest } },
    });
    const fallback = createDefaultSave(777);

    const legacy = armedSave({
      ...brandedChest,
      [legacyLayerKey]: { sigilId: 'sigil.placeholder' },
    });
    const legacyService = createSaveService(memoryPort(JSON.stringify(legacy)), () => fallback);
    await expect(legacyService.load()).resolves.toEqual(fallback);
    expect(console.warn).toHaveBeenCalledOnce();

    // Gegenprobe: derselbe Save mit dem aktuellen Feldnamen lädt unverändert.
    const current = armedSave({ ...brandedChest, imprint: { sigilId: 'sigil.placeholder' } });
    const currentService = createSaveService(memoryPort(JSON.stringify(current)), () => fallback);
    await expect(currentService.load()).resolves.toEqual(current);
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it('serialisiert validierte Daten ausschließlich über den SavePort', async () => {
    const port = memoryPort(null);
    const service = createSaveService(port, () => createDefaultSave(1));
    const save = { ...createDefaultSave(42), runCounter: 3 };

    await service.save(save);

    expect(JSON.parse(port.raw() ?? 'null')).toEqual(save);
    await expect(service.load()).resolves.toEqual(save);
  });
});
