import {
  mitigationShare,
  SIGNATURE_OWNER,
  sunderEffect,
  suppressionPlaces,
  type CrucibleRanks,
} from '@/game/crucible/crucible';
import { DEFAULT_COMBAT_CONTEXT, type CombatContext } from './combatEngine';

/**
 * Übersetzt die Crucible-Node-Ränge in den Kampf-Kontext der drei Signatur-Skills
 * (docs/spec/SIGNATURES.md#1-signatur-skills-kampfwirkung). Vor Freischaltung existiert der
 * jeweilige Effekt nicht: `m` bleibt `0`, Sunder und Suppression bleiben ungesetzt. Die
 * Smelting-Wirkungen laufen nicht hierüber, sondern über die Stat-Herleitung
 * (characterStats.ts).
 */
export function crucibleCombatContext(ranks: CrucibleRanks): CombatContext {
  const sunder = sunderEffect(ranks);
  const places = suppressionPlaces(ranks);

  return {
    ...DEFAULT_COMBAT_CONTEXT,
    mitigation: mitigationShare(ranks),
    ...(sunder === null ? {} : { sunder: { characterId: SIGNATURE_OWNER.sunder, ...sunder } }),
    ...(places < 1 ? {} : { suppression: { characterId: SIGNATURE_OWNER.suppression, places } }),
  };
}
