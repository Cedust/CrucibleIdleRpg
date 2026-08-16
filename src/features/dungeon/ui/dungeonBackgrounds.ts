import type { DungeonBackgroundId } from '@/game/encounters/actMeta';

/**
 * Statische Klassen-Strings, damit Tailwinds Scanner die bg-url-Utilities findet.
 * Noch nicht generierte Assets rendern kein Bild; darunter bleibt die dunkle
 * `bg-surface`-/Gradient-Unterlage der Karte sichtbar.
 */
export const DUNGEON_BACKGROUND_CLASSES: Record<DungeonBackgroundId, string> = {
  'ashen-depths': 'bg-[url(/assets/backgrounds/dungeon-ashen-depths_2.png)]',
  'ember-foundry': 'bg-[url(/assets/backgrounds/dungeon-ember-foundry.png)]',
  'forgotten-citadel': 'bg-[url(/assets/backgrounds/dungeon-forgotten-citadel.png)]',
};
