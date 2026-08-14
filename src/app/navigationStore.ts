import { create } from 'zustand';
import type { CharacterId } from '@/game/types';

/**
 * State-basierter View-Switch statt Router (siehe AGENTS.md).
 * Kein URL-Sync; Feature-States bleiben beim Wechseln erhalten.
 */
export const VIEWS = [
  'dungeons',
  'heroes',
  'crucible',
  'weapon-mastery',
  'blacksmith',
  'jeweler',
  'runescribe',
] as const;
export type View = (typeof VIEWS)[number];

/** Views whose content is scoped to one member of the fixed party. */
export const CHARACTER_SCOPED_VIEWS = [
  'heroes',
  'weapon-mastery',
  'blacksmith',
  'jeweler',
  'runescribe',
] as const satisfies readonly View[];

export function isCharacterScopedView(view: View): boolean {
  return (CHARACTER_SCOPED_VIEWS as readonly View[]).includes(view);
}

export const VIEW_LABELS: Record<View, string> = {
  dungeons: 'DUNGEONS',
  heroes: 'HEROES',
  crucible: 'CRUCIBLE',
  'weapon-mastery': 'WEAPON MASTERY',
  blacksmith: 'BLACKSMITH',
  jeweler: 'JEWELER',
  runescribe: 'RUNESCRIBE',
};

interface NavigationState {
  activeView: View;
  /** Session-only UI context; it deliberately does not belong in the save. */
  activeCharacterId: CharacterId;
  setActiveView: (view: View) => void;
  setActiveCharacterId: (characterId: CharacterId) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeView: 'dungeons',
  activeCharacterId: 'korvin',
  setActiveView: (view) => set({ activeView: view }),
  setActiveCharacterId: (activeCharacterId) => set({ activeCharacterId }),
}));
