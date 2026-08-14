import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';
import { stateAttrs, transitionState, type SemanticState } from '../utils/state';

interface FramedCardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'li' | 'label';
  /** Hintergrund-Art als statische `bg-[url(…)]`-Klasse. */
  artClassName: string;
  selected?: boolean;
  semantic?: SemanticState;
  /**
   * Frame in voller Stärke, Scrim aus und Glow an — für nicht-interaktive
   * „current“-Flächen wie das ActPanel.
   */
  highlight?: boolean;
  /** `false` entfernt die Hover-Affordance nicht-interaktiver Flächen. */
  interactive?: boolean;
  children: ReactNode;
}

/**
 * Karten-Layer-Stack Art/Scrim/9-Slice-Frame mit den State-Opacities des
 * State-Systems: Locked dimmt ausschließlich den Art-Layer, Selektion trägt
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
          transitionState,
          !emphasized && 'bg-linear-to-t from-background/82 to-background/32',
          interactive && semantic === 'locked' && 'group-hover:bg-surface/50',
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 border-image-thin',
          transitionState,
          emphasized && 'shadow-glow-accent',
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
