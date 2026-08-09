import type { HTMLAttributes, ReactNode } from 'react';

type PanelElement = 'div' | 'section' | 'article' | 'aside';
type PanelVariant = 'ornate' | 'plain';
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
  plain: 'rounded-lg border border-border bg-surface',
};

const PADDING_CLASSES: Record<PanelPadding, string> = {
  none: '',
  md: 'p-4',
};

/** Flächen-Primitive mit 9-Slice-Ornamentrahmen (ornate) oder ruhiger Fläche (plain). */
export function Panel({
  as: Tag = 'div',
  variant = 'ornate',
  padding = 'md',
  className = '',
  ...props
}: PanelProps) {
  return (
    <Tag
      className={`${VARIANT_CLASSES[variant]} ${PADDING_CLASSES[padding]} ${className}`}
      {...props}
    />
  );
}
