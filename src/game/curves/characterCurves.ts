import type { DerivedStats } from '@/game/types';

/**
 * Baseline-Wachstum der Derived Stats je Charakterlevel (Level 1–100).
 *
 * Multiplikator auf die Level-1-Startwerte (characters.ts): Index 0 = Level 1 = ×1.
 * Attack liegt auf der steilen Offense-Achse, Defense/Health auf der flachen Defense-Achse
 * (docs/spec/BALANCE.md#1-wachstum-und-zahlenraum). Vorberechnete Tabellen statt Math.pow zur
 * Laufzeit (AGENTS.md).
 *
 * PLATZHALTER — offen: docs/backlog/OPEN_ISSUES.md#charakter--und-gegner-kurven
 * (Derived-Stat-Kurven je Quelle). Hier gewählt: geometrisch auf ×8 (Attack) bzw. ×5
 * (Defense/Health) über die 99 Level-Ups.
 */
export const BASELINE_GROWTH: Record<keyof DerivedStats, readonly number[]> = {
  attack: [
    1, 1.0212, 1.0429, 1.065, 1.0876, 1.1107, 1.1343, 1.1584, 1.183, 1.2081, 1.2337, 1.2599, 1.2867,
    1.314, 1.3419, 1.3704, 1.3994, 1.4291, 1.4595, 1.4905, 1.5221, 1.5544, 1.5874, 1.6211, 1.6555,
    1.6906, 1.7265, 1.7632, 1.8006, 1.8388, 1.8779, 1.9177, 1.9584, 2, 2.0425, 2.0858, 2.1301,
    2.1753, 2.2215, 2.2686, 2.3168, 2.366, 2.4162, 2.4675, 2.5198, 2.5733, 2.628, 2.6837, 2.7407,
    2.7989, 2.8583, 2.919, 2.9809, 3.0442, 3.1088, 3.1748, 3.2422, 3.311, 3.3813, 3.4531, 3.5264,
    3.6012, 3.6777, 3.7557, 3.8354, 3.9169, 4, 4.0849, 4.1716, 4.2602, 4.3506, 4.4429, 4.5373,
    4.6336, 4.7319, 4.8324, 4.9349, 5.0397, 5.1467, 5.2559, 5.3675, 5.4814, 5.5978, 5.7166, 5.8379,
    5.9618, 6.0884, 6.2176, 6.3496, 6.4844, 6.622, 6.7626, 6.9061, 7.0527, 7.2024, 7.3553, 7.5114,
    7.6709, 7.8337, 8,
  ],
  defense: [
    1, 1.0164, 1.033, 1.05, 1.0672, 1.0847, 1.1025, 1.1205, 1.1389, 1.1576, 1.1765, 1.1958, 1.2154,
    1.2353, 1.2556, 1.2762, 1.2971, 1.3183, 1.3399, 1.3619, 1.3842, 1.4069, 1.43, 1.4534, 1.4772,
    1.5014, 1.526, 1.5511, 1.5765, 1.6023, 1.6286, 1.6553, 1.6824, 1.71, 1.738, 1.7665, 1.7954,
    1.8249, 1.8548, 1.8852, 1.9161, 1.9475, 1.9794, 2.0118, 2.0448, 2.0783, 2.1124, 2.147, 2.1822,
    2.218, 2.2543, 2.2913, 2.3288, 2.367, 2.4058, 2.4452, 2.4853, 2.526, 2.5674, 2.6095, 2.6523,
    2.6957, 2.7399, 2.7848, 2.8305, 2.8769, 2.924, 2.9719, 3.0207, 3.0702, 3.1205, 3.1716, 3.2236,
    3.2764, 3.3301, 3.3847, 3.4402, 3.4966, 3.5539, 3.6121, 3.6713, 3.7315, 3.7927, 3.8548, 3.918,
    3.9822, 4.0475, 4.1138, 4.1813, 4.2498, 4.3194, 4.3902, 4.4622, 4.5353, 4.6097, 4.6852, 4.762,
    4.84, 4.9194, 5,
  ],
  health: [
    1, 1.0164, 1.033, 1.05, 1.0672, 1.0847, 1.1025, 1.1205, 1.1389, 1.1576, 1.1765, 1.1958, 1.2154,
    1.2353, 1.2556, 1.2762, 1.2971, 1.3183, 1.3399, 1.3619, 1.3842, 1.4069, 1.43, 1.4534, 1.4772,
    1.5014, 1.526, 1.5511, 1.5765, 1.6023, 1.6286, 1.6553, 1.6824, 1.71, 1.738, 1.7665, 1.7954,
    1.8249, 1.8548, 1.8852, 1.9161, 1.9475, 1.9794, 2.0118, 2.0448, 2.0783, 2.1124, 2.147, 2.1822,
    2.218, 2.2543, 2.2913, 2.3288, 2.367, 2.4058, 2.4452, 2.4853, 2.526, 2.5674, 2.6095, 2.6523,
    2.6957, 2.7399, 2.7848, 2.8305, 2.8769, 2.924, 2.9719, 3.0207, 3.0702, 3.1205, 3.1716, 3.2236,
    3.2764, 3.3301, 3.3847, 3.4402, 3.4966, 3.5539, 3.6121, 3.6713, 3.7315, 3.7927, 3.8548, 3.918,
    3.9822, 4.0475, 4.1138, 4.1813, 4.2498, 4.3194, 4.3902, 4.4622, 4.5353, 4.6097, 4.6852, 4.762,
    4.84, 4.9194, 5,
  ],
};

/**
 * Attribut-Ebene: Bonus je Punkt auf den gekoppelten Derived Stat, additiv innerhalb
 * der Ebene — Derived = Basis × (1 + ATTRIBUTE_BONUS_PER_POINT × Punkte)
 * (docs/spec/CHARACTERS.md#3-attribute-level-up-progression).
 *
 * Jeder Punkt gibt exakt +1,25 % auf seinen gekoppelten Derived Stat.
 */
export const ATTRIBUTE_BONUS_PER_POINT = 0.0125;

/**
 * Umrechnung eines Core-Stat-Punkts in den Basis-Pool seines Derived Stats
 * (1 Might → +1 Attack-Basis usw.); das Wachstum liegt in den Quell-Tabellen (Item-Innate,
 * Emerald-Gems), docs/spec/BALANCE.md#1-wachstum-und-zahlenraum.
 *
 * PLATZHALTER — offen: docs/backlog/OPEN_ISSUES.md#charakter--und-gegner-kurven
 * (Derived-Stat-Kurven je Quelle, „Core-Stat-Kurven"). Hier gewählt: 1:1.
 */
export const CORE_STAT_PER_POINT = 1;
