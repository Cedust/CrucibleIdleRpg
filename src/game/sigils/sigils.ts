import type { FloorId } from '@/game/types';
import { type SigilCodex, type SigilDefinition, type SigilId, type SigilLevel } from './types';

/**
 * PLATZHALTER — Drop-Chance, Gewichte und Imprint-Stärken bleiben Balancing-Content
 * (docs/backlog/OPEN_ISSUES.md#1-offene-balancing-fragen--tuning-notizen). Die Reihenfolge
 * der fünf Werte entspricht den Sigil-Leveln 1–5.
 */
export const SIGIL_BALANCING = {
  repeatDropChance: 0.35,
  unknownWeight: 3,
  knownWeight: 1,
  standardStrengths: [0.04, 0.08, 0.12, 0.16, 0.2],
  broadStrengths: [0.02, 0.04, 0.06, 0.08, 0.1],
} as const;

const STANDARD_STRENGTHS = SIGIL_BALANCING.standardStrengths;
const BROAD_STRENGTHS = SIGIL_BALANCING.broadStrengths;

/** Alle 18 Sigils mit Quelle, Imprint-Identität und Slot-Bindung (ITEMS §5.1). */
export const SIGILS = [
  {
    id: 'sigil.tempered-edge',
    name: 'Tempered Edge',
    sourceFloorId: 'A1-D1-20',
    imprint: {
      id: 'weapon-base-damage',
      label: 'Weapon Base Damage',
      levelStrengths: STANDARD_STRENGTHS,
    },
    slots: ['chest', 'legs'],
  },
  {
    id: 'sigil.kindled-blood',
    name: 'Kindled Blood',
    sourceFloorId: 'A1-D2-20',
    imprint: { id: 'regeneration', label: 'Regeneration', levelStrengths: STANDARD_STRENGTHS },
    slots: ['head', 'chest'],
  },
  {
    id: 'sigil.narrowed-fate',
    name: 'Narrowed Fate',
    sourceFloorId: 'A1-D3-20',
    imprint: {
      id: 'damage-range-floor',
      label: 'Damage Range Floor',
      levelStrengths: STANDARD_STRENGTHS,
    },
    slots: ['head', 'feet'],
  },
  {
    id: 'sigil.forged-ward',
    name: 'Forged Ward',
    sourceFloorId: 'A1-D4-20',
    imprint: { id: 'barrier', label: 'Barrier', levelStrengths: STANDARD_STRENGTHS },
    slots: ['chest', 'legs'],
  },
  {
    id: 'sigil.wardens-bastion',
    name: "Warden's Bastion",
    sourceFloorId: 'A1-D5-20',
    imprint: {
      id: 'block-reduction',
      label: 'Block Reduction',
      levelStrengths: STANDARD_STRENGTHS,
    },
    slots: ['chest', 'legs', 'feet'],
  },
  {
    id: 'sigil.burning-sentence',
    name: 'Burning Sentence',
    sourceFloorId: 'A2-D1-20',
    imprint: {
      id: 'critical-damage',
      label: 'Critical Damage',
      levelStrengths: STANDARD_STRENGTHS,
    },
    slots: ['head', 'chest'],
  },
  {
    id: 'sigil.stormchain',
    name: 'Stormchain',
    sourceFloorId: 'A2-D2-20',
    imprint: {
      id: 'multi-hit-damage',
      label: 'Multi Hit Damage',
      levelStrengths: STANDARD_STRENGTHS,
    },
    slots: ['legs', 'feet'],
  },
  {
    id: 'sigil.molten-wake',
    name: 'Molten Wake',
    sourceFloorId: 'A2-D3-20',
    imprint: { id: 'splash-damage', label: 'Splash Damage', levelStrengths: STANDARD_STRENGTHS },
    slots: ['chest', 'legs'],
  },
  {
    id: 'sigil.answered-steel',
    name: 'Answered Steel',
    sourceFloorId: 'A2-D4-20',
    imprint: { id: 'counter-damage', label: 'Counter Damage', levelStrengths: STANDARD_STRENGTHS },
    slots: ['head', 'feet'],
  },
  {
    id: 'sigil.saints-last-testament',
    name: "Saint's Last Testament",
    sourceFloorId: 'A2-D5-20',
    imprint: {
      id: 'tri-damage',
      label: 'Multi Hit, Splash & Counter Damage',
      levelStrengths: BROAD_STRENGTHS,
    },
    slots: ['head', 'chest', 'legs', 'feet'],
  },
  {
    id: 'sigil.gilded-force',
    name: 'Gilded Force',
    sourceFloorId: 'A3-D1-20',
    imprint: {
      id: 'might-attack',
      label: 'Might Attack Contribution',
      levelStrengths: STANDARD_STRENGTHS,
    },
    slots: ['head', 'chest'],
  },
  {
    id: 'sigil.gilded-aegis',
    name: 'Gilded Aegis',
    sourceFloorId: 'A3-D2-20',
    imprint: {
      id: 'toughness-defense',
      label: 'Toughness Defense Contribution',
      levelStrengths: STANDARD_STRENGTHS,
    },
    slots: ['chest', 'legs'],
  },
  {
    id: 'sigil.gilded-lifeblood',
    name: 'Gilded Lifeblood',
    sourceFloorId: 'A3-D3-20',
    imprint: {
      id: 'vitality-health',
      label: 'Vitality Health Contribution',
      levelStrengths: STANDARD_STRENGTHS,
    },
    slots: ['head', 'legs'],
  },
  {
    id: 'sigil.imperial-advance',
    name: 'Imperial Advance',
    sourceFloorId: 'A3-D4-20',
    imprint: { id: 'initiative', label: 'Initiative', levelStrengths: STANDARD_STRENGTHS },
    slots: ['head', 'feet'],
  },
  {
    id: 'sigil.empress-ferocity',
    name: "Empress's Ferocity",
    sourceFloorId: 'A3-D5-20',
    imprint: {
      id: 'ferocity-effectiveness',
      label: 'Ferocity Effectiveness',
      levelStrengths: STANDARD_STRENGTHS,
    },
    slots: ['head', 'chest'],
  },
  {
    id: 'sigil.empress-resilience',
    name: "Empress's Resilience",
    sourceFloorId: 'A3-D5-20',
    imprint: {
      id: 'resilience-effectiveness',
      label: 'Resilience Effectiveness',
      levelStrengths: STANDARD_STRENGTHS,
    },
    slots: ['chest', 'legs'],
  },
  {
    id: 'sigil.empress-vigor',
    name: "Empress's Vigor",
    sourceFloorId: 'A3-D5-20',
    imprint: {
      id: 'vigor-effectiveness',
      label: 'Vigor Effectiveness',
      levelStrengths: STANDARD_STRENGTHS,
    },
    slots: ['legs', 'feet'],
  },
  {
    id: 'sigil.empress-mandate',
    name: "Empress's Mandate",
    sourceFloorId: 'A3-D5-20',
    imprint: {
      id: 'attribute-effectiveness',
      label: 'Attribute Effectiveness',
      levelStrengths: BROAD_STRENGTHS,
    },
    slots: ['head', 'chest', 'legs', 'feet'],
  },
] as const satisfies readonly SigilDefinition[];

