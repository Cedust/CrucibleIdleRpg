/**
 * Gemeinsame Interfaces für den deklarativen Balancing-Content (siehe AGENTS.md).
 * Content liegt getrennt von der Spiellogik unter src/game/. Alle Spieltexte Englisch.
 *
 * Die Regeln aus docs/spec/README.md sind festgelegt, die Zahlen noch offen (docs/backlog/OPEN_ISSUES.md).
 * Diese Datei beschreibt die Form, die der Content annimmt.
 */

export type CharacterId = 'korvin' | 'rhaya' | 'quinn';

/** Alle Gegner-Kennungen; `ENEMIES` (enemies.ts) muss genau diese Keys tragen. */
export const ENEMY_IDS = ['ashenGhoul', 'emberHound', 'cinderWretch', 'slagBulwark'] as const;
export type EnemyId = (typeof ENEMY_IDS)[number];

/** Alle Formations-Kennungen; `FORMATIONS` (formations.ts) muss genau diese Keys tragen. */
export const FORMATION_IDS = [
  'rampSingleLanePair',
  'rampBothLanes',
  'rampBothLanesCrowded',
  'rampWithTank',
  'dungeonSkirmish',
  'dungeonPursuit',
  'dungeonStronghold',
] as const;
export type FormationId = (typeof FORMATION_IDS)[number];

export type DungeonId = `A${number}-D${number}`;

/** Floor-Kennung in der Notation `A<Akt>-D<Dungeon>-<Floor>`, Floor zweistellig (SPEC §4.1). */
export type FloorId = `${DungeonId}-${string}`;

/** Klassifikation eines Floors für Elite-/Boss-Multiplikatoren (SPEC §1 Struktur). */
export type EncounterClass = 'normal' | 'elite' | 'boss';

/** Deklarative Zuordnung eines Floors zu einer Formation und seiner Progressionsposition. */
export interface FloorEncounterDefinition {
  id: FloorId;
  dungeonId: DungeonId;
  floorNumber: number;
  floorIndex: number;
  classification: EncounterClass;
  formationId: FormationId;
}

/** Bereits auf die drei Charaktere aufgeteilte Belohnung eines Floor-Siegs. */
export interface FloorRewardDefinition {
  floorId: FloorId;
  gold: number;
  characterXp: Readonly<Record<CharacterId, number>>;
}

/** Rolle bestimmt Zielregeln und Formationsplatz (SPEC §1.2/§1.3). */
export type Role = 'tank' | 'melee' | 'ranged';

/** Die beiden Lanes der 2×3-Gegnerformation (SPEC §1.3). */
export type Lane = 'frontline' | 'backline';

/**
 * Seltenheitsstufen eines Items — Master-Regler für Sockel, Gem-Level-Cap und Item-Level-Cap
 * (docs/spec/ITEMS.md#3-seltenheit-sockel--level-cap).
 */
export type Rarity = 'common' | 'magic' | 'rare' | 'epic' | 'legendary';

/** Die vier dauerhaften Armor-Slots (ITEMS §1); nur diese Slots können persistieren. */
export const ARMOR_SLOTS = ['chest', 'legs', 'head', 'feet'] as const;
export type ArmorSlot = (typeof ARMOR_SLOTS)[number];

/** Feste Item-Typen der Slot-Basen; Armor wird weder gedroppt noch getauscht. */
export type ArmorItemType = 'armor' | 'legguards' | 'helmet' | 'boots';

/** Die einzigen M3-Innates: Core-Stats oder flache Initiative. */
export type ArmorInnateStat = 'toughness' | 'vitality' | 'initiative';

/**
 * Persistierte M3-Form eines permanenten Armor-Items. Spätere Item-Schichten werden bewusst
 * noch nicht modelliert: Common +1 hat weder Sockel noch Gems, Implicit oder Handwerkszustand.
 */
export interface ArmorItem {
  slot: ArmorSlot;
  itemType: ArmorItemType;
  rarity: 'common';
  itemLevel: 1;
  innate: ArmorInnateStat;
}

/** Pro Charakter existieren nur die aus Armory-Rängen abgeleiteten permanenten Slot-Items. */
export type ArmorLoadout = Readonly<Partial<Record<ArmorSlot, ArmorItem>>>;
export type TeamArmor = Readonly<Record<CharacterId, ArmorLoadout>>;

/** Geschlossenes Intervall, beide Grenzen inklusive. */
export interface Range {
  min: number;
  max: number;
}

/**
 * Damage-Range einer Waffe: Faktor auf den Grundschaden, **einmal pro Angriff** per PRNG
 * innerhalb dieser Grenzen gewürfelt (docs/spec/DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden).
 * `1` ist der neutrale Wert — `{ min: 0.9, max: 1.1 }` entspricht 90 %–110 %.
 */
export type DamageRange = Range;

/** Feste Signaturwaffe eines Charakters, kein ausrüstbares Item. */
export interface WeaponProfile {
  baseDamage: number;
  damageRange: DamageRange;
  precision: number;
}

/** Core-Stats speisen die Derived Stats über je eigene Kurven (SPEC §3.0). */
export interface CoreStats {
  might: number;
  toughness: number;
  vitality: number;
}

