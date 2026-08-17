import { describe, expect, it } from 'vitest';
import { createArmorItem, createTeamArmor } from '@/game/items/armor';
import { createDefaultSave, saveSchema } from './saveSchema';

describe('saveSchema', () => {
  it('creates a complete save with dungeon checkpoints and no runtime combat state', () => {
    expect(createDefaultSave(0x12345678)).toEqual({
      version: 1,
      saveSeed: 0x12345678,
      runCounter: 0,
      playbackSpeed: 1,
      characters: {
        korvin: {
          level: 1,
          xp: 0,
          freeAttributePoints: 1,
          attributePoints: { ferocity: 0, resilience: 0, vigor: 0 },
          freeMasteryPoints: 1,
          masteryRanks: {},
        },
        rhaya: {
          level: 1,
          xp: 0,
          freeAttributePoints: 1,
          attributePoints: { ferocity: 0, resilience: 0, vigor: 0 },
          freeMasteryPoints: 1,
          masteryRanks: {},
        },
        quinn: {
          level: 1,
          xp: 0,
          freeAttributePoints: 1,
          attributePoints: { ferocity: 0, resilience: 0, vigor: 0 },
          freeMasteryPoints: 1,
          masteryRanks: {},
        },
      },
      currencies: { gold: 0, relicShards: 0, cinder: 0 },
      gems: { amber: 0, ruby: 0, sapphire: 0, emerald: 0, diamond: 0 },
      firstVictories: [],
      crucible: {},
      armor: {
        korvin: {},
        rhaya: {},
        quinn: {},
      },
      completedDungeons: {
        'A1-D1': false,
        'A1-D2': false,
        'A1-D3': false,
        'A1-D4': false,
        'A1-D5': false,
      },
    });
  });

  it('rejects runtime combat fields at every save level', () => {
    const save = createDefaultSave(123);

    for (const forbidden of [
      { health: 10 },
      { pending: [] },
      { combatPrngState: 42 },
      { floorIndex: 0 },
    ]) {
      expect(saveSchema.safeParse({ ...save, ...forbidden }).success).toBe(false);
    }
  });

  it('rejects saves with a foreign version number', () => {
    const save = createDefaultSave(123);

    expect(saveSchema.safeParse({ ...save, version: 2 }).success).toBe(false);
  });

  it('accepts Relic Shards and rejects the removed legacy currency field', () => {
    const save = createDefaultSave(123);
    const legacyCurrencyKey = ['crys', 'tals'].join('');

    expect(
      saveSchema.safeParse({
        ...save,
        currencies: { gold: 0, relicShards: 7, cinder: 0 },
      }).success,
    ).toBe(true);
    expect(
      saveSchema.safeParse({
        ...save,
        currencies: { gold: 0, [legacyCurrencyKey]: 7 },
      }).success,
    ).toBe(false);
  });

  it('verlangt Cinder und alle fünf Gem-Bestände als nichtnegative Ganzzahlen', () => {
    const save = createDefaultSave(123);

    expect(
      saveSchema.safeParse({
        ...save,
        currencies: { ...save.currencies, cinder: 3 },
        gems: { amber: 2, ruby: 0, sapphire: 1, emerald: 4, diamond: 0 },
      }).success,
    ).toBe(true);
    expect(
      saveSchema.safeParse({
        ...save,
        currencies: { ...save.currencies, cinder: -1 },
      }).success,
    ).toBe(false);
    expect(saveSchema.safeParse({ ...save, gems: { ...save.gems, ruby: -1 } }).success).toBe(false);
    expect(saveSchema.safeParse({ ...save, gems: { ...save.gems, amber: 0.5 } }).success).toBe(
      false,
    );
    expect(saveSchema.safeParse({ ...save, gems: { ...save.gems, opal: 1 } }).success).toBe(false);
    const withoutDiamond = Object.fromEntries(
      Object.entries(save.gems).filter(([color]) => color !== 'diamond'),
    );
    expect(saveSchema.safeParse({ ...save, gems: withoutDiamond }).success).toBe(false);
  });

  it('uses free mastery points directly and rejects the removed skill-point sums', () => {
    const save = createDefaultSave(123);

    expect(save.characters.korvin.freeMasteryPoints).toBe(1);
    expect(
      saveSchema.safeParse({
        ...save,
        characters: {
          ...save.characters,
          korvin: { ...save.characters.korvin, freeSkillPoints: 1, spentSkillPoints: 0 },
        },
      }).success,
    ).toBe(false);
  });

  it('requires free plus invested mastery points to match character level', () => {
    const save = createDefaultSave(123);
    const valid = {
      ...save,
      characters: {
        ...save.characters,
        korvin: {
          ...save.characters.korvin,
          level: 2,
          freeAttributePoints: 2,
          freeMasteryPoints: 1,
          masteryRanks: { 'finesse.chc-i': 1 },
        },
      },
    };
    expect(saveSchema.safeParse(valid).success).toBe(true);
    expect(
      saveSchema.safeParse({
        ...valid,
        characters: {
          ...valid.characters,
          korvin: { ...valid.characters.korvin, masteryRanks: {} },
        },
      }).success,
    ).toBe(false);
  });

  it('validiert Format und Eindeutigkeit von Erstsiegen', () => {
    const save = createDefaultSave(123);

    expect(
      saveSchema.safeParse({ ...save, firstVictories: ['A1-D1-01', 'A1-D1-02'] }).success,
    ).toBe(true);
    expect(saveSchema.safeParse({ ...save, firstVictories: ['kein-floor'] }).success).toBe(false);
    expect(
      saveSchema.safeParse({ ...save, firstVictories: ['A1-D1-01', 'A1-D1-01'] }).success,
    ).toBe(false);
  });

  it('lehnt das entfernte Checkpoint-Feld ab — die Einstiege folgen aus anvil.waystones', () => {
    const save = createDefaultSave(123);

    expect(saveSchema.safeParse({ ...save, unlockedDungeonIds: ['A1-D1'] }).success).toBe(false);
  });

  it('akzeptiert Crucible-Ränge, deren Voraussetzungen der Speicherstand erfüllt', () => {
    const save = createDefaultSave(123);
    const valid = {
      ...save,
      crucible: {
        'anvil.waystones': 1,
        'smelting.overpower': 3,
        'molten.rally': 5,
        'molten.second-wind': 2,
      },
      completedDungeons: { ...save.completedDungeons, 'A1-D1': true },
    };

    expect(saveSchema.safeParse(valid).success).toBe(true);
  });

  it('lehnt unbekannte Crucible-IDs, Überränge, fehlende Voraussetzungen und gesperrte Nodes ab', () => {
    const save = createDefaultSave(123);

    expect(saveSchema.safeParse({ ...save, crucible: { 'anvil.unknown': 1 } }).success).toBe(false);
    expect(
      saveSchema.safeParse({ ...save, crucible: { 'masterwork.rune-grimoire': 1 } }).success,
    ).toBe(false);
    expect(saveSchema.safeParse({ ...save, crucible: { 'anvil.waystones': 5 } }).success).toBe(
      false,
    );
    // Ambush verlangt Sunder Rang 1 (PROGRESSION §3.3).
    expect(saveSchema.safeParse({ ...save, crucible: { 'molten.ambush': 1 } }).success).toBe(false);
    expect(
      saveSchema.safeParse({
        ...save,
        crucible: { 'anvil.armory': 1 },
        armor: createTeamArmor({ 'anvil.armory': 1 }),
      }).success,
    ).toBe(true);
  });

  it('accepts only items on their canonical slot base, exactly derived from the Armory rank', () => {
    const save = createDefaultSave(123);
    const armed = {
      ...save,
      crucible: { 'anvil.armory': 2 },
      armor: createTeamArmor({ 'anvil.armory': 2 }),
    };

    expect(saveSchema.safeParse(armed).success).toBe(true);
    expect(
      saveSchema.safeParse({
        ...armed,
        armor: {
          ...armed.armor,
          korvin: { ...armed.armor.korvin, head: armed.armor.korvin.chest },
        },
      }).success,
    ).toBe(false);
    expect(
      saveSchema.safeParse({ ...armed, armor: createTeamArmor({ 'anvil.armory': 1 }) }).success,
    ).toBe(false);
  });

  describe('Item-Schichten (ITEMS §2–§4)', () => {
    /** Save mit Armory-Rang 1, dessen Chest-Item gezielt überschriebene Schichten trägt. */
    function armedSave(chestLayers: Record<string, unknown>) {
      const save = createDefaultSave(123);
      const armor = createTeamArmor({ 'anvil.armory': 1 });
      return {
        ...save,
        crucible: { 'anvil.armory': 1 },
        armor: {
          ...armor,
          korvin: { chest: { ...createArmorItem('chest'), ...chestLayers } },
        },
      };
    }

    it('startet der Default weiterhin als Common +1 ohne Sockel', () => {
      const item = createArmorItem('chest');
      expect(item).toMatchObject({
        rarity: 'common',
        itemLevel: 1,
        sockets: [],
        prismaticSockets: [],
      });
      expect(saveSchema.safeParse(armedSave({})).success).toBe(true);
    });

    it('persistiert alle fünf Schichten eines voll ausgebauten Items im Roundtrip', () => {
      const crafted = armedSave({
        rarity: 'legendary',
        itemLevel: 100,
        sockets: [
          { color: 'amber', affix: 'critChance', gemLevel: 2, value: 0.03 },
          { color: 'emerald', affix: 'might', gemLevel: 1, value: 2 },
          null,
          null,
        ],
        prismaticSockets: [null, null],
        implicit: { sigilId: 'sigil.placeholder' },
      });

      const parsed = saveSchema.safeParse(crafted);
      expect(parsed.success).toBe(true);
      expect(parsed.success && parsed.data).toEqual(crafted);
    });

    it('erzwingt das Item-Level-Cap der Seltenheit', () => {
      expect(saveSchema.safeParse(armedSave({ itemLevel: 20 })).success).toBe(true);
      expect(saveSchema.safeParse(armedSave({ itemLevel: 21 })).success).toBe(false);
      expect(
        saveSchema.safeParse(armedSave({ rarity: 'magic', itemLevel: 21, sockets: [null] }))
          .success,
      ).toBe(true);
      expect(saveSchema.safeParse(armedSave({ itemLevel: 0 })).success).toBe(false);
    });

    it('erzwingt die Sockelzahl nach Seltenheits-Tabelle plus Prismatic-Formel', () => {
      expect(saveSchema.safeParse(armedSave({ sockets: [null] })).success).toBe(false);
      expect(saveSchema.safeParse(armedSave({ rarity: 'magic' })).success).toBe(false);
      expect(
        saveSchema.safeParse(armedSave({ rarity: 'rare', itemLevel: 50, sockets: [null, null] }))
          .success,
      ).toBe(false);
      expect(
        saveSchema.safeParse(
          armedSave({
            rarity: 'rare',
            itemLevel: 50,
            sockets: [null, null],
            prismaticSockets: [null],
          }),
        ).success,
      ).toBe(true);
    });

    it('bindet Gem-Affixe an ihren Farb-Pool und Prismatic-Sockel an Leere', () => {
      const gem = { color: 'amber', affix: 'critChance', gemLevel: 1, value: 0.02 } as const;
      expect(saveSchema.safeParse(armedSave({ rarity: 'magic', sockets: [gem] })).success).toBe(
        true,
      );
      expect(
        saveSchema.safeParse(
          armedSave({ rarity: 'magic', sockets: [{ ...gem, affix: 'critDamage' }] }),
        ).success,
      ).toBe(false);
      expect(
        saveSchema.safeParse(
          armedSave({
            rarity: 'rare',
            itemLevel: 50,
            sockets: [null, null],
            prismaticSockets: [gem],
          }),
        ).success,
      ).toBe(false);
    });

    it('erlaubt ein Implicit nur auf Legendary', () => {
      expect(
        saveSchema.safeParse(armedSave({ implicit: { sigilId: 'sigil.placeholder' } })).success,
      ).toBe(false);
      expect(
        saveSchema.safeParse(
          armedSave({
            rarity: 'legendary',
            sockets: [null, null, null, null],
            implicit: { sigilId: 'sigil.placeholder' },
          }),
        ).success,
      ).toBe(true);
      expect(
        saveSchema.safeParse(
          armedSave({
            rarity: 'legendary',
            sockets: [null, null, null, null],
            implicit: { sigilId: '' },
          }),
        ).success,
      ).toBe(false);
    });
  });

  it('lehnt Waystone-Ränge ohne die Vollendet-Flags der vorherigen Dungeons ab', () => {
    const save = createDefaultSave(123);

    expect(saveSchema.safeParse({ ...save, crucible: { 'anvil.waystones': 1 } }).success).toBe(
      false,
    );
    expect(
      saveSchema.safeParse({
        ...save,
        crucible: { 'anvil.waystones': 2 },
        completedDungeons: { ...save.completedDungeons, 'A1-D1': true },
      }).success,
    ).toBe(false);
    expect(
      saveSchema.safeParse({
        ...save,
        crucible: { 'anvil.waystones': 2 },
        completedDungeons: { ...save.completedDungeons, 'A1-D1': true, 'A1-D2': true },
      }).success,
    ).toBe(true);
  });

  it('rejects mastery saves with unknown nodes or missing prerequisites', () => {
    const save = createDefaultSave(123);
    const invalid = {
      ...save,
      characters: {
        ...save.characters,
        korvin: {
          ...save.characters.korvin,
          level: 20,
          freeAttributePoints: 20,
          freeMasteryPoints: 19,
          masteryRanks: { 'finesse.chc-ii': 1 },
        },
      },
    };
    expect(saveSchema.safeParse(invalid).success).toBe(false);
  });
});
