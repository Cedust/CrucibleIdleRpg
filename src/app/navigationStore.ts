import { create } from 'zustand';
import type { CharacterId } from '@/game/types';

/**
 * State-basierter View-Switch statt Router (siehe AGENTS.md).
 * Kein URL-Sync; Feature-States bleiben beim Wechseln erhalten.
 */
export const VIEWS = [
  'dungeons',
  'crucible',
  'heroes',
  'weapon-mastery',
  'blacksmith',
  'jeweler',
  'runescribe',
  'sigil-codex',
  'rune-grimoire',
] as const;
export type View = (typeof VIEWS)[number];

/**
 * Blöcke der Sidebar in Anzeige-Reihenfolge: global, charaktergebunden, teamweite Sammlungen
 * (docs/spec/UI.md#1-viewport--und-screen-contract). Ein Test bindet sie an `VIEWS` und
 * `CHARACTER_SCOPED_VIEWS`.
 */
export const NAV_GROUPS = [
  ['dungeons', 'crucible'],
  ['heroes', 'weapon-mastery', 'blacksmith', 'jeweler', 'runescribe'],
  ['sigil-codex', 'rune-grimoire'],
] as const satisfies readonly (readonly View[])[];

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
  crucible: 'CRUCIBLE',
  heroes: 'HEROES',
  'weapon-mastery': 'WEAPON MASTERY',
  blacksmith: 'BLACKSMITH',
  jeweler: 'JEWELER',
  runescribe: 'RUNESCRIBE',
  'sigil-codex': 'SIGIL CODEX',
  'rune-grimoire': 'RUNE GRIMOIRE',
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
