import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SavePort } from '@/shared/ports/savePort';
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

  it('serialisiert validierte Daten ausschließlich über den SavePort', async () => {
    const port = memoryPort(null);
    const service = createSaveService(port, () => createDefaultSave(1));
    const save = { ...createDefaultSave(42), runCounter: 3 };

    await service.save(save);

    expect(JSON.parse(port.raw() ?? 'null')).toEqual(save);
    await expect(service.load()).resolves.toEqual(save);
  });
});
