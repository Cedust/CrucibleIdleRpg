import {
  Axe,
  Bomb,
  BowArrow,
  CircleDotDashed,
  Crosshair,
  Dices,
  Footprints,
  Hammer,
  HeartPulse,
  Repeat2,
  Shield,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Waves,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { MasteryNode } from '@/game/weaponMastery/mastery';

function iconFor(node: MasteryNode): LucideIcon {
  if (node.label.startsWith('CHC')) return Crosshair;
  if (node.label.startsWith('CHD')) return Sparkles;
  if (node.label.startsWith('MHC') || node.label.startsWith('MHD')) return Swords;
  if (node.label.startsWith('CHAIN')) return Repeat2;
  if (node.label.startsWith('SHC') || node.label.startsWith('SHD')) return Bomb;
  if (node.label.startsWith('RADIUS')) return Waves;
  if (node.label.startsWith('CTC') || node.label.startsWith('CTD')) return ShieldCheck;
  if (node.label.startsWith('DMG')) return Hammer;
  if (node.label.startsWith('DEF') || node.label.startsWith('BLK')) return Shield;
  if (node.label.startsWith('PRC')) return Target;
  if (node.label.includes('RNG')) return Dices;
  if (node.label.startsWith('INIT')) return Footprints;
  if (node.id.includes('executioner')) return Axe;
  if (node.id.includes('perfect-exploit') || node.id.includes('surestrike')) return Crosshair;
  if (node.id.includes('overcritical')) return Sparkles;
  if (node.id.includes('converging') || node.id.includes('storm-surge')) return Zap;
  if (node.id.includes('relentless') || node.id.includes('echoed')) return Repeat2;
  if (node.id.includes('perfect-cadence')) return Swords;
  if (node.id.includes('critical-mass') || node.id.includes('epicenter')) return Bomb;
  if (node.id.includes('focused-blast') || node.id.includes('aftershock')) return Waves;
  if (node.id.includes('vengeful') || node.id.includes('perfect-riposte')) return ShieldCheck;
  if (node.id.includes('guarded') || node.id.includes('immovable')) return Shield;
  if (node.id.includes('escalating')) return HeartPulse;
  if (node.id.includes('committed') || node.id.includes('titans')) return Hammer;
  if (node.id.includes('shielded')) return Shield;
  if (
    node.id.includes('twin-measure') ||
    node.id.includes('razors') ||
    node.id.includes('blade-poise')
  )
    return Swords;
  if (node.id.includes('second-wind')) return Repeat2;
  if (node.id.includes('zeroing') || node.id.includes('patient')) return Crosshair;
  if (node.id.includes('overdraw') || node.id.includes('steady-draw')) return BowArrow;
  return CircleDotDashed;
}

/** Semantically distinct glyphs for compact Mastery medallions. */
export function MasteryNodeIcon({
  node,
  className = '',
}: {
  node: MasteryNode;
  className?: string;
}) {
  return <MasteryGlyph glyph={iconFor(node)} className={className} />;
}

function MasteryGlyph({ glyph: Glyph, className }: { glyph: LucideIcon; className: string }) {
  return <Glyph aria-hidden="true" className={`size-8 ${className}`} strokeWidth={1.8} />;
}
