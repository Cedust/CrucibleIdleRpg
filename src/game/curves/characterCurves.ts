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
export const CORE_POINT_TO_DERIVED_BASE = 1;
