import { describe, expect, it } from 'vitest';
import type { SavePort } from '@/shared/ports/savePort';
import { deriveFloorSeed, deriveRunSeed } from '@/features/combat/engine/combatState';
import { createDungeonEntryCombat } from '@/features/dungeon/dungeonCombat';
import { createDefaultSave } from './saveSchema';
import { createSaveService } from './saveService';
import { createSaveStore } from './saveStore';

function memoryPort(): SavePort {
  let raw: string | null = null;

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
  };
}

describe('createSaveStore', () => {
  it('persistiert den runCounter vor dem Run und erzeugt pro Run einen anderen Seed', async () => {
    const port = memoryPort();
    const service = createSaveService(port, () => createDefaultSave(4242));
    const store = createSaveStore(service);
    await store.getState().hydrate();

    const first = await store.getState().beginRun();
    const second = await store.getState().beginRun();

    expect(first.runCounter).toBe(1);
    expect(second.runCounter).toBe(2);
    expect(deriveRunSeed(first.saveSeed, 'A1-D1', first.runCounter)).not.toBe(
      deriveRunSeed(second.saveSeed, 'A1-D1', second.runCounter),
    );

    const reloaded = createSaveStore(service);
    await reloaded.getState().hydrate();
    const persisted = reloaded.getState().data;
    expect(persisted?.runCounter).toBe(2);
    expect(
      deriveFloorSeed(
        deriveRunSeed(persisted?.saveSeed ?? 0, 'A1-D1', persisted?.runCounter ?? 0),
        0,
      ),
    ).toBe(deriveFloorSeed(deriveRunSeed(4242, 'A1-D1', 2), 0));
    expect(persisted === null ? null : createDungeonEntryCombat(persisted, 'A1-D1')).toEqual(
      createDungeonEntryCombat(second, 'A1-D1'),
    );
  });

  it('behält committete Belohnungen nach einem Reload, aber keinen Kampfzustand', async () => {
    const port = memoryPort();
    const service = createSaveService(port, () => createDefaultSave(7));
    const running = createSaveStore(service);
    await running.getState().hydrate();
    await running.getState().beginRun();
    await running.getState().commitVictory({
      floorId: 'A1-D1-01',
      gold: 10,
      characterXp: { korvin: 5, rhaya: 5, quinn: 5 },
    });

    const reloaded = createSaveStore(service);
    await reloaded.getState().hydrate();

    expect(reloaded.getState().data?.currencies).toEqual({ gold: 10, crystals: 1 });
    expect(reloaded.getState().data?.characters.korvin.xp).toBe(5);
    expect(reloaded.getState().data).not.toHaveProperty('combat');
  });

  it('persistiert freie Attributverteilung und Gold-Respec über einen Reload', async () => {
    const port = memoryPort();
    const service = createSaveService(port, () => createDefaultSave(7));
    const store = createSaveStore(service);
    await store.getState().hydrate();
    await store.getState().commitVictory({
      floorId: 'A1-D1-01',
      gold: 10,
      characterXp: { korvin: 0, rhaya: 0, quinn: 0 },
    });

    await expect(store.getState().spendAttributePoint('korvin', 'ferocity')).resolves.toBe(true);
    await expect(store.getState().respecAttributes('korvin', 10)).resolves.toBe(true);

    const reloaded = createSaveStore(service);
    await reloaded.getState().hydrate();
    expect(reloaded.getState().data?.characters.korvin).toMatchObject({
      freeAttributePoints: 1,
      attributePoints: { ferocity: 0, resilience: 0, vigor: 0 },
    });
    expect(reloaded.getState().data?.currencies.gold).toBe(0);
  });

  it('marks only the completed dungeon and unlocks its next checkpoint', async () => {
    const port = memoryPort();
    const store = createSaveStore(createSaveService(port, () => createDefaultSave(7)));
    await store.getState().hydrate();

    await store.getState().completeDungeon('A1-D1');
    const reloaded = createSaveStore(createSaveService(port, () => createDefaultSave(99)));
    await reloaded.getState().hydrate();

    expect(reloaded.getState().data?.completedDungeons).toEqual({
      'A1-D1': true,
      'A1-D2': false,
      'A1-D3': false,
      'A1-D4': false,
      'A1-D5': false,
    });
    expect(reloaded.getState().data?.unlockedDungeonIds).toEqual(['A1-D1', 'A1-D2']);
  });

  it('startet keinen Run, wenn der erhöhte runCounter nicht gespeichert werden kann', async () => {
    const port: SavePort = {
      load: () => Promise.resolve(null),
      save: () => Promise.reject(new Error('Speichern fehlgeschlagen')),
      clear: () => Promise.resolve(),
    };
    const store = createSaveStore(createSaveService(port, () => createDefaultSave(99)));
    await store.getState().hydrate();

    await expect(store.getState().beginRun()).rejects.toThrow('Speichern fehlgeschlagen');

    expect(store.getState().data?.runCounter).toBe(0);
    expect(store.getState().status).toBe('error');
  });

  it('meldet einen fehlgeschlagenen Reward-Commit ohne den lokalen Save vorzutäuschen', async () => {
    let writes = 0;
    let raw: string | null = null;
    const port: SavePort = {
      load: () => Promise.resolve(raw),
      save: (next) => {
        writes += 1;
        if (writes === 2) {
          return Promise.reject(new Error('Reward-Save fehlgeschlagen'));
        }
        raw = next;
        return Promise.resolve();
      },
      clear: () => Promise.resolve(),
    };
    const store = createSaveStore(createSaveService(port, () => createDefaultSave(99)));
    await store.getState().hydrate();
    await store.getState().beginRun();

    await expect(
      store.getState().commitVictory({
        floorId: 'A1-D1-01',
        gold: 10,
        characterXp: { korvin: 5, rhaya: 5, quinn: 5 },
      }),
    ).rejects.toThrow('Reward-Save fehlgeschlagen');

    expect(store.getState().data?.currencies).toEqual({ gold: 0, crystals: 0 });
    expect(store.getState().data?.characters.korvin.xp).toBe(0);
    expect(store.getState().status).toBe('error');
  });
});
