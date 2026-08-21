import { TEAM_ORDER } from '@/game/characters/characters';
import { CRUCIBLE_IDS, type CrucibleRanks } from '@/game/crucible/crucible';
import type { CharacterId } from '@/game/types';
import {
  EFFECT_RUNE_IDS,
  MODIFIER_RUNE_IDS,
  RUNE_CATEGORIES,
  TRIGGER_RUNE_IDS,
  type Rite,
  type RuneCategory,
  type RuneDefinition,
  type RuneGrimoire,
  type RuneId,
  type RuneLevel,
  type TeamRites,
} from './types';

/**
 * Platzhalterwerte für die noch offene Rune-Balance. Ihre Zuordnung zu den Kategorien ist
 * verbindlich; konkrete Wirkung und Tuning werden erst mit den Kampftasks konsumiert.
 */
export const RUNE_BALANCING = {
  triggerAttunement: [0, 0.05, 0.1, 0.15, 0.2],
  effectMagnitude: [1, 1.25, 1.5, 1.75, 2],
  modifierStrength: [1, 1.25, 1.5, 1.75, 2],
} as const;

const TRIGGER_SCALING = {
  facet: 'attunement',
  levels: RUNE_BALANCING.triggerAttunement,
  isBalancingContent: true,
} as const;
const EFFECT_SCALING = {
  facet: 'magnitude',
  levels: RUNE_BALANCING.effectMagnitude,
  isBalancingContent: true,
} as const;
const MODIFIER_SCALING = {
  facet: 'modifier-strength',
  levels: RUNE_BALANCING.modifierStrength,
  isBalancingContent: true,
} as const;

/** Alle 17 Runen aus RUNES §3, inklusive ihrer Sichtbarkeits-/Inscribe-Tiefe. */
export const RUNES = [
  {
    id: 'rune.trigger.on-crit',
    name: 'On Crit',
    category: 'trigger',
    minimumDepth: 1,
    levelScaling: TRIGGER_SCALING,
  },
  {
    id: 'rune.trigger.on-multi-hit',
    name: 'On Multi-Hit',
    category: 'trigger',
    minimumDepth: 2,
    levelScaling: TRIGGER_SCALING,
  },
  {
    id: 'rune.trigger.on-splash',
    name: 'On Splash',
    category: 'trigger',
    minimumDepth: 3,
    levelScaling: TRIGGER_SCALING,
  },
  {
    id: 'rune.trigger.on-counter',
    name: 'On Counter',
    category: 'trigger',
    minimumDepth: 4,
    levelScaling: TRIGGER_SCALING,
  },
  {
    id: 'rune.trigger.on-block',
    name: 'On Block',
    category: 'trigger',
    minimumDepth: 5,
    levelScaling: TRIGGER_SCALING,
  },
  {
    id: 'rune.trigger.on-evade',
    name: 'On Evade',
    category: 'trigger',
    minimumDepth: 6,
    levelScaling: TRIGGER_SCALING,
  },
  {
    id: 'rune.effect.heal',
    name: 'Heal',
    category: 'effect',
    minimumDepth: 1,
    levelScaling: EFFECT_SCALING,
  },
  {
    id: 'rune.effect.barrier',
    name: 'Barrier',
    category: 'effect',
    minimumDepth: 2,
    levelScaling: EFFECT_SCALING,
  },
  {
    id: 'rune.effect.bolt',
    name: 'Bolt',
    category: 'effect',
    minimumDepth: 3,
    levelScaling: EFFECT_SCALING,
  },
  {
    id: 'rune.effect.empower',
    name: 'Empower',
    category: 'effect',
    minimumDepth: 4,
    levelScaling: EFFECT_SCALING,
  },
  {
    id: 'rune.effect.mark',
    name: 'Mark',
    category: 'effect',
    minimumDepth: 5,
    levelScaling: EFFECT_SCALING,
  },
  {
    id: 'rune.effect.reprisal',
    name: 'Reprisal',
    category: 'effect',
    minimumDepth: 6,
    levelScaling: EFFECT_SCALING,
  },
  {
    id: 'rune.modifier.echo',
    name: 'Echo',
    category: 'modifier',
    minimumDepth: 2,
    levelScaling: MODIFIER_SCALING,
  },
  {
    id: 'rune.modifier.chain',
    name: 'Chain',
    category: 'modifier',
    minimumDepth: 3,
    levelScaling: MODIFIER_SCALING,
  },
  {
    id: 'rune.modifier.prism',
    name: 'Prism',
    category: 'modifier',
    minimumDepth: 4,
    levelScaling: MODIFIER_SCALING,
  },
  {
    id: 'rune.modifier.surge',
    name: 'Surge',
    category: 'modifier',
    minimumDepth: 5,
    levelScaling: MODIFIER_SCALING,
  },
  {
    id: 'rune.modifier.lingering',
    name: 'Lingering',
    category: 'modifier',
    minimumDepth: 6,
    levelScaling: MODIFIER_SCALING,
  },
] as const satisfies readonly RuneDefinition[];

