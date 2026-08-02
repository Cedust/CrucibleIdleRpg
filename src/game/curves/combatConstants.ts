import type { Role } from '@/game/types';

/**
 * Globale Kampf-Stellgrößen. Die Struktur der Formeln steht in docs/spec/COMBAT.md,
 * die Zahlen hier sind **Platzhalter** — jede trägt unten ihren offenen Eintrag.
 */

/**
 * Defense-Konstante K — Schadenspipeline Schritt 4:
 * `nachDefense = nachBlock × K / (K + Defense)`
 * (docs/spec/COMBAT.md#23-eingehender-schaden-schadenspipeline).
 *
 * PLATZHALTER — offen: docs/backlog/OPEN_ISSUES.md#kampf-stellgrößen (Defense-Konstante `K`).
 * Übernommen aus dem Test-Vektor der Schadenspipeline, der `K = 100` als frei gewählten
 * Eingangswert nennt.
 */
export const DEFENSE_CONSTANT_K = 100;

/**
 * Block-Reduktion `Block%` — Schadenspipeline Schritt 3: Ein Block mindert den Schaden um
 * diesen festen Anteil (`Schaden × (1 − BLOCK_DAMAGE_REDUCTION)`), partiell statt
 * all-or-nothing (docs/spec/COMBAT.md#23-eingehender-schaden-schadenspipeline). Die
 * _Block Chance_ ist ein Charakter-Stat, dieser Anteil eine globale Konstante.
 *
 * PLATZHALTER — offen: docs/backlog/OPEN_ISSUES.md#kampf-stellgrößen (Block-Reduktion).
 * Hier gewählt: der Wert aus dem Test-Vektor der Schadenspipeline.
 */
export const BLOCK_DAMAGE_REDUCTION = 0.4;

/**
 * Obergrenze der Gegner-Trefferchance nach der Accuracy-Rampe (enemyCurves.ts;
 * docs/spec/COMBAT.md#22-treffermodell).
 *
 * PLATZHALTER — offen: docs/backlog/OPEN_ISSUES.md#charakter--und-gegner-kurven
 * (Gegner-Kurven, „Accuracy als gedeckelte Rampe").
 */
export const ACCURACY_CAP = 0.95;

/**
 * Bulwark-Beitrag `bᵢ` je Frontline-Rolle. Solange Frontline-Gegner leben, stapeln ihre
 * Beiträge multiplikativ zum Malus auf eingehenden Schaden der Backline:
 * `Malus = 1 − Π (1 − bᵢ)` (docs/spec/COMBAT.md#24-bulwark-deckung-der-backline).
 * Ranged steht in der Backline und deckt niemanden — Beitrag `0`.
 *
 * PLATZHALTER — offen: docs/backlog/OPEN_ISSUES.md#kampf-stellgrößen
 * (Bulwark-Prozentwerte, Tank-/Melee-Beitrag). Hier gewählt: Tank trägt mehr bei als Melee,
 * wie es die Spec verlangt; eine volle Frontline aus Tank + 2 Melee ergibt damit
 * `1 − 0.75 × 0.9 × 0.9 = 0.3925`.
 */
export const BULWARK_CONTRIBUTION_BY_ROLE: Record<Role, number> = {
  tank: 0.25,
  melee: 0.1,
  ranged: 0,
};

/**
 * Obergrenze des _Multi Hit Chain Factor_ — der Abklingfaktor der Multi-Hit-Kette ist **echt
 * kleiner als 100 %** und wird auf diesen Wert geklemmt
 * (docs/spec/COMBAT.md#21-charakter-zug-ausgehender-schaden, Schritt 3). Damit klingt jede Kette
 * ab und der Zweigertrag `Σₖ f^(k−1)` bleibt endlich.
 *
 * PLATZHALTER — offen: docs/backlog/OPEN_ISSUES.md#kampf-stellgrößen (Multi-Hit-Werte).
 * Hier gewählt: das Skilltree-Maximum, das ADR-0006 als Startvorschlag nennt.
 */
export const MULTI_HIT_CHAIN_FACTOR_CAP = 0.9;
