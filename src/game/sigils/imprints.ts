import { TEAM_ORDER } from '@/game/characters/characters';
import {
  ARMOR_SLOTS,
  type ArmorLoadout,
  type ArmorSlot,
  type AttributePoints,
  type CharacterId,
  type CoreStats,
  type DefensiveStats,
  type OffensiveStats,
  type TeamArmor,
} from '@/game/types';
import { sigilById } from './sigils';
import type { SigilCodex, SigilDefinition, SigilId, SigilLevel } from './types';

/** Ein bekannter, auf einem konkreten Item wirksamer Imprint samt seiner Codex-Stärke. */
export interface AppliedImprint {
  sigil: SigilDefinition;
  level: SigilLevel;
  strength: number;
}

/**
 * Abgeleitete Kampfhebel aller Imprints eines Loadouts. Die Zahlen sind ausschließlich
 * Eingaben in die zentrale Charakter-/Kampfherleitung; sie speichern keinen Laufzeitstand.
 */
export interface ImprintEffects {
  weaponBaseDamagePercent: number;
  damageRangeFloorBonus: number;
  blockDamageReductionBonus: number;
  initiativePercent: number;
  coreContributionPercent: CoreStats;
  attributeEffectivenessPercent: AttributePoints;
  offensivePercent: Partial<OffensiveStats>;
  defensivePercent: Partial<DefensiveStats>;
}

/** Neutraler, nicht geteilter Ausgangswert für die Herleitung eines Characters. */
function emptyImprintEffects(): ImprintEffects {
  return {
    weaponBaseDamagePercent: 0,
    damageRangeFloorBonus: 0,
    blockDamageReductionBonus: 0,
    initiativePercent: 0,
    coreContributionPercent: { might: 0, toughness: 0, vitality: 0 },
    attributeEffectivenessPercent: { ferocity: 0, resilience: 0, vigor: 0 },
    offensivePercent: {},
    defensivePercent: {},
  };
}

/** Stärke eines bekannten Sigils auf seinem persistierten Level. */
export function imprintStrength(sigil: SigilDefinition, level: SigilLevel): number {
  return sigil.imprint.levelStrengths[level - 1] ?? 0;
}

/**
 * Wirksame Imprints eines Loadouts in fester Slot-Reihenfolge. Ein kaputter oder nicht mehr
 * bekannter Save-Verweis liefert absichtlich keinen Kampfbonus; das Save-Schema lehnt ihn ab.
 */
export function appliedImprints(
  loadout: ArmorLoadout,
  codex: SigilCodex,
): readonly AppliedImprint[] {
  const result: AppliedImprint[] = [];

  for (const slot of ARMOR_SLOTS) {
    const sigilId = loadout[slot]?.imprint?.sigilId;
    if (sigilId === undefined) continue;

    const sigil = sigilById(sigilId);
    const level = sigil === undefined ? undefined : codex[sigil.id];
    if (sigil === undefined || level === undefined) continue;

    result.push({ sigil, level, strength: imprintStrength(sigil, level) });
  }

  return result;
}

/** Fügt einen Prozent-Multiplikator zu einem einzelnen Gem-Stat hinzu. */
function addOffensivePercent(
  effects: ImprintEffects,
  stat: keyof OffensiveStats,
  strength: number,
): void {
  effects.offensivePercent[stat] = (effects.offensivePercent[stat] ?? 0) + strength;
}

/** Fügt einen Prozent-Multiplikator zu einem einzelnen Gem-Stat hinzu. */
function addDefensivePercent(
  effects: ImprintEffects,
  stat: keyof DefensiveStats,
  strength: number,
): void {
  effects.defensivePercent[stat] = (effects.defensivePercent[stat] ?? 0) + strength;
}

/**
 * Übersetzt die 18 Katalog-Identitäten in ihre regelkonformen Herleitungshebel (ITEMS §5.1).
 * Gem-Stats werden nie flach zugeschlagen, sondern erst auf ihren vorhandenen Wert prozentual
 * verstärkt. Die drei identitätsstiftenden Quellen ohne Gem-Pendant bleiben eigene Hebel.
 */
