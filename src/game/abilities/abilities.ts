import type { AbilityDefinition, AbilityId } from '@/game/types';

/** Beispiel-Fähigkeiten. Balancing-Werte hier anpassen — nie in Logik-Dateien. */
export const ABILITIES: Record<AbilityId, AbilityDefinition> = {
  strike: {
    id: 'strike',
    name: 'Strike',
    description: 'A basic melee attack.',
    power: 10,
    cooldown: 0,
  },
  heavyBlow: {
    id: 'heavyBlow',
    name: 'Heavy Blow',
    description: 'A powerful strike with a short cooldown.',
    power: 25,
    cooldown: 2,
  },
};
