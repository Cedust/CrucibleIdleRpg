import {
  ambushBonus,
  menaceReduction,
  mitigationShare,
  momentumCap,
  secondWindShare,
  SIGNATURE_OWNER,
  sunderEffect,
  suppressionPlaces,
  type CrucibleRanks,
} from '@/game/crucible/crucible';
import { DEFAULT_COMBAT_CONTEXT, type CombatContext } from './combatEngine';

/**
 * Übersetzt die Crucible-Node-Ränge in den Kampf-Kontext der drei Signatur-Skills und der vier
 * Molten-Vertiefungen (docs/spec/SIGNATURES.md). Vor Freischaltung existiert der jeweilige
 * Effekt nicht: `m` bleibt `0`, die übrigen Hebel bleiben ungesetzt. Die Smelting-Wirkungen und
 * Rally laufen nicht hierüber, sondern über die Stat-Herleitung (characterStats.ts) bzw. den
 * Floor-Übergang (dungeonCombat.ts).
 */
export function crucibleCombatContext(ranks: CrucibleRanks): CombatContext {
  const sunder = sunderEffect(ranks);
  const places = suppressionPlaces(ranks);
  const ambush = ambushBonus(ranks);
  const menace = menaceReduction(ranks);
  const momentum = momentumCap(ranks);
  const secondWind = secondWindShare(ranks);

  return {
    ...DEFAULT_COMBAT_CONTEXT,
    mitigation: mitigationShare(ranks),
    ...(sunder === null ? {} : { sunder: { characterId: SIGNATURE_OWNER.sunder, ...sunder } }),
    ...(places < 1 ? {} : { suppression: { characterId: SIGNATURE_OWNER.suppression, places } }),
    ...(ambush === 0 ? {} : { ambush: { bonus: ambush } }),
    ...(menace === 0 ? {} : { menace: { reduction: menace } }),
    ...(momentum < 1 ? {} : { momentum: { cap: momentum } }),
    ...(secondWind === 0 ? {} : { secondWind: { share: secondWind } }),
  };
}
