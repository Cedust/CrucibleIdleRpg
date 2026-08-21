import { prismaticSocketCount, RARITY_LAYER } from '@/game/items/itemLayers';
import { sigilById } from '@/game/sigils/sigils';
import type { SigilCodex, SigilId } from '@/game/sigils/types';
import { RARITIES, type ArmorItem, type Rarity } from '@/game/types';

/**
 * Blacksmith — Temper-, Masterwork- und Brand-Regeln samt Kosten-Content
 * (docs/spec/ITEMS.md#7-blacksmith--temper-masterwork--brand). Alle drei Aktionen sind RNG-frei
 * und vollständig planbar; Brand bezieht seinen Wissensstand aus dem Sigil Codex.
 */

/** Spieltext der Seltenheitsstufen, Englisch. */
export const RARITY_LABEL: Readonly<Record<Rarity, string>> = {
  common: 'Common',
  magic: 'Magic',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

/** Die nächsthöhere Seltenheit — das Ziel eines Masterwork; `undefined` auf Legendary. */
export function nextRarity(rarity: Rarity): Rarity | undefined {
  return RARITIES[RARITIES.indexOf(rarity) + 1];
}

/**
 * PLATZHALTER — Gold-Kosten des Tempers von `+n` auf `+n+1`
 * (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten). Verbindlich ist die
 * Struktur: eine streng monoton steigende Kurve über den vollen Bereich +1 bis +99,
 * die Parameter sind Tuning.
 */
export const TEMPER_GOLD_CURVE = { base: 20, growth: 1.06 } as const;

/** Gold-Kosten des Tempers vom übergebenen Item-Level auf das nächste. */
export function temperGoldCost(itemLevel: number): number {
  return Math.round(TEMPER_GOLD_CURVE.base * TEMPER_GOLD_CURVE.growth ** (itemLevel - 1));
}

/**
 * Cinder-Kosten des Masterwork **auf** die jeweilige Stufe nach der Seltenheits-Tabelle
 * (docs/spec/ITEMS.md#3-seltenheit-sockel--level-cap).
 */
export const MASTERWORK_CINDER_COST: Readonly<Record<Exclude<Rarity, 'common'>, number>> = {
  magic: 1,
  rare: 3,
  epic: 6,
  legendary: 10,
};

/**
 * PLATZHALTER — Gold-Anteil des Masterwork
 * (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten). Verbindlich ist nur, dass
 * jedes Masterwork zusätzlich zum Cinder Gold kostet (ITEMS §7); die Beträge sind Tuning.
 */
export const MASTERWORK_GOLD_COST: Readonly<Record<Exclude<Rarity, 'common'>, number>> = {
  magic: 60,
  rare: 180,
  epic: 420,
  legendary: 900,
};

export interface MasterworkCost {
  to: Exclude<Rarity, 'common'>;
  cinder: number;
  gold: number;
}

/** Ziel und Kosten des nächsten Masterwork, `undefined` auf Legendary. */
export function masterworkCost(rarity: Rarity): MasterworkCost | undefined {
  const to = nextRarity(rarity);
  if (to === undefined || to === 'common') return undefined;
  return { to, cinder: MASTERWORK_CINDER_COST[to], gold: MASTERWORK_GOLD_COST[to] };
}

/** Gold- und Cinder-Bestand — die beiden Zahlmittel der Station. */
export interface BlacksmithFunds {
  gold: number;
  cinder: number;
}

/**
 * PLATZHALTER — Brand-Kosten. Verbindlich sind Cinder plus Gold und die planbare Aktion;
 * konkrete Beträge bleiben Balancing-Content (docs/backlog/README.md#4-umgang-mit-offenen-balancing-werten).
 */
export const BRAND_COST = { gold: 300, cinder: 3 } as const;

/**
 * PLATZHALTER — Re-Brand kostet deutlich weniger als der Erst-Brand (BALANCING §3): ein
 * Viertel des Golds und ein einzelnes Cinder. Der Unterschied ist bewusst als Content sichtbar.
 */
export const REBRAND_COST = { gold: 75, cinder: 1 } as const;

export interface BrandCost {
  gold: number;
  cinder: number;
  rebrand: boolean;
}

/** Kosten der nächsten Brand-Aktion; ein bestehendes Imprint schaltet Re-Brand frei. */
export function brandCost(item: ArmorItem): BrandCost {
  const cost = item.imprint === undefined ? BRAND_COST : REBRAND_COST;
  return { ...cost, rebrand: item.imprint !== undefined };
}

/**
 * Prüft Brand vor jeder Bezahlung: Codex-Kenntnis, Slot-Bindung, Magic-Schwelle und die
 * teamweite Einmal-Aktivität. Der aktuelle Item-Sigil ist beim Re-Brand bereits aus der
 * aktiven Menge herausgefiltert und kann daher nicht als neue Auswahl wiederholt werden.
 */
export function brandFailure(
  item: ArmorItem,
  sigilId: SigilId,
  codex: SigilCodex,
  activeSigilIds: ReadonlySet<SigilId>,
  funds: BlacksmithFunds,
): string | null {
  if (item.rarity === 'common') {
    return 'Branding requires a Magic item or higher.';
  }

  const sigil = sigilById(sigilId);
  if (sigil === undefined || codex[sigil.id] === undefined) {
    return 'This Sigil is not known in the Codex.';
  }
  if (!sigil.slots.includes(item.slot)) {
    return `This Sigil cannot be branded into the ${item.slot} slot.`;
  }
  if (item.imprint?.sigilId === sigil.id) {
    return 'This Sigil already marks the selected item.';
  }
  if (activeSigilIds.has(sigil.id)) {
    return 'This Sigil is already active on another piece of armor.';
  }

  const cost = brandCost(item);
  const missing: string[] = [];
  if (funds.gold < cost.gold) missing.push('Gold');
  if (funds.cinder < cost.cinder) missing.push('Cinder');
  return missing.length > 0 ? `Not enough ${missing.join(' and ')}.` : null;
}

/**
 * Brand oder Re-Brand: setzt die identitätsstiftende fünfte Schicht und zieht beide
 * Zahlmittel atomar ab. `null` bedeutet, dass eine Brand-Regel die Aktion ablehnt.
 */
export function applyBrand(
  item: ArmorItem,
  sigilId: SigilId,
  codex: SigilCodex,
  activeSigilIds: ReadonlySet<SigilId>,
  funds: BlacksmithFunds,
): { item: ArmorItem; gold: number; cinder: number } | null {
  if (brandFailure(item, sigilId, codex, activeSigilIds, funds) !== null) {
    return null;
  }

  const cost = brandCost(item);
  return {
    item: { ...item, imprint: { sigilId } },
    gold: funds.gold - cost.gold,
    cinder: funds.cinder - cost.cinder,
  };
}

/** Der Sperrgrund eines Tempers oder `null`, wenn es ausführbar ist. Spieltext, Englisch. */
export function temperFailure(item: ArmorItem, gold: number): string | null {
  const cap = RARITY_LAYER[item.rarity].itemLevelCap;
  if (item.itemLevel >= cap) {
    return item.rarity === 'legendary'
      ? 'Item level is at the Legendary maximum.'
      : `Item level is at the ${RARITY_LABEL[item.rarity]} cap. Masterwork raises the cap.`;
  }
  if (gold < temperGoldCost(item.itemLevel)) {
    return 'Not enough Gold.';
  }
  return null;
}

/** Der Sperrgrund eines Masterwork oder `null`, wenn es ausführbar ist. Spieltext, Englisch. */
export function masterworkFailure(item: ArmorItem, funds: BlacksmithFunds): string | null {
  const cost = masterworkCost(item.rarity);
  if (cost === undefined) {
    return 'Legendary is the highest rarity.';
  }
  // Die Panels zeigen die Beträge bereits in der Kostenzeile; der Sperrgrund bleibt
  // deshalb allgemein und nennt Gold vor Cinder wie die Kostenanzeige.
  const missing: string[] = [];
  if (funds.gold < cost.gold) missing.push('Gold');
  if (funds.cinder < cost.cinder) missing.push('Cinder');
  return missing.length > 0 ? `Not enough ${missing.join(' and ')}.` : null;
}

/** Prismatic-Sockel folgen dem Item-Level (ITEMS §4); Temper kann daher einen öffnen. */
function createPrismaticSockets(itemLevel: number): readonly null[] {
  return Array.from({ length: prismaticSocketCount(itemLevel) }, () => null);
}

/**
 * Temper: hebt das Item-Level um genau eine Stufe bis zum Seltenheits-Cap gegen Gold
 * (ITEMS §7). `null`, wenn `temperFailure` die Aktion ablehnt.
 */
export function applyTemper(
  item: ArmorItem,
  gold: number,
): { item: ArmorItem; gold: number } | null {
  if (temperFailure(item, gold) !== null) {
    return null;
  }

  const itemLevel = item.itemLevel + 1;
  return {
    item: { ...item, itemLevel, prismaticSockets: createPrismaticSockets(itemLevel) },
    gold: gold - temperGoldCost(item.itemLevel),
  };
}

/**
 * Masterwork: hebt die Seltenheit um eine Stufe, öffnet den nächsten Sockel und zahlt
 * Cinder nach Tabelle plus Gold (ITEMS §3/§7) — jederzeit möglich, ohne Mindestlevel.
 * `null`, wenn `masterworkFailure` die Aktion ablehnt.
 */
export function applyMasterwork(
  item: ArmorItem,
  funds: BlacksmithFunds,
): { item: ArmorItem; gold: number; cinder: number } | null {
  const cost = masterworkCost(item.rarity);
  if (cost === undefined || masterworkFailure(item, funds) !== null) {
    return null;
  }

  return {
    item: { ...item, rarity: cost.to, sockets: [...item.sockets, null] },
    gold: funds.gold - cost.gold,
    cinder: funds.cinder - cost.cinder,
  };
}
