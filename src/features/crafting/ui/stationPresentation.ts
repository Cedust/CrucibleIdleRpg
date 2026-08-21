import type { ArmorInnateStat, ArmorItemType, ArmorSlot, Rarity } from '@/game/types';

/**
 * Gemeinsame Anzeige-Konstanten der Handwerks-Stationen (Blacksmith Task 027, Jeweler
 * Task 028) — getrennt von den Komponenten in stationShared.tsx (react-refresh).
 */

/** Anatomische Anzeige-Reihenfolge der Slot-Spalte, wie im Heroes-Loadout. */
export const ARMOR_COLUMN = [
  'head',
  'chest',
  'legs',
  'feet',
] as const satisfies readonly ArmorSlot[];

export const ARMOR_SLOT_LABEL: Record<ArmorSlot, string> = {
  head: 'Head',
  chest: 'Chest',
  legs: 'Legs',
  feet: 'Feet',
};

export const ARMOR_BASE_LABEL: Record<ArmorItemType, string> = {
  helmet: 'Helmet',
  armor: 'Chest Armor',
  legguards: 'Legguards',
  boots: 'Boots',
};

export const INNATE_LABEL: Record<ArmorInnateStat, string> = {
  toughness: 'Toughness',
  vitality: 'Vitality',
  initiative: 'Initiative',
};

/** Seltenheits-Akzente über bestehende Palette-Tokens. */
export const RARITY_TEXT_CLASS: Record<Rarity, string> = {
  common: 'text-text',
  magic: 'text-info',
  rare: 'text-accent-strong',
  epic: 'text-arcane',
  legendary: 'text-ember-bright',
};

export const RARITY_BADGE_CLASS: Record<Rarity, string> = {
  common: 'border-border text-text-muted',
  magic: 'border-info/50 text-info',
  rare: 'border-accent/50 text-accent-strong',
  epic: 'border-arcane/50 text-arcane',
  legendary: 'border-ember/60 text-ember-bright',
};

/** Exakte Kostenbeträge; kompakte Bestände im Kopf laufen über formatNumber. */
export const costFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
