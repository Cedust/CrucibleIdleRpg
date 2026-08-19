import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../utils/cn';

type PanelElement = 'div' | 'section' | 'article' | 'aside' | 'footer';
type PanelVariant = 'ornate' | 'thin' | 'standard' | 'plain';
type PanelPadding = 'none' | 'md' | 'lg';

interface PanelProps extends HTMLAttributes<HTMLElement> {
  as?: PanelElement;
  variant?: PanelVariant;
  padding?: PanelPadding;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<PanelVariant, string> = {
  // border-ornament bleibt als Fallback sichtbar, bis das 9-Slice-Asset lädt.
  ornate: 'border-image-ornate border-ornament bg-surface/90 shadow-panel',
  thin: 'relative isolate rounded-lg bg-surface/70 shadow-panel',
  standard: 'relative isolate rounded-lg bg-surface/70 shadow-panel',
  plain: 'rounded-lg border border-border bg-surface/90 shadow-panel',
};

const PADDING_CLASSES: Record<PanelPadding, string> = {
  none: '',
  md: 'px-4 py-3',
  lg: 'px-8 py-6',
};

/** Fläche mit großem/kompaktem 9-Slice-Rahmen oder ruhiger Plain-Variante. */
export function Panel({
  as: Tag = 'div',
  variant = 'standard',
  padding = 'md',
  className = '',
  children,
  ...props
}: PanelProps) {
  const overlayClass =
    variant === 'thin'
      ? 'border-image-thin'
      : variant === 'standard'
        ? 'border-image-standard'
        : null;

  return (
    <Tag className={cn(VARIANT_CLASSES[variant], PADDING_CLASSES[padding], className)} {...props}>
      {overlayClass !== null ? (
        <div
          aria-hidden="true"
          className={cn('pointer-events-none absolute inset-0 z-20', overlayClass)}
        />
      ) : null}
      {children}
    </Tag>
  );
}