/**
 * Attack/Defense/Health entstehen aus (Baseline + Core-Stat) × Attribut-% × Crucible-%
 * (siehe docs/spec/CHARACTERS.md#2-stats).
 */
export interface DerivedStats {
  attack: number;
  defense: number;
  health: number;
}

/**
 * Prozentuale Ebene je Derived Stat — `0` ist neutral, `0.1` sind `+10 %`
 * (docs/spec/CHARACTERS.md#2-stats).
 */
export type DerivedStatPercent = Record<keyof DerivedStats, number>;

/**
 * Attributpunkte je Charakter. Jeder Punkt hebt den gekoppelten Derived Stat um einen festen
 * Prozentsatz: Ferocity → Attack, Resilience → Defense, Vigor → Health
 * (docs/spec/CHARACTERS.md#3-attribute-level-up-progression).
 */
export interface AttributePoints {
  ferocity: number;
  resilience: number;
  vigor: number;
}

/** Persistierter Fortschritt eines Charakters außerhalb des laufenden Kampfes. */
export interface CharacterProgressionState {
  level: number;
  /** Noch nicht für das nächste Level verbrauchte XP. */
  xp: number;
  freeAttributePoints: number;
  attributePoints: AttributePoints;
  freeMasteryPoints: number;
  /** Gekaufte Weapon-Mastery-Nodes; Sperren werden daraus abgeleitet. */
  masteryRanks: Readonly<Record<string, number>>;
}

/**
 * Offensive Stats — paarweise Chance + Damage je Muster (SPEC §3.0).
 * Chancen als Anteil 0..1; Damage-Werte als Anteil des rohen Grundschadens (SPEC §2.1).
 * critDamage ist ein Gesamt-Multiplikator: 2 = 200 %, neutral ist 1.
 */
export interface OffensiveStats {
  critChance: number;
  critDamage: number;
  multiHitChance: number;
  multiHitDamage: number;
  splashChance: number;
  splashDamage: number;
  counterChance: number;
  counterDamage: number;
}

/** Defensive Stats (SPEC §3.0). Regeneration ist die einzige Heilquelle vor dem Endgame. */
export interface DefensiveStats {
  barrier: number;
  blockChance: number;
  evasion: number;
  regeneration: number;
}

/** Utility Stats (SPEC §3.0). multiHitChain zählt nur die Zusatztreffer. */
export interface UtilityStats {
  initiative: number;
  multiHitChain: number;
  /**
   * Abklingfaktor der Multi-Hit-Kette, echt kleiner als 1 — Kettentreffer k verursacht
   * multiHitDamage * multiHitChainFactor^(k-1) des rohen Grundschadens.
   * Siehe docs/spec/DAMAGE-SYSTEM.md#11-charakter-zug-ausgehender-schaden (Schritt 3) und
   * docs/adr/0006-multi-hit-kette-garantierte-laenge.md.
   */
  multiHitChainFactor: number;
  splashRadius: number;
}

export interface CharacterDefinition {
  id: CharacterId;
  /** Spieltext, Englisch. */
  name: string;
  role: Role;
  /** Startwerte auf Level 1, vor Attributen und Ausrüstung. */
  baseCore: CoreStats;
  /** Weapon Base Damage speist Attack; Defense und Health starten als feste Charakterwerte. */
  baseDerived: Omit<DerivedStats, 'attack'>;
  weapon: WeaponProfile;
  baseOffensive: OffensiveStats;
  baseDefensive: DefensiveStats;
  baseUtility: UtilityStats;
}

/**
 * Die effektiven Kampfwerte eines Charakters — die fünf Stat-Kategorien aus
 * docs/spec/CHARACTERS.md#2-stats, fertig zusammengesetzt und Eingabe jeder Kampfformel.
 * Hergeleitet in src/features/combat/characterStats.ts.
 */
export interface CharacterStats {
  core: CoreStats;
  derived: DerivedStats;
  offensive: OffensiveStats;
  defensive: DefensiveStats;
  utility: UtilityStats;
}

/**
 * Gegner haben genau vier Stats (SPEC §1.3). `attack` ist die team-weite Angriffsstärke `S`
 * und wird auf die lebenden Charaktere verteilt (SPEC §2.3).
 */
export interface EnemyDefinition {
  id: EnemyId;
  /** Spieltext, Englisch. */
  name: string;
  role: Role;
  health: number;
  attack: number;
  accuracy: number;
  /** Einmalig zu Kampfbeginn innerhalb dieser Grenzen gewürfelt (SPEC §1.1). */
  initiativeRange: Range;
}

/** Die drei Slots einer Lane; `null` = unbesetzt. Als Tuple, damit der Index typsicher greift. */
export type LaneSlots = readonly [EnemyId | null, EnemyId | null, EnemyId | null];

/**
 * Eine Formations-Vorlage der 2×3-Aufstellung (SPEC §1.3): zwei Lanes mit je drei Slots,
 * 2–6 besetzte Slots, höchstens ein Tank-Gegner. Die Vorlage nennt nur die Besetzung —
 * die Gegner-Stats skaliert die Floor-Kurve.
 */
export interface FormationDefinition {
  id: FormationId;
  slots: Record<Lane, LaneSlots>;
}
