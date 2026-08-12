import type { HTMLAttributes, ReactNode } from 'react';

type PanelElement = 'div' | 'section' | 'article' | 'aside' | 'footer';
type PanelVariant = 'ornate' | 'thin' | 'plain';
type PanelPadding = 'none' | 'md';

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
  plain: 'rounded-lg border border-border bg-surface',
};

const PADDING_CLASSES: Record<PanelPadding, string> = {
  none: '',
  md: 'p-4',
};

/** Fläche mit großem/kompaktem 9-Slice-Rahmen oder ruhiger Plain-Variante. */
export function Panel({
  as: Tag = 'div',
  variant = 'ornate',
  padding = 'md',
  className = '',
  children,
  ...props
}: PanelProps) {
  return (
    <Tag
      className={`${VARIANT_CLASSES[variant]} ${PADDING_CLASSES[padding]} ${className}`}
      {...props}
    >
      {variant === 'thin' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 border-image-thin"
        />
      )}
      {children}
    </Tag>
  );
}