const sigilsById = new Map<SigilId, SigilDefinition>(SIGILS.map((sigil) => [sigil.id, sigil]));
const sigilsBySource = new Map<FloorId, readonly SigilDefinition[]>();
for (const sigil of SIGILS) {
  const sourceSigils = sigilsBySource.get(sigil.sourceFloorId) ?? [];
  sigilsBySource.set(sigil.sourceFloorId, [...sourceSigils, sigil]);
}

/** Liefert einen Katalogeintrag; unbekannte Save-IDs haben keinen Spielwert. */
export function sigilById(sigilId: string): SigilDefinition | undefined {
  return sigilsById.get(sigilId as SigilId);
}

/** Alle Sigils einer Elite-/Boss-Quelle; normale Floors liefern ein leeres Array. */
export function sigilsForSource(floorId: FloorId): readonly SigilDefinition[] {
  return sigilsBySource.get(floorId) ?? [];
}

/** Sichtbarer Spieltext eines Sigils im Codex und als Sieg-Drop (ITEMS §5). */
export function sigilDisplayName(sigilId: SigilId): string {
  const sigil = sigilsById.get(sigilId);
  if (sigil === undefined) throw new Error(`Unbekanntes Sigil: ${sigilId}`);
  return `Sigil of ${sigil.name}`;
}

/** Akt der Quelle, aus der kanonischen Floor-ID statt einer zweiten Content-Angabe abgeleitet. */
export function sigilAct(sigil: SigilDefinition): number {
  return Number(sigil.sourceFloorId.slice(1, sigil.sourceFloorId.indexOf('-')));
}

/**
 * Aktuell sichtbare Codex-Akte. Akt 1 ist der Startakt; künftige Akt-Freischaltungen bringen
 * mindestens ihren ersten Sigil mit und öffnen so die zugehörigen Platzhalter ohne Zweit-Store.
 */
export function unlockedSigilActs(codex: SigilCodex): readonly number[] {
  const highestKnownAct = SIGILS.reduce(
    (highest, sigil) =>
      codex[sigil.id] === undefined ? highest : Math.max(highest, sigilAct(sigil)),
    1,
  );
  return Array.from({ length: highestKnownAct }, (_, index) => index + 1);
}

/** Prüft die festen Katalog-Invarianten für Tests und Content-Änderungen. */
export function validateSigilCatalog(): string | null {
  if (sigilsById.size !== 18) return 'erwartet 18 eindeutige Sigils';

  for (const [sourceFloorId, sourceSigils] of sigilsBySource) {
    const isAct3Boss = sourceFloorId === 'A3-D5-20';
    if (sourceSigils.length !== (isAct3Boss ? 4 : 1)) {
      return `ungültige Sigil-Anzahl für ${sourceFloorId}`;
    }
  }
  return sigilsBySource.size === 15 ? null : 'erwartet 15 Elite-/Boss-Quellen';
}

/** Leerer Codex beim Start eines neuen Save. */
export function createEmptySigilCodex(): SigilCodex {
  return {};
}

/** Typ-Narrowing für gespeicherte Levelwerte. */
export function isSigilLevel(value: number): value is SigilLevel {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}