export function imprintEffects(loadout: ArmorLoadout, codex: SigilCodex): ImprintEffects {
  const effects = emptyImprintEffects();

  for (const { sigil, strength } of appliedImprints(loadout, codex)) {
    switch (sigil.imprint.id) {
      case 'weapon-base-damage':
        effects.weaponBaseDamagePercent += strength;
        break;
      case 'regeneration':
        addDefensivePercent(effects, 'regeneration', strength);
        break;
      case 'damage-range-floor':
        effects.damageRangeFloorBonus += strength;
        break;
      case 'barrier':
        addDefensivePercent(effects, 'barrier', strength);
        break;
      case 'block-reduction':
        effects.blockDamageReductionBonus += strength;
        break;
      case 'critical-damage':
        addOffensivePercent(effects, 'critDamage', strength);
        break;
      case 'multi-hit-damage':
        addOffensivePercent(effects, 'multiHitDamage', strength);
        break;
      case 'splash-damage':
        addOffensivePercent(effects, 'splashDamage', strength);
        break;
      case 'counter-damage':
        addOffensivePercent(effects, 'counterDamage', strength);
        break;
      case 'tri-damage':
        addOffensivePercent(effects, 'multiHitDamage', strength);
        addOffensivePercent(effects, 'splashDamage', strength);
        addOffensivePercent(effects, 'counterDamage', strength);
        break;
      case 'might-attack':
        effects.coreContributionPercent.might += strength;
        break;
      case 'toughness-defense':
        effects.coreContributionPercent.toughness += strength;
        break;
      case 'vitality-health':
        effects.coreContributionPercent.vitality += strength;
        break;
      case 'initiative':
        effects.initiativePercent += strength;
        break;
      case 'ferocity-effectiveness':
        effects.attributeEffectivenessPercent.ferocity += strength;
        break;
      case 'resilience-effectiveness':
        effects.attributeEffectivenessPercent.resilience += strength;
        break;
      case 'vigor-effectiveness':
        effects.attributeEffectivenessPercent.vigor += strength;
        break;
      case 'attribute-effectiveness':
        effects.attributeEffectivenessPercent.ferocity += strength;
        effects.attributeEffectivenessPercent.resilience += strength;
        effects.attributeEffectivenessPercent.vigor += strength;
        break;
    }
  }

  return effects;
}

/** Aktive Imprint-IDs des Teams; das Zielitem kann für Re-Brand ausgeklammert werden. */
export function activeImprintSigilIds(
  armor: TeamArmor,
  excluded?: { characterId: CharacterId; slot: ArmorSlot },
): ReadonlySet<SigilId> {
  const active = new Set<SigilId>();

  for (const characterId of TEAM_ORDER) {
    for (const slot of ARMOR_SLOTS) {
      if (excluded?.characterId === characterId && excluded.slot === slot) continue;

      const sigilId = armor[characterId][slot]?.imprint?.sigilId;
      const sigil = sigilId === undefined ? undefined : sigilById(sigilId);
      if (sigil !== undefined) active.add(sigil.id);
    }
  }

  return active;
}

/**
 * Prüft die teamweiten Brand-Regeln des persistierten Zustands. Die lokalen Item-Invarianten
 * (Magic-Schwelle, Sockel, Slot-Basis) bleiben beim Item-Schema und werden hier ergänzt.
 */
export function validateActiveImprints(armor: TeamArmor, codex: SigilCodex): string | null {
  const active = new Set<SigilId>();

  for (const characterId of TEAM_ORDER) {
    for (const slot of ARMOR_SLOTS) {
      const item = armor[characterId][slot];
      const sigilId = item?.imprint?.sigilId;
      if (item === undefined || sigilId === undefined) continue;

      const sigil = sigilById(sigilId);
      if (sigil === undefined) return 'Unbekanntes Imprint-Sigil.';
      if (codex[sigil.id] === undefined) return 'Imprint-Sigil ist nicht im Codex bekannt.';
      if (!sigil.slots.includes(item.slot)) return 'Imprint passt nicht zum Armor-Slot.';
      if (active.has(sigil.id)) return 'Ein Sigil ist mehrfach aktiv.';

      active.add(sigil.id);
    }
  }

  return null;
}

const PERCENT_FORMATTER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Kompakte, präfixfreie Anzeige der aktuell skalierten Imprint-Wirkung. */
export function imprintEffectText(sigil: SigilDefinition, level: SigilLevel): string {
  const strength = imprintStrength(sigil, level);
  const amount = PERCENT_FORMATTER.format(strength * 100);

  switch (sigil.imprint.id) {
    case 'damage-range-floor':
      return `Minimum Damage Range +${amount}%`;
    case 'block-reduction':
      return `Block Reduction +${amount} pp`;
    default:
      return `${sigil.imprint.label} +${amount}%`;
  }
}
