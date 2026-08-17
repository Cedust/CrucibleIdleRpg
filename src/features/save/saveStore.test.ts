import { describe, expect, it } from 'vitest';
import type { SavePort } from '@/shared/ports/savePort';
import { deriveFloorSeed, deriveRunSeed } from '@/features/combat/engine/combatState';
import { createDungeonEntryCombat } from '@/features/dungeon/dungeonCombat';
import { deriveUnlockedDungeonIds } from '@/game/crucible/crucible';
import { createDefaultSave } from './saveSchema';
import { createSaveService } from './saveService';
import { createSaveStore } from './saveStore';

const NO_LOOT = {
  gems: { amber: 0, ruby: 0, sapphire: 0, emerald: 0, diamond: 0 },
  cinder: 0,
} as const;

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
      loot: { gems: { amber: 1, ruby: 0, sapphire: 0, emerald: 2, diamond: 0 }, cinder: 1 },
    });

    const reloaded = createSaveStore(service);
    await reloaded.getState().hydrate();

    expect(reloaded.getState().data?.currencies).toEqual({ gold: 10, relicShards: 1, cinder: 1 });
    expect(reloaded.getState().data?.gems).toEqual({
      amber: 1,
      ruby: 0,
      sapphire: 0,
      emerald: 2,
      diamond: 0,
    });
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
      loot: { gems: { amber: 0, ruby: 0, sapphire: 0, emerald: 0, diamond: 0 }, cinder: 0 },
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

  it('marks only the completed dungeon; the entry follows from the waystone purchase', async () => {
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
    // Der Abschluss allein schaltet nichts frei (PROGRESSION §3.1).
    expect(deriveUnlockedDungeonIds(reloaded.getState().data?.crucible ?? {})).toEqual(['A1-D1']);
  });

  it('kauft Crucible-Ränge gegen Relic Shards und leitet den Einstieg aus dem Waystone-Rang ab', async () => {
    const port = memoryPort();
    const service = createSaveService(port, () => createDefaultSave(7));
    const store = createSaveStore(service);
    await store.getState().hydrate();

    // Ohne Vollendet-Flag ist der Waystone-Kauf abgelehnt, auch mit Deckung.
    await store.getState().commitVictory({
      floorId: 'A1-D1-20',
      gold: 0,
      characterXp: { korvin: 0, rhaya: 0, quinn: 0 },
      loot: NO_LOOT,
    });
    await expect(store.getState().buyCrucibleNode('anvil.waystones')).resolves.toBe(false);

    await store.getState().completeDungeon('A1-D1');
    await expect(store.getState().buyCrucibleNode('anvil.waystones')).resolves.toBe(true);
    await expect(store.getState().buyCrucibleNode('smelting.overpower')).resolves.toBe(true);
    // Elite-Erstsieg = 3 Relic Shards; Waystone Rang 1 + Overpower Rang 1 kosten 2.
    expect(store.getState().data?.currencies.relicShards).toBe(1);

    const reloaded = createSaveStore(service);
    await reloaded.getState().hydrate();
    expect(reloaded.getState().data?.crucible).toEqual({
      'anvil.waystones': 1,
      'smelting.overpower': 1,
    });
    expect(deriveUnlockedDungeonIds(reloaded.getState().data?.crucible ?? {})).toEqual([
      'A1-D1',
      'A1-D2',
    ]);
  });

  it('creates all three permanent Common +1 Armor bases atomically with each Armory rank and reloads them', async () => {
    const port = memoryPort();
    const service = createSaveService(port, () => createDefaultSave(7));
    const store = createSaveStore(service);
    await store.getState().hydrate();

    const base = store.getState().data;
    if (base === null) throw new Error('Save fehlt');
    store.setState({ data: { ...base, currencies: { ...base.currencies, relicShards: 3 } } });

    await expect(store.getState().buyCrucibleNode('anvil.armory')).resolves.toBe(true);
    await expect(store.getState().buyCrucibleNode('anvil.armory')).resolves.toBe(true);
    const commonLayers = {
      rarity: 'common',
      itemLevel: 1,
      sockets: [],
      prismaticSockets: [],
    } as const;
    const commonPair = {
      chest: { slot: 'chest', itemType: 'armor', innate: 'toughness', ...commonLayers },
      legs: { slot: 'legs', itemType: 'legguards', innate: 'toughness', ...commonLayers },
    };
    expect(store.getState().data?.armor).toEqual({
      korvin: commonPair,
      rhaya: commonPair,
      quinn: commonPair,
    });

    const reloaded = createSaveStore(service);
    await reloaded.getState().hydrate();
    expect(reloaded.getState().data?.armor).toEqual(store.getState().data?.armor);
  });

  it('erstattet beim Tree-Respec exakt die investierten Relic Shards und lässt Anvil unberührt', async () => {
    const port = memoryPort();
    const service = createSaveService(port, () => createDefaultSave(7));
    const store = createSaveStore(service);
    await store.getState().hydrate();

    const base = store.getState().data;
    if (base === null) throw new Error('Save fehlt');
    store.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, relicShards: 0 },
        crucible: {
          'anvil.waystones': 1,
          'smelting.overpower': 2,
          'smelting.quick-step': 1,
          'molten.rally': 2,
        },
        completedDungeons: { ...base.completedDungeons, 'A1-D1': true },
      },
    });

    await expect(store.getState().respecCrucible('smelting')).resolves.toBe(true);
    expect(store.getState().data?.crucible).toEqual({
      'anvil.waystones': 1,
      'molten.rally': 2,
    });
    expect(store.getState().data?.currencies.relicShards).toBe(4);

    await expect(store.getState().respecCrucible('smelting')).resolves.toBe(false);
  });

  it('sperrt Crucible-Kauf und -Respec über das injizierte Optimierungs-Prädikat', async () => {
    const service = createSaveService(memoryPort(), () => createDefaultSave(7));
    let allowed = false;
    const store = createSaveStore(service, { canOptimize: () => allowed });
    await store.getState().hydrate();

    const base = store.getState().data;
    if (base === null) throw new Error('Save fehlt');
    store.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, relicShards: 10 },
        crucible: { 'molten.rally': 1 },
      },
    });

    await expect(store.getState().buyCrucibleNode('molten.rally')).resolves.toBe(false);
    await expect(store.getState().buyCrucibleNode('anvil.armory')).resolves.toBe(false);
    await expect(store.getState().respecCrucible('molten')).resolves.toBe(false);
    expect(store.getState().data?.crucible).toEqual({ 'molten.rally': 1 });
    expect(store.getState().data?.armor.korvin).toEqual({});

    allowed = true;
    await expect(store.getState().buyCrucibleNode('molten.rally')).resolves.toBe(true);
    expect(store.getState().data?.crucible).toEqual({ 'molten.rally': 2 });
    expect(store.getState().data?.currencies.relicShards).toBe(8);
  });

  it('serialisiert überlappende Actions ohne Lost Update', async () => {
    const port = memoryPort();
    const service = createSaveService(port, () => createDefaultSave(7));
    const store = createSaveStore(service);
    await store.getState().hydrate();

    // Beide Actions starten auf demselben Stand; die Queue lässt die zweite auf dem
    // Ergebnis der ersten aufbauen, statt es zu überschreiben.
    const victory = store.getState().commitVictory({
      floorId: 'A1-D1-01',
      gold: 10,
      characterXp: { korvin: 5, rhaya: 5, quinn: 5 },
      loot: NO_LOOT,
    });
    const speed = store.getState().setPlaybackSpeed(2);
    await Promise.all([victory, speed]);

    expect(store.getState().data?.currencies.gold).toBe(10);
    expect(store.getState().data?.playbackSpeed).toBe(2);

    const reloaded = createSaveStore(service);
    await reloaded.getState().hydrate();
    expect(reloaded.getState().data?.currencies.gold).toBe(10);
    expect(reloaded.getState().data?.playbackSpeed).toBe(2);
  });

  it('sperrt Mastery-Respec über das injizierte Prädikat', async () => {
    const service = createSaveService(memoryPort(), () => createDefaultSave(7));
    let allowed = false;
    const store = createSaveStore(service, { canOptimize: () => allowed });
    await store.getState().hydrate();

    const base = store.getState().data;
    if (base === null) throw new Error('Save fehlt');
    // Gültiger Stand nach Schema-Invarianten: Level = freie + investierte Punkte je Sorte.
    store.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, gold: 1000 },
        characters: {
          ...base.characters,
          korvin: {
            ...base.characters.korvin,
            level: 2,
            freeAttributePoints: 2,
            freeMasteryPoints: 0,
            masteryRanks: { 'finesse.chc-i': 2 },
          },
        },
      },
    });

    await expect(store.getState().respecDiscipline('korvin', 'finesse')).resolves.toBe(false);
    expect(store.getState().data?.characters.korvin.masteryRanks).toEqual({
      'finesse.chc-i': 2,
    });

    allowed = true;
    await expect(store.getState().respecDiscipline('korvin', 'finesse')).resolves.toBe(true);
    expect(store.getState().data?.characters.korvin.masteryRanks).toEqual({});
    expect(store.getState().data?.currencies.gold).toBe(1000 - 150);
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
        loot: NO_LOOT,
      }),
    ).rejects.toThrow('Reward-Save fehlgeschlagen');

    expect(store.getState().data?.currencies).toEqual({ gold: 0, relicShards: 0, cinder: 0 });
    expect(store.getState().data?.characters.korvin.xp).toBe(0);
    expect(store.getState().status).toBe('error');
  });
});
