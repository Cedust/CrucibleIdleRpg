import type { CharacterId } from '@/game/types';

/** Die drei geschlossenen Rune-Pools aus RUNES §3. */
export const RUNE_CATEGORIES = ['trigger', 'effect', 'modifier'] as const;
export type RuneCategory = (typeof RUNE_CATEGORIES)[number];

export const TRIGGER_RUNE_IDS = [
  'rune.trigger.on-crit',
  'rune.trigger.on-multi-hit',
  'rune.trigger.on-splash',
  'rune.trigger.on-counter',
  'rune.trigger.on-block',
  'rune.trigger.on-evade',
] as const;
export type TriggerRuneId = (typeof TRIGGER_RUNE_IDS)[number];

export const EFFECT_RUNE_IDS = [
  'rune.effect.heal',
  'rune.effect.barrier',
  'rune.effect.bolt',
  'rune.effect.empower',
  'rune.effect.mark',
  'rune.effect.reprisal',
] as const;
export type EffectRuneId = (typeof EFFECT_RUNE_IDS)[number];

export const MODIFIER_RUNE_IDS = [
  'rune.modifier.echo',
  'rune.modifier.chain',
  'rune.modifier.prism',
  'rune.modifier.surge',
  'rune.modifier.lingering',
] as const;
export type ModifierRuneId = (typeof MODIFIER_RUNE_IDS)[number];

export const RUNE_IDS = [...TRIGGER_RUNE_IDS, ...EFFECT_RUNE_IDS, ...MODIFIER_RUNE_IDS] as const;
export type RuneId = (typeof RUNE_IDS)[number];

/** Der Anvil-Tree begrenzt jedes bekannte Rune-Level auf diesen geschlossenen Bereich. */
export type RuneLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Explizit austauschbarer Balancing-Hebel. Die Struktur ist Regel, die Werte bleiben bis zum
 * Balancing-Pass deklarativer Content (RUNES §5 und OPEN_ISSUES §1).
 */
export interface RuneLevelScaling {
  facet: 'attunement' | 'magnitude' | 'modifier-strength';
  levels: readonly [number, number, number, number, number];
  isBalancingContent: true;
}

/** Ein sichtbarer Katalogeintrag; Mindesttiefe steuert spätere Silhouetten und Inscribe-Pools. */
export interface RuneDefinition {
  id: RuneId;
  name: string;
  category: RuneCategory;
  minimumDepth: number;
  levelScaling: RuneLevelScaling;
}

/** Teamweiter Wissensstand, nie ein Stack oder Inventar. Fehlender Key bedeutet unbekannt. */
export type RuneGrimoire = Readonly<Partial<Record<RuneId, RuneLevel>>>;

/**
 * Die persistierte Zeile eines Talismans. Leere Slots sind `null`, damit ein freigeschalteter
 * Rite schrittweise und kostenlos konfiguriert werden kann.
 */
export interface Rite {
  triggerRuneId: TriggerRuneId | null;
  effectRuneId: EffectRuneId | null;
  modifierRuneId: ModifierRuneId | null;
}

/** Geschlossene Rite-Slots; Kategorie und Save-Key bleiben damit konsistent. */
export const RITE_SLOTS = ['triggerRuneId', 'effectRuneId', 'modifierRuneId'] as const;
export type RiteSlot = (typeof RITE_SLOTS)[number];

export const RITE_SLOT_CATEGORY: Readonly<Record<RiteSlot, RuneCategory>> = {
  triggerRuneId: 'trigger',
  effectRuneId: 'effect',
  modifierRuneId: 'modifier',
};

/** Es gibt genau einen Talisman-/Rite-Zustand je festem Teammitglied. */
export type TeamRites = Readonly<Record<CharacterId, Rite>>;