const RUNES_BY_ID = new Map<RuneId, RuneDefinition>(RUNES.map((rune) => [rune.id, rune]));

/** Der verbindliche Freischaltungsgrant; die beiden Starter ermöglichen den ersten Rite. */
export const STARTER_RUNES = ['rune.trigger.on-crit', 'rune.effect.heal'] as const;

/** Liefert keinen Katalogwert für unbekannte Save-IDs. */
export function runeById(runeId: string): RuneDefinition | undefined {
  return RUNES_BY_ID.get(runeId as RuneId);
}

/** Geschlossene, deklarative Kategorie-Pools in stabiler Katalogreihenfolge. */
export function runesForCategory(category: RuneCategory): readonly RuneDefinition[] {
  return RUNES.filter((rune) => rune.category === category);
}

/** Prüft den auf 1–5 begrenzten, persistierbaren Rune-Level. */
export function isRuneLevel(value: number): value is RuneLevel {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

/**
 * Rune Grimoire liefert Cap 1; jeder Rune-Mastery-Rang erhöht es um eine Stufe, maximal 5.
 * Ohne Grimoire existiert kein Rune-System und damit Cap 0.
 */
export function runeLevelCap(ranks: CrucibleRanks): number {
  if ((ranks[CRUCIBLE_IDS.runeGrimoire] ?? 0) < 1) return 0;
  return Math.min(5, 1 + (ranks[CRUCIBLE_IDS.runeMastery] ?? 0));
}

/** Vor diesem permanenten Anvil-Kauf existieren weder Runewords noch Rune-Drops. */
export function isRuneGrimoireUnlocked(ranks: CrucibleRanks): boolean {
  return (ranks[CRUCIBLE_IDS.runeGrimoire] ?? 0) >= 1;
}

/** Trigger- und Effect-Slot folgen Talisman, Modifier folgt dem gleichrangigen Runic Focus. */
export function unlockedRiteSlots(
  ranks: CrucibleRanks,
  characterId: CharacterId,
): Readonly<{ trigger: boolean; effect: boolean; modifier: boolean }> {
  const characterIndex = TEAM_ORDER.indexOf(characterId);
  const requiredRank = characterIndex + 1;
  const talismanUnlocked =
    characterIndex >= 0 && (ranks[CRUCIBLE_IDS.talisman] ?? 0) >= requiredRank;
  return {
    trigger: talismanUnlocked,
    effect: talismanUnlocked,
    modifier: talismanUnlocked && (ranks[CRUCIBLE_IDS.runicFocus] ?? 0) >= requiredRank,
  };
}

/** Leerer konfigurabler Rite, auch solange sein Talisman noch gesperrt ist. */
export function createEmptyRite(): Rite {
  return { triggerRuneId: null, effectRuneId: null, modifierRuneId: null };
}

/** Der Save führt immer die drei festen Rite-Zeilen, nie ein dynamisches Talisman-Inventar. */
export function createEmptyTeamRites(): TeamRites {
  return {
    korvin: createEmptyRite(),
    rhaya: createEmptyRite(),
    quinn: createEmptyRite(),
  };
}

/** Leerer Wissensstand zum Start eines neuen Save. */
export function createEmptyRuneGrimoire(): RuneGrimoire {
  return {};
}

/**
 * Fügt exakt die beiden Starter bei freigeschaltetem Grimoire hinzu. Ein wiederholter Aufruf
 * verändert bekannte Starter nicht und kann deshalb keine Duplikate erzeugen.
 */
export function grantRuneGrimoireStarters(
  grimoire: RuneGrimoire,
  ranks: CrucibleRanks,
): RuneGrimoire {
  if (!isRuneGrimoireUnlocked(ranks)) return grimoire;
  return {
    ...grimoire,
    [STARTER_RUNES[0]]: grimoire[STARTER_RUNES[0]] ?? 1,
    [STARTER_RUNES[1]]: grimoire[STARTER_RUNES[1]] ?? 1,
  };
}

/** Prüft die Katalogform separat, damit Content-Änderungen direkt testbar bleiben. */
export function validateRuneCatalog(): string | null {
  const expectedCounts: Readonly<Record<RuneCategory, number>> = {
    trigger: TRIGGER_RUNE_IDS.length,
    effect: EFFECT_RUNE_IDS.length,
    modifier: MODIFIER_RUNE_IDS.length,
  };
  if (Array.from(RUNES).length !== 17 || RUNES_BY_ID.size !== 17) {
    return 'erwartet 17 eindeutige Runen';
  }

  for (const category of RUNE_CATEGORIES) {
    if (runesForCategory(category).length !== expectedCounts[category]) {
      return `ungültige Anzahl der ${category}-Runen`;
    }
  }
  if (STARTER_RUNES.some((runeId) => runeById(runeId) === undefined)) {
    return 'Starter-Rune fehlt im Katalog';
  }
  return RUNES.some((rune) => rune.minimumDepth < 1) ? 'ungültiger Rune-Balancing-Content' : null;
}

/**
 * Invarianten des reinen Wissensstands: bekannte, gelevelte Runen existieren erst nach dem
 * Grimoire, respektieren das abgeleitete Cap und enthalten dann den garantierten Starter-Grant.
 */
export function validateRuneGrimoire(grimoire: RuneGrimoire, ranks: CrucibleRanks): string | null {
  const cap = runeLevelCap(ranks);
  for (const [runeId, level] of Object.entries(grimoire)) {
    if (runeById(runeId) === undefined) return 'Unbekannte Rune im Grimoire.';
    if (!isRuneLevel(level) || level > cap) return 'Ungültiges Rune-Level im Grimoire.';
  }
  if (cap === 0 && Object.keys(grimoire).length > 0) return 'Grimoire ohne Freischaltung.';
  if (cap > 0 && STARTER_RUNES.some((runeId) => grimoire[runeId] === undefined)) {
    return 'Starter-Runen im Grimoire fehlen.';
  }
  return null;
}

/**
 * Validiert Kategorie, Wissensstand, Slot-Rang und die teamweite Rune-Einmaligkeit eines Rite
 * Zustands. Ein leeres, noch gesperrtes Rite bleibt absichtlich ein gültiger Save-Zustand.
 */
export function validateTeamRites(
  rites: TeamRites,
  grimoire: RuneGrimoire,
  ranks: CrucibleRanks,
): string | null {
  const activeRunes = new Set<RuneId>();
  const slots = [
    ['triggerRuneId', 'trigger'],
    ['effectRuneId', 'effect'],
    ['modifierRuneId', 'modifier'],
  ] as const;

  for (const characterId of TEAM_ORDER) {
    const rite = rites[characterId];
    const unlocked = unlockedRiteSlots(ranks, characterId);
    for (const [slot, category] of slots) {
      const runeId = rite[slot];
      if (runeId === null) continue;

      const rune = runeById(runeId);
      if (rune?.category !== category) return 'Rune passt nicht zum Rite-Slot.';
      if (!unlocked[category]) return 'Rite-Slot ist nicht freigeschaltet.';
      if (grimoire[rune.id] === undefined) return 'Rune ist nicht im Grimoire bekannt.';
      if (activeRunes.has(rune.id)) return 'Eine Rune ist mehrfach im Team aktiv.';
      activeRunes.add(rune.id);
    }
  }
  return null;
}
