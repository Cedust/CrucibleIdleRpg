import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';
import { stateAttrs, transitionState } from '../utils/state';

interface OrnateTabsProps {
  /** Zugänglicher Name der Tab-Leiste. */
  label: string;
  /** Spalten- und Mindestbreiten-Setup des Konsumenten. */
  className?: string;
  children: ReactNode;
}

/**
 * Tab-Leiste der Tree-Screens: eine durchgehende flache Leiste mit
 * Haarlinien-Rahmen und Eckwinkeln, eigener X-Scroller als Fallback schmaler
 * Container, Höhe aus `h-tab-strip`.
 */
export function OrnateTabs({ label, className, children }: OrnateTabsProps) {
  return (
    <div className="overflow-x-auto py-1">
      <div
        role="tablist"
        aria-label={label}
        aria-orientation="horizontal"
        data-ornate-tab-bar
        className={cn('ornate-tab-bar ornate-corners relative grid h-tab-strip', className)}
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
  children: ReactNode;
}

/**
 * Einzelnes Segment der Tab-Leiste. Inaktiv trägt es nur die Trennlinie zum
 * Vorgänger und einen neutralen Hover-Lift; die Selektion liegt als eingesetzte
 * Goldfläche mit Glut-Verlauf und Eckwinkeln darüber. Die Fläche liegt im
 * isolierten Button hinter dem Inhalt (`-z-10`), Labels und Icons brauchen
 * daher keine eigene Stapelordnung. Der Focus-Ring liegt innen, weil
 * Leistenkante und X-Scroller einen Außen-Ring clippen würden; sein Offset
 * hält ihn innerhalb der Selektionsfläche, damit Focus und Selektion nicht zu
 * einer verdickten Goldlinie verschmelzen.
 */
export function OrnateTab({ selected, controls, className, children, ...props }: OrnateTabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      aria-controls={controls}
      {...stateAttrs({ selected })}
      className={cn(
        'group relative isolate flex min-w-0 cursor-pointer items-center justify-center px-4 text-center font-display text-sm tracking-wide',
        'not-first:border-l not-first:border-ornament/25',
        transitionState,
        'text-text-muted hover:bg-surface/70 hover:text-text',
        'data-selected:bg-transparent data-selected:text-accent-strong',
        'focus-visible:z-30 focus-visible:outline-2 focus-visible:-outline-offset-8 focus-visible:outline-state-focus',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        data-ornate-tab-selection
        className={cn(
          'ornate-tab-selection ornate-corners pointer-events-none absolute inset-1 -z-10 opacity-0',
          transitionState,
          'group-data-selected:opacity-100',
        )}
      />
      {children}
    </button>
  );
}
