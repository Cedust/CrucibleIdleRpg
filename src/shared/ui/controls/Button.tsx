import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';
import { focusRing, stateAttrs, transitionState } from '../utils/state';

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'ornate';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Exklusives Highlight (FOUNDATION §5); sichtbar als Gold-Border/Tint auf `ghost`. */
  selected?: boolean;
  children: ReactNode;
}

/* Radius, Padding und Schrift liegen in den Varianten: `ornate` trägt einen
   9-Slice-Rahmen (radiusfrei, Display-Schrift) und cn führt Klassen nicht
   zusammen. Die Füllung ist eine dunkle Fläche mit Ember-Schimmer von oben
   (Rezept der Mastery-Tabs), der Schriftzug trägt das Gold; bg-clip-padding
   hält die Füllung innerhalb der Rahmenöffnung, border-ornament/40 bleibt als
   Fallback sichtbar, bis das 9-Slice-Asset lädt. */
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'rounded-md px-4 py-2 font-medium border border-ornament bg-linear-to-b from-accent-strong to-accent text-background hover:to-accent-strong',
  ghost:
    'rounded-md px-4 py-2 font-medium border border-border bg-transparent text-text hover:border-ornament hover:bg-surface-raised data-selected:border-accent data-selected:bg-state-selected-tint',
  danger:
    'rounded-md px-4 py-2 font-medium border border-danger/50 bg-danger/10 text-danger hover:bg-danger/20',
  ornate:
    'border-image-button border-ornament/40 bg-clip-padding bg-surface bg-linear-to-b from-ember/30 via-ember/15 to-transparent px-6 py-2 font-display font-semibold text-display-sm tracking-wider uppercase text-accent-strong hover:from-ember/50 hover:via-ember/25',
};

/** Basis-Button-Primitive in „Gilded Ruins“-Optik (Plain Tailwind, siehe AGENTS.md). */
export function Button({
  variant = 'primary',
  selected = false,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      {...stateAttrs({ selected })}
      className={cn(
        'cursor-pointer',
        transitionState,
        focusRing,
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
