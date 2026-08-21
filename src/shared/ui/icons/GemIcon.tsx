import { Gem } from 'lucide-react';

import type { GemColor } from '@/game/types';
import { cn } from '../utils/cn';

// Statische Klassen-Strings, damit Tailwind die Gem-Token-Utilities beim Scan findet.
const GEM_ICON_CLASS: Readonly<Record<GemColor, string>> = {
  amber: 'text-gem-amber',
  ruby: 'text-gem-ruby',
  sapphire: 'text-gem-sapphire',
  emerald: 'text-gem-emerald',
  diamond: 'text-gem-diamond',
};

interface GemIconProps {
  color: GemColor;
  className?: string;
}

/**
 * Die einheitliche Gem-Darstellung aller Screens: das Diamant-Icon, über die
 * eigenen Gem-Tokens eingefärbt — unabhängig von den Statusfarben.
 */
export function GemIcon({ color, className }: GemIconProps) {
  return (
    <Gem aria-hidden="true" className={cn('size-4 shrink-0', GEM_ICON_CLASS[color], className)} />
  );
}
