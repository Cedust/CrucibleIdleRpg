import type { CharacterDefinition, CharacterId } from '@/game/types';

/**
 * Das feste Trio (SPEC §3). Ab Start verfügbar, kein Austausch.
 *
 * Die Zahlen sind ein grober Erstwurf — die Startwerte je Rolle stehen als offener Punkt in
 * BALANCING.md §5. Struktur und Rollen sind festgelegt.
 */
export const CHARACTERS: Record<CharacterId, CharacterDefinition> = {
  korvin: {
    id: 'korvin',
    name: 'Korvin',
    role: 'tank',
    baseCore: { might: 0, toughness: 0, vitality: 0 },
    baseDerived: { attack: 8, defense: 6, health: 140 },
    baseOffensive: {
      critChance: 0.05,
      critDamage: 1.5,
      multiHitChance: 0,
      multiHitDamage: 0.25,
      splashChance: 0,
      splashDamage: 0.3,
      counterChance: 0,
      counterDamage: 0.5,
    },
    baseDefensive: { barrier: 10, blockChance: 0.1, evasion: 0.05, regeneration: 2 },
    baseUtility: { initiative: 8, multiHitChain: 1, splashRadius: 1 },
  },
  rhaya: {
    id: 'rhaya',
    name: 'Rhaya',
    role: 'melee',
    baseCore: { might: 0, toughness: 0, vitality: 0 },
    baseDerived: { attack: 14, defense: 3, health: 100 },
    baseOffensive: {
      critChance: 0.05,
      critDamage: 1.5,
      multiHitChance: 0,
      multiHitDamage: 0.25,
      splashChance: 0,
      splashDamage: 0.3,
      counterChance: 0,
      counterDamage: 0.5,
    },
    baseDefensive: { barrier: 4, blockChance: 0.05, evasion: 0.1, regeneration: 1 },
    baseUtility: { initiative: 12, multiHitChain: 1, splashRadius: 1 },
  },
  quinn: {
    id: 'quinn',
    name: 'Quinn',
    role: 'ranged',
    baseCore: { might: 0, toughness: 0, vitality: 0 },
    baseDerived: { attack: 12, defense: 2, health: 90 },
    baseOffensive: {
      critChance: 0.05,
      critDamage: 1.5,
      multiHitChance: 0,
      multiHitDamage: 0.25,
      splashChance: 0,
      splashDamage: 0.3,
      counterChance: 0,
      counterDamage: 0.5,
    },
    baseDefensive: { barrier: 4, blockChance: 0.05, evasion: 0.12, regeneration: 1 },
    baseUtility: { initiative: 14, multiHitChain: 1, splashRadius: 1 },
  },
};

/** Slot-Reihenfolge des Teams — Tiebreak der Initiative und Counter-Auflösung (SPEC §1.1). */
export const TEAM_ORDER: readonly CharacterId[] = ['korvin', 'rhaya', 'quinn'];
