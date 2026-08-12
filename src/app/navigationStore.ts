import { create } from 'zustand';

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
  'runes',
] as const;
export type View = (typeof VIEWS)[number];

export const VIEW_LABELS: Record<View, string> = {
  dungeons: 'DUNGEONS',
  heroes: 'HEROES',
  crucible: 'CRUCIBLE',
  'weapon-mastery': 'WEAPON MASTERY',
  blacksmith: 'BLACKSMITH',
  jeweler: 'JEWELER',
  runes: 'RUNES',
};

interface NavigationState {
  activeView: View;
  setActiveView: (view: View) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeView: 'dungeons',
  setActiveView: (view) => set({ activeView: view }),
}));
