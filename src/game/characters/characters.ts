import type { CharacterDefinition, CharacterId } from '@/game/types';

/**
 * Das feste Trio (SPEC §3). Ab Start verfügbar, kein Austausch.
 *
 * Startwerte auf Level 1 — vor dem ersten Attributpunkt und vor jeder Ausrüstung.
 * Core-Stats sind 0: sie stammen ausschließlich aus Item-Innate und Emerald-Gems (SPEC §3.0).
 * Chancen als Anteil 0..1; Damage-Werte als Anteil des rohen Grundschadens (SPEC §2.1).
 */
export const CHARACTERS: Record<CharacterId, CharacterDefinition> = {
  korvin: {
    id: 'korvin',
    name: 'Korvin',
    role: 'tank',
    baseCore: { might: 0, toughness: 0, vitality: 0 },
    baseDerived: { defense: 5, health: 320 },
    weapon: { baseDamage: 14, damageRange: { min: 0.7, max: 1.3 }, precision: 0.7 },
    baseOffensive: {
      critChance: 0.05,
      critDamage: 1.5,
      multiHitChance: 0,
      multiHitDamage: 0.5,
      splashChance: 0,
      splashDamage: 0.4,
      counterChance: 0,
      counterDamage: 0.6,
    },
    baseDefensive: { barrier: 0, blockChance: 0.1, evasion: 0.03, regeneration: 0 },
    baseUtility: { initiative: 8, multiHitChain: 1, multiHitChainFactor: 0.4, splashRadius: 1 },
  },
  rhaya: {
    id: 'rhaya',
    name: 'Rhaya',
    role: 'melee',
    baseCore: { might: 0, toughness: 0, vitality: 0 },
    baseDerived: { defense: 3, health: 220 },
    weapon: { baseDamage: 18, damageRange: { min: 0.8, max: 1.2 }, precision: 0.8 },
    baseOffensive: {
      critChance: 0.05,
      critDamage: 1.5,
      multiHitChance: 0,
      multiHitDamage: 0.5,
      splashChance: 0,
      splashDamage: 0.4,
      counterChance: 0,
      counterDamage: 0.6,
    },
    baseDefensive: { barrier: 0, blockChance: 0.05, evasion: 0.08, regeneration: 0 },
    baseUtility: { initiative: 12, multiHitChain: 1, multiHitChainFactor: 0.4, splashRadius: 1 },
  },
  quinn: {
    id: 'quinn',
    name: 'Quinn',
    role: 'ranged',
    baseCore: { might: 0, toughness: 0, vitality: 0 },
    baseDerived: { defense: 3, health: 200 },
    weapon: { baseDamage: 20, damageRange: { min: 0.9, max: 1.1 }, precision: 0.9 },
    baseOffensive: {
      critChance: 0.05,
      critDamage: 1.5,
      multiHitChance: 0,
      multiHitDamage: 0.5,
      splashChance: 0,
      splashDamage: 0.4,
      counterChance: 0,
      counterDamage: 0.6,
    },
    baseDefensive: { barrier: 0, blockChance: 0.05, evasion: 0.12, regeneration: 0 },
    baseUtility: { initiative: 14, multiHitChain: 1, multiHitChainFactor: 0.4, splashRadius: 1 },
  },
};

/** Slot-Reihenfolge des Teams — Tiebreak der Initiative und Counter-Auflösung (SPEC §1.1). */
export const TEAM_ORDER: readonly CharacterId[] = ['korvin', 'rhaya', 'quinn'];
