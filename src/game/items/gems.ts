import type {
  ArmorLoadout,
  CoreStats,
  DefensiveStats,
  GemAffix,
  GemColor,
  OffensiveStats,
  Range,
  RegularGemColor,
} from '@/game/types';
import {
  AMBER_AFFIXES,
  ARMOR_SLOTS,
  EMERALD_AFFIXES,
  RUBY_AFFIXES,
  SAPPHIRE_AFFIXES,
} from '@/game/types';

/**
 * Gem-Schicht der Item-Anatomie (docs/spec/ITEMS.md#8-jeweler--inlay-attune--recut):
 * Farb-Pools entlang der Stat-Kategorien und die Value-Ranges der Affixe. Diamond hat
 * keinen Pool, solange die Prismatic-Effekte offen sind (docs/backlog/OPEN_ISSUES.md).
 */

/** Anzeigename je Gem-Farbe (Spieltext, Englisch). */
export const GEM_LABEL: Readonly<Record<GemColor, string>> = {
  amber: 'Amber',
  ruby: 'Ruby',
  sapphire: 'Sapphire',
  emerald: 'Emerald',
  diamond: 'Diamond',
};

/** Farb-Pools der vier regulären Farben — die Bindung an die Stat-Kategorien (ITEMS §8). */
export const GEM_POOLS = {
  amber: AMBER_AFFIXES,
  ruby: RUBY_AFFIXES,
  sapphire: SAPPHIRE_AFFIXES,
  emerald: EMERALD_AFFIXES,
} as const satisfies Record<RegularGemColor, readonly GemAffix[]>;

/**
 * PLATZHALTER — Value-Ranges der Affixe auf Gem-Level 1
 * (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten). Verbindlich ist die
 * Struktur: jeder Affix rollt seinen Wert gleichverteilt aus einer geschlossenen Range
 * (ITEMS §8); die Grenzen sind Tuning. Chance-Affixe tragen Anteile 0..1, Damage-Affixe
 * Anteile des rohen Grundschadens, alle übrigen flache Punkte.
 */
export const GEM_VALUE_RANGES: Readonly<Record<GemAffix, Range>> = {
  critChance: { min: 0.01, max: 0.03 },
  multiHitChance: { min: 0.01, max: 0.03 },
  splashChance: { min: 0.01, max: 0.03 },
  counterChance: { min: 0.01, max: 0.03 },
  critDamage: { min: 0.05, max: 0.15 },
  multiHitDamage: { min: 0.05, max: 0.15 },
  splashDamage: { min: 0.05, max: 0.15 },
  counterDamage: { min: 0.05, max: 0.15 },
  barrier: { min: 2, max: 6 },
  blockChance: { min: 0.01, max: 0.03 },
  evasion: { min: 0.01, max: 0.03 },
  regeneration: { min: 1, max: 3 },
  might: { min: 1, max: 3 },
  toughness: { min: 1, max: 3 },
  vitality: { min: 1, max: 3 },
};

/**
 * PLATZHALTER — Wachstum der Value-Range je Gem-Level über Level 1
 * (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten). Verbindlich ist die
 * Struktur: Attune hebt die Value-Range streng monoton (ITEMS §8); der Faktor ist Tuning.
 */
export const GEM_LEVEL_RANGE_GROWTH = 1.25;

/** Value-Range eines Affixes auf dem übergebenen Gem-Level (ITEMS §8). */
export function gemValueRange(affix: GemAffix, gemLevel: number): Range {
  const base = GEM_VALUE_RANGES[affix];
  const factor = GEM_LEVEL_RANGE_GROWTH ** (gemLevel - 1);
  return { min: base.min * factor, max: base.max * factor };
}

/** Additive Kampf-Beiträge aller gesockelten Gems eines Loadouts; `0` ist überall neutral. */
export interface GemEffects {
  core: CoreStats;
  offensive: OffensiveStats;
  defensive: DefensiveStats;
}

/**
 * Aggregiert die gerollten Affixe der gesockelten Gems in die drei Zielkategorien
 * (ITEMS §8): Amber und Ruby in Offensive, Sapphire in Defensive, Emerald in Core.
 * Prismatic-Sockel bleiben leer und tragen nichts bei.
 */
export function gemEffects(loadout: ArmorLoadout): GemEffects {
  const effects: GemEffects = {
    core: { might: 0, toughness: 0, vitality: 0 },
    offensive: {
      critChance: 0,
      critDamage: 0,
      multiHitChance: 0,
      multiHitDamage: 0,
      splashChance: 0,
      splashDamage: 0,
      counterChance: 0,
      counterDamage: 0,
    },
    defensive: { barrier: 0, blockChance: 0, evasion: 0, regeneration: 0 },
  };

  for (const slot of ARMOR_SLOTS) {
    const item = loadout[slot];
    if (item === undefined) continue;
    for (const gem of item.sockets) {
      if (gem === null) continue;
      switch (gem.color) {
        case 'amber':
        case 'ruby':
          effects.offensive[gem.affix] += gem.value;
          break;
        case 'sapphire':
          effects.defensive[gem.affix] += gem.value;
          break;
        case 'emerald':
          effects.core[gem.affix] += gem.value;
          break;
      }
    }
  }

  return effects;
}
