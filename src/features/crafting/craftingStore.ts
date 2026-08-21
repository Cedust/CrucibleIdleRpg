import { create } from 'zustand';
import type { SigilId } from '@/game/sigils/types';
import type { ArmorSlot } from '@/game/types';

/** Die drei Dienste der Blacksmith-Station; Brand füllt Task 031. */
export const BLACKSMITH_TABS = ['temper', 'masterwork', 'brand'] as const;
export type BlacksmithTab = (typeof BLACKSMITH_TABS)[number];

/** Die drei Dienste der Jeweler-Station; Attune und Recut füllt Task 029. */
export const JEWELER_TABS = ['inlay', 'attune', 'recut'] as const;
export type JewelerTab = (typeof JEWELER_TABS)[number];

/**
 * Session-only UI selection of the crafting stations (Task 027/028). The slot choice is shared
 * UI context like the active character — both stations work on the same piece; it deliberately
 * does not belong in the save.
 */
interface CraftingState {
  /** A browser reload always starts at the first Armory slot. */
  selectedSlot: ArmorSlot;
  setSelectedSlot: (slot: ArmorSlot) => void;
  /** A browser reload always starts at Temper. */
  activeTab: BlacksmithTab;
  setActiveTab: (tab: BlacksmithTab) => void;
  /** Die für den nächsten Brand angewählte Codex-Marke; nur UI-Zustand, nie Teil des Saves. */
  selectedSigilId: SigilId | null;
  setSelectedSigilId: (sigilId: SigilId) => void;
  /** A browser reload always starts at Inlay. */
  jewelerTab: JewelerTab;
  setJewelerTab: (tab: JewelerTab) => void;
}

export function createCraftingStore() {
  return create<CraftingState>((set) => ({
    selectedSlot: 'chest',
    setSelectedSlot: (selectedSlot) => set({ selectedSlot }),
    activeTab: 'temper',
    setActiveTab: (activeTab) => set({ activeTab }),
    selectedSigilId: null,
    setSelectedSigilId: (selectedSigilId) => set({ selectedSigilId }),
    jewelerTab: 'inlay',
    setJewelerTab: (jewelerTab) => set({ jewelerTab }),
  }));
}

export const useCraftingStore = createCraftingStore();
