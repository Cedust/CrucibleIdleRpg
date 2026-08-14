import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';
import { stateAttrs, transitionState, type SemanticState } from './state';

interface FramedCardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'li' | 'label';
  /** Hintergrund-Art als statische `bg-[url(…)]`-Klasse. */
  artClassName: string;
  selected?: boolean;
  semantic?: SemanticState;
  /**
   * Frame in voller Stärke und Scrim aus, ohne Selection-Glow — für
   * nicht-interaktive „current“-Flächen wie das ActPanel (FOUNDATION §6).
   */
  highlight?: boolean;
  /** `false` entfernt die Hover-Affordance nicht-interaktiver Flächen. */
  interactive?: boolean;
  children: ReactNode;
}

/**
 * Karten-Layer-Stack Art/Scrim/9-Slice-Frame mit den State-Opacities aus
 * FOUNDATION §6: Locked dimmt ausschließlich den Art-Layer, Selektion trägt
 * den Frame in voller Stärke plus Glow. Umgebende Container dürfen die per
 * Outset überstehenden Frame-Spitzen nicht clippen (kein `overflow-hidden`).
 */
export function FramedCard({
  as: Tag = 'div',
  artClassName,
  selected = false,
  semantic = 'normal',
  highlight = false,
  interactive = true,
  className,
  children,
  ...props
}: FramedCardProps) {
  const emphasized = selected || highlight;

  return (
    <Tag
      {...stateAttrs({ selected, semantic })}
      className={cn('group relative isolate', className)}
      {...props}
    >
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 -z-20 rounded-md bg-surface bg-cover bg-center',
          artClassName,
          transitionState,
          semantic === 'locked' && 'opacity-(--state-deemphasis-medium) grayscale-50',
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 -z-10 rounded-md',
          !emphasized && 'bg-linear-to-t from-background/82 to-background/32',
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 border-image-thin',
          transitionState,
          selected && 'shadow-glow-accent',
          !emphasized &&
            (semantic === 'locked'
              ? 'opacity-(--state-deemphasis-strong)'
              : cn('opacity-(--state-deemphasis-weak)', interactive && 'group-hover:opacity-90')),
        )}
      />
      {children}
    </Tag>
  );
}
