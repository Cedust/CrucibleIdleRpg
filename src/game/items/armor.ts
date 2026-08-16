import type {
  ArmorInnateStat,
  ArmorItem,
  ArmorItemType,
  ArmorLoadout,
  ArmorSlot,
  CoreStats,
  TeamArmor,
} from '@/game/types';
import { ARMOR_SLOTS } from '@/game/types';
import { deriveUnlockedArmorSlots, type CrucibleRanks } from '@/game/crucible/crucible';
import { TEAM_ORDER } from '@/game/characters/characters';

/** Statische Basis eines permanenten Armor-Slots (ITEMS §1). */
interface ArmorBase {
  itemType: ArmorItemType;
  innate: ArmorInnateStat;
}

/** Slot-Basen sind Content, keine zufällig erzeugten Items. */
export const ARMOR_BASES: Readonly<Record<ArmorSlot, ArmorBase>> = {
  chest: { itemType: 'armor', innate: 'toughness' },
  legs: { itemType: 'legguards', innate: 'toughness' },
  head: { itemType: 'helmet', innate: 'vitality' },
  feet: { itemType: 'boots', innate: 'initiative' },
};

/**
 * Platzhalter-Balancing für den mit Temper wachsenden Innate-Wert. M3 erzeugt ausschließlich
 * Common +1; die Werte ab +2 sind bewusst vorab nur deklarativer Content für den M4-Temper.
 */
export const ARMOR_INNATE_VALUE_BY_ITEM_LEVEL: Readonly<Record<ArmorSlot, readonly number[]>> = {
  chest: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  legs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  head: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  feet: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
};

/** Erzeugt die unveränderliche Startform eines durch die Armory geöffneten Slots. */
export function createArmorItem(slot: ArmorSlot): ArmorItem {
  const base = ARMOR_BASES[slot];
  return {
    slot,
    itemType: base.itemType,
    rarity: 'common',
    itemLevel: 1,
    innate: base.innate,
  };
}

/** Erzeugt die komplette, aus Armory-Rängen abgeleitete dauerhafte Team-Armor. */
export function createTeamArmor(ranks: CrucibleRanks): TeamArmor {
  const slots = deriveUnlockedArmorSlots(ranks);
  const loadout = Object.fromEntries(
    slots.map((slot) => [slot, createArmorItem(slot)]),
  ) as ArmorLoadout;

  return Object.fromEntries(TEAM_ORDER.map((id) => [id, { ...loadout }])) as TeamArmor;
}

/** Prüft, ob ein Save-Item die einzig in M3 erlaubte, kanonische Common-+1-Form besitzt. */
export function isM3ArmorItem(item: ArmorItem, expectedSlot: ArmorSlot): boolean {
  const base = ARMOR_BASES[expectedSlot];
  return (
    item.slot === expectedSlot && item.itemType === base.itemType && item.innate === base.innate
  );
}

/** Gültig sind genau die durch Armory-Ränge erwarteten Items — nicht mehr und nicht weniger. */
export function hasArmorForUnlockedSlots(armor: TeamArmor, ranks: CrucibleRanks): boolean {
  const expectedSlots = deriveUnlockedArmorSlots(ranks);

  return TEAM_ORDER.every((characterId) => {
    const loadout = armor[characterId];
    const actualSlots = ARMOR_SLOTS.filter((slot) => loadout[slot] !== undefined);
    return (
      actualSlots.length === expectedSlots.length &&
      expectedSlots.every((slot) => {
        const item = loadout[slot];
        return item !== undefined && isM3ArmorItem(item, slot);
      })
    );
  });
}

/**
 * Übersetzt die permanenten Innates in die zwei zulässigen Kampf-Eingaben: Core-Stats und
 * Initiative. Might wird absichtlich nie erzeugt (ITEMS §1).
 */
export function armorEffects(loadout: ArmorLoadout): {
  coreStats: CoreStats;
  initiative: number;
} {
  const result: { coreStats: CoreStats; initiative: number } = {
    coreStats: { might: 0, toughness: 0, vitality: 0 },
    initiative: 0,
  };

  for (const slot of ARMOR_SLOTS) {
    const item = loadout[slot];
    if (item === undefined) continue;
    const value = innateValue(item);
    if (item.innate === 'initiative') {
      result.initiative += value;
    } else {
      result.coreStats[item.innate] += value;
    }
  }

  return result;
}

/** Innate-Wert einer Basis am aktuellen Item-Level; M3 validiert ausschließlich +1. */
export function innateValue(item: ArmorItem): number {
  return ARMOR_INNATE_VALUE_BY_ITEM_LEVEL[item.slot][item.itemLevel] ?? 0;
}
