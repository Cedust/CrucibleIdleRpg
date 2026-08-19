import { act1FinalFloorClass, type Act1DungeonId } from '@/game/encounters/act1';

export type GateVariant = 'normal' | 'boss';
export type GateState = 'open' | 'locked';

/**
 * Vier freigestellte Tor-Illustrationen aus dem Sheet
 * concept/ui-draft-3/dungeon-asset-sheet.png, gerendert als `<img src>`.
 * Offene Tore haben eine transparente Bogen-Öffnung für künftige
 * Hintergrund-Layer.
 */
export const GATE_ART_SRC: Record<GateVariant, Record<GateState, string>> = {
  normal: {
    open: '/assets/gates/gate-open.png',
    locked: '/assets/gates/gate-locked.png',
  },
  boss: {
    open: '/assets/gates/gate-boss-open.png',
    locked: '/assets/gates/gate-boss-locked.png',
  },
};

/**
 * Rauten-Zentrum der Tor-Crops für das Numerale-Overlay, relativ zur
 * Bildbreite (cqw bzw. % im @container der Kachel). Je Crop die Mitte der
 * dunklen Rauten-Innenfläche (Boss: freie Fläche über dem Schädel),
 * pixelvermessen am Asset und im Screenshot-Sichtpass feinjustiert. Jeder
 * Eintrag trägt die vollständige Position (top/left/translate), damit keine
 * Basis-Klasse überschrieben wird; statische Klassen-Strings, damit Tailwinds
 * Scanner die Utilities findet.
 */
export const GATE_NUMERAL_POSITION_CLASSES: Record<GateVariant, Record<GateState, string>> = {
  normal: {
    open: 'top-[15.7cqw] left-[49.5%] -translate-x-1/2',
    locked: 'top-[16.4cqw] left-[50.25%] -translate-x-1/2',
  },
  boss: {
    open: 'top-[15cqw] left-1/2 -translate-x-1/2',
    locked: 'top-[13.9cqw] left-[49.25%] -translate-x-1/2',
  },
};

/**
 * Bogen-Öffnung der offenen Tor-Crops für den dahinterliegenden
 * Hintergrund-Layer, relativ zur Bildbreite (cqw im @container der Kachel).
 * Pixelvermessen als Rechteck über der transparenten Öffnung mit Überhang in
 * den opaken Stein (gate-open: Öffnung x 129–333, y 127–454; gate-boss-open:
 * x 159–360, y 184–522) — der Stein verdeckt den Überhang, sichtbar bleibt
 * allein die Öffnung. Statische Klassen-Strings für Tailwinds Scanner.
 */
export const GATE_OPENING_CLASSES: Record<GateVariant, string> = {
  normal: 'top-[25.8cqw] left-[26.8cqw] h-[73cqw] w-[46.1cqw]',
  boss: 'top-[33.8cqw] left-[30cqw] h-[68.7cqw] w-[40.6cqw]',
};

/** Boss-Tor für den Dungeon mit Boss-Abschlussfloor; die Regel liegt im Game-Layer. */
export function gateVariantFor(dungeonId: Act1DungeonId): GateVariant {
  return act1FinalFloorClass(dungeonId) === 'boss' ? 'boss' : 'normal';
}
