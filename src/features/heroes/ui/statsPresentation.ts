import type { AttributePoints, CharacterStats, DerivedStats } from '@/game/types';
import type { IconName } from '@/shared/ui/icons/Icon';

/**
 * Katalog der Heroes-Stat-Anzeige: Reihenfolge, Beschriftung, Format, Icon und Tönung je Zeile.
 * Die Werte selbst kommen aus `CharacterStats` (Herleitung in
 * `features/combat/engine/characterStats.ts`); hier steht ausschließlich die Darstellung.
 */

/**
 * Tönung einer Stat-Achse; alle Werte sind Palette-Tokens aus `@theme`. Die vier Achsen-Töne
 * gehören allein der Stat-Darstellung — die Statusfarben `danger`, `success` und `info` bleiben
 * der Feedback-Schicht (Health-Balken, Fehler, unbezahlbare Kosten) vorbehalten.
 */
export type StatTone = 'accent' | 'offense' | 'defense' | 'vitality' | 'utility';

export const TONE_TEXT_CLASSES: Record<StatTone, string> = {
  accent: 'text-accent-strong',
  offense: 'text-offense',
  defense: 'text-defense',
  vitality: 'text-vitality',
  utility: 'text-utility',
};

export interface StatRow {
  label: string;
  value: number;
  /**
   * Zweiter Wert der Zeile; nur die Offensive-Gruppe trägt ihn, dort Chance und Damage je
   * Muster (SPEC §3.0). `format` gilt für beide Werte.
   */
  pairedValue?: number;
  format?: 'number' | 'percent';
  icon: IconName;
  /** Eigene Tönung der Zeile; ohne sie trägt die Zeile die Tönung ihrer Gruppe. */
  tone?: StatTone;
}

export interface StatGroup {
  label: string;
  tone: StatTone;
  /** Beschriftung der beiden Wertspalten; nur die paarweise Offensive-Gruppe trägt sie. */
  valueColumns?: readonly [string, string];
  stats: readonly StatRow[];
}

/** Die drei präsenten Kampfwerte der linken Spalte. */
export interface CombatStatRow {
  label: string;
  value: number;
  tone: StatTone;
  icon: IconName;
}

/** Attribut und der Derived Stat, den es um exakt 1,25 % je Punkt hebt (CHARACTERS §3). */
export interface AttributeAxis {
  attribute: keyof AttributePoints;
  label: string;
  derived: keyof DerivedStats;
  tone: StatTone;
  icon: IconName;
}

/** Ein Attribut trägt Icon und Tönung seines gekoppelten Derived Stats. */
const DERIVED_ICON = {
  attack: 'stat-attack',
  defense: 'stat-defense',
  health: 'stat-health',
} as const satisfies Record<keyof DerivedStats, IconName>;

const DERIVED_TONE = {
  attack: 'offense',
  defense: 'defense',
  health: 'vitality',
} as const satisfies Record<keyof DerivedStats, StatTone>;

export const ATTRIBUTE_AXES = [
  {
    attribute: 'ferocity',
    label: 'Ferocity',
    derived: 'attack',
    tone: DERIVED_TONE.attack,
    icon: DERIVED_ICON.attack,
  },
  {
    attribute: 'resilience',
    label: 'Resilience',
    derived: 'defense',
    tone: DERIVED_TONE.defense,
    icon: DERIVED_ICON.defense,
  },
  {
    attribute: 'vigor',
    label: 'Vigor',
    derived: 'health',
    tone: DERIVED_TONE.health,
    icon: DERIVED_ICON.health,
  },
] as const satisfies readonly AttributeAxis[];

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export function formatStatValue({ value, format = 'number' }: Pick<StatRow, 'value' | 'format'>) {
  return format === 'percent'
    ? `${numberFormatter.format(value * 100)}%`
    : numberFormatter.format(value);
}

