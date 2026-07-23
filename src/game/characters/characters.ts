import type { CharacterDefinition, CharacterId } from '@/game/types';

/** Beispiel-Charaktere für das Spielerteam. */
export const CHARACTERS: Record<CharacterId, CharacterDefinition> = {
  knight: {
    id: 'knight',
    name: 'Knight',
    baseStats: { maxHp: 120, attack: 14, defense: 10, speed: 8 },
    abilities: ['strike', 'heavyBlow'],
  },
};
