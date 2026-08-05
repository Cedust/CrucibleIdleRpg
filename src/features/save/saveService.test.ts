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
  ])('fällt bei %s kontrolliert auf einen neuen Default zurück', async (_label, raw) => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fallback = createDefaultSave(777);
    const service = createSaveService(memoryPort(raw), () => fallback);

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

  it('migrates a v1 save with the first dungeon checkpoint to v2', async () => {
    const saveV1 = Object.fromEntries(
      Object.entries(createDefaultSave(42)).filter(
        ([key]) => key !== 'unlockedDungeonIds' && key !== 'completedDungeons',
      ),
    );
    const service = createSaveService(memoryPort(JSON.stringify({ ...saveV1, version: 1 })), () =>
      createDefaultSave(1),
    );

    await expect(service.load()).resolves.toEqual(createDefaultSave(42));
  });
});
