import { create } from 'zustand';
import type { ArmorSlot } from '@/game/types';

/** Die drei Dienste der Blacksmith-Station; Brand füllt Task 031. */
export const BLACKSMITH_TABS = ['temper', 'masterwork', 'brand'] as const;
export type BlacksmithTab = (typeof BLACKSMITH_TABS)[number];

/**
 * Session-only UI selection of the crafting stations (Task 027). The slot choice is shared
 * UI context like the active character; it deliberately does not belong in the save.
 */
interface CraftingState {
  /** A browser reload always starts at the first Armory slot. */
  selectedSlot: ArmorSlot;
  setSelectedSlot: (slot: ArmorSlot) => void;
  /** A browser reload always starts at Temper. */
  activeTab: BlacksmithTab;
  setActiveTab: (tab: BlacksmithTab) => void;
}

export function createCraftingStore() {
  return create<CraftingState>((set) => ({
    selectedSlot: 'chest',
    setSelectedSlot: (selectedSlot) => set({ selectedSlot }),
    activeTab: 'temper',
    setActiveTab: (activeTab) => set({ activeTab }),
  }));
}

export const useCraftingStore = createCraftingStore();
