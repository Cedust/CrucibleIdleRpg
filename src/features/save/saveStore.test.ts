import { describe, expect, it } from 'vitest';
import type { SavePort } from '@/shared/ports/savePort';
import { deriveFloorSeed, deriveRunSeed } from '@/features/combat/engine/combatState';
import { createDungeonEntryCombat } from '@/features/dungeon/dungeonCombat';
import {
  ATTUNE_GOLD_COST,
  attuneFodderCost,
  craftLootPrng,
  INLAY_GOLD_COST,
  RECUT_GOLD_COST,
  rollGem,
} from '@/game/crafting/jeweler';
import { gemValueRange } from '@/game/items/gems';
import { attributeRespecCost } from '@/game/rewards/xpRewards';
import { deriveUnlockedDungeonIds } from '@/game/crucible/crucible';
import { createTeamArmor } from '@/game/items/armor';
import { createDefaultSave } from './saveSchema';
import { createSaveService } from './saveService';
import { createSaveStore } from './saveStore';

const NO_LOOT = {
  gems: { amber: 0, ruby: 0, sapphire: 0, emerald: 0, diamond: 0 },
  cinder: 0,
  runewords: 0,
  sigil: null,
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
      loot: {
        gems: { amber: 1, ruby: 0, sapphire: 0, emerald: 2, diamond: 0 },
        cinder: 1,
        runewords: 4,
        sigil: null,
      },
    });

    const reloaded = createSaveStore(service);
    await reloaded.getState().hydrate();

    expect(reloaded.getState().data?.currencies).toEqual({
      gold: 10,
      relicShards: 1,
      cinder: 1,
      runewords: 4,
    });
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

  it('persistiert einen Sigil-Codex-Drop atomar mit dem Floor-Sieg', async () => {
    const service = createSaveService(memoryPort(), () => createDefaultSave(7));
    const store = createSaveStore(service);
    await store.getState().hydrate();

    await store.getState().commitVictory({
      floorId: 'A1-D1-20',
      gold: 0,
      characterXp: { korvin: 0, rhaya: 0, quinn: 0 },
      loot: { ...NO_LOOT, sigil: { sigilId: 'sigil.tempered-edge', level: 1 } },
    });

    expect(store.getState().data?.sigils).toEqual({ 'sigil.tempered-edge': 1 });
  });

  it('persistiert freie Attributverteilung und Gold-Respec über einen Reload', async () => {
    const port = memoryPort();
    const service = createSaveService(port, () => createDefaultSave(7));
    const store = createSaveStore(service);
    await store.getState().hydrate();
    await store.getState().commitVictory({
      floorId: 'A1-D1-01',
      gold: attributeRespecCost(1),
      characterXp: { korvin: 0, rhaya: 0, quinn: 0 },
      loot: {
        gems: { amber: 0, ruby: 0, sapphire: 0, emerald: 0, diamond: 0 },
        cinder: 0,
        runewords: 0,
        sigil: null,
      },
    });

    await expect(store.getState().spendAttributePoint('korvin', 'ferocity')).resolves.toBe(true);
    // Ein Punkt verlässt Ferocity und landet auf Vigor; nur dieser Punkt kostet Gold.
    await expect(
      store
        .getState()
        .redistributeAttributePoints('korvin', { ferocity: 0, resilience: 0, vigor: 1 }),
    ).resolves.toBe(true);

    const reloaded = createSaveStore(service);
    await reloaded.getState().hydrate();
    expect(reloaded.getState().data?.characters.korvin).toMatchObject({
      freeAttributePoints: 0,
      attributePoints: { ferocity: 0, resilience: 0, vigor: 1 },
    });
    expect(reloaded.getState().data?.currencies.gold).toBe(0);
  });

  it('lehnt eine Neuverteilung ohne Gold-Deckung und während eines Runs ab', async () => {
    const service = createSaveService(memoryPort(), () => createDefaultSave(7));
    const store = createSaveStore(service);
    await store.getState().hydrate();
    await expect(store.getState().spendAttributePoint('korvin', 'ferocity')).resolves.toBe(true);

    // Ohne Gold bleibt jede kostenpflichtige Neuverteilung aus.
    await expect(
      store
        .getState()
        .redistributeAttributePoints('korvin', { ferocity: 0, resilience: 1, vigor: 0 }),
    ).resolves.toBe(false);
    expect(store.getState().data?.characters.korvin.attributePoints).toEqual({
      ferocity: 1,
      resilience: 0,
      vigor: 0,
    });

    const locked = createSaveStore(
      createSaveService(memoryPort(), () => createDefaultSave(7)),
      {
        canOptimize: () => false,
      },
    );
    await locked.getState().hydrate();
    await expect(
      locked
        .getState()
        .redistributeAttributePoints('korvin', { ferocity: 0, resilience: 0, vigor: 0 }),
    ).resolves.toBe(false);
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

  it('grants the two Rune Grimoire starters atomically and idempotently with its Anvil purchase', async () => {
    const port = memoryPort();
    const store = createSaveStore(createSaveService(port, () => createDefaultSave(7)));
    await store.getState().hydrate();

    const base = store.getState().data;
    if (base === null) throw new Error('Save fehlt');
    store.setState({
      data: { ...base, currencies: { ...base.currencies, relicShards: 1 } },
    });

    await expect(store.getState().buyCrucibleNode('anvil.rune-grimoire')).resolves.toBe(true);
    expect(store.getState().data?.runes).toEqual({
      'rune.trigger.on-crit': 1,
      'rune.effect.heal': 1,
    });

    const reloaded = createSaveStore(createSaveService(port, () => createDefaultSave(7)));
    await reloaded.getState().hydrate();
    expect(reloaded.getState().data?.runes).toEqual({
      'rune.trigger.on-crit': 1,
      'rune.effect.heal': 1,
    });
    await expect(reloaded.getState().buyCrucibleNode('anvil.rune-grimoire')).resolves.toBe(false);
    expect(reloaded.getState().data?.runes).toEqual({
      'rune.trigger.on-crit': 1,
      'rune.effect.heal': 1,
    });
  });

  it('inscribes one reachable unknown Rune atomically through the persisted craft stream', async () => {
    const port = memoryPort();
    const service = createSaveService(port, () => createDefaultSave(7));
    const store = createSaveStore(service);
    await store.getState().hydrate();

    const base = store.getState().data;
    if (base === null) throw new Error('Save fehlt');
    store.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, gold: 500, runewords: 100 },
        firstVictories: ['A1-D1-03'],
        crucible: { 'anvil.rune-grimoire': 1 },
        runes: { 'rune.trigger.on-crit': 1, 'rune.effect.heal': 1 },
      },
    });

    await expect(store.getState().inscribeRune('trigger')).resolves.toBe(true);
    const inscribed = store.getState().data;
    expect(inscribed?.craftCounter).toBe(1);
    expect(inscribed?.currencies).toMatchObject({ gold: 460, runewords: 94 });
    expect(Object.keys(inscribed?.runes ?? {})).toHaveLength(3);
    expect(inscribed?.runes['rune.trigger.on-crit']).toBe(1);
    expect(inscribed?.runes['rune.effect.heal']).toBe(1);

    const reloaded = createSaveStore(service);
    await reloaded.getState().hydrate();
    expect(reloaded.getState().data).toEqual(inscribed);
  });

  it('etches a known Rune atomically without consuming the craft stream', async () => {
    const port = memoryPort();
    const service = createSaveService(port, () => createDefaultSave(7));
    const store = createSaveStore(service);
    await store.getState().hydrate();

    const base = store.getState().data;
    if (base === null) throw new Error('Save fehlt');
    store.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, gold: 500, runewords: 100 },
        crucible: { 'anvil.rune-grimoire': 1, 'anvil.rune-mastery': 1 },
        runes: { 'rune.trigger.on-crit': 1, 'rune.effect.heal': 1 },
      },
    });

    await expect(store.getState().etchRune('rune.trigger.on-crit')).resolves.toBe(true);
    const etched = store.getState().data;
    expect(etched?.runes['rune.trigger.on-crit']).toBe(2);
    expect(etched?.currencies).toMatchObject({ gold: 400, runewords: 92 });
    expect(etched?.craftCounter).toBe(0);

    const reloaded = createSaveStore(service);
    await reloaded.getState().hydrate();
    expect(reloaded.getState().data).toEqual(etched);
  });

  it('rejects impossible Rune actions without a save write', async () => {
    let writes = 0;
    const port: SavePort = {
      load: () => Promise.resolve(null),
      save: () => {
        writes += 1;
        return Promise.resolve();
      },
      clear: () => Promise.resolve(),
    };
    const store = createSaveStore(createSaveService(port, () => createDefaultSave(7)));
    await store.getState().hydrate();

    const base = store.getState().data;
    if (base === null) throw new Error('Save fehlt');
    store.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, gold: 0, runewords: 0 },
        crucible: { 'anvil.rune-grimoire': 1 },
        runes: { 'rune.trigger.on-crit': 1, 'rune.effect.heal': 1 },
      },
    });
    const before = store.getState().data;

    await expect(store.getState().inscribeRune('trigger')).resolves.toBe(false);
    await expect(store.getState().etchRune('rune.trigger.on-crit')).resolves.toBe(false);
    expect(store.getState().data).toEqual(before);
    expect(writes).toBe(0);
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

  it('persistiert Temper und Masterwork atomar und lädt beide Schichten wieder', async () => {
    const port = memoryPort();
    const service = createSaveService(port, () => createDefaultSave(7));
    const store = createSaveStore(service);
    await store.getState().hydrate();

    const base = store.getState().data;
    if (base === null) throw new Error('Save fehlt');
    store.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, gold: 1000, cinder: 2 },
        crucible: { 'anvil.armory': 1, 'anvil.blacksmith': 1 },
        armor: createTeamArmor({ 'anvil.armory': 1 }),
      },
    });

    await expect(store.getState().temperArmor('korvin', 'chest')).resolves.toBe(true);
    await expect(store.getState().masterworkArmor('korvin', 'chest')).resolves.toBe(true);

    const reloaded = createSaveStore(service);
    await reloaded.getState().hydrate();
    const item = reloaded.getState().data?.armor.korvin.chest;
    expect(item).toMatchObject({ itemLevel: 2, rarity: 'magic' });
    expect(item?.sockets).toEqual([null]);
    // 1000 − 20 (Temper +1) − 60 (Masterwork-Gold); Cinder 2 − 1 nach Tabelle.
    expect(reloaded.getState().data?.currencies.gold).toBe(920);
    expect(reloaded.getState().data?.currencies.cinder).toBe(1);
    // Unbeteiligte Charaktere und Slots bleiben unberührt.
    expect(reloaded.getState().data?.armor.rhaya.chest).toMatchObject({
      itemLevel: 1,
      rarity: 'common',
    });
  });

  it('persists Brand and lower-cost Re-Brand atomically while keeping a Sigil team-unique', async () => {
    const port = memoryPort();
    const service = createSaveService(port, () => createDefaultSave(7));
    const store = createSaveStore(service);
    await store.getState().hydrate();

    const base = store.getState().data;
    if (base === null) throw new Error('Save fehlt');
    const armor = createTeamArmor({ 'anvil.armory': 1 });
    const chest = armor.korvin.chest;
    const rhayaChest = armor.rhaya.chest;
    if (chest === undefined || rhayaChest === undefined) throw new Error('Chest fehlt');
    store.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, gold: 1_000, cinder: 5 },
        sigils: { 'sigil.tempered-edge': 2, 'sigil.burning-sentence': 3 },
        crucible: { 'anvil.armory': 1, 'anvil.blacksmith': 1 },
        armor: {
          ...armor,
          korvin: { chest: { ...chest, rarity: 'magic', sockets: [null] } },
          rhaya: { chest: { ...rhayaChest, rarity: 'magic', sockets: [null] } },
        },
      },
    });

    await expect(
      store.getState().brandArmor('korvin', 'chest', 'sigil.tempered-edge'),
    ).resolves.toBe(true);
    await expect(
      store.getState().brandArmor('rhaya', 'chest', 'sigil.tempered-edge'),
    ).resolves.toBe(false);
    await expect(
      store.getState().brandArmor('korvin', 'chest', 'sigil.burning-sentence'),
    ).resolves.toBe(true);

    const reloaded = createSaveStore(service);
    await reloaded.getState().hydrate();
    expect(reloaded.getState().data?.armor.korvin.chest?.imprint).toEqual({
      sigilId: 'sigil.burning-sentence',
    });
    // 1000 − 300 Erst-Brand − 75 Re-Brand; Cinder 5 − 3 − 1.
    expect(reloaded.getState().data?.currencies.gold).toBe(625);
    expect(reloaded.getState().data?.currencies.cinder).toBe(1);
    expect(reloaded.getState().data?.armor.rhaya.chest?.imprint).toBeUndefined();
  });

  it('lehnt unbezahlbare oder unmögliche Blacksmith-Aktionen ohne Save-Schreibvorgang ab', async () => {
    let writes = 0;
    const port: SavePort = {
      load: () => Promise.resolve(null),
      save: () => {
        writes += 1;
        return Promise.resolve();
      },
      clear: () => Promise.resolve(),
    };
    const store = createSaveStore(createSaveService(port, () => createDefaultSave(7)));
    await store.getState().hydrate();

    const base = store.getState().data;
    if (base === null) throw new Error('Save fehlt');
    store.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, gold: 0, cinder: 0 },
        crucible: { 'anvil.armory': 1, 'anvil.blacksmith': 1 },
        armor: createTeamArmor({ 'anvil.armory': 1 }),
      },
    });
    const before = store.getState().data;

    // Zu wenig Gold bzw. Cinder; der Legs-Slot ist bei Armory Rang 1 noch nicht freigeschaltet.
    await expect(store.getState().temperArmor('korvin', 'chest')).resolves.toBe(false);
    await expect(store.getState().masterworkArmor('korvin', 'chest')).resolves.toBe(false);
    await expect(store.getState().temperArmor('korvin', 'legs')).resolves.toBe(false);

    expect(store.getState().data).toEqual(before);
    expect(writes).toBe(0);
  });

  it('sperrt Blacksmith-Aktionen über das injizierte Optimierungs-Prädikat', async () => {
    const service = createSaveService(memoryPort(), () => createDefaultSave(7));
    let allowed = false;
    const store = createSaveStore(service, { canOptimize: () => allowed });
    await store.getState().hydrate();

    const base = store.getState().data;
    if (base === null) throw new Error('Save fehlt');
    store.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, gold: 1000, cinder: 10 },
        crucible: { 'anvil.armory': 1, 'anvil.blacksmith': 1 },
        armor: createTeamArmor({ 'anvil.armory': 1 }),
      },
    });

    await expect(store.getState().temperArmor('korvin', 'chest')).resolves.toBe(false);
    await expect(store.getState().masterworkArmor('korvin', 'chest')).resolves.toBe(false);
    expect(store.getState().data?.armor.korvin.chest).toMatchObject({
      itemLevel: 1,
      rarity: 'common',
    });

    allowed = true;
    await expect(store.getState().temperArmor('korvin', 'chest')).resolves.toBe(true);
    expect(store.getState().data?.armor.korvin.chest?.itemLevel).toBe(2);
  });

  it('persistiert Inlay atomar: Sockel, Bestand, Gold und craftCounter überleben den Reload', async () => {
    const port = memoryPort();
    const service = createSaveService(port, () => createDefaultSave(7));
    const store = createSaveStore(service);
    await store.getState().hydrate();

    const base = store.getState().data;
    if (base === null) throw new Error('Save fehlt');
    const armor = createTeamArmor({ 'anvil.armory': 1 });
    const chest = armor.korvin.chest;
    if (chest === undefined) throw new Error('Chest fehlt');
    store.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, gold: 1000 },
        gems: { ...base.gems, amber: 2 },
        crucible: { 'anvil.armory': 1, 'anvil.blacksmith': 1, 'anvil.jeweler': 1 },
        armor: {
          ...armor,
          korvin: { chest: { ...chest, rarity: 'magic', sockets: [null] } },
        },
      },
    });

    await expect(store.getState().inlayGem('korvin', 'chest', 0, 'amber')).resolves.toBe(true);

    const reloaded = createSaveStore(service);
    await reloaded.getState().hydrate();
    const persisted = reloaded.getState().data;
    expect(persisted?.armor.korvin.chest?.sockets[0]).toMatchObject({
      color: 'amber',
      gemLevel: 1,
    });
    expect(persisted?.gems.amber).toBe(1);
    expect(persisted?.currencies.gold).toBe(1000 - INLAY_GOLD_COST);
    expect(persisted?.craftCounter).toBe(1);
    // Der Roll entspricht exakt dem Craft-Seed aus saveSeed und Zähler 0 (kein Save-Scumming).
    expect(persisted?.armor.korvin.chest?.sockets[0]).toEqual(
      rollGem('amber', craftLootPrng(7, 0)),
    );
  });

  it('würfelt aufeinanderfolgende Inlays über den steigenden craftCounter frisch', async () => {
    const service = createSaveService(memoryPort(), () => createDefaultSave(7));
    const store = createSaveStore(service);
    await store.getState().hydrate();

    const base = store.getState().data;
    if (base === null) throw new Error('Save fehlt');
    const armor = createTeamArmor({ 'anvil.armory': 1 });
    const chest = armor.korvin.chest;
    if (chest === undefined) throw new Error('Chest fehlt');
    store.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, gold: 1000 },
        gems: { ...base.gems, sapphire: 5 },
        crucible: { 'anvil.armory': 1, 'anvil.blacksmith': 1, 'anvil.jeweler': 1 },
        armor: {
          ...armor,
          korvin: { chest: { ...chest, rarity: 'rare', sockets: [null, null] } },
        },
      },
    });

    await expect(store.getState().inlayGem('korvin', 'chest', 0, 'sapphire')).resolves.toBe(true);
    await expect(store.getState().inlayGem('korvin', 'chest', 1, 'sapphire')).resolves.toBe(true);

    const sockets = store.getState().data?.armor.korvin.chest?.sockets;
    expect(sockets?.[0]).toEqual(rollGem('sapphire', craftLootPrng(7, 0)));
    expect(sockets?.[1]).toEqual(rollGem('sapphire', craftLootPrng(7, 1)));
    expect(store.getState().data?.craftCounter).toBe(2);
    expect(store.getState().data?.gems.sapphire).toBe(3);
  });

  it('lehnt unmögliche Inlays ohne Save-Schreibvorgang ab und sperrt über das Prädikat', async () => {
    let writes = 0;
    const port: SavePort = {
      load: () => Promise.resolve(null),
      save: () => {
        writes += 1;
        return Promise.resolve();
      },
      clear: () => Promise.resolve(),
    };
    let allowed = true;
    const store = createSaveStore(
      createSaveService(port, () => createDefaultSave(7)),
      {
        canOptimize: () => allowed,
      },
    );
    await store.getState().hydrate();

    const base = store.getState().data;
    if (base === null) throw new Error('Save fehlt');
    const armor = createTeamArmor({ 'anvil.armory': 1 });
    const chest = armor.korvin.chest;
    if (chest === undefined) throw new Error('Chest fehlt');
    store.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, gold: 1000 },
        gems: { ...base.gems, ruby: 1 },
        crucible: { 'anvil.armory': 1, 'anvil.blacksmith': 1, 'anvil.jeweler': 1 },
        armor: {
          ...armor,
          korvin: { chest: { ...chest, rarity: 'magic', sockets: [null] } },
        },
      },
    });
    const before = store.getState().data;

    // Leerer Amber-Bestand, ungültiger Sockel, gesperrter Slot — und die Run-Sperre.
    await expect(store.getState().inlayGem('korvin', 'chest', 0, 'amber')).resolves.toBe(false);
    await expect(store.getState().inlayGem('korvin', 'chest', 1, 'ruby')).resolves.toBe(false);
    await expect(store.getState().inlayGem('korvin', 'legs', 0, 'ruby')).resolves.toBe(false);
    allowed = false;
    await expect(store.getState().inlayGem('korvin', 'chest', 0, 'ruby')).resolves.toBe(false);

    expect(store.getState().data).toEqual(before);
    expect(writes).toBe(0);
  });

  it('persistiert Attune atomar: Gem-Level, Wert, Fodder und Gold überleben den Reload', async () => {
    const port = memoryPort();
    const service = createSaveService(port, () => createDefaultSave(7));
    const store = createSaveStore(service);
    await store.getState().hydrate();

    const base = store.getState().data;
    if (base === null) throw new Error('Save fehlt');
    const armor = createTeamArmor({ 'anvil.armory': 1 });
    const chest = armor.korvin.chest;
    if (chest === undefined) throw new Error('Chest fehlt');
    // Emerald auf dem Range-Minimum: die relative Position 0 bleibt beim Attune erhalten.
    const gem = {
      color: 'emerald',
      affix: 'might',
      gemLevel: 1,
      value: gemValueRange('might', 1).min,
    } as const;
    store.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, gold: 1000 },
        gems: { ...base.gems, emerald: 10 },
        crucible: { 'anvil.armory': 1, 'anvil.blacksmith': 1, 'anvil.jeweler': 1 },
        armor: {
          ...armor,
          korvin: { chest: { ...chest, rarity: 'magic', sockets: [gem] } },
        },
      },
    });

    await expect(store.getState().attuneGem('korvin', 'chest', 0)).resolves.toBe(true);

    const reloaded = createSaveStore(service);
    await reloaded.getState().hydrate();
    const persisted = reloaded.getState().data;
    expect(persisted?.armor.korvin.chest?.sockets[0]).toMatchObject({
      color: 'emerald',
      affix: 'might',
      gemLevel: 2,
    });
    expect(persisted?.armor.korvin.chest?.sockets[0]?.value).toBeCloseTo(
      gemValueRange('might', 2).min,
      10,
    );
    expect(persisted?.gems.emerald).toBe(10 - attuneFodderCost(1));
    expect(persisted?.currencies.gold).toBe(1000 - ATTUNE_GOLD_COST);
    // Attune ist RNG-frei und verbraucht keinen Craft-Roll.
    expect(persisted?.craftCounter).toBe(0);

    // Magic-Cap erreicht: das zweite Attune ist abgelehnt.
    await expect(reloaded.getState().attuneGem('korvin', 'chest', 0)).resolves.toBe(false);
  });

  it('persistiert Recut atomar und rollt deterministisch über den craftCounter', async () => {
    const port = memoryPort();
    const service = createSaveService(port, () => createDefaultSave(7));
    const store = createSaveStore(service);
    await store.getState().hydrate();

    const base = store.getState().data;
    if (base === null) throw new Error('Save fehlt');
    const armor = createTeamArmor({ 'anvil.armory': 1 });
    const chest = armor.korvin.chest;
    if (chest === undefined) throw new Error('Chest fehlt');
    const range = gemValueRange('barrier', 1);
    const gem = { color: 'sapphire', affix: 'barrier', gemLevel: 1, value: range.min } as const;
    store.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, gold: 1000 },
        crucible: { 'anvil.armory': 1, 'anvil.blacksmith': 1, 'anvil.jeweler': 1 },
        armor: {
          ...armor,
          korvin: { chest: { ...chest, rarity: 'magic', sockets: [gem] } },
        },
      },
    });

    await expect(store.getState().recutGem('korvin', 'chest', 0)).resolves.toBe(true);

    const reloaded = createSaveStore(service);
    await reloaded.getState().hydrate();
    const persisted = reloaded.getState().data;
    const recut = persisted?.armor.korvin.chest?.sockets[0];
    // Der Wert entspricht exakt dem Craft-Seed aus saveSeed und Zähler 0 (kein Save-Scumming).
    const expected = range.min + craftLootPrng(7, 0).next() * (range.max - range.min);
    expect(recut?.value).toBeCloseTo(expected, 10);
    expect(recut).toMatchObject({ color: 'sapphire', affix: 'barrier', gemLevel: 1 });
    expect(persisted?.currencies.gold).toBe(1000 - RECUT_GOLD_COST);
    expect(persisted?.craftCounter).toBe(1);
  });

  it('lehnt Attune und Recut auf leeren Sockeln ab und sperrt beide über das Prädikat', async () => {
    const service = createSaveService(memoryPort(), () => createDefaultSave(7));
    let allowed = true;
    const store = createSaveStore(service, { canOptimize: () => allowed });
    await store.getState().hydrate();

    const base = store.getState().data;
    if (base === null) throw new Error('Save fehlt');
    const armor = createTeamArmor({ 'anvil.armory': 1 });
    const chest = armor.korvin.chest;
    if (chest === undefined) throw new Error('Chest fehlt');
    const gem = {
      color: 'emerald',
      affix: 'might',
      gemLevel: 1,
      value: gemValueRange('might', 1).min,
    } as const;
    store.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, gold: 1000 },
        gems: { ...base.gems, emerald: 10 },
        crucible: { 'anvil.armory': 1, 'anvil.blacksmith': 1, 'anvil.jeweler': 1 },
        armor: {
          ...armor,
          korvin: { chest: { ...chest, rarity: 'rare', sockets: [gem, null] } },
        },
      },
    });

    // Sockel 2 ist leer — beide Aktionen sind abgelehnt.
    await expect(store.getState().attuneGem('korvin', 'chest', 1)).resolves.toBe(false);
    await expect(store.getState().recutGem('korvin', 'chest', 1)).resolves.toBe(false);

    allowed = false;
    await expect(store.getState().attuneGem('korvin', 'chest', 0)).resolves.toBe(false);
    await expect(store.getState().recutGem('korvin', 'chest', 0)).resolves.toBe(false);
    expect(store.getState().data?.armor.korvin.chest?.sockets[0]).toEqual(gem);
    expect(store.getState().data?.craftCounter).toBe(0);
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

    expect(store.getState().data?.currencies).toEqual({
      gold: 0,
      relicShards: 0,
      cinder: 0,
      runewords: 0,
    });
    expect(store.getState().data?.characters.korvin.xp).toBe(0);
    expect(store.getState().status).toBe('error');
  });
});