export function combatStatRows(
  derived: DerivedStats,
): readonly [CombatStatRow, CombatStatRow, CombatStatRow] {
  return [
    {
      label: 'Attack',
      value: derived.attack,
      tone: DERIVED_TONE.attack,
      icon: DERIVED_ICON.attack,
    },
    {
      label: 'Defense',
      value: derived.defense,
      tone: DERIVED_TONE.defense,
      icon: DERIVED_ICON.defense,
    },
    {
      label: 'Health',
      value: derived.health,
      tone: DERIVED_TONE.health,
      icon: DERIVED_ICON.health,
    },
  ];
}

/**
 * Die vier Listen-Gruppen der Stats-Ansicht. Die Offensive Stats stehen paarweise: eine Zeile je
 * Muster mit Chance und Damage nebeneinander (SPEC §3.0), beschriftet über `valueColumns`. Jede
 * Zeile trägt damit genau einmal das Discipline-Icon ihres Weapon-Mastery-Tabs — Critical Hits →
 * Finesse, Multi Hits → Tempest, Splash Hits → Dominance, Counter Hits → Valor.
 *
 * Die Core Stats bleiben als Gruppe golden und tönen stattdessen jede Zeile mit der Achse des
 * Derived Stats, den der Core Stat speist (Might → Attack, Toughness → Defense,
 * Vitality → Health; CHARACTERS §2). Die drei übrigen Gruppen tragen je eine Achse geschlossen.
 */
export function statGroups(
  stats: CharacterStats,
): readonly [StatGroup, StatGroup, StatGroup, StatGroup] {
  return [
    {
      label: 'Core',
      tone: 'accent',
      stats: [
        {
          label: 'Might',
          value: stats.core.might,
          icon: 'stat-might',
          tone: DERIVED_TONE.attack,
        },
        {
          label: 'Toughness',
          value: stats.core.toughness,
          icon: 'stat-toughness',
          tone: DERIVED_TONE.defense,
        },
        {
          label: 'Vitality',
          value: stats.core.vitality,
          icon: 'stat-vitality',
          tone: DERIVED_TONE.health,
        },
      ],
    },
    {
      label: 'Offensive',
      tone: 'offense',
      valueColumns: ['Chance', 'Damage'],
      stats: [
        {
          label: 'Critical Hits',
          value: stats.offensive.critChance,
          pairedValue: stats.offensive.critDamage,
          format: 'percent',
          icon: 'discipline-finesse',
        },
        {
          label: 'Multi Hits',
          value: stats.offensive.multiHitChance,
          pairedValue: stats.offensive.multiHitDamage,
          format: 'percent',
          icon: 'discipline-tempest',
        },
        {
          label: 'Splash Hits',
          value: stats.offensive.splashChance,
          pairedValue: stats.offensive.splashDamage,
          format: 'percent',
          icon: 'discipline-dominance',
        },
        {
          label: 'Counter Hits',
          value: stats.offensive.counterChance,
          pairedValue: stats.offensive.counterDamage,
          format: 'percent',
          icon: 'discipline-valor',
        },
      ],
    },
    {
      label: 'Defensive',
      tone: 'defense',
      stats: [
        { label: 'Barrier', value: stats.defensive.barrier, icon: 'stat-barrier' },
        {
          label: 'Block Chance',
          value: stats.defensive.blockChance,
          format: 'percent',
          icon: 'stat-block',
        },
        {
          label: 'Evasion',
          value: stats.defensive.evasion,
          format: 'percent',
          icon: 'stat-evasion',
        },
        {
          label: 'Regeneration',
          value: stats.defensive.regeneration,
          icon: 'stat-regeneration',
        },
      ],
    },
    {
      label: 'Utility',
      tone: 'utility',
      stats: [
        { label: 'Initiative', value: stats.utility.initiative, icon: 'stat-initiative' },
        {
          label: 'Multi Hit Chain',
          value: stats.utility.multiHitChain,
          icon: 'stat-multi-hit-chain',
        },
        {
          label: 'Multi Hit Chain Factor',
          value: stats.utility.multiHitChainFactor,
          format: 'percent',
          icon: 'stat-chain-factor',
        },
        {
          label: 'Splash Radius',
          value: stats.utility.splashRadius,
          icon: 'stat-splash-radius',
        },
      ],
    },
  ];
}
