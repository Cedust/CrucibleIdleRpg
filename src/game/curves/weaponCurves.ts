import type { DamageRange, Rarity } from '@/game/types';

/**
 * Damage-Range der Main Hand je Seltenheit — Faktor auf den Grundschaden, einmal pro
 * Angriff gewürfelt (docs/spec/COMBAT.md#21-charakter-zug-ausgehender-schaden).
 * Die Main Hand ist ab Spielstart als `Common +1` belegt
 * (docs/spec/ITEMS.md#1-slots-basen--innate-affixe), `MAIN_HAND_DAMAGE_RANGE.common` ist
 * damit der Startwert aller drei Charaktere.
 *
 * PLATZHALTER — die Breiten je Seltenheit sind offen:
 * docs/backlog/OPEN_ISSUES.md#kampf-stellgrößen (Waffen-Damage-Range-Breiten je Seltenheit).
 * Hier gewählt: symmetrisch um 1, mit der Seltenheit breiter werdend. Der Erwartungswert
 * bleibt auf jeder Stufe 1, die Seltenheit ändert also nur die Streuung.
 */
export const MAIN_HAND_DAMAGE_RANGE: Record<Rarity, DamageRange> = {
  common: { min: 0.95, max: 1.05 },
  magic: { min: 0.925, max: 1.075 },
  rare: { min: 0.9, max: 1.1 },
  epic: { min: 0.875, max: 1.125 },
  legendary: { min: 0.85, max: 1.15 },
};
