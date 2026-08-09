type IconName = 'melting-metal';
type IconSize = 'sm' | 'md' | 'lg';

// Statische Klassen-Strings, damit Tailwind die mask-Utilities beim Scan findet.
const ICON_MASK_CLASSES: Record<IconName, string> = {
  'melting-metal': 'mask-[url(/assets/icons/melting-metal.svg)]',
};

const SIZE_CLASSES: Record<IconSize, string> = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
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
export function Icon({ name, size = 'md', label, className = 'bg-accent' }: IconProps) {
  return (
    <span
      role={label === undefined ? undefined : 'img'}
      aria-label={label}
      aria-hidden={label === undefined ? 'true' : undefined}
      className={`inline-block shrink-0 mask-center mask-contain mask-no-repeat ${SIZE_CLASSES[size]} ${ICON_MASK_CLASSES[name]} ${className}`}
    />
  );
}
