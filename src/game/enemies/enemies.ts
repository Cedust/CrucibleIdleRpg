import { BULWARK_CONTRIBUTION_BY_ROLE } from '@/game/curves/combatConstants';
import type { EnemyDefinition, EnemyId } from '@/game/types';

/**
 * Gegner für Akt 1, Dungeon 1 (docs/spec/PROGRESSION.md#1-struktur-akte-dungeons-floors).
 * Genau vier Stats plus den Bulwark-Beitrag seiner Rolle
 * (docs/spec/COMBAT.md#13-gegnerformation).
 *
 * Die Werte sind **Floor-1-Anker**: Die Floor-Kurven (curves/enemyCurves.ts) skalieren
 * Health und Attack mit der Tiefe, die Accuracy-Rampe addiert auf die Basis-Accuracy.
 *
 * `attack` ist die **team-weite** Angriffsstärke `S` und wird auf die lebenden Charaktere
 * verteilt (docs/spec/COMBAT.md#23-eingehender-schaden-schadenspipeline) — die Werte sind
 * also kein Schaden pro Charakter. Die defensive Schwere einer Formation hängt an der
 * **Summe** `attack` pro Runde (docs/BALANCING.md#2-kern-wachstumsachsen).
 *
 * PLATZHALTER — sämtliche Zahlen offen:
 * docs/backlog/OPEN_ISSUES.md#charakter--und-gegner-kurven (Gegner-Basiswerte je Gegnertyp).
 * Sie tragen die Rollen-Kontraste, gegen die die Engine gebaut wird: Tank viel Health und
 * wenig Attack, Ranged wenig Health und viel Attack, Melee dazwischen; die Initiative-Ranges
 * überlappen, damit die Zugreihenfolge pro Kampf variiert.
 */
export const ENEMIES: Record<EnemyId, EnemyDefinition> = {
  ashenGhoul: {
    id: 'ashenGhoul',
    name: 'Ashen Ghoul',
    role: 'melee',
    health: 70,
    attack: 6,
    accuracy: 0.7,
    initiativeRange: { min: 6, max: 10 },
    bulwarkContribution: BULWARK_CONTRIBUTION_BY_ROLE.melee,
  },
  emberHound: {
    id: 'emberHound',
    name: 'Ember Hound',
    role: 'melee',
    health: 70,
    attack: 6,
    accuracy: 0.75,
    initiativeRange: { min: 11, max: 15 },
    bulwarkContribution: BULWARK_CONTRIBUTION_BY_ROLE.melee,
  },
  cinderWretch: {
    id: 'cinderWretch',
    name: 'Cinder Wretch',
    role: 'ranged',
    health: 40,
    attack: 8,
    accuracy: 0.65,
    initiativeRange: { min: 10, max: 16 },
    bulwarkContribution: BULWARK_CONTRIBUTION_BY_ROLE.ranged,
  },
  slagBulwark: {
    id: 'slagBulwark',
    name: 'Slag Bulwark',
    role: 'tank',
    health: 120,
    attack: 4,
    accuracy: 0.55,
    initiativeRange: { min: 4, max: 7 },
    bulwarkContribution: BULWARK_CONTRIBUTION_BY_ROLE.tank,
  },
};
