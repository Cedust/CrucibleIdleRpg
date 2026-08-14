import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';
import { stateAttrs, transitionState } from './state';

interface OrnateTabsProps {
  /** Zugänglicher Name der Tab-Leiste. */
  label: string;
  /** Spalten- und Mindestbreiten-Setup des Konsumenten. */
  className?: string;
  children: ReactNode;
}

/**
 * Tab-Leiste der Tree-Screens (FOUNDATION §7): eigener X-Scroller als
 * Fallback schmaler Container, Höhe aus `h-tab-strip`.
 */
export function OrnateTabs({ label, className, children }: OrnateTabsProps) {
  return (
    <div className="overflow-x-auto py-1">
      <div
        role="tablist"
        aria-label={label}
        aria-orientation="horizontal"
        className={cn('grid h-tab-strip gap-1', className)}
      >
        {children}
      </div>
    </div>
  );
}

interface OrnateTabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
  /** id des kontrollierten Tabpanels (`aria-controls`). */
  controls: string;
  /** Render-Slot der Tab-Fläche; stylt sich über `group-data-selected`. */
  surface: ReactNode;
  children: ReactNode;
}

/**
 * Einzelner Tab mit 9-Slice-Ornamentrahmen. Der Focus-Ring liegt mit
 * Offset -5px innen, weil der Frame-Überhang einen Außen-Ring clippen
 * würde (FOUNDATION §10). Das horizontale Padding ist an die Strip-Höhe
 * gekoppelt und hält den Inhalt in der Rahmenöffnung zwischen den breiten
 * Endstücken (DECISIONS D-011).
 */
export function OrnateTab({
  selected,
  controls,
  surface,
  className,
  children,
  ...props
}: OrnateTabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      aria-controls={controls}
      {...stateAttrs({ selected })}
      className={cn(
        'group relative isolate flex min-w-0 cursor-pointer items-center justify-center px-[calc(var(--spacing-tab-strip)*0.62*var(--tab-frame-scale))] text-center font-display text-xs tracking-wide',
        transitionState,
        'text-text-muted hover:text-text data-selected:text-accent-strong',
        'focus-visible:z-30 focus-visible:outline-2 focus-visible:outline-offset-[-5px] focus-visible:outline-state-focus',
        className,
      )}
      {...props}
    >
      {surface}
      <span
        aria-hidden="true"
        data-ornate-tab-frame
        className={cn(
          'border-image-tab-ornate pointer-events-none absolute inset-0 z-10',
          transitionState,
          'opacity-(--state-deemphasis-weak) grayscale-25 group-hover:opacity-80',
          'group-data-selected:opacity-100 group-data-selected:grayscale-0 group-data-selected:drop-shadow-glow-accent',
        )}
      />
      {children}
    </button>
  );
}
