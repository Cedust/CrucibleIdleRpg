import type { FloorId } from '@/game/types';
import type { Prng } from '@/shared/utils/prng';
import { SIGIL_BALANCING, sigilsForSource } from './sigils';
import type { SigilCodex, SigilDefinition, SigilDrop, SigilLevel } from './types';

const EMPRESS_MANDATE_ID = 'sigil.empress-mandate';
const MAX_SIGIL_LEVEL: SigilLevel = 5;

/**
 * Ermittelt den Codex-Fortschritt eines Floor-Siegs über den bestehenden Loot-Strom.
 * Garantierte Erstsiege und erschöpfte Quellen verbrauchen absichtlich keinen RNG-Wurf.
 */
export function rollSigilDrop(floorId: FloorId, codex: SigilCodex, prng: Prng): SigilDrop | null {
  const sourceSigils = sigilsForSource(floorId);
  if (sourceSigils.length === 0) return null;

  if (floorId === 'A3-D5-20' && codex[EMPRESS_MANDATE_ID] === undefined) {
    return { sigilId: EMPRESS_MANDATE_ID, level: 1 };
  }

  if (sourceSigils.length === 1) {
    return rollSingleSigil(sourceSigils[0], codex, prng);
  }

  const eligible = sourceSigils.filter((sigil) => (codex[sigil.id] ?? 0) < MAX_SIGIL_LEVEL);
  if (eligible.length === 0 || !prng.chance(SIGIL_BALANCING.repeatDropChance)) return null;

  const sigil = pickWeightedSigil(eligible, codex, prng);
  return { sigilId: sigil.id, level: nextSigilLevel(codex[sigil.id]) };
}

/** Schreibt einen gewonnenen Codex-Eintrag unveränderlich in den Save-Stand. */
export function applySigilDrop(codex: SigilCodex, drop: SigilDrop | null): SigilCodex {
  if (drop === null) return codex;
  return { ...codex, [drop.sigilId]: drop.level };
}

function rollSingleSigil(
  sigil: SigilDefinition | undefined,
  codex: SigilCodex,
  prng: Prng,
): SigilDrop | null {
  if (sigil === undefined) return null;

  const level = codex[sigil.id];
  if (level === undefined) return { sigilId: sigil.id, level: 1 };
  if (level === MAX_SIGIL_LEVEL || !prng.chance(SIGIL_BALANCING.repeatDropChance)) return null;
  return { sigilId: sigil.id, level: nextSigilLevel(level) };
}

function pickWeightedSigil(
  sigils: readonly SigilDefinition[],
  codex: SigilCodex,
  prng: Prng,
): SigilDefinition {
  const totalWeight = sigils.reduce(
    (total, sigil) =>
      total +
      (codex[sigil.id] === undefined ? SIGIL_BALANCING.unknownWeight : SIGIL_BALANCING.knownWeight),
    0,
  );
  const threshold = prng.next() * totalWeight;
  let cumulativeWeight = 0;

  for (const sigil of sigils) {
    cumulativeWeight +=
      codex[sigil.id] === undefined ? SIGIL_BALANCING.unknownWeight : SIGIL_BALANCING.knownWeight;
    if (threshold < cumulativeWeight) return sigil;
  }

  // `next()` liegt in [0, 1); der Fallback schützt nur vor künftigen PRNG-Änderungen.
  const last = sigils.at(-1);
  if (last === undefined) throw new Error('Keine Sigils für gewichtete Auswahl.');
  return last;
}

function nextSigilLevel(level: SigilLevel | undefined): SigilLevel {
  return ((level ?? 0) + 1) as SigilLevel;
}
