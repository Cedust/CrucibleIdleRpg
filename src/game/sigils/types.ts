import type { ArmorSlot, FloorId } from '@/game/types';

/** Persistierte Katalog-IDs der 18 Sigils (ITEMS §5.1). */
export const SIGIL_IDS = [
  'sigil.tempered-edge',
  'sigil.kindled-blood',
  'sigil.narrowed-fate',
  'sigil.forged-ward',
  'sigil.wardens-bastion',
  'sigil.burning-sentence',
  'sigil.stormchain',
  'sigil.molten-wake',
  'sigil.answered-steel',
  'sigil.saints-last-testament',
  'sigil.gilded-force',
  'sigil.gilded-aegis',
  'sigil.gilded-lifeblood',
  'sigil.imperial-advance',
  'sigil.empress-ferocity',
  'sigil.empress-resilience',
  'sigil.empress-vigor',
  'sigil.empress-mandate',
] as const;

export type SigilId = (typeof SIGIL_IDS)[number];
export type SigilLevel = 1 | 2 | 3 | 4 | 5;

/** Teamweiter Wissensstand des Sigil Codex; fehlender Key bedeutet unbekannt. */
export type SigilCodex = Readonly<Partial<Record<SigilId, SigilLevel>>>;

/** Ein beim Sieg zu schreibender Codex-Eintrag; kein inventarisierbares Item. */
export interface SigilDrop {
  sigilId: SigilId;
  level: SigilLevel;
}

export type SigilImprintId =
  | 'weapon-base-damage'
  | 'regeneration'
  | 'damage-range-floor'
  | 'barrier'
  | 'block-reduction'
  | 'critical-damage'
  | 'multi-hit-damage'
  | 'splash-damage'
  | 'counter-damage'
  | 'tri-damage'
  | 'might-attack'
  | 'toughness-defense'
  | 'vitality-health'
  | 'initiative'
  | 'ferocity-effectiveness'
  | 'resilience-effectiveness'
  | 'vigor-effectiveness'
  | 'attribute-effectiveness';

export interface SigilImprintDefinition {
  id: SigilImprintId;
  /** Englischer Spieltext für Codex und späteren Brand. */
  label: string;
  /** Stärke je Sigil-Level; Balancing-Content, Anwendung folgt mit Task 031. */
  levelStrengths: readonly [number, number, number, number, number];
}

/** Deklarativer Sigil-Katalog (ITEMS §5.1). */
export interface SigilDefinition {
  id: SigilId;
  name: string;
  sourceFloorId: FloorId;
  imprint: SigilImprintDefinition;
  slots: readonly ArmorSlot[];
}
