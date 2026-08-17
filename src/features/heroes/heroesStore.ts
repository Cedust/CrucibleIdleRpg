import { create } from 'zustand';

export const HERO_AREAS = ['stats', 'loadout'] as const;
export type HeroesArea = (typeof HERO_AREAS)[number];

interface HeroesState {
  /** Session-only local selection; a browser reload always starts at Stats. */
  activeArea: HeroesArea;
  setActiveArea: (area: HeroesArea) => void;
}

export function createHeroesStore() {
  return create<HeroesState>((set) => ({
    activeArea: 'stats',
    setActiveArea: (activeArea) => set({ activeArea }),
  }));
}

export const useHeroesStore = createHeroesStore();
