export type IconName =
  | 'crucible-waystones'
  | 'crucible-armory'
  | 'crucible-blacksmith'
  | 'crucible-jeweler'
  | 'crucible-overpower'
  | 'crucible-iron-skin'
  | 'crucible-unyielding'
  | 'crucible-quick-step'
  | 'crucible-mitigation'
  | 'crucible-sunder'
  | 'crucible-suppression'
  | 'crucible-rally'
  | 'crucible-ambush'
  | 'crucible-menace'
  | 'crucible-momentum'
  | 'crucible-second-wind'
  | 'crucible-rune-grimoire'
  | 'crucible-talisman'
  | 'crucible-runic-focus'
  | 'crucible-rune-mastery';
type IconSize = 'sm' | 'md' | 'lg' | 'xl';

// Statische Klassen-Strings, damit Tailwind die mask-Utilities beim Scan findet.
const ICON_MASK_CLASSES: Record<IconName, string> = {
  'crucible-waystones': 'mask-[url(/assets/icons/crucible/crucible-waystones.svg)]',
  'crucible-armory': 'mask-[url(/assets/icons/crucible/crucible-armory.svg)]',
  'crucible-blacksmith': 'mask-[url(/assets/icons/crucible/crucible-blacksmith.svg)]',
  'crucible-jeweler': 'mask-[url(/assets/icons/crucible/crucible-jeweler.svg)]',
  'crucible-overpower': 'mask-[url(/assets/icons/crucible/crucible-overpower.svg)]',
  'crucible-iron-skin': 'mask-[url(/assets/icons/crucible/crucible-iron-skin.svg)]',
  'crucible-unyielding': 'mask-[url(/assets/icons/crucible/crucible-unyielding.svg)]',
  'crucible-quick-step': 'mask-[url(/assets/icons/crucible/crucible-quick-step.svg)]',
  'crucible-mitigation': 'mask-[url(/assets/icons/crucible/crucible-mitigation.svg)]',
  'crucible-sunder': 'mask-[url(/assets/icons/crucible/crucible-sunder.svg)]',
  'crucible-suppression': 'mask-[url(/assets/icons/crucible/crucible-suppression.svg)]',
  'crucible-rally': 'mask-[url(/assets/icons/crucible/crucible-rally.svg)]',
  'crucible-ambush': 'mask-[url(/assets/icons/crucible/crucible-ambush.svg)]',
  'crucible-menace': 'mask-[url(/assets/icons/crucible/crucible-menace.svg)]',
  'crucible-momentum': 'mask-[url(/assets/icons/crucible/crucible-momentum.svg)]',
  'crucible-second-wind': 'mask-[url(/assets/icons/crucible/crucible-second-wind.svg)]',
  'crucible-rune-grimoire': 'mask-[url(/assets/icons/crucible/crucible-rune-grimoire.svg)]',
  'crucible-talisman': 'mask-[url(/assets/icons/crucible/crucible-talisman.svg)]',
  'crucible-runic-focus': 'mask-[url(/assets/icons/crucible/crucible-runic-focus.svg)]',
  'crucible-rune-mastery': 'mask-[url(/assets/icons/crucible/crucible-rune-mastery.svg)]',
};

const SIZE_CLASSES: Record<IconSize, string> = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
  xl: 'size-11',
};

interface IconProps {
  name: IconName;
  size?: IconSize;
  /** Gesetzt macht das Icon zum benannten Bild; ohne Label ist es dekorativ. */
  label?: string;
  /** Farbe über bg-Tokens; das SVG wird als Maske auf die Fläche gelegt. */
  className?: string;
}

/**
 * Icon-Primitive für per CSS eingefärbte Assets aus public/assets/icons/
 * (hybride Asset-Strategie, DESIGN.md §5).
 */
export function Icon({ name, size = 'md', label, className = 'bg-current' }: IconProps) {
  return (
    <span
      role={label === undefined ? undefined : 'img'}
      aria-label={label}
      aria-hidden={label === undefined ? 'true' : undefined}
      className={`inline-block shrink-0 mask-center mask-contain mask-no-repeat ${SIZE_CLASSES[size]} ${ICON_MASK_CLASSES[name]} ${className}`}
    />
  );
}
