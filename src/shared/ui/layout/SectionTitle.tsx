import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

/**
 * Gruppenfarbe eines Zwischentitels; Gold bleibt der Default des Design-Systems. Die vier
 * weiteren Töne sind die Stat-Achsen der Heroes-Ansicht (index.css, UI.md §4).
 */
type SectionTitleTone = 'accent' | 'offense' | 'defense' | 'vitality' | 'utility';

/** Stufe der Display-Skala; `sm` ist der Zwischentitel jeder Panel-Gruppe. */
type SectionTitleSize = 'sm' | 'md';

const TONE_CLASSES: Record<SectionTitleTone, string> = {
  accent: 'text-accent-strong',
  offense: 'text-offense',
  defense: 'text-defense',
  vitality: 'text-vitality',
  utility: 'text-utility',
};

const SIZE_CLASSES: Record<SectionTitleSize, string> = {
  sm: 'text-display-sm',
  md: 'text-display',
};

interface SectionTitleProps {
  as?: 'h2' | 'h3';
  align?: 'center' | 'start';
  tone?: SectionTitleTone;
  size?: SectionTitleSize;
  id?: string;
  className?: string;
  children: ReactNode;
}

/** Gold-Kapitälchen-Zwischentitel für Panel-Gruppen (Heroes, Combat Log, Lanes). */
export function SectionTitle({
  as: Tag = 'h2',
  align = 'center',
  tone = 'accent',
  size = 'sm',
  id,
  className,
  children,
}: SectionTitleProps) {
  return (
    <Tag
      id={id}
      className={cn(
        'font-display',
        SIZE_CLASSES[size],
        TONE_CLASSES[tone],
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
