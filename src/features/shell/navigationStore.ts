import { create } from 'zustand';

/**
 * State-basierter View-Switch statt Router (siehe AGENTS.md §6).
 * Kein URL-Sync; Feature-States bleiben beim Wechseln erhalten.
 */
export const VIEWS = ['dungeons', 'team', 'crucible', 'blacksmith', 'jeweler', 'runes'] as const;
export type View = (typeof VIEWS)[number];

interface NavigationState {
  activeView: View;
  setActiveView: (view: View) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeView: 'dungeons',
  setActiveView: (view) => set({ activeView: view }),
}));
